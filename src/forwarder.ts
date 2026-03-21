import axios from 'axios';
import type { ChatCompletionRequest, Model } from './types.js';
import type { Response } from 'express';
import { generateRequestId } from './responseBuilder.js';

/**
 * 标准化 API 错误响应格式
 * 将不同 API 提供商的错误格式统一为 OpenAI 格式
 */
export function standardizeErrorResponse(error: any, apiType: string = 'unknown'): any {
  // 如果已经是标准格式，直接返回
  if (error.error && error.error.message && error.error.type) {
    return error;
  }

  let message = 'Unknown error';
  let type = 'api_error';
  let code = 'internal_error';

  // 处理 axios 错误
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // 根据 API 类型解析错误
    switch (apiType) {
      case 'openai':
      case 'azure':
      case 'custom':
        // OpenAI 格式错误
        if (data.error) {
          message = data.error.message || 'OpenAI API error';
          type = data.error.type || 'api_error';
          code = data.error.code || 'api_error';
        } else {
          message = data.message || `HTTP ${status}`;
        }
        break;

      case 'anthropic':
        // Anthropic 格式错误
        if (data.error) {
          message = data.error.message || 'Anthropic API error';
          type = data.error.type || 'api_error';
        } else {
          message = data.message || `HTTP ${status}`;
        }
        break;

      case 'google':
        // Google 格式错误
        if (data.error) {
          if (typeof data.error === 'object') {
            message = data.error.message || 'Google API error';
            code = data.error.code || 'api_error';
          } else {
            message = data.error;
          }
        } else {
          message = data.message || `HTTP ${status}`;
        }
        break;

      default:
        message = data.message || data.error?.message || `HTTP ${status}`;
    }
  } else if (error.message) {
    message = error.message;
  }

  return {
    error: {
      message,
      type,
      code,
      api_type: apiType,
    }
  };
}

/**
 * 获取转发时使用的模型名称
 */
function getForwardModelName(model: Model, requestedModel: string): string {
  return model.forwardModelName || requestedModel;
}

/**
 * 转发请求到真实的 API
 */
export async function forwardChatRequest(
  model: Model,
  body: ChatCompletionRequest
): Promise<{ success: true; response: any } | { success: false; error: string }> {
  if (!model.api_base_url || !model.api_key) {
    return { success: false, error: 'Model not configured for forwarding' };
  }

  const apiType = model.api_type || 'openai';

  try {
    switch (apiType) {
      case 'openai':
      case 'azure':
      case 'custom':
        return await forwardToOpenAI(model, body);

      case 'anthropic':
        return await forwardToAnthropic(model, body);

      case 'google':
        return await forwardToGoogle(model, body);

      default:
        return { success: false, error: `Unsupported API type: ${apiType}` };
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Forwarder] Error forwarding to ${apiType}:`, errorMessage);

    // 返回标准化的错误响应
    const standardizedError = standardizeErrorResponse(error, apiType);
    return { success: false, error: JSON.stringify(standardizedError) };
  }
}

/**
 * 转发流式请求
 */
export async function forwardStreamRequest(
  model: Model,
  body: ChatCompletionRequest,
  res: Response
): Promise<void> {
  if (!model.api_base_url || !model.api_key) {
    throw new Error('Model not configured for forwarding');
  }

  // 生成统一的请求 ID
  const requestId = generateRequestId();

  // 设置流式响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  let url = model.api_base_url;
  if (!url.includes('/chat/completions')) {
    url = `${url}/chat/completions`;
  }

  // 使用转发模型名称
  const forwardModel = getForwardModelName(model, body.model);
  const forwardBody = { ...body, model: forwardModel };

  const response = await axios.post(url, forwardBody, {
    headers: {
      'Authorization': `Bearer ${model.api_key}`,
      'Content-Type': 'application/json',
    },
    timeout: 120000,
    responseType: 'stream',
  });

  // 处理流数据，统一 id 格式
  let firstChunk = true;
  response.data.on('data', (chunk: Buffer) => {
    let chunkStr = chunk.toString();
    
    // 替换流中的 id 为统一格式
    // 匹配 "id":"xxx" 或 "id": "xxx" 格式
    chunkStr = chunkStr.replace(
      /"id"\s*:\s*"[^"]*"/g,
      `"id":"${requestId}"`
    );
    
    res.write(chunkStr);
  });

  response.data.on('end', () => {
    res.end();
  });

  response.data.on('error', (err: Error) => {
    console.error('[Forwarder] Stream error:', err.message);
    res.end();
  });
}

/**
 * 转发到 OpenAI 兼容的 API
 */
async function forwardToOpenAI(
  model: Model,
  body: ChatCompletionRequest
): Promise<{ success: true; response: any }> {
  // 智能处理 URL：如果 api_base_url 已经包含完整路径，直接使用
  let url = model.api_base_url!;
  if (!url.includes('/chat/completions')) {
    url = `${url}/chat/completions`;
  }

  // 使用转发模型名称
  const forwardModel = getForwardModelName(model, body.model);
  const forwardBody = { ...body, model: forwardModel };

  const response = await axios.post(url, forwardBody, {
    headers: {
      'Authorization': `Bearer ${model.api_key}`,
      'Content-Type': 'application/json',
    },
    timeout: 120000, // 2 分钟超时
    responseType: body.stream ? 'stream' : 'json',
  });

  // 非流式响应：统一 id 格式
  if (!body.stream && response.data) {
    response.data.id = generateRequestId();
  }

  return { success: true, response: response.data };
}

/**
 * 转发到 Anthropic Claude API
 */
async function forwardToAnthropic(
  model: Model,
  body: ChatCompletionRequest
): Promise<{ success: true; response: any }> {
  const url = `${model.api_base_url}/v1/messages`;

  // 使用转发模型名称
  const forwardModel = getForwardModelName(model, body.model);

  // 转换消息格式：OpenAI -> Anthropic
  const systemMessages = body.messages.filter(m => m.role === 'system');
  const nonSystemMessages = body.messages.filter(m => m.role !== 'system');

  const anthropicBody = {
    model: forwardModel,
    messages: nonSystemMessages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    })),
    max_tokens: body.max_tokens || 4096,
    temperature: body.temperature,
    top_p: body.top_p,
    stream: body.stream,
    system: systemMessages.length > 0 ? systemMessages[0].content : undefined,
  };

  const response = await axios.post(url, anthropicBody, {
    headers: {
      'x-api-key': model.api_key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    timeout: 120000,
    responseType: body.stream ? 'stream' : 'json',
  });

  // 转换响应格式：Anthropic -> OpenAI
  if (!body.stream) {
    const anthropicResponse = response.data;
    return {
      success: true,
      response: {
        id: generateRequestId(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: body.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: anthropicResponse.content[0]?.text || '',
          },
          finish_reason: anthropicResponse.stop_reason === 'end_turn' ? 'stop' : 'length',
        }],
        usage: {
          prompt_tokens: anthropicResponse.usage?.input_tokens || 0,
          completion_tokens: anthropicResponse.usage?.output_tokens || 0,
          total_tokens: (anthropicResponse.usage?.input_tokens || 0) + (anthropicResponse.usage?.output_tokens || 0),
        },
      },
    };
  }

  return { success: true, response: response.data };
}

/**
 * 转发到 Google Gemini API
 */
async function forwardToGoogle(
  model: Model,
  body: ChatCompletionRequest
): Promise<{ success: true; response: any }> {
  // 使用转发模型名称
  const forwardModel = getForwardModelName(model, body.model);
  const url = `${model.api_base_url}/v1beta/models/${forwardModel}:generateContent?key=${model.api_key}`;

  // 转换消息格式：OpenAI -> Google
  const contents = body.messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
  }));

  const googleBody = {
    contents,
    generationConfig: {
      temperature: body.temperature,
      topP: body.top_p,
      maxOutputTokens: body.max_tokens,
    },
  };

  const response = await axios.post(url, googleBody, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 120000,
  });

  // 转换响应格式：Google -> OpenAI
  const googleResponse = response.data;
  const candidate = googleResponse.candidates?.[0];

  return {
    success: true,
    response: {
      id: generateRequestId(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: body.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: candidate?.content?.parts?.[0]?.text || '',
        },
        finish_reason: candidate?.finishReason === 'STOP' ? 'stop' : 'length',
      }],
      usage: {
        prompt_tokens: googleResponse.usageMetadata?.promptTokenCount || 0,
        completion_tokens: googleResponse.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: googleResponse.usageMetadata?.totalTokenCount || 0,
      },
    },
  };
}

/**
 * 转发 Gemini 格式的请求（非流式）
 * 根据 api_type 决定如何转发和转换格式
 */
export async function forwardGeminiRequest(
  model: Model,
  geminiBody: any
): Promise<{ success: true; response: any } | { success: false; error: string }> {
  if (!model.api_base_url || !model.api_key) {
    return { success: false, error: 'Model not configured for forwarding' };
  }

  const apiType = model.api_type || 'google';

  try {
    // 如果目标是 Google/Gemini API，直接转发 Gemini 格式
    if (apiType === 'google') {
      const forwardModel = model.forwardModelName || model.id;
      const url = `${model.api_base_url}/v1beta/models/${forwardModel}:generateContent?key=${model.api_key}`;

      console.log(`[Gemini Forwarder] 转发到 Gemini API: ${url}`);

      const response = await axios.post(url, geminiBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000,
      });

      return { success: true, response: response.data };
    }

    // 如果目标是其他 API（OpenAI、Anthropic 等），需要转换格式
    // 1. 将 Gemini 格式转换为 OpenAI 格式
    const messages: ChatCompletionRequest['messages'] = [];

    // 提取 system instruction
    if (geminiBody.systemInstruction?.parts) {
      const systemContent = geminiBody.systemInstruction.parts
        .map((p: { text?: string }) => p.text || '')
        .join('\n');
      if (systemContent) {
        messages.push({ role: 'system', content: systemContent });
      }
    }

    // 提取 contents
    if (geminiBody.contents) {
      geminiBody.contents.forEach((item: { role: string; parts: { text?: string }[] }) => {
        const content = item.parts
          .map((p: { text?: string }) => p.text || '')
          .join('\n');
        const role = item.role === 'model' ? 'assistant' : item.role;
        messages.push({ role, content });
      });
    }

    const openaiBody: ChatCompletionRequest = {
      model: model.forwardModelName || model.id,
      messages,
      stream: false,
      temperature: geminiBody.generationConfig?.temperature,
      top_p: geminiBody.generationConfig?.topP,
      max_tokens: geminiBody.generationConfig?.maxOutputTokens,
    };

    console.log(`[Gemini Forwarder] 转换为 OpenAI 格式，转发到 ${apiType} API`);

    // 2. 使用现有的转发函数
    const result = await forwardChatRequest(model, openaiBody);

    if (!result.success) {
      return result;
    }

    // 3. 将 OpenAI 响应转换回 Gemini 格式
    const openaiResponse = result.response;
    const geminiResponse = {
      candidates: [{
        content: {
          parts: [{ text: openaiResponse.choices?.[0]?.message?.content || '' }],
          role: 'model',
        },
        finishReason: openaiResponse.choices?.[0]?.finish_reason === 'stop' ? 'STOP' : 'MAX_TOKENS',
      }],
      usageMetadata: {
        promptTokenCount: openaiResponse.usage?.prompt_tokens || 0,
        candidatesTokenCount: openaiResponse.usage?.completion_tokens || 0,
        totalTokenCount: openaiResponse.usage?.total_tokens || 0,
      },
    };

    return { success: true, response: geminiResponse };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
    console.error('[Gemini Forwarder] 转发失败:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * 转发 Gemini 格式的请求（流式）
 * 根据 api_type 决定如何转发和转换格式
 */
export async function forwardGeminiStreamRequest(
  model: Model,
  geminiBody: any,
  res: Response
): Promise<void> {
  if (!model.api_base_url || !model.api_key) {
    throw new Error('Model not configured for forwarding');
  }

  const apiType = model.api_type || 'google';

  // 设置流式响应头（Gemini 格式）
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // 如果目标是 Google/Gemini API，直接转发
  if (apiType === 'google') {
    const forwardModel = model.forwardModelName || model.id;
    const url = `${model.api_base_url}/v1beta/models/${forwardModel}:streamGenerateContent?key=${model.api_key}&alt=sse`;

    console.log(`[Gemini Forwarder] 流式转发到 Gemini API: ${url}`);

    const response = await axios.post(url, geminiBody, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000,
      responseType: 'stream',
    });

    // 直接透传流数据
    response.data.on('data', (chunk: Buffer) => {
      res.write(chunk);
    });

    response.data.on('end', () => {
      res.end();
    });

    response.data.on('error', (err: Error) => {
      console.error('[Gemini Forwarder] 流式转发错误:', err.message);
      res.end();
    });
    return;
  }

  // 如果目标是其他 API，需要转换格式
  // 1. 将 Gemini 格式转换为 OpenAI 格式
  const messages: ChatCompletionRequest['messages'] = [];

  if (geminiBody.systemInstruction?.parts) {
    const systemContent = geminiBody.systemInstruction.parts
      .map((p: { text?: string }) => p.text || '')
      .join('\n');
    if (systemContent) {
      messages.push({ role: 'system', content: systemContent });
    }
  }

  if (geminiBody.contents) {
    geminiBody.contents.forEach((item: { role: string; parts: { text?: string }[] }) => {
      const content = item.parts
        .map((p: { text?: string }) => p.text || '')
        .join('\n');
      const role = item.role === 'model' ? 'assistant' : item.role;
      messages.push({ role, content });
    });
  }

  const openaiBody: ChatCompletionRequest = {
    model: model.forwardModelName || model.id,
    messages,
    stream: true,
    temperature: geminiBody.generationConfig?.temperature,
    top_p: geminiBody.generationConfig?.topP,
    max_tokens: geminiBody.generationConfig?.maxOutputTokens,
  };

  console.log(`[Gemini Forwarder] 流式转换为 OpenAI 格式，转发到 ${apiType} API`);

  // 2. 转发 OpenAI 格式请求
  let url = model.api_base_url;
  if (!url.includes('/chat/completions')) {
    url = `${url}/chat/completions`;
  }

  const response = await axios.post(url, openaiBody, {
    headers: {
      'Authorization': `Bearer ${model.api_key}`,
      'Content-Type': 'application/json',
    },
    timeout: 120000,
    responseType: 'stream',
  });

  // 3. 将 OpenAI 流式响应转换为 Gemini 格式
  let buffer = '';
  
  response.data.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          continue;
        }

        try {
          const openaiChunk = JSON.parse(data);
          const content = openaiChunk.choices?.[0]?.delta?.content || '';
          
          if (content) {
            // 转换为 Gemini 格式
            const geminiChunk = {
              candidates: [{
                content: {
                  parts: [{ text: content }],
                  role: 'model',
                },
                finishReason: openaiChunk.choices?.[0]?.finish_reason ? 'STOP' : null,
              }],
            };
            res.write(`data: ${JSON.stringify(geminiChunk)}\n\n`);
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  });

  response.data.on('end', () => {
    res.write('data: [DONE]\n\n');
    res.end();
  });

  response.data.on('error', (err: Error) => {
    console.error('[Gemini Forwarder] 流式转换错误:', err.message);
    res.end();
  });
}