import { useStorageSetting } from '@/hooks/useStorageSetting';
import { streamChatCompletion } from '@/open-router/chat';
import { IoSend } from 'react-icons/io5';
import { toast } from 'sonner';
import { FormEvent, KeyboardEvent } from 'react';
import type { MessageType } from '@/types/chat';
import type { PageData } from '@/types/editor';
import type { ModelConfig, ModelEndpointsResponse } from '@/types/open-router';
import { ChatConfiguration } from '@/components/ChatConfiguration';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildSystemPrompt } from '@/utils/prompt-builder';

interface ChatInputProps {
  input: string;
  setInput: (_value: string) => void;
  isStreaming: boolean;
  setIsStreaming: (_value: boolean) => void;
  setStreamingMessage: (_value: string) => void;
  messages: MessageType[];
  setMessages: (_fn: (_prev: MessageType[]) => MessageType[]) => void;
  pageData: PageData;
}

export function ChatInput({
  input,
  setInput,
  isStreaming,
  setIsStreaming,
  setStreamingMessage,
  messages,
  setMessages,
  pageData
}: ChatInputProps) {
  // Use custom hooks for storage settings
  const {
    value: apiKey,
    setValue: setApiKey,
    saveToStorage: saveApiKey
  } = useStorageSetting({
    key: 'apiKey',
    defaultValue: ''
  });

  const {
    value: modelResponse,
    setValue: setModelResponse,
    saveToStorage: saveModelResponse
  } = useStorageSetting<ModelEndpointsResponse | null>({
    key: 'model',
    defaultValue: null
  });

  const {
    value: config,
    setValue: setConfig,
    saveToStorage: saveConfig
  } = useStorageSetting<ModelConfig>({
    key: 'config',
    defaultValue: { tools: false, reasoning: '', mode: 'learn' }
  });

  const supportsTools = modelResponse?.data.endpoints[0]?.supported_parameters?.includes('tools') || false;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!input.trim() || !apiKey || isStreaming || !modelResponse) return;

    const userMessage: MessageType = { content: input.trim(), role: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setStreamingMessage('');

    await streamChatCompletion({
      apiKey,
      model: modelResponse.data.id,
      reasoning: config.reasoning,
      messages: [buildSystemPrompt(pageData), ...messages.slice(1), userMessage],
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
      }
    });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Create a synthetic form event to submit the form
      const form = e.currentTarget.closest('form');
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={
          `relative rounded-md bg-lc-textarea-bg p-2 drop-shadow-md transition-shadow duration-200 ease-in-out group-focus-within/input:ring-1 group-focus-within/input:ring-blue-500 ` +
          'before:transition-duration-[2000ms] before:pointer-events-none before:absolute before:inset-0 before:rounded-md before:opacity-0 before:shadow-[0_0_6px_2px_rgba(255,255,255,0.10),0_0_14px_4px_rgba(255,255,255,0.05)] before:transition-opacity before:content-[""]' +
          (isStreaming ? ' before:animate-glow-pulse before:opacity-100' : '')
        }
      >
        <textarea
          className="sticky bottom-0 w-full resize-none bg-transparent px-1 text-white placeholder:text-neutral-500 focus:outline-none"
          placeholder="Type your message here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
        />
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-1">
            <ChatConfiguration
              apiKey={apiKey}
              setApiKey={setApiKey}
              saveApiKey={saveApiKey}
              modelResponse={modelResponse}
              setModelResponse={setModelResponse}
              saveModelResponse={saveModelResponse}
            />
            <Select
              value={config.mode}
              onValueChange={(value) => setConfig({ ...config, mode: value as 'learn' | 'agent' })}
              onOpenChange={(open) => {
                if (!open) {
                  saveConfig();
                }
              }}
            >
              <SelectTrigger className="h-fit w-fit border-none px-1 py-1 text-xs text-white/60 hover:bg-white/10 focus:ring-0">
                <SelectValue placeholder="Mode" className="w-fit border-none" />
              </SelectTrigger>
              <SelectContent className="border-none bg-lc-popover-bg text-xs text-lc-primary">
                <SelectGroup>
                  <SelectItem value="learn" className="text-xs focus:bg-white/10 focus:text-white">
                    Learn
                  </SelectItem>
                  {supportsTools && (
                    <SelectItem value="agent" className="text-xs focus:bg-white/10 focus:text-white">
                      Agent
                    </SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <button
            type="submit"
            className="cursor-pointer rounded-md px-1 py-1 text-white/60 hover:bg-white/10 disabled:opacity-50"
            disabled={isStreaming || !input.trim() || !apiKey || !modelResponse}
          >
            <IoSend />
          </button>
        </div>
      </div>
    </form>
  );
}
