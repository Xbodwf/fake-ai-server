import type { ActionDefinition } from '../types.js';

/**
 * 内置 Actions 定义
 * 这些是 Phantom Mock 提供的核心 Actions
 */

export const BUILTIN_ACTIONS: Record<string, ActionDefinition> = {
  // 调用模型 Action
  'phantom/call-model': {
    id: 'phantom/call-model',
    name: 'Call Model',
    description: 'Call an AI model to generate responses',
    version: 'v1',
    author: 'Phantom Mock',
    category: 'model',
    tags: ['model', 'ai', 'chat'],
    inputs: {
      model: {
        description: 'Model name to use',
        required: true,
        type: 'string',
      },
      messages: {
        description: 'Array of messages for the model',
        required: true,
        type: 'array',
      },
      temperature: {
        description: 'Sampling temperature (0-2)',
        required: false,
        type: 'number',
        default: 0.7,
      },
      max_tokens: {
        description: 'Maximum tokens to generate',
        required: false,
        type: 'number',
        default: 2000,
      },
      top_p: {
        description: 'Nucleus sampling parameter',
        required: false,
        type: 'number',
        default: 1,
      },
    },
    outputs: {
      content: {
        description: 'Generated response content',
        type: 'string',
      },
      tokens_used: {
        description: 'Total tokens used',
        type: 'number',
      },
      cost: {
        description: 'Cost in USD',
        type: 'number',
      },
      model: {
        description: 'Model used',
        type: 'string',
      },
    },
  },

  // 文本转换 Action
  'phantom/transform-text': {
    id: 'phantom/transform-text',
    name: 'Transform Text',
    description: 'Transform text with various operations',
    version: 'v1',
    author: 'Phantom Mock',
    category: 'transform',
    tags: ['text', 'transform'],
    inputs: {
      input: {
        description: 'Input text to transform',
        required: true,
        type: 'string',
      },
      operation: {
        description: 'Transformation operation',
        required: true,
        type: 'string',
        enum: ['uppercase', 'lowercase', 'trim', 'replace', 'length', 'reverse', 'split'],
      },
      params: {
        description: 'Operation parameters',
        required: false,
        type: 'object',
      },
    },
    outputs: {
      result: {
        description: 'Transformed result',
        type: 'string',
      },
      length: {
        description: 'Length of result',
        type: 'number',
      },
    },
  },

  // HTTP 请求 Action
  'phantom/http-request': {
    id: 'phantom/http-request',
    name: 'HTTP Request',
    description: 'Make HTTP requests to external APIs',
    version: 'v1',
    author: 'Phantom Mock',
    category: 'custom',
    tags: ['http', 'api', 'request'],
    inputs: {
      url: {
        description: 'Request URL',
        required: true,
        type: 'string',
      },
      method: {
        description: 'HTTP method',
        required: false,
        type: 'string',
        default: 'GET',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      },
      headers: {
        description: 'Request headers',
        required: false,
        type: 'object',
      },
      body: {
        description: 'Request body',
        required: false,
        type: 'object',
      },
      timeout: {
        description: 'Request timeout in milliseconds',
        required: false,
        type: 'number',
        default: 30000,
      },
    },
    outputs: {
      status: {
        description: 'HTTP status code',
        type: 'number',
      },
      headers: {
        description: 'Response headers',
        type: 'object',
      },
      body: {
        description: 'Response body',
        type: 'object',
      },
      text: {
        description: 'Response as text',
        type: 'string',
      },
    },
  },

  // 条件判断 Action
  'phantom/conditional': {
    id: 'phantom/conditional',
    name: 'Conditional',
    description: 'Execute steps conditionally based on expressions',
    version: 'v1',
    author: 'Phantom Mock',
    category: 'custom',
    tags: ['conditional', 'control-flow'],
    inputs: {
      condition: {
        description: 'Condition expression to evaluate',
        required: true,
        type: 'string',
      },
      then_steps: {
        description: 'Steps to execute if condition is true',
        required: false,
        type: 'array',
      },
      else_steps: {
        description: 'Steps to execute if condition is false',
        required: false,
        type: 'array',
      },
    },
    outputs: {
      result: {
        description: 'Condition evaluation result',
        type: 'boolean',
      },
      executed_branch: {
        description: 'Which branch was executed (then/else)',
        type: 'string',
      },
    },
  },

  // 并行执行 Action
  'phantom/parallel': {
    id: 'phantom/parallel',
    name: 'Parallel',
    description: 'Execute multiple steps in parallel',
    version: 'v1',
    author: 'Phantom Mock',
    category: 'custom',
    tags: ['parallel', 'concurrent'],
    inputs: {
      steps: {
        description: 'Array of steps to execute in parallel',
        required: true,
        type: 'array',
      },
      timeout: {
        description: 'Timeout for all parallel steps in seconds',
        required: false,
        type: 'number',
        default: 300,
      },
    },
    outputs: {
      results: {
        description: 'Results from all parallel steps',
        type: 'object',
      },
      failed_steps: {
        description: 'List of failed step IDs',
        type: 'array',
      },
    },
  },

  // 保存结果 Action
  'phantom/save-result': {
    id: 'phantom/save-result',
    name: 'Save Result',
    description: 'Save workflow results to storage',
    version: 'v1',
    author: 'Phantom Mock',
    category: 'storage',
    tags: ['storage', 'save'],
    inputs: {
      key: {
        description: 'Storage key',
        required: true,
        type: 'string',
      },
      value: {
        description: 'Value to save',
        required: true,
        type: 'object',
      },
      ttl: {
        description: 'Time to live in seconds',
        required: false,
        type: 'number',
        default: 86400,
      },
    },
    outputs: {
      success: {
        description: 'Whether save was successful',
        type: 'boolean',
      },
      key: {
        description: 'Saved key',
        type: 'string',
      },
    },
  },

  // 延迟 Action
  'phantom/delay': {
    id: 'phantom/delay',
    name: 'Delay',
    description: 'Delay execution for a specified duration',
    version: 'v1',
    author: 'Phantom Mock',
    category: 'custom',
    tags: ['delay', 'wait'],
    inputs: {
      duration: {
        description: 'Delay duration in milliseconds',
        required: true,
        type: 'number',
      },
    },
    outputs: {
      delayed: {
        description: 'Whether delay completed',
        type: 'boolean',
      },
    },
  },

  // 日志 Action
  'phantom/log': {
    id: 'phantom/log',
    name: 'Log',
    description: 'Log messages for debugging',
    version: 'v1',
    author: 'Phantom Mock',
    category: 'custom',
    tags: ['logging', 'debug'],
    inputs: {
      message: {
        description: 'Message to log',
        required: true,
        type: 'string',
      },
      level: {
        description: 'Log level',
        required: false,
        type: 'string',
        default: 'info',
        enum: ['debug', 'info', 'warn', 'error'],
      },
      data: {
        description: 'Additional data to log',
        required: false,
        type: 'object',
      },
    },
    outputs: {
      logged: {
        description: 'Whether log was successful',
        type: 'boolean',
      },
    },
  },
};

/**
 * 获取所有内置 Actions
 */
export function getBuiltinActions(): ActionDefinition[] {
  return Object.values(BUILTIN_ACTIONS);
}

/**
 * 获取特定 Action 定义
 */
export function getActionDefinition(actionId: string): ActionDefinition | undefined {
  return BUILTIN_ACTIONS[actionId];
}

/**
 * 检查 Action 是否存在
 */
export function actionExists(actionId: string): boolean {
  return actionId in BUILTIN_ACTIONS;
}
