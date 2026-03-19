import { MessageType } from '@/types/chat';

export const postMessageToParent = (message: object) => {
  window.parent.postMessage(message, '*');
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
