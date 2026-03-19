export function getEditorContentScript(): string {
  try {
    const monacoInstance = window.monaco;
    if (monacoInstance && monacoInstance.editor) {
      const editors = monacoInstance.editor.getEditors();
      for (let i = 0; i < editors.length; i++) {
        const editor = editors[i];
        if (editor) {
          const model = editor.getModel();
          if (model) {
            const content = model.getValue();
            if (content.trim().length > 0) {
              return content;
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('[Extension] Error getting editor content:', e);
  }
  return '';
}

export function getEditorSelectionScript(): string {
  try {
    const monacoInstance = window.monaco;
    if (monacoInstance && monacoInstance.editor) {
      const editors = monacoInstance.editor.getEditors();
      for (let i = 0; i < editors.length; i++) {
        const editor = editors[i];
        if (editor) {
          const selection = editor.getSelection();
          if (selection && !selection.isEmpty()) {
            const model = editor.getModel();
            if (model) {
              return model.getValueInRange(selection);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('[Extension] Error getting editor selection:', e);
  }
  return '';
}
