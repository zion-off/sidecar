import { MessageType } from '@/types/chat';
import { PageData } from '@/types/editor';

export function buildSystemPrompt(pageData: PageData, customInstructions: string = ''): MessageType {
  return {
    role: 'system',
    content: `
    You are a helpful Leetcode coach. Answer the user's questions naturally and conversationally. When they ask for help with problem-solving: give 1–2 high‑leverage hints first (no code/full solution). Offer more hints only if requested; provide full solution only on explicit ask. After the user has solved the problem or conversation winds down, you can discuss underlying patterns (e.g., sliding window, monotonic stack), reusable heuristics, Big‑O analysis, and suggest similar problems for practice. Keep responses concise unless detail is needed.
    
    ${customInstructions.length > 0 ? `\n\n${customInstructions}\n` : ''}

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

export function buildEditorContent(pageData: PageData): MessageType {
  return {
    role: 'system',
    content: `
    ${
      pageData.editorContent.length > 0
        ? `
    Here is the user's current code:

    \`\`\`${pageData.language}
    ${pageData.editorContent}
    \`\`\`
    `
        : ''
    }`
  };
}

export async function getPageData(): Promise<PageData> {
  return new Promise((resolve) => {
    window.parent.postMessage({ type: 'GET_PROBLEM_DATA' }, '*');

    // Listen for the response
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'PROBLEM_DATA_RESPONSE') {
        window.removeEventListener('message', handleMessage);
        const pageData = event.data.data;
        resolve(pageData as PageData);
      }
    };

    window.addEventListener('message', handleMessage);
  });
}
