import { useRecentModels } from '@/hooks/useRecentModels';
import { toast } from 'sonner';
import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ModelConfig, ModelEndpointsResponse, OpenRouterModel } from '@/types/open-router';
import { useConfigContext } from '@/context/ConfigContext';
import { ModelBrowser } from '@/components/ModelBrowser';
import { PopoverHeader } from '@/components/PopoverHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

function buildModelResponse(model: OpenRouterModel): ModelEndpointsResponse {
  return {
    data: {
      id: model.id,
      name: model.name,
      created: model.created,
      description: model.description,
      architecture: {
        tokenizer: model.architecture.tokenizer,
        input_modalities: model.architecture.input_modalities ?? [],
        output_modalities: model.architecture.output_modalities ?? [],
        instruct_type: model.architecture.instruct_type ?? ''
      },
      endpoints: [
        {
          supported_parameters: model.supported_parameters,
          context_length: model.top_provider.context_length ?? model.context_length,
          pricing: {
            prompt: model.pricing.prompt,
            completion: model.pricing.completion
          }
        }
      ]
    }
  };
}

export function ChatConfiguration() {
  const { apiKey, setApiKey, modelResponse, setModelResponse, config, setConfig } = useConfigContext();
  const { recentModelIds, pushRecentModel } = useRecentModels();

  const [isOpen, setIsOpen] = useState(false);
  const [localApiKey, setLocalApiKey] = useState('');
  const [isBrowsing, setIsBrowsing] = useState(false);

  const configRef = useRef(config);
  configRef.current = config;

  const applyModelResponse = useCallback(
    async (response: ModelEndpointsResponse) => {
      await setModelResponse(response);
      const supportedParams = response.data.endpoints[0]?.supported_parameters || [];
      const supportsTools = supportedParams.includes('tools');
      const supportsReasoning = supportedParams.includes('reasoning');
      await setConfig({
        tools: supportsTools,
        reasoning: supportsReasoning ? configRef.current.reasoning : '',
        mode: supportsTools ? configRef.current.mode : 'learn'
      });
    },
    [setConfig, setModelResponse]
  );

  const handleSelectFromBrowser = useCallback(
    async (model: OpenRouterModel) => {
      try {
        await applyModelResponse(buildModelResponse(model));
        await pushRecentModel(model.id);
        setIsBrowsing(false);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to select model: ${message}`);
      }
    },
    [applyModelResponse, pushRecentModel]
  );

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setLocalApiKey(apiKey);
    } else {
      void setApiKey(localApiKey);
    }
    setIsOpen(open);
  };

  const displayName = modelResponse?.data.id.split('/')[1]?.slice(0, 40) || 'No model selected';

  return (
    <>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger className="rounded-md px-1 py-1 text-xs text-neutral-500 hover:bg-white/10">
          {displayName}
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
                <Label className="text-xs">Model</Label>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsBrowsing(true);
                  }}
                  className="col-span-2 h-8 truncate rounded-md border border-white/10 px-2 text-left text-xs text-lc-text-secondary transition-colors hover:bg-white/[0.04]"
                >
                  {modelResponse?.data.id || 'Browse models'}
                </button>
              </div>
              <ReasoningEffort />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {isBrowsing &&
        createPortal(
          <ModelBrowser
            onSelect={(model) => void handleSelectFromBrowser(model)}
            onClose={() => setIsBrowsing(false)}
            selectedModelId={modelResponse?.data.id || ''}
            recentModelIds={recentModelIds}
          />,
          document.getElementById('root') || document.body
        )}
    </>
  );
}

function ReasoningEffort() {
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
}

function ReasoningEffortChoices() {
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
}
