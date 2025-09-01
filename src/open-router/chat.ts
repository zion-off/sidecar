import { ToolFunctionArgs } from '@/open-router/tools';
import type { MessageType, StreamChatCompletionBody, StreamChatCompletionOptions } from '@/types/chat';
import { ReasoningEffort, Tool } from '@/types/open-router';

export class ChatCompletion {
  private apiKey: string;
  private onChunk: StreamChatCompletionOptions['onChunk'];
  private onReasoning: StreamChatCompletionOptions['onReasoning'];
  private onToolCall: StreamChatCompletionOptions['onToolCall'];
  private onComplete: StreamChatCompletionOptions['onComplete'];
  private onError: StreamChatCompletionOptions['onError'];

  constructor(options: Omit<StreamChatCompletionOptions, 'model' | 'reasoning' | 'messages'>) {
    this.apiKey = options.apiKey;
    this.onChunk = options.onChunk;
    this.onReasoning = options.onReasoning;
    this.onToolCall = options.onToolCall;
    this.onComplete = options.onComplete;
    this.onError = options.onError;
  }

  private buildRequestBody(
    model: string,
    reasoning: ReasoningEffort,
    messages: MessageType[],
    tools?: Tool[]
  ): StreamChatCompletionBody {
    const body: StreamChatCompletionBody = {
      model: model,
      messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
      stream: true
    };

    if (reasoning) {
      body['reasoning'] = {
        effort: reasoning
      };
    }

    if (tools) {
      body['tools'] = tools;
    }
    return body;
  }

  private async makeRequest(body: StreamChatCompletionBody): Promise<Response> {
    return await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }

  private async handleErrorResponse(response: Response): Promise<void> {
    if (!response.ok) {
      const raw = await response.text();
      let detail = raw;
      try {
        const parsed = JSON.parse(raw);
        detail = parsed?.error?.message || detail;
      } catch {
        // ignore JSON parse errors, fallback to raw
      }
      throw new Error(`HTTP error! status: ${response.status}. ${detail}`);
    }
  }

  private async safeProcessStream(
    model: string,
    reasoning: ReasoningEffort,
    messages: MessageType[],
    tools?: Tool[]
  ): Promise<void> {
    const body = this.buildRequestBody(model, reasoning, messages, tools);
    const response = await this.makeRequest(body);
    await this.handleErrorResponse(response);

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullMessage = '';
    let reasoningAccumulated = '';
    const toolCalls: { [index: number]: { name: string; arguments: string } } = {};

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        while (true) {
          const lineEnd = buffer.indexOf('\n');
          if (lineEnd === -1) break;

          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);

          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              const content = delta?.content;

              // Handle tool calls
              if (delta?.tool_calls) {
                for (const toolCall of delta.tool_calls) {
                  const index = toolCall.index ?? 0;

                  if (!toolCalls[index]) {
                    toolCalls[index] = { name: '', arguments: '' };
                  }

                  if (toolCall.function?.name) {
                    toolCalls[index].name += toolCall.function.name;
                  }

                  if (toolCall.function?.arguments) {
                    toolCalls[index].arguments += toolCall.function.arguments;
                  }
                }
              }

              if (parsed.choices?.[0]?.finish_reason === 'tool_calls') {
                for (const toolCall of Object.values(toolCalls)) {
                  if (toolCall.name && toolCall.arguments) {
                    this.onToolCall?.(toolCall.name as keyof ToolFunctionArgs, JSON.parse(toolCall.arguments));
                  }
                }
                break;
              }

              // Handle regular content
              if (content) {
                fullMessage += content;
                this.onChunk(content, fullMessage);
              }

              // Handle reasoning (existing code)
              const reasoningDetails = delta?.reasoning || delta?.reasoning_details;
              if (reasoningDetails) {
                let deltaText = '';
                if (Array.isArray(reasoningDetails)) {
                  for (const item of reasoningDetails) {
                    if (item && typeof item === 'object') {
                      if (typeof item.text === 'string') deltaText += item.text;
                    } else if (typeof item === 'string') {
                      deltaText += item;
                    }
                  }
                } else if (typeof reasoningDetails === 'object') {
                  if (typeof reasoningDetails.text === 'string') {
                    deltaText += reasoningDetails.text;
                  }
                } else if (typeof reasoningDetails === 'string') {
                  deltaText += reasoningDetails;
                }
                if (deltaText) {
                  reasoningAccumulated += deltaText;
                  this.onReasoning?.(reasoningAccumulated);
                }
              }
            } catch {
              // Ignore invalid JSON
            }
          }
        }
      }
    } finally {
      reader.cancel();
    }

    this.onComplete(fullMessage);
  }

  public async processStream(
    model: string,
    reasoning: ReasoningEffort,
    messages: MessageType[],
    tools?: Tool[]
  ): Promise<void> {
    try {
      return await this.safeProcessStream(model, reasoning, messages, tools);
    } catch (error) {
      this.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
