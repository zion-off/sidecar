import { MessageType } from '@/types/chat';
import { PageData } from '@/types/editor';

export function buildSystemPrompt(pageData: PageData, customInstructions: string = ''): MessageType {
  return {
    role: 'system',
    content: `
    You are a helpful coding assistant helping the user get better at solving Leetcode problems. ${customInstructions.length > 0 ? `\n\n${customInstructions}\n` : ''}

    The user is currently attempting to solve ${pageData.title}.

    Here is the problem description:

    \`\`\`html
    ${String(pageData.description)}
    \`\`\`

    ${
      pageData.editorContent.length > 0
        ? `
    Here is the user's current code:

    \`\`\`${pageData.language}
    ${pageData.editorContent}
    \`\`\`
    `
        : ''
    }

    Use this context to answer the user's questions.`
  };
}
