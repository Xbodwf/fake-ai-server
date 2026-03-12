import { ExecutionContext } from '../context.js';

/**
 * 内置 Actions 实现
 */

/**
 * 调用模型 Action
 */
export async function callModelAction(
  inputs: Record<string, any>,
  context: ExecutionContext
): Promise<Record<string, any>> {
  const { model, messages, temperature = 0.7, max_tokens = 2000, top_p = 1 } = inputs;

  if (!model || !messages) {
    throw new Error('model and messages are required');
  }

  context.addLog(`Calling model: ${model}`, 'info');

  // 这里应该调用实际的模型 API
  // 目前返回模拟响应
  return {
    content: 'Mock response from model',
    tokens_used: 100,
    cost: 0.001,
    model: model,
  };
}

/**
 * 文本转换 Action
 */
export async function transformTextAction(
  inputs: Record<string, any>,
  context: ExecutionContext
): Promise<Record<string, any>> {
  const { input, operation, params = {} } = inputs;

  if (!input || !operation) {
    throw new Error('input and operation are required');
  }

  context.addLog(`Transforming text with operation: ${operation}`, 'info');

  let result: string;

  switch (operation) {
    case 'uppercase':
      result = String(input).toUpperCase();
      break;
    case 'lowercase':
      result = String(input).toLowerCase();
      break;
    case 'trim':
      result = String(input).trim();
      break;
    case 'reverse':
      result = String(input).split('').reverse().join('');
      break;
    case 'replace':
      if (!params.find || !params.replace) {
        throw new Error('replace operation requires find and replace parameters');
      }
      result = String(input).replace(new RegExp(params.find, 'g'), params.replace);
      break;
    case 'length':
      return {
        result: String(input).length,
        length: String(input).length,
      };
    case 'split':
      if (!params.separator) {
        throw new Error('split operation requires separator parameter');
      }
      return {
        result: String(input).split(params.separator),
        parts: String(input).split(params.separator),
      };
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return {
    result,
    length: result.length,
  };
}

/**
 * HTTP 请求 Action
 */
export async function httpRequestAction(
  inputs: Record<string, any>,
  context: ExecutionContext
): Promise<Record<string, any>> {
  const { url, method = 'GET', headers = {}, body, timeout = 30000 } = inputs;

  if (!url) {
    throw new Error('url is required');
  }

  context.addLog(`Making HTTP ${method} request to ${url}`, 'info');

  try {
    const options: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(timeout),
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const text = await response.text();

    let responseBody: any;
    try {
      responseBody = JSON.parse(text);
    } catch {
      responseBody = text;
    }

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: responseBody,
      text: text,
    };
  } catch (error) {
    throw new Error(`HTTP request failed: ${error}`);
  }
}

/**
 * 延迟 Action
 */
export async function delayAction(
  inputs: Record<string, any>,
  context: ExecutionContext
): Promise<Record<string, any>> {
  const { duration } = inputs;

  if (!duration || typeof duration !== 'number') {
    throw new Error('duration is required and must be a number');
  }

  context.addLog(`Delaying for ${duration}ms`, 'info');

  await new Promise(resolve => setTimeout(resolve, duration));

  return {
    delayed: true,
  };
}

/**
 * 日志 Action
 */
export async function logAction(
  inputs: Record<string, any>,
  context: ExecutionContext
): Promise<Record<string, any>> {
  const { message, level = 'info', data } = inputs;

  if (!message) {
    throw new Error('message is required');
  }

  const logMessage = data ? `${message} ${JSON.stringify(data)}` : message;
  context.addLog(logMessage, level);

  return {
    logged: true,
  };
}

/**
 * 保存结果 Action
 */
export async function saveResultAction(
  inputs: Record<string, any>,
  context: ExecutionContext
): Promise<Record<string, any>> {
  const { key, value, ttl = 86400 } = inputs;

  if (!key || !value) {
    throw new Error('key and value are required');
  }

  context.addLog(`Saving result with key: ${key}`, 'info');

  // 这里应该保存到实际的存储系统
  // 目前只返回成功响应
  return {
    success: true,
    key: key,
  };
}

/**
 * 条件判断 Action
 */
export async function conditionalAction(
  inputs: Record<string, any>,
  context: ExecutionContext
): Promise<Record<string, any>> {
  const { condition, then_steps, else_steps } = inputs;

  if (condition === undefined) {
    throw new Error('condition is required');
  }

  context.addLog(`Evaluating condition: ${condition}`, 'info');

  const result = Boolean(condition);

  return {
    result,
    executed_branch: result ? 'then' : 'else',
  };
}

/**
 * 并行执行 Action
 */
export async function parallelAction(
  inputs: Record<string, any>,
  context: ExecutionContext
): Promise<Record<string, any>> {
  const { steps, timeout = 300 } = inputs;

  if (!Array.isArray(steps)) {
    throw new Error('steps must be an array');
  }

  context.addLog(`Executing ${steps.length} steps in parallel`, 'info');

  // 这里应该并行执行多个 steps
  // 目前只返回模拟响应
  return {
    results: {},
    failed_steps: [],
  };
}
