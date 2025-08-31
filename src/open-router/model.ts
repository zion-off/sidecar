import { ModelEndpointsResponse } from '@/types/open-router';

export async function getModelEndpoints(author: string, slug: string): Promise<ModelEndpointsResponse> {
  const response = await fetch(`https://openrouter.ai/api/v1/models/${author}/${slug}/endpoints`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch model endpoints: ${response.statusText}`);
  }

  return response.json();
}
