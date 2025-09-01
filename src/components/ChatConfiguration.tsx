import { useDebounce } from '@/hooks/useDebounce';
import { useStorageSetting } from '@/hooks/useStorageSetting';
import { getModelEndpoints } from '@/open-router/model';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import type { ModelConfig, ModelEndpointsResponse } from '@/types/open-router';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function ChatConfiguration() {
  const [modelInput, setModelInput] = useState('');
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [modelDirty, setModelDirty] = useState(false);
  const debouncedModelInput = useDebounce(modelInput, 500);

  const {
    value: apiKey,
    setValue: setApiKey,
    saveToStorage: saveApiKey
  } = useStorageSetting({
    key: 'apiKey',
    defaultValue: ''
  });

  const {
    value: modelResponse,
    setValue: setModelResponse,
    saveToStorage: saveModelResponse
  } = useStorageSetting<ModelEndpointsResponse | null>({
    key: 'model',
    defaultValue: null
  });
  const {
    value: config,
    setValue: setConfig,
    saveToStorage: saveConfig
  } = useStorageSetting<ModelConfig>({
    key: 'config',
    defaultValue: { tools: false, reasoning: '', mode: 'learn' }
  });

  useEffect(() => {
    if (modelResponse?.data?.id) {
      setModelInput(modelResponse.data.id);
    }
  }, [modelResponse]);

  useEffect(() => {
    if (!modelDirty) return;

    if (!debouncedModelInput.trim()) {
      setModelResponse(null);
      return;
    }

    const parts = debouncedModelInput.split('/');
    if (parts.length !== 2) {
      setModelResponse(null);
      return;
    }

    const [author, slug] = parts;
    setIsLoadingModel(true);

    getModelEndpoints(author, slug)
      .then((response) => {
        setModelResponse(response);
        const supportedParams = response.data.endpoints[0]?.supported_parameters || [];
        const newConfig: ModelConfig = {
          tools: supportedParams.includes('tools'),
          reasoning: supportedParams.includes('reasoning') ? config.reasoning : '',
          mode: supportedParams.includes('tools') ? config.mode : 'learn'
        };
        setConfig(newConfig);
      })
      .catch((error) => {
        toast.error(`Failed to fetch model endpoints: ${error.message || 'Unknown error'}`);
        setModelResponse(null);
      })
      .finally(() => {
        setIsLoadingModel(false);
        setModelDirty(false);
      });
  }, [debouncedModelInput, setModelResponse, config.reasoning, config.mode, setConfig, modelDirty]);

  const displayName =
    modelResponse?.data.id.split('/').slice(0, 40) || (modelInput ? modelInput : 'Model not configured');
  const supportsReasoning = modelResponse?.data.endpoints[0]?.supported_parameters?.includes('reasoning') || false;

  return (
    <Popover
      onOpenChange={(open) => {
        // Save to storage when popover closes
        if (!open) {
          saveApiKey();
          saveModelResponse();
          saveConfig();
        }
      }}
    >
      <PopoverTrigger className="rounded-md px-1 py-1 text-white/60 hover:bg-white/10">
        {isLoadingModel ? 'Loading...' : displayName}
      </PopoverTrigger>
      <PopoverContent className="border-none bg-lc-popover-bg text-xs text-lc-primary">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium leading-none">OpenRouter Configuration</h4>
            <p className="text-muted-foreground">
              Set the OpenRouter API key and model configuration. Get your API key{' '}
              <a
                href="https://openrouter.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                here
              </a>
              .
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="apiKey" className="text-xs">
                API Key
              </Label>
              <Input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="col-span-2 h-8 border-white/10 text-xs focus-visible:ring-0"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="model" className="text-xs">
                Model
              </Label>
              <Input
                id="model"
                value={modelInput}
                onChange={(e) => {
                  setModelInput(e.target.value);
                  setModelDirty(true);
                }}
                placeholder="anthropic/claude-3-sonnet"
                className="col-span-2 h-8 border-white/10 text-xs placeholder:text-xs focus-visible:ring-0"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="reasoning" className="text-xs">
                Reasoning
              </Label>
              <ToggleGroup
                type="single"
                className="col-span-2 grid grid-cols-3"
                disabled={!supportsReasoning}
                value={config.reasoning}
                onValueChange={(value) =>
                  setConfig({ ...config, reasoning: (value || '') as ModelConfig['reasoning'] })
                }
              >
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
              </ToggleGroup>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
