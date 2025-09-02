import { useCallback, useEffect, useState } from 'react';
import { getStorageItem, setStorageItem } from '@/utils/storage';

interface UseStorageSettingOptions<T> {
  key: string;
  defaultValue: T;
}

export function useStorageSetting<T>({ key, defaultValue }: UseStorageSettingOptions<T>) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getStorageItem<T>(key).then((storedValue) => {
      setValue(storedValue ?? defaultValue);
      setIsLoading(false);
    });
  }, [key]);

  useEffect(() => {
    if (!chrome?.storage) {
      return;
    }

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes[key]) {
        setValue(changes[key].newValue === undefined ? defaultValue : changes[key].newValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, [key]);

  const updateValue = useCallback(
    async (newValue: T) => {
      setIsLoading(true);
      try {
        await setStorageItem(key, newValue);
      } finally {
        setIsLoading(false);
      }
    },
    [key]
  );

  return {
    value,
    setValue: updateValue,
    isLoading
  };
}
