import { MessageType } from '@/types/chat';
import { PageData } from '@/types/editor';

export function buildSystemPrompt(pageData: PageData, customInstructions: string = ''): MessageType {
  return {
    role: 'system',
    content: `You are a Leetcode coach. Calibrate the length and depth of your response to what's being asked — do not elaborate beyond what the question warrants.

For problem-solving: lead with 1–2 focused hints, no code or full solutions unless explicitly asked. Once solved, discussing patterns, complexity, and similar problems is appropriate.

The user is working on ${pageData.title}.

\`\`\`html
${String(pageData.description)}
\`\`\`
${customInstructions ? `\n${customInstructions}` : ''}`
  };
}

export function buildEditorContent(pageData: PageData): MessageType {
  return {
    role: 'developer',
    content: `${
      pageData.editorContent.length > 0
        ? `[CURRENT LEETCODE EDITOR CONTENT]

    Here is the user's current code currently visible in their code editor:

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
