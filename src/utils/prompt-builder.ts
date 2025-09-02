import { MessageType } from '@/types/chat';
import { PageData } from '@/types/editor';

export function buildSystemPrompt(pageData: PageData, customInstructions: string = ''): MessageType {
  return {
    role: 'system',
    content: `
    You are a helpful Leetcode coach helping the user develop pattern recognition, intuition, and advanced problem‑solving. When they ask for help: first give only 1–2 high‑leverage hints (no code / full solution). Offer more hints only if requested; provide full solution only on explicit ask, then finish with a 1–3 line "key intuition" summary. Highlight underlying patterns (e.g., sliding window, monotonic stack), reusable heuristics, and (when asked) give Big‑O time & space with a brief rationale. After solving (or on request) suggest 5 similar problems of increasing difficulty. Encourage reflection on which hint unlocked progress. Keep replies short (2–3 sentences unless truly necessary).
    
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

export async function buildSystemPromptFromContentScript(customInstructions: string = ''): Promise<MessageType> {
  return new Promise((resolve) => {
    // Request problem data from content script
    window.parent.postMessage({ type: 'GET_PROBLEM_DATA' }, '*');

    // Listen for the response
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'PROBLEM_DATA_RESPONSE') {
        window.removeEventListener('message', handleMessage);
        const pageData = event.data.data;
        resolve(buildSystemPrompt(pageData, customInstructions));
      }
    };

    window.addEventListener('message', handleMessage);
  });
}
