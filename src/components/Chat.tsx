import { useAutoSmoothScroll } from '@/hooks/useAutoSmoothScroll';
import { useCallback, useRef, useState } from 'react';
import type { ChatProps } from '@/types/chat';
import { Bubble } from '@/components/Bubble';
import { ChatInput } from '@/components/ChatInput';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import { seedChat } from '@/utils/messaging';
import { Suggestion } from './Suggestion';

export function Chat({
  problemTitle,
  showSuggestions,
  resolveSuggestion
}: ChatProps) {
  const [messages, setMessages] = useState(seedChat(problemTitle));
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [hasPendingToolCall, setHasPendingToolCall] = useState(false);
  const toolCallResolverRef = useRef<((_v: boolean) => void) | null>(null);

  const handleResolveSuggestion = useCallback(
    (isAccept: boolean) => {
      resolveSuggestion(isAccept);
      toolCallResolverRef.current?.(isAccept);
    },
    [resolveSuggestion]
  );

  const handleToolCallResolverReady = useCallback((resolver: ((_v: boolean) => void) | null) => {
    toolCallResolverRef.current = resolver;
    setHasPendingToolCall(resolver !== null);
  }, []);

  useAutoSmoothScroll(scrollRef, [messages.length, streamingMessage], true, { bottomThreshold: 96 });

  return (
    <div className="flex h-full w-full max-w-full flex-col justify-between overflow-hidden p-4">
      <div ref={scrollRef} className="hide-scrollbar min-h-0 flex-1 overflow-y-auto bg-lc-bg-base">
        {messages.map((msg, index) => {
          if (msg.type === 'reasoning') {
            const isLast = index === messages.length - 1;
            const isReasoningStreaming = isLast && isStreaming && streamingMessage === '';
            return (
              <Reasoning key={index} isStreaming={isReasoningStreaming} className="mt-4">
                <ReasoningTrigger />
                <ReasoningContent>{msg.content}</ReasoningContent>
              </Reasoning>
            );
          }
          return <Bubble key={index} content={msg.content} role={msg.role} type={msg.type} />;
        })}
        {isStreaming && streamingMessage.length > 0 && <Bubble content={streamingMessage} role="assistant" />}
      </div>

      <div className="flex-shrink-0">
        <Suggestion activeSuggestion={hasPendingToolCall} resolveSuggestion={handleResolveSuggestion} />
        <ChatInput
          isStreaming={isStreaming}
          setIsStreaming={setIsStreaming}
          setStreamingMessage={setStreamingMessage}
          messages={messages}
          setMessages={setMessages}
          showSuggestions={showSuggestions}
          onToolCallResolverReady={handleToolCallResolverReady}
        />
      </div>
    </div>
  );
}
