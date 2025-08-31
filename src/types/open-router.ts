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
