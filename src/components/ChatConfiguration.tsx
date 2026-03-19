import { useConfigContext } from '@/context/ConfigContext';
import { useRecentModels } from '@/hooks/useRecentModels';
import { toast } from 'sonner';
import { useCallback, useRef, useState } from 'react';
import type { ModelConfig, ModelEndpointsResponse, OpenRouterModel } from '@/types/open-router';
import { ModelBrowser } from '@/components/ModelBrowser';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, CircleHelp, X } from 'lucide-react';

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
  const {
    apiKey,
    setApiKey,
    modelResponse,
    setModelResponse,
    config,
    setConfig,
    customInstructions,
    setCustomInstructions
  } = useConfigContext();
  const { recentModelIds, pushRecentModel } = useRecentModels();

  const [isOpen, setIsOpen] = useState(false);
  const [localApiKey, setLocalApiKey] = useState('');
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [isCustomInstructionsOpen, setIsCustomInstructionsOpen] = useState(false);
  const [localCustomInstructions, setLocalCustomInstructions] = useState('');

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

  const openCustomInstructions = () => {
    setIsOpen(false);
    setLocalCustomInstructions(customInstructions);
    setIsCustomInstructionsOpen(true);
  };

  const saveCustomInstructions = () => {
    void setCustomInstructions(localCustomInstructions);
    setIsCustomInstructionsOpen(false);
  };

  const cancelCustomInstructions = () => {
    setIsCustomInstructionsOpen(false);
  };

  const displayName = modelResponse?.data.id.split('/')[1]?.slice(0, 40) || 'No model selected';
  const customInstructionsPreview = customInstructions.trim().replace(/\s+/g, ' ');

  return (
    <>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger className="rounded-md px-1 py-1 text-xs text-neutral-500 hover:bg-white/10">
          {displayName}
        </PopoverTrigger>
        <PopoverContent className="text-lc-text-primary border-none bg-lc-bg-popover text-xs">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="apiKey" className="flex items-center gap-1 text-xs">
                  API Key
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleHelp className="h-3 w-3 text-lc-text-secondary" />
                    </TooltipTrigger>
                    <TooltipContent className="border border-white/10 bg-lc-bg-base text-xs text-lc-text-secondary">
                      <p>
                        Get your OpenRouter API key{' '}
                        <a
                          href="https://openrouter.ai"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 underline"
                        >
                          here
                        </a>
                        .
                      </p>
                    </TooltipContent>
                  </Tooltip>
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
                  className="col-span-2 h-8 truncate rounded-md border border-white/10 px-2 text-center text-xs text-lc-text-secondary transition-colors hover:bg-white/[0.04]"
                >
                  {modelResponse?.data.id || 'Browse models'}
                </button>
              </div>
              <ReasoningEffort />
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-xs">Instructions</Label>
                <button
                  type="button"
                  onClick={openCustomInstructions}
                  className="col-span-2 h-8 truncate rounded-md border border-white/10 px-2 text-center text-xs text-lc-text-secondary transition-colors hover:bg-white/[0.04]"
                >
                  {customInstructionsPreview || 'Custom instructions'}
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <ModelBrowser
        open={isBrowsing}
        onOpenChange={setIsBrowsing}
        onSelect={(model) => void handleSelectFromBrowser(model)}
        selectedModelId={modelResponse?.data.id || ''}
        recentModelIds={recentModelIds}
      />

      <Dialog open={isCustomInstructionsOpen} onOpenChange={() => cancelCustomInstructions()}>
        <DialogContent className="flex h-[50dvh] max-w-[calc(100%-24px)] flex-col gap-0 overflow-hidden rounded-lg border-white/10 bg-lc-bg-base p-0 text-lc-text-primary [&>button:last-child]:hidden">
          <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b border-white/5 px-4 py-3">
            <div>
              <DialogTitle className="text-xs font-medium text-lc-text-body">Custom Instructions</DialogTitle>
              <DialogDescription className="sr-only">Add custom instructions for the AI</DialogDescription>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={cancelCustomInstructions} className="rounded p-1 text-lc-text-secondary transition-colors hover:bg-white/[0.06]">
                <X className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={saveCustomInstructions} className="rounded p-1 text-green-400 transition-colors hover:bg-white/[0.06]">
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          </DialogHeader>
          <Textarea
            value={localCustomInstructions}
            onChange={(e) => setLocalCustomInstructions(e.target.value)}
            placeholder="Add custom instructions..."
            className="min-h-0 flex-1 resize-none rounded-none border-none bg-transparent px-4 py-3 text-xs text-lc-text-body placeholder:text-lc-text-secondary focus-visible:ring-0"
          />
        </DialogContent>
      </Dialog>
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
