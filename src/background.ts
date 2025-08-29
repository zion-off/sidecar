import type * as monaco from 'monaco-editor';

// Extend window interface for Monaco and other globals
declare global {
  interface Window {
    monaco?: typeof monaco;
    Diff?: {
      diffLines(
        _oldText: string,
        _newText: string
      ): Array<{
        value: string;
        added?: boolean;
        removed?: boolean;
      }>;
    };
    myExtensionDecorations?: string[];
    resolveSuggestion?: (_isAccept: boolean) => void;
  }
}

function injectionScript(codeToInject: string): boolean {
  try {
    const monacoInstance = window.monaco;
    if (monacoInstance && monacoInstance.editor) {
      const editor = monacoInstance.editor.getEditors()[0];
      if (editor) {
        const model = editor.getModel();
        if (model) {
          const range = model.getFullModelRange();
          editor.executeEdits('my-extension-source', [
            {
              range: range,
              text: codeToInject,
              forceMoveMarkers: true
            }
          ]);
          return true;
        }
      }
    }
    return false;
  } catch (e) {
    console.error('[Extension] Error during code injection:', e);
    return false;
  }
}

function showSuggestionScript(suggestion: { originalCode: string; suggestedCode: string }): void {
  (async () => {
    try {
      const monacoInstance = window.monaco;
      const editor = monacoInstance?.editor?.getEditors()[0];
      if (!editor) return;

      if (typeof window.Diff === 'undefined') {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/diff/dist/diff.min.js';
          script.onload = () => resolve();
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      const Diff = window.Diff;
      if (!Diff) return;

      const model = editor.getModel();
      if (model) {
        const range = model.getFullModelRange();
        editor.executeEdits('extension-suggestion-initial', [{ range, text: suggestion.suggestedCode }]);
      }

      const diff = Diff.diffLines(suggestion.originalCode, suggestion.suggestedCode);
      const highlights: {
        lineNumber: number;
        className: 'green' | 'red';
      }[] = [];
      let currentLine = 1;

      diff.forEach((part) => {
        const lineCount = (part.value.match(/\n/g) || []).length;
        if (part.added) {
          for (let i = 0; i < lineCount; i++) {
            highlights.push({
              lineNumber: currentLine + i,
              className: 'green'
            });
          }
        }
        if (!part.removed) {
          currentLine += lineCount;
        }
      });

      document.getElementById('extension-suggestion-buttons')?.remove();
      if (!window.myExtensionDecorations) window.myExtensionDecorations = [];

      const newDecorations = highlights.map((h) => ({
        range: new monacoInstance.Range(h.lineNumber, 1, h.lineNumber, 1),
        options: {
          isWholeLine: true,
          className: `line-highlight-${h.className}`
        }
      }));
      const newDecorationIds = editor.deltaDecorations(window.myExtensionDecorations, newDecorations);
      window.myExtensionDecorations = newDecorationIds;

      window.resolveSuggestion = (isAccept: boolean) => {
        const finalCode = isAccept ? suggestion.suggestedCode : suggestion.originalCode;
        if (model)
          editor.executeEdits('extension-suggestion-resolve', [{ range: model.getFullModelRange(), text: finalCode }]);
        window.myExtensionDecorations = editor.deltaDecorations(window.myExtensionDecorations || [], []);
        window.postMessage({ type: 'SUGGESTION_RESOLVED_FROM_PAGE' }, '*');
      };
    } catch (e) {
      console.error('[Extension] Error showing suggestion:', e);
    }
  })();
}

function resolveSuggestionScript(isAccept: boolean): void {
  if (typeof window.resolveSuggestion === 'function') {
    window.resolveSuggestion(isAccept);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  if (!tabId) return true;

  const { type, code, suggestion, isAccept } = message;

  switch (type) {
    case 'INJECT_CODE_FROM_CONTENT_SCRIPT':
      chrome.scripting
        .executeScript({
          target: { tabId },
          func: injectionScript,
          args: [code],
          world: 'MAIN'
        })
        .then((injectionResult) => sendResponse({ success: injectionResult[0].result }))
        .catch((error) => console.error(error));
      break;

    case 'SHOW_SUGGESTION_FROM_CONTENT_SCRIPT':
      chrome.scripting.executeScript({
        target: { tabId },
        func: showSuggestionScript,
        args: [suggestion],
        world: 'MAIN'
      });
      break;

    case 'RESOLVE_SUGGESTION_FROM_CONTENT_SCRIPT':
      chrome.scripting.executeScript({
        target: { tabId },
        func: resolveSuggestionScript,
        args: [isAccept],
        world: 'MAIN'
      });
      break;
  }

  return true;
});

export {};
