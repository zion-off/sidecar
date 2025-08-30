/**
 * Chrome Extension Storage Utilities
 * Provides getter and setter methods for Chrome extension storage
 */

export interface StorageOptions {
  area?: 'local' | 'sync';
}

/**
 * Get a value from Chrome extension storage
 * @param key - The key to retrieve
 * @param options - Storage options (defaults to local storage)
 * @returns Promise resolving to the stored value or null if not found
 */
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

/**
 * Set a value in Chrome extension storage
 * @param key - The key to store the value under
 * @param value - The value to store
 * @param options - Storage options (defaults to local storage)
 * @returns Promise resolving to true if successful, false otherwise
 */
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

/**
 * Remove a value from Chrome extension storage
 * @param key - The key to remove
 * @param options - Storage options (defaults to local storage)
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function removeStorageItem(key: string, options: StorageOptions = { area: 'local' }): Promise<boolean> {
  try {
    if (!chrome?.storage) {
      console.error('Chrome storage API not available');
      return false;
    }

    const storage = options.area === 'sync' ? chrome.storage.sync : chrome.storage.local;
    await storage.remove(key);

    return true;
  } catch (error) {
    console.error(`Error removing storage item "${key}":`, error);
    return false;
  }
}

/**
 * Get multiple values from Chrome extension storage
 * @param keys - Array of keys to retrieve
 * @param options - Storage options (defaults to local storage)
 * @returns Promise resolving to an object with the retrieved key-value pairs
 */
export async function getMultipleStorageItems(
  keys: string[],
  options: StorageOptions = { area: 'local' }
): Promise<Record<string, unknown>> {
  try {
    if (!chrome?.storage) {
      console.error('Chrome storage API not available');
      return {};
    }

    const storage = options.area === 'sync' ? chrome.storage.sync : chrome.storage.local;
    const result = await storage.get(keys);

    return result;
  } catch (error) {
    console.error('Error getting multiple storage items:', error);
    return {};
  }
}

/**
 * Set multiple values in Chrome extension storage
 * @param items - Object with key-value pairs to store
 * @param options - Storage options (defaults to local storage)
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function setMultipleStorageItems(
  items: Record<string, unknown>,
  options: StorageOptions = { area: 'local' }
): Promise<boolean> {
  try {
    if (!chrome?.storage) {
      console.error('Chrome storage API not available');
      return false;
    }

    const storage = options.area === 'sync' ? chrome.storage.sync : chrome.storage.local;
    await storage.set(items);

    return true;
  } catch (error) {
    console.error('Error setting multiple storage items:', error);
    return false;
  }
}

/**
 * Clear all items from Chrome extension storage
 * @param options - Storage options (defaults to local storage)
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function clearStorage(options: StorageOptions = { area: 'local' }): Promise<boolean> {
  try {
    if (!chrome?.storage) {
      console.error('Chrome storage API not available');
      return false;
    }

    const storage = options.area === 'sync' ? chrome.storage.sync : chrome.storage.local;
    await storage.clear();

    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}

/**
 * Listen for storage changes
 * @param callback - Function to call when storage changes occur
 * @param options - Storage options (defaults to local storage)
 * @returns Function to remove the listener
 */
export function onStorageChanged(
  callback: (_changes: chrome.storage.StorageChange, _areaName: string) => void,
  options: StorageOptions = { area: 'local' }
): () => void {
  if (!chrome?.storage) {
    console.error('Chrome storage API not available');
    return () => {};
  }

  const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
    if (!options.area || areaName === options.area) {
      Object.entries(changes).forEach(([_key, change]) => {
        callback(change, areaName);
      });
    }
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

// Fallback localStorage utilities for development/testing
export const fallbackStorage = {
  /**
   * Fallback getter for when Chrome storage is not available
   */
  getItem: <T = unknown>(key: string): T | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
      return null;
    } catch (error) {
      console.error(`Error getting localStorage item "${key}":`, error);
      return null;
    }
  },

  /**
   * Fallback setter for when Chrome storage is not available
   */
  setItem: <T = unknown>(key: string, value: T): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error setting localStorage item "${key}":`, error);
      return false;
    }
  },

  /**
   * Fallback remove for when Chrome storage is not available
   */
  removeItem: (key: string): boolean => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error removing localStorage item "${key}":`, error);
      return false;
    }
  }
};
