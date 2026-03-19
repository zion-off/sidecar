import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ConfigContext } from '@/context/ConfigContext';
import { ChatCompletion } from '@/open-router/chat';
import { defaultTools } from '@/open-router/tools';
import type { MessageType, ToolCallInfo } from '@/types/chat';
import { MSG } from '@/types/messages';
import { postMessageToParent, seedChat } from '@/utils/messaging';
import { buildEditorContent, buildSelectedText, buildSystemPrompt, getPageData } from './prompt-builder';

function mapForPrompt(messages: MessageType[]) {
  return messages
    .filter((msg) => msg.type !== 'reasoning')
    .map((msg) => ({ ...msg, role: msg.role === 'developer' ? 'user' : msg.role }));
}

export function useChatStream(problemTitle: string) {
  const configContext = useContext(ConfigContext);
  if (!configContext) {
    throw new Error('useChatStream must be used within ConfigProvider');
  }

  const { apiKey, modelResponse, config, customInstructions } = configContext;
  const apiKeyRef = useRef(apiKey);
  const modelResponseRef = useRef(modelResponse);
  const configRef = useRef(config);
  const customInstructionsRef = useRef(customInstructions);
  const [messages, setMessages] = useState<MessageType[]>(() => seedChat(problemTitle));
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [hasPendingToolCall, setHasPendingToolCall] = useState(false);
  const pendingToolCalls = useRef<ToolCallInfo[] | null>(null);
  const currentEditorContent = useRef<MessageType | null>(null);

  useEffect(() => {
    apiKeyRef.current = apiKey;
  }, [apiKey]);

  useEffect(() => {
    modelResponseRef.current = modelResponse;
  }, [modelResponse]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    customInstructionsRef.current = customInstructions;
  }, [customInstructions]);

  useEffect(() => {
    setMessages(seedChat(problemTitle));
    setIsStreaming(false);
    setStreamingMessage('');
    setHasPendingToolCall(false);
    pendingToolCalls.current = null;
    currentEditorContent.current = null;
  }, [problemTitle]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === MSG.SUGGESTION_RESOLVED) {
        setHasPendingToolCall(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const createClient = useCallback(() => {
    return new ChatCompletion({
      apiKey: apiKeyRef.current,
      onChunk: (_, fullMessage) => {
        setStreamingMessage(fullMessage);
      },
      onReasoning: (reasoning) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.type === 'reasoning') {
            return [...prev.slice(0, -1), { ...last, content: reasoning }];
          }
          return [...prev, { role: 'assistant', content: reasoning, type: 'reasoning' }];
        });
      },
      onToolCall: async (func, args) => {
        if (func === 'suggest_code') {
          const pageData = await getPageData();
          postMessageToParent({
            type: MSG.SHOW_SUGGESTION,
            suggestion: {
              originalCode: pageData.editorContent || '',
              suggestedCode: args.suggestion
            }
          });
        }
      },
      onToolCallComplete: (toolCalls) => {
        pendingToolCalls.current = toolCalls;
        setHasPendingToolCall(true);
        setMessages((prev) => [...prev, { content: '', role: 'assistant', tool_calls: toolCalls }]);
      },
      onComplete: (fullMessage) => {
        setMessages((prev) => [...prev, { content: fullMessage, role: 'assistant' }]);
        setIsStreaming(false);
        setStreamingMessage('');
        pendingToolCalls.current = null;
      },
      onError: (error) => {
        toast.warning(error.message || 'An error occurred while fetching the response.');
        setIsStreaming(false);
        setStreamingMessage('');
        pendingToolCalls.current = null;
        setHasPendingToolCall(false);
        setMessages((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].role === 'user') {
            return prev.slice(0, -1);
          }
          return prev;
        });
      }
    });
  }, []);

  const sendMessage = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      const currentApiKey = apiKeyRef.current;
      const currentModelResponse = modelResponseRef.current;
      const currentConfig = configRef.current;
      const currentCustomInstructions = customInstructionsRef.current;

      if (!trimmed || !currentApiKey || isStreaming || !currentModelResponse) return;

      const userMessage: MessageType = { content: trimmed, role: 'user' };
      const pageData = await getPageData();
      const systemPrompt = buildSystemPrompt(pageData, {
        agentMode: currentConfig.mode === 'agent',
        customInstructions: currentCustomInstructions
      });
      const editorContentPrompt = buildEditorContent(pageData);
      const selectedTextPrompt = buildSelectedText(pageData);

      const allMessages = [...messages];
      if (!currentEditorContent.current || currentEditorContent.current.content !== editorContentPrompt.content) {
        allMessages.push(editorContentPrompt);
        currentEditorContent.current = editorContentPrompt;
      }
      if (selectedTextPrompt) {
        allMessages.push(selectedTextPrompt);
      }
      allMessages.push(userMessage);

      setMessages(allMessages);
      setIsStreaming(true);
      setStreamingMessage('');

      const prompt = [systemPrompt, ...mapForPrompt(allMessages.slice(1))];
      const client = createClient();
      await client.processStream(
        currentModelResponse.data.id,
        currentConfig.reasoning,
        prompt,
        currentConfig.mode === 'agent' ? defaultTools : undefined
      );
    },
    [createClient, isStreaming, messages]
  );

  const resolveToolCall = useCallback(
    (accepted: boolean) => {
      const currentModelResponse = modelResponseRef.current;
      const currentConfig = configRef.current;
      const currentCustomInstructions = customInstructionsRef.current;
      if (!pendingToolCalls.current || !currentModelResponse) return;

      const toolCalls = pendingToolCalls.current;
      const messagesSnapshot = messages;

      void (async () => {
        postMessageToParent({ type: MSG.RESOLVE_SUGGESTION, isAccept: accepted });
        setHasPendingToolCall(false);

        const toolResultMessages: MessageType[] = toolCalls.map((tc) => ({
          content: accepted
            ? 'The user accepted the suggestion. It has been applied to the editor.'
            : 'The user rejected the suggestion. It has been reverted.',
          role: 'tool',
          tool_call_id: tc.id
        }));

        const allMessages = [...messagesSnapshot, ...toolResultMessages];
        setMessages(allMessages);

        pendingToolCalls.current = null;
        setIsStreaming(true);
        setStreamingMessage('');

        const pageData = await getPageData();
        const systemPrompt = buildSystemPrompt(pageData, {
          agentMode: currentConfig.mode === 'agent',
          customInstructions: currentCustomInstructions
        });
        const prompt = [systemPrompt, ...mapForPrompt(allMessages.slice(1))];

        const client = createClient();
        await client.processStream(
          currentModelResponse.data.id,
          currentConfig.reasoning,
          prompt,
          currentConfig.mode === 'agent' ? defaultTools : undefined
        );
      })();
    },
    [createClient, messages]
  );

  const resetChat = useCallback(() => {
    setMessages(seedChat(problemTitle));
    setIsStreaming(false);
    setStreamingMessage('');
    setHasPendingToolCall(false);
    pendingToolCalls.current = null;
    currentEditorContent.current = null;
  }, [problemTitle]);

  return useMemo(
    () => ({
      messages,
      isStreaming,
      streamingMessage,
      hasPendingToolCall,
      sendMessage,
      resolveToolCall,
      resetChat
    }),
    [messages, isStreaming, streamingMessage, hasPendingToolCall, sendMessage, resolveToolCall, resetChat]
  );
}
