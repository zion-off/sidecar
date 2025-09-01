import { SuggestionProps } from '@/types/chat';

export function Suggestion({ activeSuggestion, resolveSuggestion }: SuggestionProps) {
  return (
    <div className="w-full max-w-full">
      <div className="relative mb-4 space-y-3 overflow-hidden">
        <div
          className={`flex justify-end gap-2 transition-all duration-300 ease-in-out ${
            activeSuggestion
              ? 'translate-y-0 transform opacity-100'
              : 'pointer-events-none translate-y-4 transform opacity-0'
          }`}
        >
          <button
            onClick={() => resolveSuggestion(true)}
            className="w-fit rounded-2xl border border-green-500/20 bg-green-600/10 px-4 py-1 text-xs text-green-700 transition-colors hover:bg-green-700/20"
          >
            Keep
          </button>
          <button
            onClick={() => resolveSuggestion(false)}
            className="w-fit rounded-2xl border border-red-500/20 bg-red-600/10 px-4 py-1 text-xs text-red-700 transition-colors hover:bg-red-700/20"
          >
            Undo
          </button>
        </div>
      </div>
    </div>
  );
}
