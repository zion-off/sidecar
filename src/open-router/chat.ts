import type { MessageType, StreamChatCompletionBody, StreamChatCompletionOptions } from '@/types/chat';
import { ReasoningEffort, Tool } from '@/types/open-router';

export class ChatCompletion {
  private apiKey: string;
  private onChunk: StreamChatCompletionOptions['onChunk'];
  private onReasoning: StreamChatCompletionOptions['onReasoning'];
  private onComplete: StreamChatCompletionOptions['onComplete'];
  private onError: StreamChatCompletionOptions['onError'];

  constructor(options: Omit<StreamChatCompletionOptions, 'model' | 'reasoning' | 'messages'>) {
    this.apiKey = options.apiKey;
    this.onChunk = options.onChunk;
    this.onReasoning = options.onReasoning;
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
              const content = parsed.choices?.[0]?.delta?.content;
              const reasoningDetails = parsed.choices?.[0]?.delta?.reasoning_details;
              if (content) {
                if (content) {
                  fullMessage += content;
                  this.onChunk(content, fullMessage);
                }
              }
              if (reasoningDetails) {
                let deltaText = '';
                if (Array.isArray(reasoningDetails)) {
                  // Each element may be an object like { type: 'reasoning.text', text: '...', ... } or a raw string
                  for (const item of reasoningDetails) {
                    if (item && typeof item === 'object') {
                      if (typeof item.text === 'string') deltaText += item.text;
                    } else if (typeof item === 'string') {
                      deltaText += item;
                    }
                  }
                } else if (typeof reasoningDetails === 'object') {
                  // Single object case
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
