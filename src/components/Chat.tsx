/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { useAutoSmoothScroll } from '@/hooks/useAutoSmoothScroll';
import { useRef, useState } from 'react';
import type { MessageType } from '@/types/chat';
import type { InjectionStatus, PageData } from '@/types/editor';
import { Bubble } from '@/components/Bubble';
import { ChatInput } from '@/components/ChatInput';

interface ChatProps {
  pageData: PageData;
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
  const [messages, setMessages] = useState<MessageType[]>([
    {
      role: 'assistant',
      content: `Need help with <strong>${pageData.title.replace(/^\d+\.\s*/, '')}</strong>?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto smooth scroll while streaming (and upon completion if user is at bottom)
  useAutoSmoothScroll(
    scrollRef,
    [messages.length, streamingMessage],
    true, // always enabled; hook respects user manual scroll position
    { bottomThreshold: 96 }
  );

  return (
    <div className="flex h-full w-full max-w-full flex-col justify-between overflow-hidden p-4">
      <div ref={scrollRef} className="hide-scrollbar min-h-0 flex-1 overflow-y-auto bg-lc-text-light">
        {messages.map((msg, index) => (
          <Bubble key={index} content={msg.content} role={msg.role} type={msg.type} />
        ))}
        {isStreaming && streamingMessage.length > 0 && <Bubble content={streamingMessage} role="assistant" />}
      </div>

      <div className="flex-shrink-0">
        {/* <div className="w-full max-w-full">
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
        </div> */}

        <ChatInput
          input={input}
          setInput={setInput}
          isStreaming={isStreaming}
          setIsStreaming={setIsStreaming}
          setStreamingMessage={setStreamingMessage}
          messages={messages}
          setMessages={setMessages}
          pageData={pageData}
        />
      </div>
    </div>
  );
}
