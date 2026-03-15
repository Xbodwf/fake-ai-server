/**
 * 内部 Chat Completion 处理
 * 用于 Action 沙箱中调用，通过 HTTP 调用 /v1/chat 端点
 */

// 声明全局变量，在VM沙箱中会被注入
declare const __usageTracker: { promptTokens: number; completionTokens: number; userId?: string; apiKeyId?: string } | undefined;

/**
 * 获取服务器基础 URL
 * 支持 Docker 环境和本地开发环境
 */
function getServerBaseUrl(): string {
  // 优先使用环境变量
  if (process.env.SERVER_URL) {
    return process.env.SERVER_URL;
  }

  // Docker 环境：使用容器内部通信
  if (process.env.DOCKER_ENV === 'true' || process.env.DOCKER_HOST) {
    // 在 Docker 中，使用服务名或 localhost
    const host = process.env.SERVER_HOST || 'localhost';
    const port = process.env.PORT || 7143;
    return `http://${host}:${port}`;
  }

  // 本地开发环境
  const port = process.env.PORT || 7143;
  return `http://localhost:${port}`;
}

/**
 * 内部调用 Chat Completion
 * 这个函数在 Action 沙箱中被调用，通过 HTTP 调用本地 /v1/chat 端点
 */
export async function internalChatCompletion(params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}): Promise<string> {
  try {
    // 构建请求体
    const requestBody = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens,
      top_p: params.top_p,
    };

    // 获取服务器基础 URL
    const baseUrl = getServerBaseUrl();
    const url = `${baseUrl}/v1/chat/completions`;

    // 从沙箱中获取用户信息
    // __usageTracker 在VM代码中被注入为全局变量
    const userId = (typeof __usageTracker !== 'undefined' && __usageTracker?.userId) ? __usageTracker.userId : undefined;
    const apiKeyId = (typeof __usageTracker !== 'undefined' && __usageTracker?.apiKeyId) ? __usageTracker.apiKeyId : undefined;

    console.log('[internalChatCompletion] Calling model:', params.model);
    console.log('[internalChatCompletion] userId:', userId, 'apiKeyId:', apiKeyId);

    // 构建 headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 如果有用户信息，通过特殊 header 传递
    if (userId) {
      headers['x-internal-user-id'] = userId;
      console.log('[internalChatCompletion] Added x-internal-user-id header');
    }
    if (apiKeyId) {
      headers['x-internal-api-key-id'] = apiKeyId;
      console.log('[internalChatCompletion] Added x-internal-api-key-id header');
    }

    console.log('[internalChatCompletion] Final headers:', headers);

    // 调用本地 /v1/chat 端点
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Chat completion failed');
    }

    const data = await response.json();

    // 提取响应内容
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content;
      if (typeof content === 'string') {
        return content;
      }
    }

    throw new Error('Invalid response format from chat completion');
  } catch (error) {
    throw new Error(`Chat completion failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
