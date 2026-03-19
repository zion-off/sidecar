export function showSuggestionScript(
  suggestion: { originalCode: string; suggestedCode: string },
  suggestionResolvedType: string
): void {
  try {
    const monacoInstance = window.monaco;
    if (!monacoInstance) return;

    const baseEditor = monacoInstance.editor.getEditors()[0];
    if (!baseEditor) return;

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
      window.postMessage({ type: suggestionResolvedType }, '*');
    }

    window.resolveSuggestion = (isAccept: boolean) => cleanup(isAccept);
  } catch (e) {
    console.error('[Extension] Error showing suggestion:', e);
  }
}

export function resolveSuggestionScript(isAccept: boolean): void {
  if (typeof window.resolveSuggestion === 'function') {
    window.resolveSuggestion(isAccept);
  }
}
