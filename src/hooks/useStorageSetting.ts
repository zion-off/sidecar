import { useEffect, useState } from 'react';
import { getStorageItem, setStorageItem } from '@/utils/storage';

interface UseStorageSettingOptions<T> {
  key: string;
  defaultValue: T;
  staleTime?: number;
}

export function useStorageSetting<T>({ key, defaultValue }: UseStorageSettingOptions<T>) {
  const [localValue, setLocalValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getStorageItem<T>(key).then((storedValue) => {
      if (storedValue !== undefined && storedValue !== null) {
        setLocalValue(storedValue);
      }
      setIsLoading(false);
    });
  }, [key]);

  const saveToStorage = () => {
    setIsLoading(true);
    setStorageItem(key, localValue).finally(() => setIsLoading(false));
  };

  return {
    value: localValue,
    setValue: setLocalValue,
    saveToStorage,
    isLoading
  };
}
