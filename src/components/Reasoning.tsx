import { useStorageSetting } from '@/hooks/useStorageSetting';
import type { ModelConfig, ModelEndpointsResponse } from '@/types/open-router';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export const ReasoningEffort = () => {
  const { value: modelResponse } = useStorageSetting<ModelEndpointsResponse | null>({
    key: 'model',
    defaultValue: null
  });
  const { value: config, setValue: setConfig } = useStorageSetting<ModelConfig>({
    key: 'config',
    defaultValue: { tools: false, reasoning: '', mode: 'learn' }
  });

  const supportsReasoning = modelResponse?.data.endpoints[0]?.supported_parameters?.includes('reasoning') || false;
  return (
    <div className="grid grid-cols-3 items-center gap-4">
      <Label htmlFor="reasoning" className="text-xs">
        Reasoning
      </Label>
      <ToggleGroup
        type="single"
        className="col-span-2 grid grid-cols-3"
        disabled={!supportsReasoning}
        value={config.reasoning}
        onValueChange={(value) => setConfig({ ...config, reasoning: (value || '') as ModelConfig['reasoning'] })}
      >
        <ReasoningEffortChoices />
      </ToggleGroup>
    </div>
  );
};

export const ReasoningEffortChoices = () => {
  return (
    <>
      <ToggleGroupItem
        value="low"
        aria-label="Toggle low"
        className="col-span-1 h-8 rounded-br-none rounded-tr-none font-mono text-xxs hover:bg-lc-fg data-[state=on]:bg-white/20"
      >
        low
      </ToggleGroupItem>
      <ToggleGroupItem
        value="medium"
        aria-label="Toggle medium"
        className="col-span-1 h-8 rounded-none font-mono text-xxs hover:bg-lc-fg data-[state=on]:bg-white/20"
      >
        med
      </ToggleGroupItem>
      <ToggleGroupItem
        value="high"
        aria-label="Toggle high"
        className="col-span-1 h-8 rounded-bl-none rounded-tl-none font-mono text-xxs hover:bg-lc-fg data-[state=on]:bg-white/20"
      >
        high
      </ToggleGroupItem>
    </>
  );
};
