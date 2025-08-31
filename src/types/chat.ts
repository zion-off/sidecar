/* eslint-disable no-unused-vars */
import type { ReasoningEffort } from '@/types/open-router';

// Added optional `type` to distinguish reasoning vs normal assistant content in the UI.
export type MessageType = {
  content: string;
  role: 'system' | 'developer' | 'user' | 'assistant' | 'tool';
  type?: 'content' | 'reasoning';
};

export type StreamChatCompletionOptions = {
  apiKey: string;
  model: string;
  reasoning: ReasoningEffort;
  messages: MessageType[];
  onChunk: (content: string, fullMessage: string) => void;
  onReasoning?: (reasoning: string) => void;
  onComplete: (fullMessage: string) => void;
  onError: (error: Error) => void;
};

export type StreamChatCompletionBody = {
  model: string;
  messages: MessageType[];
  stream?: boolean;
  reasoning?: {
    effort: ReasoningEffort;
  };
};
