import { TbCode } from 'react-icons/tb';

interface SelectionBadgeProps {
  selectedText: string;
}

export function SelectionBadge({ selectedText }: SelectionBadgeProps) {
  const firstLine = selectedText.split('\n').find((l) => l.trim()) ?? '';
  const lineCount = selectedText.split('\n').filter((l) => l.trim()).length;

  if (!firstLine) return null;

  return (
    <div className="selection-badge mb-1 flex items-center gap-1.5 rounded-md bg-lc-textarea-bg px-2 py-1 dark:drop-shadow-md">
      {TbCode({ className: 'h-3 w-3 flex-shrink-0 text-neutral-400' })}
      <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-neutral-400">
        {firstLine.trim()}
      </span>
      {lineCount > 1 && (
        <span className="flex-shrink-0 text-[9px] text-neutral-500">+{lineCount - 1}</span>
      )}
    </div>
  );
}
