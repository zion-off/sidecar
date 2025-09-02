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
      description:
        'Invoke when the user asks for the solution. If the user intent is uncertain, seek clarification instead of invoking.',
      parameters: {
        type: 'object',
        properties: {
          suggestion: {
            type: 'string',
            description: 'The full new code to put in the editor, completely replacing existing content.'
          }
        },
        required: ['suggestion']
      }
    }
  }
];
