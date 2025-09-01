import { MessageType } from '@/types/chat';
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

export const seedChat = (question: string): MessageType[] => {
  return [
    {
      role: 'assistant',
      content: `Need help with <strong>${question.replace(/^\d+\.\s*/, '')}</strong>?`
    }
  ];
};

export function stripControlPreamble(raw: string): string {
  if (!raw) return raw;
  const CONTROL_PRE = /^(?:\s*<\|start\|>assistant<\|channel\|>[a-zA-Z0-9_-]+<\|message\|>)+/;
  if (CONTROL_PRE.test(raw)) {
    return raw.replace(CONTROL_PRE, '');
  }
  return raw;
}
