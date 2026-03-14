import { memo, useMemo } from 'react';
import { MessageType } from '@/types/chat';
import { parseMarkdown } from '@/utils/markdown';
import { stripControlPreamble } from '@/utils/messaging';

export const Bubble = memo(function Bubble({ content, role, type = 'content' }: MessageType) {
  const safe = stripControlPreamble(content);
  const html = useMemo(() => parseMarkdown(safe), [safe]);

  if (role === 'system' || role === 'developer') return null;
  return (
    <div className={`flex text-sm ${role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`overflow-hidden rounded-lg px-2 py-1 ${role === 'user' ? 'bg-white/10 text-lc-text-body' : `${type === 'reasoning' ? 'text-neutral-500 dark:text-white/60' : 'text-lc-text-body'}`}`}
      >
        <div
          className={`markdown-content ${role === 'assistant' ? 'dark' : ''}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
});
