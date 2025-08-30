import { MessageType, StreamChatCompletionOptions } from '@/types/chat';
import { PageData } from '@/types/editor';

export const postMessageToParent = (message: object) => {
  window.parent.postMessage(message, '*');
};

export const sampleSuggestedCode = `def twoSum(nums, target):
    """
    Given an array of integers nums and an integer target,
    return indices of the two numbers such that they add up to target.
    """
    num_to_index = {} # More descriptive variable name
    for index, num in enumerate(nums):
        complement = target - num
        if complement in num_to_index:
            return [num_to_index[complement], index]
        num_to_index[num] = index
    # No explicit return is needed if a solution is guaranteed.`;

export const sampleMessages = (pageData: PageData | null): MessageType[] => {
  return [
    {
      content: `Title: ${pageData?.title}
      Description: ${pageData?.description.slice(0, 10)}
      Current editor content: ${pageData?.editorContent.slice(0, 10)}
      Current editor language: ${pageData?.language}`,
      role: 'assistant'
    },
    { content: 'Hello, how can I assist you today?', role: 'assistant' },
    { content: 'I need help with my code.', role: 'user' }
  ];
};

export async function streamChatCompletion({
  apiKey,
  model,
  messages,
  onChunk,
  onComplete,
  onError
}: StreamChatCompletionOptions): Promise<void> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullMessage = '';

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
              const content = parsed.choices[0].delta.content;
              if (content) {
                fullMessage += content;
                onChunk(content, fullMessage);
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

    onComplete(fullMessage);
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
