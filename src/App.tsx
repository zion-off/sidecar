import { HiMiniSparkles } from 'react-icons/hi2';
import { TbReload, TbLayoutSidebarRightCollapse } from 'react-icons/tb';
import { Toaster } from 'sonner';
import { useCallback, useEffect, useState } from 'react';
import { Chat } from '@/components/Chat';
import { MSG } from '@/types/messages';
import { postMessageToParent } from '@/utils/messaging';

function App() {
  const [problemTitle, setProblemTitle] = useState<string | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<boolean>(false);
  const [resetKey, setResetKey] = useState(0);

  const [suggestionRequest, setSuggestionRequest] = useState<string | null>(null);

  const showSuggestions = useCallback((suggestedCode?: string) => {
    if (!suggestedCode) return;
    setSuggestionRequest(suggestedCode);
    // Request current problem data from content script
    postMessageToParent({ type: MSG.GET_PROBLEM_DATA });
  }, []);

  const resolveSuggestion = useCallback((isAccept: boolean) => {
    postMessageToParent({ type: MSG.RESOLVE_SUGGESTION, isAccept });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;

      switch (type) {
        case MSG.PROBLEM_TITLE_UPDATE:
          setProblemTitle(data.title);
          break;
        case MSG.PROBLEM_DATA_RESPONSE: {
          // Handle problem data response for suggestions
          if (suggestionRequest) {
            const originalCode = data.editorContent || '';
            const newSuggestion = { originalCode, suggestedCode: suggestionRequest };
            setActiveSuggestion(true);
            postMessageToParent({
              type: MSG.SHOW_SUGGESTION,
              suggestion: newSuggestion
            });
            setSuggestionRequest(null);
          }
          break;
        }
        case MSG.SUGGESTION_RESOLVED:
          setActiveSuggestion(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    setTimeout(() => {
      postMessageToParent({ type: MSG.REQUEST_PROBLEM_TITLE });
    }, 500);

    return () => window.removeEventListener('message', handleMessage);
  }, [suggestionRequest]);

  if (!problemTitle) {
    return (
      <div className="flex h-full items-center justify-center bg-lc-bg-base">
        <div className="text-center">
          <p className="animate-pulse text-neutral-500">Loading problem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full max-w-full flex-col overflow-hidden bg-lc-bg-base">
      <Toaster />
      <div className="flex h-9 items-center justify-between bg-lc-layer-one p-1 pl-3 pr-1">
        <span className="flex items-center gap-1">
          {HiMiniSparkles({ className: 'text-yellow-500' })}
          <h2 className="text-[14px] font-[600] text-lc-primary">Sidecar</h2>
        </span>
        <div className="flex items-center">
          <span
            onClick={() => setResetKey((prev) => prev + 1)}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md p-[5px] text-neutral-400 hover:text-neutral-500 dark:hover:bg-white/10 dark:hover:text-neutral-500"
            title="Reset chat"
          >
            {TbReload({ className: 'h-[14px] w-[14px]' })}
          </span>
          <span
            onClick={() => postMessageToParent({ type: MSG.CLOSE_PANEL })}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md p-[5px] text-neutral-400 hover:text-neutral-500 dark:hover:bg-white/10 dark:hover:text-neutral-500"
            title="Close panel"
          >
            {TbLayoutSidebarRightCollapse({ className: 'h-[14px] w-[14px]' })}
          </span>
        </div>
      </div>

      <Chat
        key={resetKey}
        problemTitle={problemTitle}
        activeSuggestion={activeSuggestion}
        showSuggestions={showSuggestions}
        resolveSuggestion={resolveSuggestion}
      />
    </div>
  );
}

export default App;
