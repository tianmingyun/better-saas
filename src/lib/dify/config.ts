export const DIFY_CONFIG = {
    BASE_URL: process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1',
    API_KEY: process.env.DIFY_API_KEY || '',
    APP_ID: process.env.DIFY_APP_ID || '',
    TIMEOUT: 30000,
  } as const;

// 验证环境变量配置
export const validateDifyConfig = (): boolean => {
  if (!DIFY_CONFIG.API_KEY) {
    console.warn('⚠️ DIFY_API_KEY 环境变量未设置');
    return false;
  }
  if (!DIFY_CONFIG.BASE_URL) {
    console.warn('⚠️ DIFY_BASE_URL 环境变量未设置');
    return false;
  }
  return true;
};

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