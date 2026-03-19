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

  const { apiKey, modelResponse, config } = configContext;
  const [messages, setMessages] = useState<MessageType[]>(() => seedChat(problemTitle));
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [hasPendingToolCall, setHasPendingToolCall] = useState(false);
  const pendingToolCalls = useRef<ToolCallInfo[] | null>(null);
  const currentEditorContent = useRef<MessageType | null>(null);

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
      apiKey,
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
  }, [apiKey]);

  const sendMessage = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed || !apiKey || isStreaming || !modelResponse) return;

      const userMessage: MessageType = { content: trimmed, role: 'user' };
      const pageData = await getPageData();
      const systemPrompt = buildSystemPrompt(pageData, { agentMode: config.mode === 'agent' });
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
        modelResponse.data.id,
        config.reasoning,
        prompt,
        config.mode === 'agent' ? defaultTools : undefined
      );
    },
    [apiKey, config.mode, config.reasoning, createClient, isStreaming, messages, modelResponse]
  );

  const resolveToolCall = useCallback(
    async (accepted: boolean) => {
      if (!pendingToolCalls.current || !modelResponse) return;

      postMessageToParent({ type: MSG.RESOLVE_SUGGESTION, isAccept: accepted });
      setHasPendingToolCall(false);

      const toolResultMessages: MessageType[] = pendingToolCalls.current.map((tc) => ({
        content: accepted
          ? 'The user accepted the suggestion. It has been applied to the editor.'
          : 'The user rejected the suggestion. It has been reverted.',
        role: 'tool',
        tool_call_id: tc.id
      }));

      const allMessages = [...messages, ...toolResultMessages];
      setMessages(allMessages);

      pendingToolCalls.current = null;
      setIsStreaming(true);
      setStreamingMessage('');

      const pageData = await getPageData();
      const systemPrompt = buildSystemPrompt(pageData, { agentMode: config.mode === 'agent' });
      const prompt = [systemPrompt, ...mapForPrompt(allMessages.slice(1))];

      const client = createClient();
      await client.processStream(
        modelResponse.data.id,
        config.reasoning,
        prompt,
        config.mode === 'agent' ? defaultTools : undefined
      );
    },
    [config.mode, config.reasoning, createClient, messages, modelResponse]
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
