import { SuggestionProps } from '@/types/chat';

export function Suggestion({ injectionStatus, activeSuggestion, resolveSuggestion, showSuggestions }: SuggestionProps) {
  return (
    <div className="w-full max-w-full">
      {injectionStatus.message && (
        <div
          className={`mb-4 rounded-lg p-3 ${
            injectionStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {injectionStatus.success ? '✅' : '❌'} {injectionStatus.message}
        </div>
      )}

      <div className="mb-4 space-y-3">
        {activeSuggestion ? (
          <div className="flex justify-end gap-2">
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
        ) : (
          <button
            onClick={() => showSuggestions()}
            className="w-full rounded-lg bg-neutral-600 px-4 py-2 font-bold text-white transition-colors"
          >
            Generate Suggestion
          </button>
        )}
      </div>
    </div>
  );
}
