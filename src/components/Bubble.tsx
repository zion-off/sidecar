import { MessageType } from '@/types/chat';
import { parseMarkdown } from '@/utils/markdown';

export function Bubble({ content, role }: MessageType) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`overflow-hidden rounded-lg px-2 py-1 ${role === 'user' ? 'bg-blue-500 text-white' : 'text-white'}`}
      >
        <div
          className={`markdown-content ${role === 'assistant' ? 'dark' : ''}`}
          dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
        />
      </div>
    </div>
  );
}
