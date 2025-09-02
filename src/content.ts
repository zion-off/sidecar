import { dragHandlebarSVG, openHandlebarSVG } from '@/assets/icons';

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

async function main() {
  const appIframe = document.createElement('iframe');
  appIframe.id = 'extension-iframe';
  appIframe.allow = 'clipboard-read; clipboard-write';
  appIframe.src = chrome.runtime.getURL('index.html');

  function sendProblemTitleToApp() {
    if (appIframe.contentWindow) {
      const problemTitle = getProblemTitle();
      appIframe.contentWindow.postMessage(
        {
          type: 'PROBLEM_TITLE_UPDATE',
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
      case 'REQUEST_PROBLEM_TITLE':
        sendProblemTitleToApp();
        break;

      case 'GET_PROBLEM_DATA':
        // Send all problem data when requested
        appIframe.contentWindow?.postMessage(
          {
            type: 'PROBLEM_DATA_RESPONSE',
            data: {
              title: getProblemTitle(),
              description: getProblemDescription(),
              editorContent: getEditorContent(),
              language: getLanguage(),
              timestamp: Date.now()
            }
          },
          '*'
        );
        break;

      case 'INJECT_CODE':
        chrome.runtime.sendMessage({ type: 'INJECT_CODE_FROM_CONTENT_SCRIPT', code }, (response) => {
          if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
          appIframe.contentWindow?.postMessage(
            {
              type: 'INJECTION_RESULT',
              success: response?.success,
              message: response?.success ? 'Code injected successfully!' : 'Failed to inject code'
            },
            '*'
          );
        });
        break;

      case 'HIGHLIGHT_LINES':
        chrome.runtime.sendMessage({
          type: 'HIGHLIGHT_LINES_FROM_CONTENT_SCRIPT',
          highlights
        });
        break;

      case 'SHOW_SUGGESTION':
        chrome.runtime.sendMessage({
          type: 'SHOW_SUGGESTION_FROM_CONTENT_SCRIPT',
          suggestion
        });
        break;

      case 'RESOLVE_SUGGESTION':
        chrome.runtime.sendMessage({
          type: 'RESOLVE_SUGGESTION_FROM_CONTENT_SCRIPT',
          isAccept
        });
        break;
    }
  });

  window.addEventListener(
    'message',
    (event) => {
      if (event.source !== window || !event.data.type?.startsWith('SUGGESTION_')) return;

      if (event.data.type === 'SUGGESTION_RESOLVED_FROM_PAGE') {
        appIframe.contentWindow?.postMessage({ type: 'SUGGESTION_RESOLVED' }, '*');
      }
    },
    false
  );

  const handlebar = document.createElement('div');
  handlebar.id = 'extension-handlebar';
  handlebar.style.minWidth = '8px';
  handlebar.style.userSelect = 'none';
  handlebar.style.position = 'relative';

  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.display = 'none';

  let isResizing = false;
  let initialMousePosition = 0;
  let isOpen = true;

  function startResizing(event: MouseEvent) {
    isResizing = true;
    initialMousePosition = event.clientX;
    overlay.style.display = 'block';
  }

  handlebar.addEventListener('mousedown', (event) => {
    if (!isOpen) {
      setToggleState(true);
      return;
    }
    startResizing(event);
  });
  handlebar.addEventListener('dragstart', (event) => event.preventDefault());

  function setToggleState(toggleState: boolean) {
    if (toggleState) {
      appIframe.style.display = 'block';
      handlebar.innerHTML = `
            <div id="handlebar-highlight">${dragHandlebarSVG}</div>
            `;
      handlebar.style.cursor = 'ew-resize';
      chrome.storage.local.set({ extensionToggleState: true });
      isOpen = true;
      handlebar.style.zIndex = '10';
    } else {
      appIframe.style.display = 'none';
      handlebar.innerHTML = openHandlebarSVG;
      handlebar.style.cursor = 'pointer';
      chrome.storage.local.set({ extensionToggleState: false });
      isOpen = false;
      handlebar.style.zIndex = '0';
    }
  }

  function showPanel() {
    chrome.storage.local.get('extensionToggleState', (result) => {
      setToggleState(result.extensionToggleState ?? true);
    });
    chrome.storage.local.set({ shouldShowPanel: true });
    handlebar.style.display = 'flex';
  }

  function hidePanel() {
    chrome.storage.local.set({ shouldShowPanel: false });
    appIframe.style.display = 'none';
    handlebar.style.display = 'none';
  }

  handlebar.addEventListener('dblclick', () => {
    if (isOpen) {
      setToggleState(false);
    }
  });

  function stopResizing() {
    isResizing = false;
    overlay.style.display = 'none';
  }

  function throttle<T extends unknown[]>(func: (..._args: T) => void, limit: number) {
    let inThrottle: boolean;
    return (...params: T) => {
      if (!inThrottle) {
        func(...params);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  const MIN_WIDTH = 350;
  const MAX_WIDTH = 800;

  function updateWidth(event: MouseEvent) {
    if (!isResizing) return;
    const deltaX = initialMousePosition - event.clientX;
    initialMousePosition = event.clientX;
    const currentWidth = parseInt(appIframe.style.width);
    let newWidth = currentWidth + deltaX;

    if (isOpen && initialMousePosition - window.innerWidth - MIN_WIDTH > -450) {
      setToggleState(false);
      return;
    } else if (!isOpen && initialMousePosition - window.innerWidth - MIN_WIDTH < -450) {
      setToggleState(true);
      return;
    }

    if (newWidth < MIN_WIDTH) {
      newWidth = MIN_WIDTH;
      if (deltaX < 0 && event.clientX > handlebar.getBoundingClientRect().right) {
        initialMousePosition = event.clientX;
      }
    } else if (newWidth > MAX_WIDTH) {
      newWidth = MAX_WIDTH;
      if (deltaX > 0 && event.clientX < handlebar.getBoundingClientRect().left) {
        initialMousePosition = event.clientX;
      }
    } else {
      if (deltaX < 0 && event.clientX > handlebar.getBoundingClientRect().right) {
        newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));
      } else if (deltaX > 0 && event.clientX < handlebar.getBoundingClientRect().left) {
        newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));
      } else {
        return;
      }
    }

    appIframe.style.width = `${newWidth}px`;
    chrome.storage.local.set({ extensionWidth: newWidth });
  }

  window.addEventListener('mousemove', throttle(updateWidth, 16));
  window.addEventListener('mouseup', stopResizing);

  // Initialize panel state from storage
  chrome.storage.local.get('extensionToggleState', (result) => {
    setToggleState(result.extensionToggleState ?? true);
  });
  chrome.storage.local.get('extensionWidth', (result) => {
    const extensionWidth = result.extensionWidth ?? '525';
    appIframe.style.width = `${extensionWidth}px`;
  });
  chrome.storage.local.get('shouldShowPanel', (result) => {
    const shouldShowPanel = result.shouldShowPanel ?? true;
    if (shouldShowPanel) {
      showPanel();
    } else {
      hidePanel();
    }
  });

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
  });

  // Fallback: try sending after a longer delay in case load event doesn't fire
  setTimeout(sendTitleWhenReady, 1000);

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    for (const [key, { newValue }] of Object.entries(changes)) {
      if (key === 'shouldShowPanel') {
        if (newValue === true) {
          showPanel();
        } else {
          hidePanel();
        }
      }
      if (key === 'extensionToggleState') {
        setToggleState(newValue === true);
      }
      if (key === 'extensionWidth') {
        appIframe.style.width = `${newValue}px`;
      }
    }
  });
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
