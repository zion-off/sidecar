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
        className="col-span-2 flex gap-0"
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
  const colors =
    'bg-none hover:bg-neutral-200 hover:text-neutral-400 data-[state=on]:bg-neutral-300 data-[state=on]:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:data-[state=on]:bg-neutral-600 dark:data-[state=on]:text-neutral-200';
  return (
    <>
      <ToggleGroupItem
        value="low"
        aria-label="Toggle low"
        className={`h-8 flex-1 rounded-br-none rounded-tr-none font-mono text-xxs ${colors}`}
      >
        low
      </ToggleGroupItem>
      <ToggleGroupItem
        value="medium"
        aria-label="Toggle medium"
        className={`h-8 flex-1 rounded-none font-mono text-xxs ${colors}`}
      >
        med
      </ToggleGroupItem>
      <ToggleGroupItem
        value="high"
        aria-label="Toggle high"
        className={`h-8 flex-1 rounded-bl-none rounded-tl-none font-mono text-xxs ${colors}`}
      >
        high
      </ToggleGroupItem>
    </>
  );
};
