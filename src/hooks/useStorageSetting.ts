import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getStorageItem, setStorageItem } from '@/utils/storage';

interface UseStorageSettingOptions<T> {
  key: string;
  defaultValue: T;
  staleTime?: number;
}

export function useStorageSetting<T>({ key, defaultValue, staleTime = 1000 * 60 * 5 }: UseStorageSettingOptions<T>) {
  const queryClient = useQueryClient();

  const { data: storedValue } = useQuery({
    queryKey: [key],
    queryFn: () => getStorageItem<T>(key),
    staleTime
  });

  const [localValue, setLocalValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (storedValue !== undefined && storedValue !== null) {
      setLocalValue(storedValue);
    }
  }, [storedValue]);

  const saveMutation = useMutation({
    mutationFn: (newValue: T) => setStorageItem(key, newValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  });

  const saveToStorage = () => {
    saveMutation.mutate(localValue);
  };

  return {
    value: localValue,
    setValue: setLocalValue,
    saveToStorage,
    isLoading: saveMutation.isPending
  };
}
