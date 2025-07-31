export const DIFY_CONFIG = {
    BASE_URL: process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1',
    API_KEY: process.env.DIFY_API_KEY || 'app-AwzafXTA0PV8bGj0G9uGKu5F',
    APP_ID: '1c9d59b7-3766-4a61-95e1-13c0600fede7',
  } as const;

  export const DIFY_ENDPOINTS = {
    COMPLETIONS: '/completions',
    CHAT_MESSAGES: '/chat-messages',
    APPLICATIONS: '/applications',
    CONVERSATIONS: '/conversations',
    FILES: '/files',
  } as const;

  export interface DifyApp {
    id: string;
    name: string;
    description: string;
    icon: string;
    mode: string;
    model_config: {
      model: {
        name: string;
        provider: string;
      };
    };
    tags?: string[];
    is_installed: boolean;
    installed_at?: string;
    last_used?: string;
    usage_count: number;
    rating: number;
    user_id: string;
  }

  export interface DifyCompletionRequest {
    inputs: Record<string, any>;
    user: string;
    files?: Array<{
      type: string;
      transfer_method: string;
      url: string;
    }>;
    response_mode?: 'streaming' | 'blocking';
  }

  export interface DifyCompletionResponse {
    message_id: string;
    conversation_id: string;
    mode: string;
    answer: string;
    metadata?: Record<string, any>;
    created_at: number;
  }