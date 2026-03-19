import { useAutoSmoothScroll } from '@/hooks/useAutoSmoothScroll';
import { useRef } from 'react';
import { useChatContext } from '@/context/ChatContext';
import { Bubble } from '@/components/Bubble';
import { ChatInput } from '@/components/ChatInput';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import { Suggestion } from './Suggestion';

export function Chat() {
  const { messages, isStreaming, streamingMessage, hasPendingToolCall, resolveToolCall } = useChatContext();
  const scrollRef = useRef<HTMLDivElement | null>(null);

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
        <Suggestion activeSuggestion={hasPendingToolCall} resolveSuggestion={resolveToolCall} />
        <ChatInput />
      </div>
    </div>
  );
}
