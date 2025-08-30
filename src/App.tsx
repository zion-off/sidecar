import { HiMiniSparkles } from 'react-icons/hi2';
import { useEffect, useState } from 'react';
import { InjectionStatus, PageData, Suggestion } from '@/types/editor';
import { Chat } from '@/components/Chat';

function App() {
  const [problemData, setProblemData] = useState<PageData | null>(null);
  const [injectionStatus, setInjectionStatus] = useState<InjectionStatus>({});

  const [generatedCode, setGeneratedCode] = useState<string>(`def twoSum(nums, target):
    """
    Given an array of integers nums and an integer target,
    return indices of the two numbers such that they add up to target.
    """
    num_map = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    
    return []  # No solution found`);

  const [activeSuggestion, setActiveSuggestion] = useState<boolean>(false);

  const postMessageToParent = (message: object) => {
    window.parent.postMessage(message, '*');
  };

  const sendCodeToEditor = (code: string) => {
    setInjectionStatus({});
    postMessageToParent({ type: 'INJECT_CODE', code: code });
  };

  const generateAndShowSuggestion = () => {
    if (!problemData) return;

    const originalCode = problemData.editorContent || '';
    const suggestedCode = `def twoSum(nums, target):
    """
    Given an array of integers nums and an integer target,
    return indices of the two numbers such that they add up to target.
    """
    num_to_index = {} # More descriptive variable name
    for index, num in enumerate(nums):
        complement = target - num
        if complement in num_to_index:
            return [num_to_index[complement], index]
        num_to_index[num] = index
    # No explicit return is needed if a solution is guaranteed.`;

    const newSuggestion: Suggestion = { originalCode, suggestedCode };

    setActiveSuggestion(true);
    postMessageToParent({
      type: 'SHOW_SUGGESTION',
      suggestion: newSuggestion
    });
  };

  const resolveSuggestion = (isAccept: boolean) => {
    postMessageToParent({ type: 'RESOLVE_SUGGESTION', isAccept });
  };

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
    <div className="h-full w-full max-w-full overflow-auto bg-lc-bg">
      <div className="sticky top-0 flex h-9 items-center bg-lc-fg p-1">
        <div className="flex items-center gap-1 px-2">
          <HiMiniSparkles className="text-yellow-500" />
          <h2 className="text-lc-primary text-[14px] font-medium">Agent</h2>
        </div>
      </div>

      <Chat />

      <div className="w-full max-w-full p-4">
        {injectionStatus.message && (
          <div
            className={`mb-4 rounded-lg p-3 ${
              injectionStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {injectionStatus.success ? '✅' : '❌'} {injectionStatus.message}
          </div>
        )}
        <h1 className="mb-4 text-xl font-bold text-gray-900">{problemData.title}</h1>

        {/* Display Problem Data */}
        <div className="mb-4 space-y-3 border-b pb-4">
          <h3 className="font-medium text-gray-800">📊 Page Data</h3>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Title:</span>{' '}
                <span className="text-gray-900">{problemData.title || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Language:</span>{' '}
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  {problemData.language || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Description:</span>
                <div className="mt-1 max-h-40 overflow-y-auto rounded border bg-white p-3 text-sm text-gray-900">
                  {problemData.description ? (
                    <div
                      className="prose prose-sm max-w-none [&>code]:rounded [&>code]:bg-gray-100 [&>code]:px-1 [&>code]:py-0.5 [&>code]:text-xs [&>em]:italic [&>li]:mb-1 [&>ol]:mb-2 [&>p]:mb-2 [&>pre]:rounded [&>pre]:bg-gray-100 [&>pre]:p-2 [&>pre]:text-xs [&>strong]:font-semibold [&>ul]:mb-2"
                      dangerouslySetInnerHTML={{ __html: problemData.description }}
                    />
                  ) : (
                    <span className="italic text-gray-500">No description available</span>
                  )}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Timestamp:</span>{' '}
                <span className="text-gray-900">
                  {problemData.timestamp ? new Date(problemData.timestamp).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Editor Content Length:</span>{' '}
                <span className="text-gray-900">{problemData.editorContent?.length || 0} chars</span>
              </div>
              {problemData.editorContent && (
                <div>
                  <span className="font-medium text-gray-700">Current Editor Content:</span>
                  <pre className="mt-1 max-h-32 overflow-y-auto rounded bg-gray-900 p-2 font-mono text-xs text-green-400">
                    {problemData.editorContent}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4 space-y-3 border-b pb-4">
          <h3 className="font-medium text-gray-800">AI Actions</h3>
          {activeSuggestion ? (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
              <p className="mb-3 text-center text-sm font-medium text-purple-800">
                💡 Suggestion is active in the editor. What would you like to do?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => resolveSuggestion(true)}
                  className="w-full rounded-lg bg-green-600 px-4 py-2 font-bold text-white transition-colors hover:bg-green-700"
                >
                  Keep
                </button>
                <button
                  onClick={() => resolveSuggestion(false)}
                  className="w-full rounded-lg bg-red-600 px-4 py-2 font-bold text-white transition-colors hover:bg-red-700"
                >
                  Undo
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={generateAndShowSuggestion}
              className="w-full rounded-lg bg-purple-600 px-4 py-2 font-bold text-white transition-colors hover:bg-purple-700"
            >
              💡 Generate Suggestion
            </button>
          )}
        </div>
        <div className="space-y-3">
          <h3 className="font-medium text-gray-800">Manual Controls</h3>
          <div className="rounded-lg bg-green-50 p-4">
            <h4 className="mb-2 font-medium text-green-800">Code to Inject</h4>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-gray-900 p-3 font-mono text-xs text-green-400">
              {generatedCode}
            </pre>
          </div>
          <button
            onClick={() => sendCodeToEditor(generatedCode)}
            className="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            📝 Inject Above Code
          </button>
          <button
            onClick={() => setGeneratedCode(`# New sample code\nprint("Hello from the extension!")`)}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            🔄 Update Sample Code
          </button>
          <button
            onClick={() => sendCodeToEditor('')}
            className="w-full rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            🗑️ Clear Editor
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
