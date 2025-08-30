/* eslint-disable no-unused-vars */
export type MessageType = { content: string; role: 'system' | 'developer' | 'user' | 'assistant' | 'tool' };

export type StreamChatCompletionOptions = {
  apiKey: string;
  model: string;
  messages: MessageType[];
  onChunk: (content: string, fullMessage: string) => void;
  onComplete: (fullMessage: string) => void;
  onError: (error: Error) => void;
};
