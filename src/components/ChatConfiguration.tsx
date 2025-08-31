import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ChatConfigurationProps {
  apiKey: string;
  setApiKey: (_value: string) => void;
  saveApiKey: () => void;
  model: string;
  setModel: (_value: string) => void;
  saveModel: () => void;
}

export function ChatConfiguration({
  apiKey,
  setApiKey,
  saveApiKey,
  model,
  setModel,
  saveModel
}: ChatConfigurationProps) {
  return (
    <Popover
      onOpenChange={(open) => {
        // Save to storage when popover closes
        if (!open) {
          saveApiKey();
          saveModel();
        }
      }}
    >
      <PopoverTrigger className="rounded-md px-1 py-1 text-white/60 hover:bg-white/10">
        {model ? model : 'Model not configured'}
      </PopoverTrigger>
      <PopoverContent className="border-none bg-lc-popover-bg text-xs text-lc-primary">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">OpenRouter Configuration</h4>
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
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="col-span-2 h-8 border-white/10 text-sm focus-visible:ring-0"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="model" className="text-xs">
                Model
              </Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="col-span-2 h-8 border-white/10 text-sm focus-visible:ring-0"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="reasoning" className="text-xs">
                Reasoning
              </Label>
              <ToggleGroup type="single" className="col-span-2 grid grid-cols-3">
                <ToggleGroupItem
                  value="low"
                  aria-label="Toggle low"
                  className="text-xxs col-span-1 h-8 rounded-br-none rounded-tr-none font-mono hover:bg-lc-fg"
                >
                  low
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="medium"
                  aria-label="Toggle medium"
                  className="text-xxs col-span-1 h-8 rounded-none font-mono hover:bg-lc-fg"
                >
                  med
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="high"
                  aria-label="Toggle high"
                  className="text-xxs col-span-1 h-8 rounded-bl-none rounded-tl-none font-mono hover:bg-lc-fg"
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
