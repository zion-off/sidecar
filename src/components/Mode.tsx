import { useStorageSetting } from '@/hooks/useStorageSetting';
import type { ModelConfig, ModelEndpointsResponse } from '@/types/open-router';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ModeSelector() {
  const {
    value: config,
    setValue: setConfig,
    isLoading: configLoading
  } = useStorageSetting<ModelConfig>({
    key: 'config',
    defaultValue: { tools: false, reasoning: '', mode: 'learn' }
  });

  const { value: modelResponse, isLoading: modelLoading } = useStorageSetting<ModelEndpointsResponse | null>({
    key: 'model',
    defaultValue: null
  });

  const supportsTools = modelResponse?.data.endpoints[0]?.supported_parameters?.includes('tools') || false;

  if (configLoading || modelLoading) {
    return null;
  }

  return (
    <Select value={config.mode} onValueChange={(value) => setConfig({ ...config, mode: value as 'learn' | 'agent' })}>
      <SelectTrigger className="h-fit w-fit border-none px-1 py-1 text-xs text-neutral-500 shadow-none hover:bg-white/10 focus:ring-0 dark:shadow-sm">
        <SelectValue placeholder="Mode" className="w-fit border-none" />
      </SelectTrigger>
      <SelectContent className="bg-lc-bg-popover border-none text-xs text-neutral-500">
        <SelectGroup>
          <SelectItem
            value="learn"
            className="hover:text-500 text-xs text-neutral-400 focus:bg-white/10 focus:text-neutral-700 dark:focus:text-white"
          >
            Learn
          </SelectItem>
          {supportsTools && (
            <SelectItem
              value="agent"
              className="hover:text-500 text-xs text-neutral-400 focus:bg-white/10 focus:text-neutral-700 dark:focus:text-white"
            >
              Agent
            </SelectItem>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
