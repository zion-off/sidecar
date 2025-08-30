/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { KeyboardEvent, useState } from 'react';
import type { MessageBubble } from '@/types/chat';
import type { InjectionStatus, PageData } from '@/types/editor';
import { Bubble } from '@/components/Bubble';
import { sampleMessages } from '@/utils/messaging';

interface ChatProps {
  pageData: PageData | null;
  activeSuggestion: boolean;
  injectionStatus: InjectionStatus;
  sendCodeToEditor: (code: string) => void;
  showSuggestions: (suggestedCode?: string) => void;
  resolveSuggestion: (isAccept: boolean) => void;
}

export function Chat({
  pageData,
  activeSuggestion,
  injectionStatus,
  sendCodeToEditor,
  showSuggestions,
  resolveSuggestion
}: ChatProps) {
  const [messages, _] = useState<MessageBubble[]>(sampleMessages(pageData));
  const [input, setInput] = useState('');

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Add message sending logic here
    }
  }

  return (
    <div className="flex h-full w-full max-w-full flex-col justify-between p-4">
      <div className="overflow-y-scroll">
        {messages.map((msg, index) => (
          <Bubble key={index} message={msg.message} role={msg.role} />
        ))}
      </div>

      <div>
        <div className="w-full max-w-full">
          {injectionStatus.message && (
            <div
              className={`mb-4 rounded-lg p-3 ${
                injectionStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {injectionStatus.success ? '✅' : '❌'} {injectionStatus.message}
            </div>
          )}

          <div className="mb-4 space-y-3">
            {activeSuggestion ? (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                <p className="mb-3 text-center text-sm font-medium text-purple-800">
                  💡 Suggestion is active in the editor. What would you like to do?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => resolveSuggestion(true)}
                    className="w-full rounded-lg bg-green-600 px-4 py-2 font-bold text-white transition-colors hover:bg-green-700"
                  >
                    Keep
                  </button>
                  <button
                    onClick={() => resolveSuggestion(false)}
                    className="w-full rounded-lg bg-red-600 px-4 py-2 font-bold text-white transition-colors hover:bg-red-700"
                  >
                    Undo
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => showSuggestions()}
                className="w-full rounded-lg bg-neutral-600 px-4 py-2 font-bold text-white transition-colors"
              >
                Generate Suggestion
              </button>
            )}
          </div>
        </div>

        <textarea
          className="sticky bottom-0 w-full rounded-md bg-lc-fg p-2 text-white transition-shadow duration-200 ease-in-out placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Type your message here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
