export interface StorageOptions {
  area?: 'local' | 'sync';
}

export async function getStorageItem<T = unknown>(
  key: string,
  options: StorageOptions = { area: 'local' }
): Promise<T | null> {
  try {
    if (!chrome?.storage) {
      console.error('Chrome storage API not available');
      return null;
    }

    const storage = options.area === 'sync' ? chrome.storage.sync : chrome.storage.local;
    const result = await storage.get(key);

    return result[key] ?? null;
  } catch (error) {
    console.error(`Error getting storage item "${key}":`, error);
    return null;
  }
}

export async function setStorageItem<T = unknown>(
  key: string,
  value: T,
  options: StorageOptions = { area: 'local' }
): Promise<boolean> {
  try {
    if (!chrome?.storage) {
      console.error('Chrome storage API not available');
      return false;
    }

    const storage = options.area === 'sync' ? chrome.storage.sync : chrome.storage.local;
    await storage.set({ [key]: value });

    return true;
  } catch (error) {
    console.error(`Error setting storage item "${key}":`, error);
    return false;
  }
}
