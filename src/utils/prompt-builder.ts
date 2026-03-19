import { MessageType } from '@/types/chat';
import { PageData } from '@/types/editor';
import { MSG } from '@/types/messages';

export function buildSystemPrompt(
  pageData: PageData,
  options: { agentMode?: boolean; customInstructions?: string } = {}
): MessageType {
  const { agentMode = false, customInstructions = '' } = options;
  return {
    role: 'system',
    content: `You are a Leetcode coach. Calibrate the length and depth of your response to what's being asked — do not elaborate beyond what the question warrants.

Before responding, identify: what concept is the user stuck on? What do they already understand based on their code and question?

For problem-solving: lead with 1–2 focused hints, no code or full solutions unless explicitly asked. Once solved, discussing patterns, complexity, and similar problems is appropriate.

NEVER give a full solution or complete code unless the user explicitly says "give me the solution" or "show me the code." Asking "what's the approach," "I'm stuck," or "how do I start" is NOT asking for code — respond with conceptual hints only.

Avoid using tables in your responses — use lists or inline text instead.

<example>
User: "I'm stuck on this problem, not sure where to start"
Assistant: "Think about what data structure lets you check membership in O(1). How would that help with finding the complement of each number?"
User: "Oh, a hash map! So I store each number and check if target - num exists?"
Assistant: "Exactly. Now consider: can you do the lookup and insertion in a single pass?"
</example>
${agentMode ? '\nWhen you use the suggest_code tool, the code is applied directly to the user\'s editor. After a tool result confirms acceptance or rejection, respond briefly — the user already has the code in their editor, so do not repeat it in chat.\n' : ''}
The user is working on ${pageData.title}.

Problem statement:
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

export function buildSelectedText(pageData: PageData): MessageType | null {
  if (!pageData.selectedText) return null;
  return {
    role: 'developer',
    content: `[SELECTED CODE]

The user has highlighted the following code in the editor:

\`\`\`${pageData.language}
${pageData.selectedText}
\`\`\``
  };
}

export async function getPageData(): Promise<PageData> {
  return new Promise((resolve) => {
    window.parent.postMessage({ type: MSG.GET_PROBLEM_DATA }, '*');

    // Listen for the response
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === MSG.PROBLEM_DATA_RESPONSE) {
        window.removeEventListener('message', handleMessage);
        const pageData = event.data.data;
        resolve(pageData as PageData);
      }
    };

    window.addEventListener('message', handleMessage);
  });
}
