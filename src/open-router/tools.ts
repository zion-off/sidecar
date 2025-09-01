import { Tool } from '@/types/open-router';

export type ToolFunctionArgs = {
  suggest_code: {
    suggestion: string;
  };
};

export const defaultTools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'suggest_code',
      description: 'Suggest code snippets based on the provided context',
      parameters: {
        type: 'object',
        properties: {
          suggestion: {
            type: 'string',
            description: "The code that will replace the user's code"
          }
        },
        required: ['suggestion']
      }
    }
  }
];
