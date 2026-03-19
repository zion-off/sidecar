import { useDebounce } from '@/hooks/useDebounce';
import { getModelEndpoints } from '@/open-router/model';
import { toast } from 'sonner';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ModelConfig } from '@/types/open-router';
import { useConfigContext } from '@/context/ConfigContext';
import { PopoverHeader } from '@/components/PopoverHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function ChatConfiguration() {
  const { apiKey, setApiKey, modelResponse, setModelResponse, config, setConfig } = useConfigContext();
  const [isOpen, setIsOpen] = useState(false);
  const [localApiKey, setLocalApiKey] = useState('');
  const [localModelInput, setLocalModelInput] = useState('');
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const debouncedModelInput = useDebounce(localModelInput, 500);

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const modelResponseRef = useRef(modelResponse);
  useEffect(() => {
    modelResponseRef.current = modelResponse;
  }, [modelResponse]);

  const hasInteracted = useRef(false);

  const resolveModel = useCallback(
    async (modelId: string) => {
      const trimmed = modelId.trim();

      if (!trimmed) {
        await setModelResponse(null);
        return;
      }

      if (trimmed === modelResponseRef.current?.data.id) return;

      const parts = trimmed.split('/');
      if (parts.length !== 2) {
        await setModelResponse(null);
        return;
      }

      const [author, slug] = parts;
      setIsLoadingModel(true);

      try {
        const response = await getModelEndpoints(author, slug);
        await setModelResponse(response);
        const supportedParams = response.data.endpoints[0]?.supported_parameters || [];
        await setConfig({
          tools: supportedParams.includes('tools'),
          reasoning: supportedParams.includes('reasoning') ? configRef.current.reasoning : '',
          mode: supportedParams.includes('tools') ? configRef.current.mode : 'learn'
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to fetch model endpoints: ${message}`);
        await setModelResponse(null);
      } finally {
        setIsLoadingModel(false);
      }
    },
    [setConfig, setModelResponse]
  );

  useEffect(() => {
    if (!hasInteracted.current) return;
    resolveModel(debouncedModelInput);
  }, [debouncedModelInput, resolveModel]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      hasInteracted.current = false;
      setLocalApiKey(apiKey);
      setLocalModelInput(modelResponse?.data.id || '');
    } else {
      setApiKey(localApiKey);
    }
    setIsOpen(open);
  };

  const displayName = modelResponse?.data.id.split('/')[1]?.slice(0, 40) || 'Model not configured';

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger className="rounded-md px-1 py-1 text-xs text-neutral-500 hover:bg-white/10">
        {isLoadingModel ? 'Loading...' : displayName}
      </PopoverTrigger>
      <PopoverContent className="text-lc-text-primary border-none bg-lc-bg-popover text-xs">
        <div className="grid gap-4">
          <PopoverHeader />
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="apiKey" className="text-xs">
                API Key
              </Label>
              <Input
                type="password"
                id="apiKey"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                className="col-span-2 h-8 border-white/10 text-xs focus-visible:ring-0"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="model" className="text-xs">
                Model
              </Label>
              <Input
                id="model"
                value={localModelInput}
                onChange={(e) => {
                  hasInteracted.current = true;
                  setLocalModelInput(e.target.value);
                }}
                placeholder="anthropic/claude-3-sonnet"
                className="col-span-2 h-8 border-white/10 text-xs placeholder:text-xs focus-visible:ring-0"
              />
            </div>
            <ReasoningEffort />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const ReasoningEffort = () => {
  const { modelResponse, config, setConfig } = useConfigContext();
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

const ReasoningEffortChoices = () => {
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
