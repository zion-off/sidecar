export type ModelEndpointPricing = {
  prompt: string;
  completion: string;
  request?: string;
  image?: string;
};

export type ModelEndpoint = {
  supported_parameters: string[];
  context_length?: number | null;
  pricing?: ModelEndpointPricing;
};

export type ModelArchitecture = {
  tokenizer: string;
  input_modalities?: string[];
  output_modalities?: string[];
  instruct_type?: string;
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

export type OpenRouterModelPricing = {
  prompt: string;
  completion: string;
};

export type OpenRouterModelTopProvider = {
  context_length: number | null;
};

export type OpenRouterModel = {
  id: string;
  name: string;
  description: string;
  context_length: number | null;
  created: number;
  pricing: OpenRouterModelPricing;
  supported_parameters: string[];
  architecture: ModelArchitecture;
  top_provider: OpenRouterModelTopProvider;
};

export type OpenRouterModelsResponse = {
  data: OpenRouterModel[];
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
