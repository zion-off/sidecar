import { useAutoSmoothScroll } from '@/hooks/useAutoSmoothScroll';
import { useRef, useState } from 'react';
import type { ChatProps } from '@/types/chat';
import { Bubble } from '@/components/Bubble';
import { ChatInput } from '@/components/ChatInput';
import { seedChat } from '@/utils/messaging';
import { Suggestion } from './Suggestion';

export function Chat({
  problemTitle,
  activeSuggestion,
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  sendCodeToEditor,
  showSuggestions,
  resolveSuggestion
}: ChatProps) {
  const [messages, setMessages] = useState(seedChat(problemTitle));
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useAutoSmoothScroll(scrollRef, [messages.length, streamingMessage], true, { bottomThreshold: 96 });

  return (
    <div className="flex h-full w-full max-w-full flex-col justify-between overflow-hidden p-4">
      <div ref={scrollRef} className="hide-scrollbar min-h-0 flex-1 overflow-y-auto bg-lc-bg-base">
        {messages.map((msg, index) => (
          <Bubble key={index} content={msg.content} role={msg.role} type={msg.type} />
        ))}
        {isStreaming && streamingMessage.length > 0 && <Bubble content={streamingMessage} role="assistant" />}
      </div>

      <div className="flex-shrink-0">
        <Suggestion activeSuggestion={activeSuggestion} resolveSuggestion={resolveSuggestion} />
        <ChatInput
          input={input}
          setInput={setInput}
          isStreaming={isStreaming}
          setIsStreaming={setIsStreaming}
          setStreamingMessage={setStreamingMessage}
          messages={messages}
          setMessages={setMessages}
          showSuggestions={showSuggestions}
        />
      </div>
    </div>
  );
}
