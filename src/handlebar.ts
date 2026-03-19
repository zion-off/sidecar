import { dragHandlebarSVG, openHandlebarSVG } from '@/assets/icons';

const MIN_WIDTH = 350;
const MAX_WIDTH = 800;

function throttle<T extends unknown[]>(func: (...args: T) => void, limit: number) {
  let inThrottle: boolean;
  return (...params: T) => {
    if (!inThrottle) {
      func(...params);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function createHandlebar(appIframe: HTMLIFrameElement) {
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

  function stopResizing() {
    isResizing = false;
    overlay.style.display = 'none';
  }

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

  handlebar.addEventListener('mousedown', (event) => {
    if (!isOpen) {
      setToggleState(true);
      return;
    }
    startResizing(event);
  });
  handlebar.addEventListener('dragstart', (event) => event.preventDefault());
  handlebar.addEventListener('dblclick', () => {
    if (isOpen) {
      setToggleState(false);
    }
  });

  window.addEventListener('mousemove', throttle(updateWidth, 16));
  window.addEventListener('mouseup', stopResizing);

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

  return { handlebar, overlay, setToggleState };
}
