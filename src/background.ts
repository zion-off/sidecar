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
  try {
    const monacoInstance = window.monaco;
    if (!monacoInstance) return;

    const baseEditor = monacoInstance.editor.getEditors()[0];
    if (!baseEditor) return;

    // Clean up any previous diff session via existing resolveSuggestion
    if (typeof window.resolveSuggestion === 'function') {
      try {
        window.resolveSuggestion(false);
      } catch {
        /* ignore */
      }
    }

    const baseModel = baseEditor.getModel();
    const language = baseModel?.getLanguageId?.() || 'plaintext';

    const originalModel = monacoInstance.editor.createModel(suggestion.originalCode, language);
    const modifiedModel = monacoInstance.editor.createModel(suggestion.suggestedCode, language);

    const baseDom = baseEditor.getDomNode();
    if (!baseDom || !baseDom.parentElement) return;

    // Hide original single editor
    baseDom.style.display = 'none';

    const diffContainerId = 'extension-inline-diff-container';
    let diffContainer = document.getElementById(diffContainerId);
    if (diffContainer) diffContainer.remove();
    diffContainer = document.createElement('div');
    diffContainer.id = diffContainerId;
    diffContainer.style.width = '100%';
    diffContainer.style.height = baseDom.style.height || '100%';
    diffContainer.style.position = 'relative';
    baseDom.parentElement.appendChild(diffContainer);

    const diffEditor = monacoInstance.editor.createDiffEditor(diffContainer, {
      automaticLayout: true,
      renderSideBySide: false,
      originalEditable: false,
      hideUnchangedRegions: { enabled: true },
      minimap: { enabled: false }
    });
    diffEditor.setModel({ original: originalModel, modified: modifiedModel });

    function cleanup(apply?: boolean) {
      try {
        if (apply && baseModel) baseModel.setValue(modifiedModel.getValue());
        diffEditor.dispose();
        originalModel.dispose();
        modifiedModel.dispose();
        diffContainer?.remove();
        if (baseDom) baseDom.style.display = '';
      } catch (err) {
        console.error('[Extension] diff cleanup error', err);
      }
      window.postMessage({ type: 'SUGGESTION_RESOLVED_FROM_PAGE' }, '*');
    }

    // Expose for background-triggered accept/reject via resolveSuggestionScript
    window.resolveSuggestion = (isAccept: boolean) => cleanup(isAccept);
  } catch (e) {
    console.error('[Extension] Error showing suggestion:', e);
  }
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
