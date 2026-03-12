import { useStorageSetting } from '@/hooks/useStorageSetting';
import { ChatCompletion } from '@/open-router/chat';
import { defaultTools } from '@/open-router/tools';
import { IoSend } from 'react-icons/io5';
import { toast } from 'sonner';
import { FormEvent, KeyboardEvent, useRef } from 'react';
import type { ChatInputProps, MessageType } from '@/types/chat';
import type { ModelConfig, ModelEndpointsResponse } from '@/types/open-router';
import { ChatConfiguration } from '@/components/ChatConfiguration';
import { defaultConfig } from '@/utils/defaults';
import { buildEditorContent, buildSystemPrompt, getPageData } from '@/utils/prompt-builder';
import { AnimatedGlowBorder } from './AnimatedGlowBorder';
import { ModeSelector } from './Mode';

export function ChatInput({
  input,
  setInput,
  isStreaming,
  setIsStreaming,
  setStreamingMessage,
  messages,
  setMessages,
  showSuggestions
}: ChatInputProps) {
  const currentEditorContent = useRef<MessageType | null>(null);

  const { value: apiKey } = useStorageSetting({
    key: 'apiKey',
    defaultValue: ''
  });

  const { value: modelResponse } = useStorageSetting<ModelEndpointsResponse | null>({
    key: 'model',
    defaultValue: null
  });

  const { value: config } = useStorageSetting<ModelConfig>({
    key: 'config',
    defaultValue: defaultConfig
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!input.trim() || !apiKey || isStreaming || !modelResponse) return;

    const client = new ChatCompletion({
      apiKey,
      onChunk: (_, fullMessage) => {
        setStreamingMessage(fullMessage);
      },
      onReasoning: (reasoning) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.type === 'reasoning') {
            return [...prev.slice(0, -1), { ...last, content: reasoning }];
          }
          return [...prev, { role: 'assistant', content: reasoning, type: 'reasoning' }];
        });
      },
      onToolCall: (func, args) => {
        if (func === 'suggest_code') {
          showSuggestions(args.suggestion);
        }
      },
      onComplete: (fullMessage) => {
        const assistantMessage: MessageType = { content: fullMessage, role: 'assistant' };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsStreaming(false);
        setStreamingMessage('');
      },
      onError: (error) => {
        toast.warning(error.message || 'An error occurred while fetching the response.');
        setIsStreaming(false);
        setStreamingMessage('');
        setMessages((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].role === 'user') {
            return prev.slice(0, -1);
          }
          return prev;
        });
      }
    });

    const userMessage: MessageType = { content: input.trim(), role: 'user' };
    const pageData = await getPageData();
    const systemPrompt = buildSystemPrompt(pageData);
    const editorContentPrompt = buildEditorContent(pageData);
    const prompt = [
      systemPrompt,
      ...messages
        .slice(1)
        .filter((msg) => msg.type !== 'reasoning')
        .map((msg) => ({ ...msg, role: msg.role === 'developer' ? 'user' : msg.role }))
    ];

    if (!currentEditorContent.current || currentEditorContent.current.content !== editorContentPrompt.content) {
      setMessages((prev) => [...prev, editorContentPrompt]);
      currentEditorContent.current = editorContentPrompt;
      prompt.push({
        ...editorContentPrompt,
        role: editorContentPrompt.role === 'developer' ? 'user' : editorContentPrompt.role
      });
    }

    prompt.push(userMessage);
    setInput('');
    setIsStreaming(true);
    setStreamingMessage('');
    setMessages((prev) => [...prev, userMessage]);

    await client.processStream(
      modelResponse.data.id,
      config.reasoning,
      prompt,
      config.mode === 'agent' ? defaultTools : undefined
    );
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative">
        <AnimatedGlowBorder
          isActive={isStreaming}
          duration={4}
          colors={['#dd7bbb', '#d79f1e', '#5a922c', '#4c7894']}
          spread={20}
          borderWidth={2}
          className="rounded-md"
        />

        <div
          className={`relative rounded-md border border-transparent bg-lc-textarea-bg p-2 transition-all duration-300 ease-in-out group-focus-within/input:ring-1 group-focus-within/input:ring-blue-500 dark:drop-shadow-md`}
        >
          <textarea
            rows={3}
            className="text-lc-text-primary sticky bottom-0 w-full resize-none bg-transparent px-1 text-xs placeholder:text-neutral-500 focus:outline-none"
            placeholder="Ask about this problem"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
          />
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-1">
              <ChatConfiguration />
              <ModeSelector />
            </div>

            <button
              type="submit"
              className="disabled:opacity-500 cursor-pointer rounded-md px-1 py-1 text-neutral-400 hover:text-neutral-500 dark:hover:bg-white/10 dark:hover:text-neutral-500"
              disabled={isStreaming || !input.trim() || !apiKey || !modelResponse}
            >
              {IoSend({})}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
