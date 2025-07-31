  import { DIFY_CONFIG, DIFY_ENDPOINTS, validateDifyConfig, DifyApp, DifyCompletionRequest, DifyCompletionResponse } from './config';

  class DifyAPI {
    private baseUrl: string;
    private apiKey: string;
    private enabled: boolean;

    constructor() {
      this.baseUrl = DIFY_CONFIG.BASE_URL;
      this.apiKey = DIFY_CONFIG.API_KEY;
      this.enabled = validateDifyConfig();
      
      if (!this.enabled) {
        console.warn('🚫 Dify集成未启用，请检查环境变量配置');
      }
    }

    private async request<T>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<T> {
      if (!this.enabled) {
        throw new Error('Dify集成未启用：请检查DIFY_API_KEY和DIFY_BASE_URL环境变量');
      }

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
      if (!this.enabled) {
        return [];
      }
      const response = await this.request<{ data: DifyApp[] }>(DIFY_ENDPOINTS.APPLICATIONS);
      return response.data;
    }

    async getApp(appId: string): Promise<DifyApp | null> {
      if (!this.enabled) {
        return null;
      }
      try {
        return await this.request<DifyApp>(`${DIFY_ENDPOINTS.APPLICATIONS}/${appId}`);
      } catch (error) {
        console.error(`获取应用 ${appId} 失败:`, error);
        return null;
      }
    }

    async createChatMessage(
      appId: string,
      request: DifyCompletionRequest & {
        query: string;
        conversation_id?: string;
      }
    ): Promise<any> {
      if (!this.enabled) {
        throw new Error('Dify集成未启用，无法创建聊天消息');
      }
      
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
