import { IoSend } from 'react-icons/io5';
import { FormEvent, KeyboardEvent } from 'react';
import { ChatConfiguration } from '@/components/ChatConfiguration';

interface ChatInputProps {
  input: string;
  setInput: (_value: string) => void;
  isStreaming: boolean;
  apiKey: string;
  setApiKey: (_value: string) => void;
  saveApiKey: () => void;
  model: string;
  setModel: (_value: string) => void;
  saveModel: () => void;
  onSubmit: (_e: FormEvent) => void;
}

export function ChatInput({
  input,
  setInput,
  isStreaming,
  apiKey,
  setApiKey,
  saveApiKey,
  model,
  setModel,
  saveModel,
  onSubmit
}: ChatInputProps) {
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
    <form onSubmit={onSubmit}>
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
