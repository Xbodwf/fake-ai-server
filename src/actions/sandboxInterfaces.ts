/**
 * Action 沙箱接口实现
 * 提供 Action 代码可以使用的所有内置函数
 */

import { internalChatCompletion } from './chatCompletion.js';

/**
 * 沙箱接口集合
 */
export interface SandboxInterfaces {
  callChatCompletion: typeof internalChatCompletion;
  console: typeof console;
  fetch: typeof fetch;
  JSON: typeof JSON;
  Math: typeof Math;
  Date: typeof Date;
  Array: typeof Array;
  Object: typeof Object;
  String: typeof String;
  Number: typeof Number;
  Boolean: typeof Boolean;
  Promise: typeof Promise;
  setTimeout: typeof setTimeout;
  setInterval: typeof setInterval;
  __usageTracker?: { promptTokens: number; completionTokens: number; userId?: string; apiKeyId?: string };
  __getUsageTracker?: () => { promptTokens: number; completionTokens: number; userId?: string; apiKeyId?: string };
}

/**
 * 创建沙箱接口对象
 */
export function createSandboxInterfaces(usageTracker?: { promptTokens: number; completionTokens: number; userId?: string; apiKeyId?: string }): SandboxInterfaces {
  return {
    callChatCompletion: internalChatCompletion,
    console,
    fetch,
    JSON,
    Math,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Promise,
    setTimeout,
    setInterval,
    __usageTracker: usageTracker,
    __getUsageTracker: () => usageTracker || { promptTokens: 0, completionTokens: 0 },
  };
}

/**
 * 获取沙箱接口的文档
 */
export function getSandboxInterfacesDoc(): string {
  return `
# Action 沙箱接口文档

## 内置函数

### callChatCompletion(params)
调用 Chat Completion API

参数:
- model: string - 模型名称
- messages: Array<{role: string, content: string}> - 消息列表
- temperature?: number - 温度参数 (0-2)
- max_tokens?: number - 最大令牌数
- top_p?: number - Top P 采样参数

返回: Promise<string> - 模型的响应文本

示例:
\`\`\`typescript
const response = await callChatCompletion({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  temperature: 0.7
});
\`\`\`

## 全局对象

### console
标准控制台对象，支持 log, error, warn, info

### JSON
JSON 序列化和反序列化

### Math
数学函数和常数

### Date
日期和时间

### Array, Object, String, Number, Boolean
标准 JavaScript 类型

### Promise
异步操作支持

### setTimeout, setInterval
定时器函数

## 元数据对象

### metadata
包含 Action 的配置信息:
- name: string - Action 名称
- description: string - 描述
- version: string - 版本
- author: string - 作者
- category: string - 分类
- tags: string[] - 标签
- schema: object - 配置 schema
- config: object - 当前配置值
- inputs: object - 输入定义
- outputs: object - 输出定义

## 导出函数

### onInit(config)
Action 初始化函数，在首次加载时调用

### onConfigChange(config)
配置变更函数，当配置在 Inspector 中被修改时调用

### execute(input)
Action 主执行函数，处理输入并返回输出
`;
}
