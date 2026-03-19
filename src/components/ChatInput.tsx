import { IoSend } from 'react-icons/io5';
import { FormEvent, KeyboardEvent, useEffect, useState } from 'react';
import { useChatContext } from '@/context/ChatContext';
import { useConfigContext } from '@/context/ConfigContext';
import { ChatConfiguration } from '@/components/ChatConfiguration';
import { MSG } from '@/types/messages';
import { AnimatedGlowBorder } from './AnimatedGlowBorder';
import { ModeSelector } from './Mode';
import { SelectionBadge } from './SelectionBadge';

export function ChatInput() {
  const [input, setInput] = useState('');
  const [selectionPreview, setSelectionPreview] = useState('');
  const { sendMessage, isStreaming } = useChatContext();
  const { apiKey, modelResponse } = useConfigContext();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === MSG.SELECTION_CHANGED) {
        setSelectionPreview(event.data.selectedText || '');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming || !apiKey || !modelResponse) return;
    setInput('');
    await sendMessage(trimmed);
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
      <SelectionBadge key={selectionPreview} selectedText={selectionPreview} />
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
