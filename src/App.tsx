import { HiMiniSparkles } from 'react-icons/hi2';
import { Toaster } from 'sonner';
import { useCallback, useEffect, useState } from 'react';
import { InjectionStatus } from '@/types/editor';
import { Chat } from '@/components/Chat';
import { postMessageToParent, sampleSuggestedCode } from '@/utils/messaging';

function App() {
  const [problemTitle, setProblemTitle] = useState<string | null>(null);
  const [injectionStatus, setInjectionStatus] = useState<InjectionStatus>({});
  const [activeSuggestion, setActiveSuggestion] = useState<boolean>(false);

  const sendCodeToEditor = useCallback((code: string) => {
    setInjectionStatus({});
    postMessageToParent({ type: 'INJECT_CODE', code: code });
  }, []);

  const [suggestionRequest, setSuggestionRequest] = useState<string | null>(null);

  const showSuggestions = useCallback((suggestedCode: string = sampleSuggestedCode) => {
    setSuggestionRequest(suggestedCode);
    // Request current problem data from content script
    postMessageToParent({ type: 'GET_PROBLEM_DATA' });
  }, []);

  const resolveSuggestion = useCallback((isAccept: boolean) => {
    postMessageToParent({ type: 'RESOLVE_SUGGESTION', isAccept });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, data, success, message } = event.data;

      switch (type) {
        case 'PROBLEM_TITLE_UPDATE':
          setProblemTitle(data.title);
          break;
        case 'PROBLEM_DATA_RESPONSE': {
          // Handle problem data response for suggestions
          if (suggestionRequest) {
            const originalCode = data.editorContent || '';
            const newSuggestion = { originalCode, suggestedCode: suggestionRequest };
            setActiveSuggestion(true);
            postMessageToParent({
              type: 'SHOW_SUGGESTION',
              suggestion: newSuggestion
            });
            setSuggestionRequest(null);
          }
          break;
        }
        case 'INJECTION_RESULT':
          setInjectionStatus({
            success,
            message,
            timestamp: Date.now()
          });
          setTimeout(() => setInjectionStatus({}), 3000);
          break;
        case 'SUGGESTION_RESOLVED':
          setActiveSuggestion(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial problem title after component mounts
    setTimeout(() => {
      postMessageToParent({ type: 'REQUEST_PROBLEM_TITLE' });
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
      <div className="flex h-9 items-center gap-1 bg-lc-layer-one p-1 px-3">
        {HiMiniSparkles({ className: 'text-yellow-500' })}
        <h2 className="text-[14px] font-[600] text-lc-primary">Sidecar</h2>
      </div>

      <Chat
        problemTitle={problemTitle}
        activeSuggestion={activeSuggestion}
        injectionStatus={injectionStatus}
        sendCodeToEditor={sendCodeToEditor}
        showSuggestions={showSuggestions}
        resolveSuggestion={resolveSuggestion}
      />
    </div>
  );
}

export default App;
