import { dragHandlebarSVG, openHandlebarSVG } from '@/assets/icons';

async function main() {
  const appIframe = document.createElement('iframe');
  appIframe.id = 'extension-iframe';
  appIframe.allow = 'clipboard-read; clipboard-write';
  appIframe.src = chrome.runtime.getURL('index.html');

  function sendPageDataToApp() {
    const descriptionElement = document.querySelector('[data-track-load="description_content"]');
    function extractEditorContent(): string {
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

    function extractCurrentLanguage(): string {
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

    if (descriptionElement && appIframe.contentWindow) {
      const problemTitleElement =
        document.querySelector('.text-title-large a[href*="/problems/"]') ||
        document.querySelector('a[href*="/problems/"]:first-of-type');
      const problemTitle = problemTitleElement?.textContent?.trim() || 'Unknown Problem';
      const editorContent = extractEditorContent();
      const currentLanguage = extractCurrentLanguage();
      appIframe.contentWindow.postMessage(
        {
          type: 'PAGE_DATA_UPDATE',
          data: {
            title: problemTitle,
            description: descriptionElement.innerHTML,
            editorContent: editorContent,
            language: currentLanguage,
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

  // Extract and display problem description initially
  sendPageDataToApp();

  // Set up a mutation observer to update content when the problem changes
  let updateTimeout: ReturnType<typeof setTimeout>;
  const problemObserver = new MutationObserver(() => {
    // Debounce the updates to avoid too many calls
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      sendPageDataToApp();
    }, 500);
  });

  // Observe changes to the problem content area
  const problemContentArea = document.querySelector('#qd-content');
  if (problemContentArea) {
    problemObserver.observe(problemContentArea, {
      childList: true,
      subtree: true
    });
  }

  // Also observe changes to the Monaco editor specifically
  let editorUpdateTimeout: ReturnType<typeof setTimeout>;
  const editorObserver = new MutationObserver(() => {
    // Debounce editor updates separately with a shorter delay
    clearTimeout(editorUpdateTimeout);
    editorUpdateTimeout = setTimeout(() => {
      sendPageDataToApp();
    }, 200);
  });

  // Look for the Monaco editor container and observe it
  const waitForEditor = () => {
    const editorContainer = document.querySelector('.view-lines[role="presentation"]');
    if (editorContainer) {
      editorObserver.observe(editorContainer, {
        childList: true,
        subtree: true,
        characterData: true
      });
    } else {
      // If editor not found yet, try again after a short delay
      setTimeout(waitForEditor, 1000);
    }
  };

  waitForEditor();

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
