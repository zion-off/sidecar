import { useStorageSetting } from '@/hooks/useStorageSetting';
import { ChatCompletion } from '@/open-router/chat';
import { defaultTools } from '@/open-router/tools';
import { IoSend } from 'react-icons/io5';
import { toast } from 'sonner';
import { FormEvent, KeyboardEvent } from 'react';
import type { ChatInputProps, MessageType } from '@/types/chat';
import type { ModelConfig, ModelEndpointsResponse } from '@/types/open-router';
import { ChatConfiguration } from '@/components/ChatConfiguration';
import { defaultConfig } from '@/utils/defaults';
import { buildSystemPromptFromContentScript } from '@/utils/prompt-builder';
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

    const userMessage: MessageType = { content: input.trim(), role: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setStreamingMessage('');

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

    // Get system prompt with current page data
    const systemPrompt = await buildSystemPromptFromContentScript();

    await client.processStream(
      modelResponse.data.id,
      config.reasoning,
      [systemPrompt, ...messages.slice(1), userMessage],
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
        {/* Animated border background */}
        <div
          className={`absolute -inset-px rounded-md bg-animated-border bg-border-animation transition-opacity duration-300 ease-in-out ${
            isStreaming ? 'opacity-50 dark:opacity-75' : 'opacity-0'
          }`}
          style={{
            animation: isStreaming ? 'border-glow 4s linear infinite' : 'none'
          }}
        ></div>

        <div
          className={`relative rounded-md border border-transparent bg-lc-textarea-bg p-2 transition-all duration-300 ease-in-out group-focus-within/input:ring-1 group-focus-within/input:ring-blue-500 dark:drop-shadow-md ${
            isStreaming
              ? 'shadow-[inset_0_0_8px_rgba(221,123,187,0.08),inset_0_0_6px_rgba(215,159,30,0.06),inset_0_0_4px_rgba(90,146,44,0.06),inset_0_0_4px_rgba(76,120,148,0.06)] dark:shadow-[inset_0_0_12px_rgba(221,123,187,0.15),inset_0_0_8px_rgba(215,159,30,0.1),inset_0_0_6px_rgba(90,146,44,0.1),inset_0_0_4px_rgba(76,120,148,0.1)]'
              : ''
          }`}
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
