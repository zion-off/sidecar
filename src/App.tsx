import { HiMiniSparkles } from 'react-icons/hi2';
import { useCallback, useEffect, useState } from 'react';
import { InjectionStatus, PageData, Suggestion } from '@/types/editor';
import { Chat } from '@/components/Chat';
import { postMessageToParent, sampleSuggestedCode } from '@/utils/messaging';

function App() {
  // Change this to ref later
  const [problemData, setProblemData] = useState<PageData | null>(null);
  const [injectionStatus, setInjectionStatus] = useState<InjectionStatus>({});
  const [activeSuggestion, setActiveSuggestion] = useState<boolean>(false);

  const sendCodeToEditor = useCallback((code: string) => {
    setInjectionStatus({});
    postMessageToParent({ type: 'INJECT_CODE', code: code });
  }, []);

  const showSuggestions = useCallback(
    (suggestedCode: string = sampleSuggestedCode) => {
      if (!problemData) return;

      const originalCode = problemData.editorContent || '';

      const newSuggestion: Suggestion = { originalCode, suggestedCode };

      setActiveSuggestion(true);
      postMessageToParent({
        type: 'SHOW_SUGGESTION',
        suggestion: newSuggestion
      });
    },
    [problemData]
  );

  const resolveSuggestion = useCallback((isAccept: boolean) => {
    postMessageToParent({ type: 'RESOLVE_SUGGESTION', isAccept });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, data, success, message } = event.data;

      switch (type) {
        case 'PAGE_DATA_UPDATE':
          setProblemData(data);
          break;
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
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!problemData) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">🤖 Agent</h3>
          <p className="text-gray-600">Waiting for page data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full max-w-full flex-col bg-lc-text-light">
      <div className="flex h-9 items-center gap-1 bg-lc-fg p-1 px-3">
        <HiMiniSparkles className="text-yellow-500" />
        <h2 className="text-lc-primary text-[14px] font-medium">Agent</h2>
      </div>

      <Chat
        pageData={problemData}
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
