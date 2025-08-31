import { MessageType } from '@/types/chat';
import { parseMarkdown } from '@/utils/markdown';
import { stripControlPreamble } from '@/utils/messaging';

export function Bubble({ content, role, type = 'content' }: MessageType) {
  const safe = stripControlPreamble(content);
  return (
    <div className={`flex text-sm ${role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`overflow-hidden rounded-lg px-2 py-1 ${role === 'user' ? 'bg-white/10 text-white' : `${type === 'reasoning' ? 'text-white/60' : 'text-white'}`}`}
      >
        <div
          className={`markdown-content ${role === 'assistant' ? 'dark' : ''}`}
          dangerouslySetInnerHTML={{ __html: parseMarkdown(safe) }}
        />
      </div>
    </div>
  );
}
