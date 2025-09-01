import { useDebounce } from '@/hooks/useDebounce';
import { useStorageSetting } from '@/hooks/useStorageSetting';
import { getModelEndpoints } from '@/open-router/model';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import type { ModelConfig, ModelEndpointsResponse } from '@/types/open-router';
import { PopoverHeader } from '@/components/PopoverHeader';
import { ReasoningEffort } from '@/components/Reasoning';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function ChatConfiguration() {
  const { value: apiKey, setValue: setApiKey } = useStorageSetting({
    key: 'apiKey',
    defaultValue: ''
  });

  const { value: modelResponse, setValue: setModelResponse } = useStorageSetting<ModelEndpointsResponse | null>({
    key: 'model',
    defaultValue: null
  });
  const { value: config, setValue: setConfig } = useStorageSetting<ModelConfig>({
    key: 'config',
    defaultValue: { tools: false, reasoning: '', mode: 'learn' }
  });

  const [localApiKey, setLocalApiKey] = useState<string>(apiKey);
  const [modelInput, setModelInput] = useState(modelResponse?.data.id || '');
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [modelDirty, setModelDirty] = useState(false);
  const debouncedModelInput = useDebounce(modelInput, 500);

  const handlePopoverOpen = (open: boolean) => {
    if (open) {
      setLocalApiKey(apiKey);
      setModelInput(modelResponse?.data.id || '');
      setModelInput(modelResponse?.data.id || '');
    } else {
      setApiKey(localApiKey);
    }
  };

  useEffect(() => {
    if (!modelDirty) return;

    if (!modelInput.trim()) {
      setModelResponse(null);
      return;
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedModelInput, modelDirty]);

  const displayName = modelResponse?.data.id.split('/').slice(0, 40) || 'Model not configured';

  return (
    <Popover onOpenChange={handlePopoverOpen}>
      <PopoverTrigger className="rounded-md px-1 py-1 text-white/60 hover:bg-white/10">
        {isLoadingModel ? 'Loading...' : displayName}
      </PopoverTrigger>
      <PopoverContent className="border-none bg-lc-popover-bg text-xs text-lc-primary">
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
                value={modelInput}
                onChange={(e) => {
                  setModelInput(e.target.value);
                  setModelDirty(true);
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
