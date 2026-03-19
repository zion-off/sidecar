import type * as monaco from 'monaco-editor';
import { getEditorContentScript, getEditorSelectionScript } from '@/monaco/editor';
import { setupSelectionListenerScript } from '@/monaco/selection';
import { resolveSuggestionScript, showSuggestionScript } from '@/monaco/suggestion';

const MSG = __SIDECAR_MSG__;

declare global {
  interface Window {
    monaco?: typeof monaco;
    __sidecarSelectionListenerAttached?: boolean;
    Diff?: {
      diffLines(
        oldText: string,
        newText: string
      ): Array<{
        value: string;
        added?: boolean;
        removed?: boolean;
      }>;
    };
    myExtensionDecorations?: string[];
    resolveSuggestion?: (isAccept: boolean) => void;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  if (!tabId) return true;

  const { type, suggestion, isAccept } = message;

  switch (type) {
    case MSG.GET_EDITOR_CONTENT_FROM_CONTENT_SCRIPT:
      chrome.scripting
        .executeScript({
          target: { tabId },
          func: getEditorContentScript,
          world: 'MAIN'
        })
        .then((result) => sendResponse({ content: result[0].result }))
        .catch((error) => {
          console.error(error);
          sendResponse({ content: '' });
        });
      break;

    case MSG.SETUP_SELECTION_LISTENER_FROM_CONTENT_SCRIPT:
      chrome.scripting.executeScript({
        target: { tabId },
        func: setupSelectionListenerScript,
        args: [MSG.MONACO_SELECTION_CHANGED],
        world: 'MAIN'
      });
      break;

    case MSG.GET_EDITOR_SELECTION_FROM_CONTENT_SCRIPT:
      chrome.scripting
        .executeScript({
          target: { tabId },
          func: getEditorSelectionScript,
          world: 'MAIN'
        })
        .then((result) => sendResponse({ selectedText: result[0].result }))
        .catch((error) => {
          console.error(error);
          sendResponse({ selectedText: '' });
        });
      break;

    case MSG.SHOW_SUGGESTION_FROM_CONTENT_SCRIPT:
      chrome.scripting.executeScript({
        target: { tabId },
        func: showSuggestionScript,
        args: [suggestion, MSG.SUGGESTION_RESOLVED_FROM_PAGE],
        world: 'MAIN'
      });
      break;

    case MSG.RESOLVE_SUGGESTION_FROM_CONTENT_SCRIPT:
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
