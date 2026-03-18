import { useEffect, useCallback } from 'react';
import { SuggestionProps } from '@/types/chat';

export function Suggestion({ activeSuggestion, resolveSuggestion }: SuggestionProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!activeSuggestion) return;
      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        resolveSuggestion(true);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        resolveSuggestion(false);
      }
    },
    [activeSuggestion, resolveSuggestion]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className={`mb-2 overflow-hidden transition-all duration-300 ease-in-out ${
        activeSuggestion ? 'max-h-16 opacity-100' : 'pointer-events-none max-h-0 opacity-0'
      }`}
    >
      <div className="flex items-center justify-between rounded-md border border-lc-fg/10 bg-lc-textarea-bg px-3 py-2">
        <span className="text-xxs font-medium tracking-wide text-lc-text-secondary">
          Accept suggestion?
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => resolveSuggestion(false)}
            className="group flex items-center gap-1.5 rounded px-2 py-1 text-xxs text-lc-text-secondary transition-colors hover:bg-lc-fg/5 hover:text-lc-text-body"
          >
            Reject
            <kbd className="rounded border border-lc-fg/10 bg-lc-bg-base px-1 py-px font-mono text-[9px] text-lc-text-secondary transition-colors group-hover:border-lc-fg/20">
              N
            </kbd>
          </button>
          <button
            onClick={() => resolveSuggestion(true)}
            className="group flex items-center gap-1.5 rounded bg-lc-fg/10 px-2 py-1 text-xxs font-medium text-lc-text-body transition-colors hover:bg-lc-fg/15"
          >
            Accept
            <kbd className="rounded border border-lc-fg/10 bg-lc-bg-base px-1 py-px font-mono text-[9px] text-lc-text-secondary transition-colors group-hover:border-lc-fg/20">
              Y
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
