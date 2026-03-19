/* eslint-disable no-unused-vars */
import { ToolFunctionArgs } from '@/open-router/tools';
import type { ReasoningEffort, Tool } from '@/types/open-router';

export type ToolCallInfo = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

export type MessageType = {
  content: string;
  role: 'system' | 'developer' | 'user' | 'assistant' | 'tool';
  type?: 'content' | 'reasoning';
  tool_calls?: ToolCallInfo[];
  tool_call_id?: string;
};

export type StreamChatCompletionOptions = {
  apiKey: string;
  model: string;
  reasoning: ReasoningEffort;
  messages: MessageType[];
  onChunk: (content: string, fullMessage: string) => void;
  onReasoning?: (reasoning: string) => void;
  onToolCall: <T extends keyof ToolFunctionArgs>(toolName: T, args: ToolFunctionArgs[T]) => void;
  onToolCallComplete: (toolCalls: ToolCallInfo[]) => void;
  onComplete: (fullMessage: string) => void;
  onError: (error: Error) => void;
};

export type StreamChatCompletionBody = {
  model: string;
  messages: MessageType[];
  stream?: boolean;
  max_tokens?: number;
  reasoning?: {
    effort: ReasoningEffort;
  };
  tools?: Tool[];
};

export type SuggestionProps = {
  activeSuggestion: boolean;
  resolveSuggestion: (isAccept: boolean) => void | Promise<void>;
};
