export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface Model {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
  description?: string;
  context_length?: number;
}

export interface PendingRequest {
  requestId: string;
  request: ChatCompletionRequest;
  isStream: boolean;
  createdAt: number;
}

export interface WSMessage {
  type: 'request' | 'response' | 'stream' | 'stream_end' | 'connected' | 'models_update';
  payload: {
    requestId: string;
    data: ChatCompletionRequest;
  } | {
    requestId: string;
    content: string;
  } | {
    message: string;
  } | {
    models: Model[];
  };
}

export interface Stats {
  pendingRequests: number;
  connectedClients: number;
  totalModels: number;
}

export interface SystemSettings {
  streamDelay: number;
  port: number;
}
