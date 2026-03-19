import { useCallback, useEffect, useRef } from 'react';
import { useStorageSetting } from '@/hooks/useStorageSetting';

const MAX_RECENT = 5;

export function useRecentModels() {
  const { value: recentModelIds, setValue: setRecentModelIds } = useStorageSetting<string[]>({
    key: 'recentModels',
    defaultValue: []
  });

  const idsRef = useRef(recentModelIds);
  useEffect(() => {
    idsRef.current = recentModelIds;
  }, [recentModelIds]);

  const pushRecentModel = useCallback(
    async (modelId: string) => {
      const next = [modelId, ...idsRef.current.filter((id) => id !== modelId)].slice(0, MAX_RECENT);
      await setRecentModelIds(next);
    },
    [setRecentModelIds]
  );

  return { recentModelIds, pushRecentModel };
}
