import { useDebounce } from '@/hooks/useDebounce';
import { useStorageSetting } from '@/hooks/useStorageSetting';
import { getModelEndpoints } from '@/open-router/model';
import { toast } from 'sonner';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ModelConfig, ModelEndpointsResponse } from '@/types/open-router';
import { PopoverHeader } from '@/components/PopoverHeader';
import { ReasoningEffort } from '@/components/Reasoning';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { defaultConfig } from '@/utils/defaults';

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
    defaultValue: defaultConfig
  });

  const [isOpen, setIsOpen] = useState(false);
  const [localApiKey, setLocalApiKey] = useState('');
  const [localModelInput, setLocalModelInput] = useState('');
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const debouncedModelInput = useDebounce(localModelInput, 500);

  // Refs to avoid stale closures in resolveModel without circular deps
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const modelResponseRef = useRef(modelResponse);
  useEffect(() => {
    modelResponseRef.current = modelResponse;
  }, [modelResponse]);

  // Tracks whether the user has actually typed, so the debounce effect doesn't
  // fire when we programmatically set localModelInput on open
  const hasInteracted = useRef(false);

  const resolveModel = useCallback(
    async (modelId: string) => {
      const trimmed = modelId.trim();

      if (!trimmed) {
        setModelResponse(null);
        return;
      }

      if (trimmed === modelResponseRef.current?.data.id) return;

      const parts = trimmed.split('/');
      if (parts.length !== 2) {
        setModelResponse(null);
        return;
      }

      const [author, slug] = parts;
      setIsLoadingModel(true);

      try {
        const response = await getModelEndpoints(author, slug);
        setModelResponse(response);
        const supportedParams = response.data.endpoints[0]?.supported_parameters || [];
        setConfig({
          tools: supportedParams.includes('tools'),
          reasoning: supportedParams.includes('reasoning') ? configRef.current.reasoning : '',
          mode: supportedParams.includes('tools') ? configRef.current.mode : 'learn'
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to fetch model endpoints: ${message}`);
        setModelResponse(null);
      } finally {
        setIsLoadingModel(false);
      }
    },
    [setModelResponse, setConfig]
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
