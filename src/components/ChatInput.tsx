import { useStorageSetting } from '@/hooks/useStorageSetting';
import { streamChatCompletion } from '@/open-router/chat';
import { IoSend } from 'react-icons/io5';
import { toast } from 'sonner';
import { FormEvent, KeyboardEvent } from 'react';
import type { MessageType } from '@/types/chat';
import type { PageData } from '@/types/editor';
import { ChatConfiguration } from '@/components/ChatConfiguration';
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
    value: model,
    setValue: setModel,
    saveToStorage: saveModel
  } = useStorageSetting({
    key: 'model',
    defaultValue: 'openai/gpt-4o-mini'
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!input.trim() || !apiKey || isStreaming) return;

    const userMessage: MessageType = { content: input.trim(), role: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setStreamingMessage('');

    await streamChatCompletion({
      apiKey,
      model,
      messages: [buildSystemPrompt(pageData), ...messages.slice(1), userMessage],
      onChunk: (_, fullMessage) => {
        setStreamingMessage(fullMessage);
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
      <div className="rounded-md bg-lc-textarea-bg p-2 drop-shadow-md transition-shadow duration-200 ease-in-out group-focus-within/input:ring-1 group-focus-within/input:ring-blue-500">
        <textarea
          className="sticky bottom-0 w-full resize-none bg-transparent px-1 text-white placeholder:text-neutral-500 focus:outline-none"
          placeholder="Type your message here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
        />
        <div className="flex items-end justify-between">
          <ChatConfiguration
            apiKey={apiKey}
            setApiKey={setApiKey}
            saveApiKey={saveApiKey}
            model={model}
            setModel={setModel}
            saveModel={saveModel}
          />

          <button
            type="submit"
            className="rounded-md px-1 py-1 text-white/60 hover:bg-white/10 disabled:opacity-50"
            disabled={isStreaming || !input.trim() || !apiKey}
          >
            <IoSend />
          </button>
        </div>
      </div>
    </form>
  );
}
