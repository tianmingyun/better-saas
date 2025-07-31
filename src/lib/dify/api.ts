  import { DIFY_CONFIG, DIFY_ENDPOINTS, DifyApp, DifyCompletionRequest, DifyCompletionResponse } from './config';

  class DifyAPI {
    private baseUrl: string;
    private apiKey: string;

    constructor() {
      this.baseUrl = DIFY_CONFIG.BASE_URL;
      this.apiKey = DIFY_CONFIG.API_KEY;
    }

    private async request<T>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<T> {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      };

      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });

        if (!response.ok) {
          throw new Error(`Dify API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Dify API request failed:', error);
        throw error;
      }
    }

    async getApplications(): Promise<DifyApp[]> {
      const response = await this.request<{ data: DifyApp[] }>(DIFY_ENDPOINTS.APPLICATIONS);
      return response.data;
    }

    async getApp(appId: string): Promise<DifyApp> {
      return this.request<DifyApp>(`${DIFY_ENDPOINTS.APPLICATIONS}/${appId}`);
    }

    async createChatMessage(
      appId: string,
      request: DifyCompletionRequest & {
        query: string;
        conversation_id?: string;
      }
    ): Promise<any> {
      return this.request(
        `${DIFY_ENDPOINTS.APPLICATIONS}/${appId}/chat-messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            ...request,
            response_mode: 'blocking',
          }),
        }
      );
    }
  }

  export const difyAPI = new DifyAPI();
