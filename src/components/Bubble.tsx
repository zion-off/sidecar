import { MessageType } from '@/types/chat';
import { hasMarkdownSyntax, parseMarkdown } from '@/utils/markdown';

export function Bubble({ content, role }: MessageType) {
  // Check if content has markdown syntax
  const shouldParseMarkdown = hasMarkdownSyntax(content);

  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-xs whitespace-pre-line rounded-lg px-2 py-1 lg:max-w-md ${
          role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
        }`}
      >
        {shouldParseMarkdown ? (
          <div
            className={`markdown-content ${role === 'assistant' ? 'dark' : ''}`}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
          />
        ) : (
          content
        )}
      </div>
    </div>
  );
}
