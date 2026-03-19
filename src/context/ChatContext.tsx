import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useChatStream } from '@/hooks/chat/useChatStream';
import type { MessageType } from '@/types/chat';

type SendMessageFn = ReturnType<typeof useChatStream>['sendMessage'];
type ResolveToolCallFn = ReturnType<typeof useChatStream>['resolveToolCall'];

type ChatContextValue = {
  messages: MessageType[];
  isStreaming: boolean;
  streamingMessage: string;
  hasPendingToolCall: boolean;
  sendMessage: SendMessageFn;
  resolveToolCall: ResolveToolCallFn;
  resetChat: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ problemTitle, children }: { problemTitle: string; children: ReactNode }) {
  const { messages, isStreaming, streamingMessage, hasPendingToolCall, sendMessage, resolveToolCall, resetChat } =
    useChatStream(problemTitle);

  const value = useMemo(
    () => ({
      messages,
      isStreaming,
      streamingMessage,
      hasPendingToolCall,
      sendMessage,
      resolveToolCall,
      resetChat
    }),
    [messages, isStreaming, streamingMessage, hasPendingToolCall, sendMessage, resolveToolCall, resetChat]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}

export { ChatContext };
