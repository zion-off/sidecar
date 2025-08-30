/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { useStorageSetting } from '@/hooks/useStorageSetting';
import { IoSend } from 'react-icons/io5';
import { KeyboardEvent, useState } from 'react';
import type { MessageBubble } from '@/types/chat';
import type { InjectionStatus, PageData } from '@/types/editor';
import { Bubble } from '@/components/Bubble';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { sampleMessages } from '@/utils/messaging';

interface ChatProps {
  pageData: PageData | null;
  activeSuggestion: boolean;
  injectionStatus: InjectionStatus;
  sendCodeToEditor: (code: string) => void;
  showSuggestions: (suggestedCode?: string) => void;
  resolveSuggestion: (isAccept: boolean) => void;
}

export function Chat({
  pageData,
  activeSuggestion,
  injectionStatus,
  sendCodeToEditor,
  showSuggestions,
  resolveSuggestion
}: ChatProps) {
  const [messages, _] = useState<MessageBubble[]>(sampleMessages(pageData));
  const [input, setInput] = useState('');

  // Use custom hooks for storage settings
  const {
    value: apiKey,
    setValue: setApiKey,
    saveToStorage: saveApiKey
  } = useStorageSetting({
    key: 'apiKey',
    defaultValue: ''
  });

  const {
    value: model,
    setValue: setModel,
    saveToStorage: saveModel
  } = useStorageSetting({
    key: 'model',
    defaultValue: 'openai/gpt-4o-mini'
  });

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Add message sending logic here
    }
  }

  return (
    <div className="flex h-full w-full max-w-full flex-col justify-between p-4">
      <div className="overflow-y-scroll">
        {messages.map((msg, index) => (
          <Bubble key={index} message={msg.message} role={msg.role} />
        ))}
      </div>

      <div>
        <div className="w-full max-w-full">
          {injectionStatus.message && (
            <div
              className={`mb-4 rounded-lg p-3 ${
                injectionStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {injectionStatus.success ? '✅' : '❌'} {injectionStatus.message}
            </div>
          )}

          <div className="mb-4 space-y-3">
            {activeSuggestion ? (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                <p className="mb-3 text-center text-sm font-medium text-purple-800">
                  💡 Suggestion is active in the editor. What would you like to do?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => resolveSuggestion(true)}
                    className="w-full rounded-lg bg-green-600 px-4 py-2 font-bold text-white transition-colors hover:bg-green-700"
                  >
                    Keep
                  </button>
                  <button
                    onClick={() => resolveSuggestion(false)}
                    className="w-full rounded-lg bg-red-600 px-4 py-2 font-bold text-white transition-colors hover:bg-red-700"
                  >
                    Undo
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => showSuggestions()}
                className="w-full rounded-lg bg-neutral-600 px-4 py-2 font-bold text-white transition-colors"
              >
                Generate Suggestion
              </button>
            )}
          </div>
        </div>

        <div className="bg-lc-textarea-bg rounded-md p-2 drop-shadow-md transition-shadow duration-200 ease-in-out group-focus-within/input:ring-1 group-focus-within/input:ring-blue-500">
          <textarea
            className="sticky bottom-0 w-full resize-none bg-transparent px-1 text-white placeholder:text-neutral-500 focus:outline-none"
            placeholder="Type your message here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-end justify-between">
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
              <PopoverContent className="bg-lc-popover-bg text-lc-primary border-none text-xs">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">OpenRouter Configuration</h4>
                    <p className="text-muted-foreground">
                      Set the OpenRouter API key and model configuration. Get your API key from{' '}
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
                        defaultValue=""
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
                        defaultValue="openai/gpt-4o-mini"
                        className="col-span-2 h-8 border-white/10 text-sm focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <button className="rounded-md px-1 py-1 text-white/60 hover:bg-white/10">
              <IoSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
