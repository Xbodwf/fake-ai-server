/**
 * Action 沙箱全局接口定义
 * 这个文件定义了在 Action 代码中可用的所有内置函数和对象
 */

/**
 * Chat Completion 请求参数
 */
interface ChatCompletionParams {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

/**
 * 调用 Chat Completion API
 * @param params - Chat completion 参数
 * @returns 返回模型的响应文本
 */
declare function callChatCompletion(params: ChatCompletionParams): Promise<string>;

/**
 * 获取当前 Action 的元数据和配置
 * 包含 schema、config、inputs、outputs 等信息
 */
declare const metadata: {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  category?: string;
  tags?: string[];
  schema?: Record<string, any>;
  config?: Record<string, any>;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
};

/**
 * 标准的全局对象和函数
 */
declare const console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
};

declare const JSON: {
  parse(text: string): any;
  stringify(value: any, replacer?: any, space?: any): string;
};

declare const Math: {
  abs(x: number): number;
  ceil(x: number): number;
  floor(x: number): number;
  round(x: number): number;
  max(...values: number[]): number;
  min(...values: number[]): number;
  pow(x: number, y: number): number;
  sqrt(x: number): number;
  random(): number;
  PI: number;
  E: number;
};

declare const Date: {
  new(): Date;
  now(): number;
  parse(dateString: string): number;
};

declare const Array: {
  isArray(arg: any): arg is any[];
  from(arrayLike: any): any[];
  of(...items: any[]): any[];
};

declare const Object: {
  keys(obj: any): string[];
  values(obj: any): any[];
  entries(obj: any): [string, any][];
  assign(target: any, ...sources: any[]): any;
  create(proto: any): any;
};

declare const String: {
  fromCharCode(...codes: number[]): string;
};

declare const Number: {
  isNaN(value: any): boolean;
  isFinite(value: any): boolean;
  parseInt(string: string, radix?: number): number;
  parseFloat(string: string): number;
};

declare const Boolean: {
  (value?: any): boolean;
};

declare const Promise: {
  new<T>(executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void): Promise<T>;
  resolve<T>(value: T): Promise<T>;
  reject(reason?: any): Promise<never>;
  all<T>(promises: Promise<T>[]): Promise<T[]>;
  race<T>(promises: Promise<T>[]): Promise<T>;
};

declare function setTimeout(callback: () => void, ms?: number): number;
declare function setInterval(callback: () => void, ms?: number): number;

/**
 * 导出的 Action 生命周期函数
 */

/**
 * Action 初始化函数
 * 在 Action 首次加载时调用
 */
declare function onInit(config: any): Promise<void>;

/**
 * Action 配置变更函数
 * 当 Action 的配置在 Inspector 中被修改时调用
 */
declare function onConfigChange(config: any): Promise<void>;

/**
 * Action 执行函数
 * 这是 Action 的主要入口点
 */
declare function execute(input: any): Promise<any>;
