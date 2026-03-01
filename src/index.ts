import express, { Request, Response, Application } from 'express';
import type { ChatCompletionRequest, PendingRequest, Model } from './types.js';
import { addPendingRequest, getPendingRequest, removePendingRequest, getPendingCount } from './requestStore.js';
import { buildResponse, buildStreamChunk, buildStreamDone, generateRequestId } from './responseBuilder.js';
import { broadcastRequest, initWebSocket, getConnectedClientsCount, broadcastModelsUpdate } from './websocket.js';
import { createServer } from 'http';
import {
  loadModels,
  getAllModels,
  getModel,
  addModel as storageAddModel,
  updateModel as storageUpdateModel,
  deleteModel as storageDeleteModel,
  getServerConfig,
  getSettings,
  updateSettings,
} from './storage.js';

const app: Application = express();
const server = createServer(app);

// 中间件
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ==================== 管理 API ====================

// GET /api/models - 获取模型列表（管理用）
app.get('/api/models', (req: Request, res: Response) => {
  res.json({ models: getAllModels() });
});

// POST /api/models - 添加模型
app.post('/api/models', async (req: Request, res: Response) => {
  const { id, owned_by, description, context_length } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Model ID is required' });
  }

  if (getModel(id)) {
    return res.status(400).json({ error: 'Model already exists' });
  }

  try {
    const newModel = await storageAddModel({
      id,
      owned_by: owned_by || 'custom',
      description: description || '',
      context_length: context_length || 4096,
    });
    broadcastModelsUpdate(getAllModels());
    res.json({ success: true, model: newModel });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add model' });
  }
});

// PUT /api/models/:id - 更新模型
app.put('/api/models/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { owned_by, description, context_length } = req.body;

  try {
    const updated = await storageUpdateModel(id, {
      owned_by,
      description,
      context_length,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Model not found' });
    }

    broadcastModelsUpdate(getAllModels());
    res.json({ success: true, model: updated });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update model' });
  }
});

// DELETE /api/models/:id - 删除模型
app.delete('/api/models/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const deleted = await storageDeleteModel(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Model not found' });
    }
    broadcastModelsUpdate(getAllModels());
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

// GET /api/stats - 获取统计信息
app.get('/api/stats', (req: Request, res: Response) => {
  res.json({
    pendingRequests: getPendingCount(),
    connectedClients: getConnectedClientsCount(),
    totalModels: getAllModels().length,
  });
});

// GET /api/settings - 获取系统设置
app.get('/api/settings', async (req: Request, res: Response) => {
  try {
    const settings = await getSettings();
    const serverConfig = await getServerConfig();
    res.json({ ...settings, port: serverConfig.port });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// PUT /api/settings - 更新系统设置
app.put('/api/settings', async (req: Request, res: Response) => {
  try {
    const { port, ...settings } = req.body;
    
    // 更新设置
    const updatedSettings = await updateSettings(settings);
    
    // 如果包含端口配置，也更新服务器配置
    if (port !== undefined) {
      const { updateServerConfig } = await import('./storage.js');
      await updateServerConfig({ port });
    }
    
    res.json({ success: true, settings: { ...updatedSettings, port } });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// GET /api/server-config - 获取服务器配置
app.get('/api/server-config', async (req: Request, res: Response) => {
  try {
    const serverConfig = await getServerConfig();
    res.json(serverConfig);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get server config' });
  }
});

// ==================== OpenAI API 路由 ====================

// GET /v1/models - 获取模型列表
app.get('/v1/models', (req: Request, res: Response) => {
  res.json({
    object: 'list',
    data: getAllModels(),
  });
});

// GET /v1/models/:id - 获取单个模型
app.get('/v1/models/:id', (req: Request, res: Response) => {
  const model = getModel(req.params.id as string);
  if (!model) {
    return res.status(404).json({
      error: { message: 'Model not found', type: 'invalid_request_error' }
    });
  }
  res.json(model);
});

// POST /v1/chat/completions - 聊天补全
app.post('/v1/chat/completions', async (req: Request, res: Response) => {
  const body = req.body as ChatCompletionRequest;

  if (!body.model || !body.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({
      error: {
        message: 'Invalid request: model and messages are required',
        type: 'invalid_request_error',
      }
    });
  }

  // 验证模型是否存在
  const modelExists = getModel(body.model);
  if (!modelExists) {
    console.log('[Server] 模型不存在:', body.model);
    return res.status(400).json({
      error: {
        message: `Model '${body.model}' not found. Available models: ${getAllModels().map(m => m.id).join(', ')}`,
        type: 'invalid_request_error',
        code: 'model_not_found',
      }
    });
  }

  const requestId = generateRequestId();
  const isStream = body.stream === true;

  console.log('\n========================================');
  console.log('收到新的 ChatCompletion 请求 [OpenAI]');
  console.log('请求ID:', requestId);
  console.log('模型:', body.model);
  console.log('流式:', isStream);
  console.log('消息数:', body.messages.length);
  console.log('当前前端连接数:', getConnectedClientsCount());
  console.log('----------------------------------------');

  body.messages.forEach((msg, i) => {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    console.log(`  [${i + 1}] ${msg.role}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
  });
  console.log('========================================\n');

  await handleChatRequest(body, requestId, isStream, res);
});

// POST /v1/responses - OpenAI Responses API
app.post('/v1/responses', async (req: Request, res: Response) => {
  const body = req.body;

  if (!body.model) {
    return res.status(400).json({
      error: {
        message: 'Invalid request: model is required',
        type: 'invalid_request_error',
      }
    });
  }

  // 验证模型是否存在
  const modelExists = getModel(body.model);
  if (!modelExists) {
    return res.status(400).json({
      error: {
        message: `Model '${body.model}' not found`,
        type: 'invalid_request_error',
        code: 'model_not_found',
      }
    });
  }

  const requestId = generateRequestId();
  const isStream = body.stream === true;

  // 转换 input 为 messages 格式
  let messages: ChatCompletionRequest['messages'] = [];

  // input 可以是字符串或消息数组
  if (typeof body.input === 'string') {
    if (body.instructions) {
      messages.push({ role: 'system', content: body.instructions });
    }
    messages.push({ role: 'user', content: body.input });
  } else if (Array.isArray(body.input)) {
    messages = body.input.map((item: { role?: string; content?: string }) => {
      if (item.role === 'assistant') {
        return { role: 'assistant' as const, content: item.content || '' };
      }
      return { role: item.role || 'user' as const, content: item.content || '' };
    });
    if (body.instructions && messages[0]?.role !== 'system') {
      messages.unshift({ role: 'system', content: body.instructions });
    }
  }

  console.log('\n========================================');
  console.log('收到新的 Responses 请求 [OpenAI Responses API]');
  console.log('请求ID:', requestId);
  console.log('模型:', body.model);
  console.log('流式:', isStream);
  console.log('消息数:', messages.length);
  console.log('当前前端连接数:', getConnectedClientsCount());
  console.log('----------------------------------------');

  messages.forEach((msg, i) => {
    console.log(`  [${i + 1}] ${msg.role}: ${msg.content?.substring(0, 100)}${(msg.content?.length || 0) > 100 ? '...' : ''}`);
  });
  console.log('========================================\n');

  const chatRequest: ChatCompletionRequest = {
    model: body.model,
    messages,
    stream: isStream,
  };

  if (isStream) {
    // 流式响应 - 使用 Responses API 格式
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let streamEnded = false;
    const chunks: string[] = [];

    const pending: PendingRequest = {
      requestId,
      request: chatRequest,
      isStream: true,
      createdAt: Date.now(),
      resolve: () => {},
      streamController: {
        enqueue: (content: string) => {
          if (!streamEnded) {
            chunks.push(content);
            // Responses API 流式格式
            const responseChunk = {
              type: 'response.output_item.added',
              item: {
                type: 'message',
                id: `msg_${generateRequestId()}`,
                status: 'in_progress',
                role: 'assistant',
                content: [{ type: 'output_text', text: content }]
              }
            };
            res.write(`data: ${JSON.stringify(responseChunk)}\n\n`);
          }
        },
        close: () => {
          if (!streamEnded) {
            streamEnded = true;
            const doneChunk = {
              type: 'response.completed',
              response: {
                id: `resp_${requestId}`,
                object: 'response',
                status: 'completed'
              }
            };
            res.write(`data: ${JSON.stringify(doneChunk)}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
          }
        }
      }
    };

    addPendingRequest(pending);
    broadcastRequest(pending);

    const timeout = setTimeout(() => {
      if (!streamEnded) {
        streamEnded = true;
        removePendingRequest(requestId);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }, 10 * 60 * 1000);

    req.on('close', () => {
      clearTimeout(timeout);
      removePendingRequest(requestId);
    });
  } else {
    // 非流式响应
    const pending: PendingRequest = {
      requestId,
      request: chatRequest,
      isStream: false,
      createdAt: Date.now(),
      resolve: () => {},
    };

    const responsePromise = new Promise<string>((resolve) => {
      pending.resolve = resolve;
    });

    addPendingRequest(pending);
    broadcastRequest(pending);

    const timeout = setTimeout(() => {
      removePendingRequest(requestId);
      res.json(buildResponsesApiResponse('请求超时，请重试', body.model, requestId));
    }, 10 * 60 * 1000);

    try {
      const content = await responsePromise;
      clearTimeout(timeout);
      res.json(buildResponsesApiResponse(content, body.model, requestId));
    } catch (e) {
      clearTimeout(timeout);
      res.status(500).json({
        error: { message: 'Internal server error', type: 'server_error' }
      });
    }
  }
});

// POST /v1/completions - 文本补全（旧版）
app.post('/v1/completions', (req: Request, res: Response) => {
  res.status(400).json({
    error: {
      message: 'This endpoint is deprecated. Please use /v1/chat/completions',
      type: 'invalid_request_error',
    }
  });
});

// POST /v1/embeddings - 向量嵌入
app.post('/v1/embeddings', (req: Request, res: Response) => {
  res.json({
    object: 'list',
    data: [{
      object: 'embedding',
      embedding: new Array(1536).fill(0),
      index: 0,
    }],
    model: req.body.model || 'text-embedding-ada-002',
    usage: {
      prompt_tokens: 0,
      total_tokens: 0,
    }
  });
});

// POST /v1/moderations - 内容审核
app.post('/v1/moderations', (req: Request, res: Response) => {
  res.json({
    id: `modr-${generateRequestId()}`,
    model: 'text-moderation-latest',
    results: [{
      flagged: false,
      categories: {},
      category_scores: {},
    }]
  });
});

// ==================== Anthropic API 路由 ====================

// POST /v1/messages - Anthropic Messages API
app.post('/v1/messages', async (req: Request, res: Response) => {
  const body = req.body;

  if (!body.model) {
    return res.status(400).json({
      type: 'error',
      error: { type: 'invalid_request_error', message: 'model is required' }
    });
  }

  // 验证模型是否存在
  const modelExists = getModel(body.model);
  if (!modelExists) {
    return res.status(400).json({
      type: 'error',
      error: {
        type: 'invalid_request_error',
        message: `Model '${body.model}' not found`
      }
    });
  }

  const requestId = generateRequestId();
  const isStream = body.stream === true;
  const maxTokens = body.max_tokens || 4096;

  // 转换 Anthropic 格式到 OpenAI 格式
  const messages: ChatCompletionRequest['messages'] = [];

  if (body.system) {
    messages.push({ role: 'system', content: body.system });
  }

  if (Array.isArray(body.messages)) {
    body.messages.forEach((msg: { role: string; content: string | { type: string; text: string }[] }) => {
      let content = '';
      if (typeof msg.content === 'string') {
        content = msg.content;
      } else if (Array.isArray(msg.content)) {
        content = msg.content
          .filter((c: { type: string }) => c.type === 'text')
          .map((c: { text: string }) => c.text)
          .join('\n');
      }
      messages.push({ role: msg.role as 'system' | 'user' | 'assistant' | 'tool', content });
    });
  }

  console.log('\n========================================');
  console.log('收到新的 Messages 请求 [Anthropic]');
  console.log('请求ID:', requestId);
  console.log('模型:', body.model);
  console.log('流式:', isStream);
  console.log('消息数:', messages.length);
  console.log('当前前端连接数:', getConnectedClientsCount());
  console.log('----------------------------------------');

  messages.forEach((msg, i) => {
    console.log(`  [${i + 1}] ${msg.role}: ${msg.content?.substring(0, 100)}${(msg.content?.length || 0) > 100 ? '...' : ''}`);
  });
  console.log('========================================\n');

  const chatRequest: ChatCompletionRequest = {
    model: body.model,
    messages,
    stream: isStream,
    max_tokens: maxTokens,
  };

  if (isStream) {
    // Anthropic 流式响应格式
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let streamEnded = false;
    const chunks: string[] = [];

    // 发送消息开始事件
    res.write(`event: message_start\ndata: ${JSON.stringify({
      type: 'message_start',
      message: {
        id: `msg_${requestId}`,
        type: 'message',
        role: 'assistant',
        content: [],
        model: body.model,
        stop_reason: null,
        usage: { input_tokens: 0, output_tokens: 0 }
      }
    })}\n\n`);

    res.write(`event: content_block_start\ndata: ${JSON.stringify({
      type: 'content_block_start',
      index: 0,
      content_block: { type: 'text', text: '' }
    })}\n\n`);

    const pending: PendingRequest = {
      requestId,
      request: chatRequest,
      isStream: true,
      createdAt: Date.now(),
      resolve: () => {},
      streamController: {
        enqueue: (content: string) => {
          if (!streamEnded) {
            chunks.push(content);
            res.write(`event: content_block_delta\ndata: ${JSON.stringify({
              type: 'content_block_delta',
              index: 0,
              delta: { type: 'text_delta', text: content }
            })}\n\n`);
          }
        },
        close: () => {
          if (!streamEnded) {
            streamEnded = true;
            res.write(`event: content_block_stop\ndata: ${JSON.stringify({
              type: 'content_block_stop',
              index: 0
            })}\n\n`);

            res.write(`event: message_delta\ndata: ${JSON.stringify({
              type: 'message_delta',
              delta: { stop_reason: 'end_turn' },
              usage: { output_tokens: chunks.join('').length }
            })}\n\n`);

            res.write(`event: message_stop\ndata: ${JSON.stringify({
              type: 'message_stop'
            })}\n\n`);
            res.end();
          }
        }
      }
    };

    addPendingRequest(pending);
    broadcastRequest(pending);

    const timeout = setTimeout(() => {
      if (!streamEnded) {
        streamEnded = true;
        removePendingRequest(requestId);
        res.write(`event: message_stop\ndata: {"type":"message_stop"}\n\n`);
        res.end();
      }
    }, 10 * 60 * 1000);

    req.on('close', () => {
      clearTimeout(timeout);
      removePendingRequest(requestId);
    });
  } else {
    // 非流式响应
    const pending: PendingRequest = {
      requestId,
      request: chatRequest,
      isStream: false,
      createdAt: Date.now(),
      resolve: () => {},
    };

    const responsePromise = new Promise<string>((resolve) => {
      pending.resolve = resolve;
    });

    addPendingRequest(pending);
    broadcastRequest(pending);

    const timeout = setTimeout(() => {
      removePendingRequest(requestId);
      res.json(buildAnthropicResponse('请求超时，请重试', body.model, requestId, maxTokens));
    }, 10 * 60 * 1000);

    try {
      const content = await responsePromise;
      clearTimeout(timeout);
      res.json(buildAnthropicResponse(content, body.model, requestId, maxTokens));
    } catch (e) {
      clearTimeout(timeout);
      res.status(500).json({
        type: 'error',
        error: { type: 'server_error', message: 'Internal server error' }
      });
    }
  }
});

// ==================== Google Gemini API 路由 ====================

// POST /v1beta/models/:modelId:generateContent - Gemini generateContent
app.post('/v1beta/models/:modelId:generateContent', async (req: Request, res: Response) => {
  const modelId = (req.params.modelId as string).replace(':', '');
  return handleGeminiRequest(req, res, modelId, false);
});

// POST /v1beta/models/:modelId:streamGenerateContent - Gemini streamGenerateContent
app.post('/v1beta/models/:modelId:streamGenerateContent', async (req: Request, res: Response) => {
  const modelId = (req.params.modelId as string).replace(':', '');
  return handleGeminiRequest(req, res, modelId, true);
});

// GET /v1beta/models - Gemini models list
app.get('/v1beta/models', (req: Request, res: Response) => {
  const models = getAllModels().map(m => ({
    name: `models/${m.id}`,
    displayName: m.id,
    description: m.description || `${m.id} model`,
    inputTokenLimit: m.context_length || 1048576,
    outputTokenLimit: 8192,
    supportedGenerationMethods: ['generateContent'],
  }));

  res.json({ models });
});

// GET /v1beta/models/:modelId - Gemini model info
app.get('/v1beta/models/:modelId', (req: Request, res: Response) => {
  const modelId = req.params.modelId as string;
  const model = getModel(modelId);

  if (!model) {
    return res.status(404).json({
      error: { code: 404, message: `Model ${modelId} not found`, status: 'NOT_FOUND' }
    });
  }

  res.json({
    name: `models/${model.id}`,
    displayName: model.id,
    description: model.description || `${model.id} model`,
    inputTokenLimit: model.context_length || 1048576,
    outputTokenLimit: 8192,
    supportedGenerationMethods: ['generateContent'],
  });
});

// ==================== 辅助函数 ====================

async function handleChatRequest(
  body: ChatCompletionRequest,
  requestId: string,
  isStream: boolean,
  res: Response
) {
  if (isStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let streamEnded = false;

    const pending: PendingRequest = {
      requestId,
      request: body,
      isStream: true,
      createdAt: Date.now(),
      resolve: () => {},
      streamController: {
        enqueue: (content: string) => {
          if (!streamEnded) {
            res.write(buildStreamChunk(requestId, body.model, content, false));
          }
        },
        close: () => {
          if (!streamEnded) {
            streamEnded = true;
            res.write(buildStreamChunk(requestId, body.model, '', false, true));
            res.write(buildStreamDone());
            res.end();
          }
        }
      }
    };

    addPendingRequest(pending);
    broadcastRequest(pending);

    const timeout = setTimeout(() => {
      if (!streamEnded) {
        streamEnded = true;
        removePendingRequest(requestId);
        res.write(buildStreamDone());
        res.end();
      }
    }, 10 * 60 * 1000);

    res.on('close', () => {
      clearTimeout(timeout);
      removePendingRequest(requestId);
    });
  } else {
    const pending: PendingRequest = {
      requestId,
      request: body,
      isStream: false,
      createdAt: Date.now(),
      resolve: () => {},
    };

    const responsePromise = new Promise<string>((resolve) => {
      pending.resolve = resolve;
    });

    addPendingRequest(pending);
    broadcastRequest(pending);

    const timeout = setTimeout(() => {
      removePendingRequest(requestId);
      res.json(buildResponse('请求超时，请重试', body.model, requestId));
    }, 10 * 60 * 1000);

    try {
      const content = await responsePromise;
      clearTimeout(timeout);
      res.json(buildResponse(content, body.model, requestId));
    } catch {
      clearTimeout(timeout);
      res.status(500).json({
        error: { message: 'Internal server error', type: 'server_error' }
      });
    }
  }
}

async function handleGeminiRequest(
  req: Request,
  res: Response,
  modelId: string,
  isStream: boolean
) {
  const body = req.body;

  // 验证模型是否存在
  const modelExists = getModel(modelId);
  if (!modelExists) {
    return res.status(404).json({
      error: { code: 404, message: `Model ${modelId} not found`, status: 'NOT_FOUND' }
    });
  }

  const requestId = generateRequestId();

  // 转换 Gemini 格式到 OpenAI 格式
  const messages: ChatCompletionRequest['messages'] = [];

  if (body.systemInstruction?.parts) {
    const systemContent = body.systemInstruction.parts
      .map((p: { text?: string }) => p.text || '')
      .join('\n');
    if (systemContent) {
      messages.push({ role: 'system', content: systemContent });
    }
  }

  if (body.contents) {
    body.contents.forEach((item: { role: string; parts: { text?: string }[] }) => {
      const content = item.parts
        .map((p: { text?: string }) => p.text || '')
        .join('\n');
      const role: 'system' | 'user' | 'assistant' | 'tool' = item.role === 'model' ? 'assistant' : item.role as 'system' | 'user' | 'assistant' | 'tool';
      messages.push({ role, content });
    });
  }

  console.log('\n========================================');
  console.log('收到新的 generateContent 请求 [Google Gemini]');
  console.log('请求ID:', requestId);
  console.log('模型:', modelId);
  console.log('流式:', isStream);
  console.log('消息数:', messages.length);
  console.log('当前前端连接数:', getConnectedClientsCount());
  console.log('----------------------------------------');

  messages.forEach((msg, i) => {
    console.log(`  [${i + 1}] ${msg.role}: ${msg.content?.substring(0, 100)}${(msg.content?.length || 0) > 100 ? '...' : ''}`);
  });
  console.log('========================================\n');

  const chatRequest: ChatCompletionRequest = {
    model: modelId,
    messages,
    stream: isStream,
  };

  if (isStream) {
    // Gemini 流式响应格式
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let streamEnded = false;
    const chunks: string[] = [];

    const pending: PendingRequest = {
      requestId,
      request: chatRequest,
      isStream: true,
      createdAt: Date.now(),
      resolve: () => {},
      streamController: {
        enqueue: (content: string) => {
          if (!streamEnded) {
            chunks.push(content);
            const chunk = {
              candidates: [{
                content: { parts: [{ text: content }], role: 'model' },
                finishReason: 'STOP'
              }]
            };
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
        },
        close: () => {
          if (!streamEnded) {
            streamEnded = true;
            res.write('data: [DONE]\n\n');
            res.end();
          }
        }
      }
    };

    addPendingRequest(pending);
    broadcastRequest(pending);

    const timeout = setTimeout(() => {
      if (!streamEnded) {
        streamEnded = true;
        removePendingRequest(requestId);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }, 10 * 60 * 1000);

    req.on('close', () => {
      clearTimeout(timeout);
      removePendingRequest(requestId);
    });
  } else {
    // 非流式响应
    const pending: PendingRequest = {
      requestId,
      request: chatRequest,
      isStream: false,
      createdAt: Date.now(),
      resolve: () => {},
    };

    const responsePromise = new Promise<string>((resolve) => {
      pending.resolve = resolve;
    });

    addPendingRequest(pending);
    broadcastRequest(pending);

    const timeout = setTimeout(() => {
      removePendingRequest(requestId);
      res.json(buildGeminiResponse('请求超时，请重试', modelId));
    }, 10 * 60 * 1000);

    try {
      const content = await responsePromise;
      clearTimeout(timeout);
      res.json(buildGeminiResponse(content, modelId));
    } catch {
      clearTimeout(timeout);
      res.status(500).json({
        error: { code: 500, message: 'Internal server error', status: 'INTERNAL' }
      });
    }
  }
}

function buildAnthropicResponse(content: string, model: string, requestId: string, maxTokens: number) {
  return {
    id: `msg_${requestId}`,
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: content }],
    model,
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 0,
      output_tokens: content.length,
    }
  };
}

function buildResponsesApiResponse(content: string, model: string, requestId: string) {
  return {
    id: `resp_${requestId}`,
    object: 'response',
    created_at: Math.floor(Date.now() / 1000),
    model,
    output: [{
      id: `msg_${requestId}`,
      type: 'message',
      status: 'completed',
      role: 'assistant',
      content: [{
        type: 'output_text',
        text: content,
        annotations: []
      }]
    }],
    usage: {
      input_tokens: 0,
      output_tokens: content.length,
      total_tokens: content.length
    }
  };
}

function buildGeminiResponse(content: string, model: string) {
  return {
    candidates: [{
      content: {
        parts: [{ text: content }],
        role: 'model'
      },
      finishReason: 'STOP',
      safetyRatings: []
    }],
    modelVersion: model,
    usageMetadata: {
      promptTokenCount: 0,
      candidatesTokenCount: content.length,
      totalTokenCount: content.length
    }
  };
}

// 静态文件服务（前端构建产物）
app.use(express.static('frontend/dist'));

// SPA fallback - 使用中间件处理所有未匹配的路由
app.use((req: Request, res: Response) => {
  // 如果是 API 请求但未匹配到路由，返回 404
  if (req.path.startsWith('/api/') || req.path.startsWith('/v1/') || req.path.startsWith('/v1beta/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  // 否则返回前端页面
  res.sendFile('frontend/dist/index.html', { root: '.' });
});

// 启动服务
async function start() {
  // 加载配置和模型
  await loadModels();
  const serverConfig = await getServerConfig();
  const PORT = process.env.PORT || serverConfig.port;

  server.listen(PORT, () => {
    initWebSocket(server);
    console.log('========================================');
    console.log('Fake OpenAI Server 已启动');
    console.log('端口:', PORT);
    console.log('前端地址:', `http://localhost:${PORT}`);
    console.log('========================================');
    console.log('支持的 API 端点:');
    console.log('  OpenAI:');
    console.log('    POST /v1/chat/completions');
    console.log('    POST /v1/responses');
    console.log('    GET  /v1/models');
    console.log('  Anthropic:');
    console.log('    POST /v1/messages');
    console.log('  Google Gemini:');
    console.log('    POST /v1beta/models/{model}:generateContent');
    console.log('    POST /v1beta/models/{model}:streamGenerateContent');
    console.log('    GET  /v1beta/models');
    console.log('========================================');
    console.log('模型数量:', getAllModels().length);
  });
}

start().catch(console.error);

export { app, server };