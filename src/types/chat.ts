/* eslint-disable no-unused-vars */
import { ToolFunctionArgs } from '@/open-router/tools';
import { InjectionStatus, PageData } from '@/types/editor';
import type { ReasoningEffort, Tool } from '@/types/open-router';

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
  onToolCall: <T extends keyof ToolFunctionArgs>(toolName: T, args: ToolFunctionArgs[T]) => void;
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
  tools?: Tool[];
};

export type ChatProps = {
  pageData: PageData;
  activeSuggestion: boolean;
  injectionStatus: InjectionStatus;
  sendCodeToEditor: (code: string) => void;
  showSuggestions: (suggestedCode?: string) => void;
  resolveSuggestion: (isAccept: boolean) => void;
};

export type SuggestionProps = Pick<ChatProps, 'activeSuggestion' | 'resolveSuggestion'>;

export type ChatInputProps = {
  input: string;
  setInput: (value: string) => void;
  isStreaming: boolean;
  setIsStreaming: (value: boolean) => void;
  setStreamingMessage: (value: string) => void;
  messages: MessageType[];
  setMessages: (fn: (prev: MessageType[]) => MessageType[]) => void;
  pageData: PageData;
  showSuggestions: (suggestedCode?: string) => void;
};
