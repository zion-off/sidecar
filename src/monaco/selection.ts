export function setupSelectionListenerScript(monacoSelectionChangedType: string): void {
  if (window.__sidecarSelectionListenerAttached) return;

  const waitForEditor = () => {
    const monacoInstance = window.monaco;
    if (!monacoInstance?.editor) {
      setTimeout(waitForEditor, 500);
      return;
    }
    const editors = monacoInstance.editor.getEditors();
    if (!editors.length) {
      setTimeout(waitForEditor, 500);
      return;
    }

    window.__sidecarSelectionListenerAttached = true;
    const editor = editors[0];
    editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection();
      let selectedText = '';
      if (selection && !selection.isEmpty()) {
        const model = editor.getModel();
        if (model) selectedText = model.getValueInRange(selection);
      }
      window.postMessage({ type: monacoSelectionChangedType, selectedText }, '*');
    });
  };

  waitForEditor();
}
