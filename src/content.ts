import { createHandlebar } from '@/handlebar';

const MSG = __SIDECAR_MSG__;

// Individual data fetching functions
export function getProblemTitle(): string {
  const problemTitleElement =
    document.querySelector('.text-title-large a[href*="/problems/"]') ||
    document.querySelector('a[href*="/problems/"]:first-of-type');
  return problemTitleElement?.textContent?.trim() || 'Unknown Problem';
}

export function getProblemDescription(): string {
  const descriptionElement = document.querySelector('[data-track-load="description_content"]');
  return descriptionElement?.innerHTML || '';
}

export function getLanguage(): string {
  // Look for the language selector button with the specific pattern from LeetCode
  const languageButton = document.querySelector('button[aria-haspopup="dialog"] .svg-inline--fa.fa-chevron-down');
  if (languageButton && languageButton.parentElement) {
    // Get the button element and extract text before the icon
    const buttonElement = languageButton.parentElement;
    const buttonText = buttonElement.childNodes[0]?.textContent?.trim();
    if (buttonText) return buttonText;
  }

  // Alternative approach: look for button containing both text and chevron icon
  const buttons = document.querySelectorAll('button[aria-haspopup="dialog"]');
  for (const button of buttons) {
    const hasChevron = button.querySelector('.fa-chevron-down');
    if (hasChevron) {
      // Extract text content excluding the icon
      const textNode = Array.from(button.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
      );
      if (textNode && textNode.textContent) {
        return textNode.textContent.trim();
      }
    }
  }

  return 'Unknown';
}

export function getEditorContent(): string {
  // Fallback to DOM method (only visible content) - will be replaced by async version
  const viewLinesElement = document.querySelector('.view-lines[role="presentation"]');
  if (!viewLinesElement) return '';
  const viewLines = viewLinesElement.querySelectorAll('.view-line');
  const lines: string[] = [];
  viewLines.forEach((line) => {
    const textContent = line.textContent || '';
    const cleanedContent = textContent.replace(/\u00A0/g, ' ');
    lines.push(cleanedContent);
  });
  return lines.join('\n');
}

export async function getEditorContentAsync(): Promise<string> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: MSG.GET_EDITOR_CONTENT_FROM_CONTENT_SCRIPT }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting editor content from background:', chrome.runtime.lastError);
        // Fallback to DOM method
        resolve(getEditorContent());
      } else {
        const content = response?.content || '';
        if (content.trim().length > 0) {
          resolve(content);
        } else {
          console.error('Background script returned empty content, using DOM fallback');
          resolve(getEditorContent());
        }
      }
    });
  });
}

export async function getEditorSelectionAsync(): Promise<string> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: MSG.GET_EDITOR_SELECTION_FROM_CONTENT_SCRIPT }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting editor selection from background:', chrome.runtime.lastError);
        resolve('');
      } else {
        resolve(response?.selectedText || '');
      }
    });
  });
}

async function main() {
  const appIframe = document.createElement('iframe');
  appIframe.id = 'extension-iframe';
  appIframe.allow = 'clipboard-read; clipboard-write';
  appIframe.src = chrome.runtime.getURL('index.html');
  const { handlebar, overlay, setToggleState } = createHandlebar(appIframe);

  function sendProblemTitleToApp() {
    if (appIframe.contentWindow) {
      const problemTitle = getProblemTitle();
      appIframe.contentWindow.postMessage(
        {
          type: MSG.PROBLEM_TITLE_UPDATE,
          data: {
            title: problemTitle,
            timestamp: Date.now()
          }
        },
        '*'
      );
    }
  }

  window.addEventListener('message', (event) => {
    if (event.source !== appIframe.contentWindow) return;

    const { type, code, highlights, suggestion, isAccept } = event.data;

    switch (type) {
      case MSG.REQUEST_PROBLEM_TITLE:
        sendProblemTitleToApp();
        break;

      case MSG.GET_PROBLEM_DATA:
        // Send all problem data when requested
        (async () => {
          const [editorContent, selectedText] = await Promise.all([
            getEditorContentAsync(),
            getEditorSelectionAsync()
          ]);
          appIframe.contentWindow?.postMessage(
            {
              type: MSG.PROBLEM_DATA_RESPONSE,
              data: {
                title: getProblemTitle(),
                description: getProblemDescription(),
                editorContent: editorContent,
                language: getLanguage(),
                timestamp: Date.now(),
                selectedText: selectedText || undefined
              }
            },
            '*'
          );
        })();
        break;

      case MSG.INJECT_CODE:
        chrome.runtime.sendMessage({ type: MSG.INJECT_CODE_FROM_CONTENT_SCRIPT, code }, (response) => {
          if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
          appIframe.contentWindow?.postMessage(
            {
              type: MSG.INJECTION_RESULT,
              success: response?.success,
              message: response?.success ? 'Code injected successfully!' : 'Failed to inject code'
            },
            '*'
          );
        });
        break;

      case MSG.HIGHLIGHT_LINES:
        chrome.runtime.sendMessage({
          type: MSG.HIGHLIGHT_LINES_FROM_CONTENT_SCRIPT,
          highlights
        });
        break;

      case MSG.SHOW_SUGGESTION:
        chrome.runtime.sendMessage({
          type: MSG.SHOW_SUGGESTION_FROM_CONTENT_SCRIPT,
          suggestion
        });
        break;

      case MSG.RESOLVE_SUGGESTION:
        chrome.runtime.sendMessage({
          type: MSG.RESOLVE_SUGGESTION_FROM_CONTENT_SCRIPT,
          isAccept
        });
        break;

      case MSG.CLOSE_PANEL:
        setToggleState(false);
        break;
    }
  });

  window.addEventListener(
    'message',
    (event) => {
      if (event.source !== window) return;

      if (event.data.type === MSG.SUGGESTION_RESOLVED_FROM_PAGE) {
        appIframe.contentWindow?.postMessage({ type: MSG.SUGGESTION_RESOLVED }, '*');
      } else if (event.data.type === MSG.MONACO_SELECTION_CHANGED) {
        appIframe.contentWindow?.postMessage(
          { type: MSG.SELECTION_CHANGED, selectedText: event.data.selectedText },
          '*'
        );
      }
    },
    false
  );

  // Wait for LeetCode content to load and inject the panel
  const mainContentContainer = await waitForElement(['#qd-content']);
  mainContentContainer.insertAdjacentElement('afterend', overlay);
  mainContentContainer.insertAdjacentElement('afterend', appIframe);
  mainContentContainer.insertAdjacentElement('afterend', handlebar);

  // Wait for iframe to load before sending initial data
  let titleSent = false;

  const sendTitleWhenReady = () => {
    if (!titleSent) {
      sendProblemTitleToApp();
      titleSent = true;
    }
  };

  appIframe.addEventListener('load', () => {
    // Small delay to ensure React app is mounted
    setTimeout(sendTitleWhenReady, 100);
    chrome.runtime.sendMessage({ type: MSG.SETUP_SELECTION_LISTENER_FROM_CONTENT_SCRIPT });
  });

  // Fallback: try sending after a longer delay in case load event doesn't fire
  setTimeout(sendTitleWhenReady, 1000);

}

function waitForElement(selectors: string[]): Promise<Element> {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          observer.disconnect();
          return;
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

main();

export {};
