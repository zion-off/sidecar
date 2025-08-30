/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { useStorageSetting } from '@/hooks/useStorageSetting';
import { IoSend } from 'react-icons/io5';
import { FormEvent, KeyboardEvent, useState } from 'react';
import type { MessageType } from '@/types/chat';
import type { InjectionStatus, PageData } from '@/types/editor';
import { Bubble } from '@/components/Bubble';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { streamChatCompletion } from '@/utils/messaging';
import { buildSystemPrompt } from '@/utils/prompt-builder';

interface ChatProps {
  pageData: PageData;
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
  const [messages, setMessages] = useState<MessageType[]>([
    {
      role: 'assistant',
      content: `Hi, how can I help you with ${pageData.title}?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!input.trim() || !apiKey || isStreaming) return;

    const userMessage: MessageType = { content: input.trim(), role: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setStreamingMessage('');

    await streamChatCompletion({
      apiKey,
      model,
      messages: [buildSystemPrompt(pageData), ...messages.slice(1), userMessage],
      onChunk: (_, fullMessage) => {
        setStreamingMessage(fullMessage);
      },
      onComplete: (fullMessage) => {
        const assistantMessage: MessageType = { content: fullMessage, role: 'assistant' };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsStreaming(false);
        setStreamingMessage('');
      },
      onError: (error) => {
        console.error('Error sending message:', error);
        setIsStreaming(false);
        setStreamingMessage('');
      }
    });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Create a synthetic form event to submit the form
      const form = e.currentTarget.closest('form');
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    }
  }

  return (
    <div className="flex h-full w-full max-w-full flex-col justify-between overflow-hidden p-4">
      <div className="min-h-0 flex-1 overflow-y-auto bg-lc-text-light">
        {messages.map((msg, index) => (
          <Bubble key={index} content={msg.content} role={msg.role} />
        ))}
        {isStreaming && streamingMessage.length > 0 && <Bubble content={streamingMessage} role="assistant" />}
      </div>

      <div className="flex-shrink-0">
        {/* <div className="w-full max-w-full">
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
        </div> */}

        <form onSubmit={handleSubmit}>
          <div className="rounded-md bg-lc-textarea-bg p-2 drop-shadow-md transition-shadow duration-200 ease-in-out group-focus-within/input:ring-1 group-focus-within/input:ring-blue-500">
            <textarea
              className="sticky bottom-0 w-full resize-none bg-transparent px-1 text-white placeholder:text-neutral-500 focus:outline-none"
              placeholder="Type your message here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
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
                <PopoverContent className="border-none bg-lc-popover-bg text-xs text-lc-primary">
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
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <button
                type="submit"
                className="rounded-md px-1 py-1 text-white/60 hover:bg-white/10 disabled:opacity-50"
                disabled={isStreaming || !input.trim() || !apiKey}
              >
                <IoSend />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
