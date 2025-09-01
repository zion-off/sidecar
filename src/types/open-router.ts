export type ModelEndpointPricing = {
  request: string;
  image: string;
  prompt: string;
  completion: string;
};

export type ModelEndpoint = {
  name: string;
  context_length: number;
  pricing: ModelEndpointPricing;
  provider_name: string;
  supported_parameters: string[];
  quantization: string;
  max_completion_tokens: number;
  max_prompt_tokens: number;
  status: string;
  uptime_last_30m: number;
};

export type ModelArchitecture = {
  input_modalities: string[];
  output_modalities: string[];
  tokenizer: string;
  instruct_type: string;
};

export type ModelData = {
  id: string;
  name: string;
  created: number;
  description: string;
  architecture: ModelArchitecture;
  endpoints: ModelEndpoint[];
};

export type ModelEndpointsResponse = {
  data: ModelData;
};

export type ReasoningEffort = '' | 'low' | 'medium' | 'high';

export type ModelConfig = {
  tools: boolean;
  reasoning: ReasoningEffort;
  mode: 'learn' | 'agent';
};

export type FunctionDescription = {
  description?: string;
  name: string;
  parameters: object;
};

export type Tool = {
  type: 'function';
  function: FunctionDescription;
};

export type StreamingChoice = {
  finish_reason: 'tool_calls' | 'stop' | 'length' | 'content_filter' | 'error' | null;
  native_finish_reason: string | null;
  delta: {
    content: string | null;
    role?: string;
    tool_calls?: ToolCall[];
  };
  error?: ErrorResponse;
};

export type ErrorResponse = {
  code: number;
  message: string;
  metadata?: Record<string, unknown>;
};

export type ToolCall = Tool & {
  id: string;
};
