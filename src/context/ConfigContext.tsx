import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useStorageSetting } from '@/hooks/useStorageSetting';
import type { ModelConfig, ModelEndpointsResponse } from '@/types/open-router';
import { defaultConfig } from '@/utils/defaults';

type StorageSetter<T> = ReturnType<typeof useStorageSetting<T>>['setValue'];

type ConfigContextValue = {
  apiKey: string;
  setApiKey: StorageSetter<string>;
  modelResponse: ModelEndpointsResponse | null;
  setModelResponse: StorageSetter<ModelEndpointsResponse | null>;
  config: ModelConfig;
  setConfig: StorageSetter<ModelConfig>;
  isConfigLoading: boolean;
};

const ConfigContext = createContext<ConfigContextValue | null>(null);
export { ConfigContext };

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { value: apiKey, setValue: setApiKey, isLoading: isApiKeyLoading } = useStorageSetting({
    key: 'apiKey',
    defaultValue: ''
  });
  const {
    value: modelResponse,
    setValue: setModelResponse,
    isLoading: isModelLoading
  } = useStorageSetting<ModelEndpointsResponse | null>({
    key: 'model',
    defaultValue: null
  });
  const {
    value: config,
    setValue: setConfig,
    isLoading: isConfigValueLoading
  } = useStorageSetting<ModelConfig>({
    key: 'config',
    defaultValue: defaultConfig
  });

  const value = useMemo(
    () => ({
      apiKey,
      setApiKey,
      modelResponse,
      setModelResponse,
      config,
      setConfig,
      isConfigLoading: isApiKeyLoading || isModelLoading || isConfigValueLoading
    }),
    [
      apiKey,
      setApiKey,
      modelResponse,
      setModelResponse,
      config,
      setConfig,
      isApiKeyLoading,
      isModelLoading,
      isConfigValueLoading
    ]
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfigContext() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfigContext must be used within ConfigProvider');
  }
  return context;
}
