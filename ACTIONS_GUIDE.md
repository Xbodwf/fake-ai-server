# 自定义 Action 创建指南

## 概述

在 Phantom Mock 中，**Action** 是可重用的代码单元，可以在工作流中被调用。自定义 Action 允许你扩展系统功能，实现特定的业务逻辑。

## 基础概念

### Action 的结构

每个 Action 必须导出一个 `execute` 函数，该函数接收输入参数并返回处理结果：

```typescript
export async function execute(input: any): Promise<any> {
  // 处理逻辑
  return result;
}
```

### 完整示例

```typescript
interface ActionInput {
  text: string;
  model?: string;
  temperature?: number;
}

interface ActionOutput {
  original: string;
  processed: string;
  wordCount: number;
  characterCount: number;
}

export async function execute(input: ActionInput): Promise<ActionOutput> {
  const { text, model = 'gpt-4', temperature = 0.7 } = input;

  if (!text || typeof text !== 'string') {
    throw new Error('Input text is required and must be a string');
  }

  const processed = text.toUpperCase();
  const wordCount = text.trim().split(/\s+/).length;
  const characterCount = text.length;

  return {
    original: text,
    processed,
    wordCount,
    characterCount,
  };
}

// 可选：定义元数据
export const metadata = {
  name: 'Text Processor',
  description: 'Process and analyze text content',
  version: '1.0.0',
  inputs: {
    text: {
      type: 'string',
      description: 'The text to process',
      required: true,
    },
  },
  outputs: {
    processed: { type: 'string', description: 'Processed text' },
    wordCount: { type: 'number', description: 'Number of words' },
  },
};
```

## 在工作流中使用 Action

### 创建 Action

1. 进入 **Actions** 页面
2. 点击 **Create Action** 按钮
3. 填写 Action 名称和描述
4. 在代码编辑器中编写 Action 代码
5. 点击 **Create** 保存

### 在工作流中调用 Action

在工作流 YAML 中，使用 `uses` 字段指定 Action：

```yaml
steps:
  - id: process_text
    name: Process Text
    uses: text-processor@1.0.0
    with:
      text: ${{ inputs.userInput }}
      model: gpt-4
      temperature: 0.7
```

### 访问 Action 输出

后续步骤可以通过 `${{ steps.<step-id>.outputs.<field> }}` 访问前一步的输出：

```yaml
steps:
  - id: step1
    uses: text-processor@1.0.0
    with:
      text: "Hello World"

  - id: step2
    uses: log-action@1.0.0
    with:
      message: ${{ steps.step1.outputs.processed }}
```

## 常见 Action 模式

### 1. 数据处理 Action

处理和转换数据：

```typescript
export async function execute(input: {
  data: any[];
  operation: 'filter' | 'map' | 'sort';
  config: any;
}): Promise<any> {
  const { data, operation, config } = input;

  switch (operation) {
    case 'filter':
      return data.filter(item =>
        Object.entries(config).every(([key, value]) => item[key] === value)
      );
    case 'map':
      return data.map(item => {
        const result: any = {};
        Object.entries(config).forEach(([newKey, oldKey]) => {
          result[newKey] = item[oldKey as string];
        });
        return result;
      });
    case 'sort':
      return [...data].sort((a, b) => {
        const key = config.key || 'id';
        const order = config.order || 'asc';
        if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
        return 0;
      });
  }
}
```

### 2. API 请求 Action

调用外部 API：

```typescript
export async function execute(input: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}): Promise<any> {
  const { url, method = 'GET', headers = {}, body } = input;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return {
    status: response.status,
    data: await response.json(),
    headers: Object.fromEntries(response.headers.entries()),
  };
}
```

### 3. 条件判断 Action

实现条件逻辑：

```typescript
export async function execute(input: {
  value: any;
  condition: 'equals' | 'greater' | 'less' | 'contains' | 'matches';
  compareWith: any;
}): Promise<{ result: boolean; message: string }> {
  const { value, condition, compareWith } = input;

  let result = false;

  switch (condition) {
    case 'equals':
      result = value === compareWith;
      break;
    case 'greater':
      result = value > compareWith;
      break;
    case 'less':
      result = value < compareWith;
      break;
    case 'contains':
      result = String(value).includes(String(compareWith));
      break;
    case 'matches':
      result = new RegExp(compareWith).test(String(value));
      break;
  }

  return {
    result,
    message: `Condition check: ${result}`,
  };
}
```

### 4. 模型调用 Action

调用 AI 模型：

```typescript
export async function execute(input: {
  prompt: string;
  model?: string;
  temperature?: number;
}): Promise<{ response: string; tokens: number }> {
  const { prompt, model = 'gpt-4', temperature = 0.7 } = input;

  // 调用模型 API
  const response = await fetch('/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
    }),
  });

  const data = await response.json();

  return {
    response: data.choices[0].message.content,
    tokens: data.usage.total_tokens,
  };
}
```

## 最佳实践

### 1. 输入验证

始终验证输入参数：

```typescript
export async function execute(input: any): Promise<any> {
  if (!input.text || typeof input.text !== 'string') {
    throw new Error('Input text is required and must be a string');
  }

  if (input.maxLength && input.maxLength < 0) {
    throw new Error('maxLength must be a positive number');
  }

  // 处理逻辑...
}
```

### 2. 错误处理

提供清晰的错误信息：

```typescript
export async function execute(input: any): Promise<any> {
  try {
    // 处理逻辑
  } catch (error) {
    throw new Error(
      `Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
```

### 3. 类型定义

使用 TypeScript 接口定义输入和输出：

```typescript
interface MyActionInput {
  param1: string;
  param2?: number;
  param3: boolean;
}

interface MyActionOutput {
  result: string;
  metadata: {
    processedAt: number;
    duration: number;
  };
}

export async function execute(input: MyActionInput): Promise<MyActionOutput> {
  // 实现...
}
```

### 4. 元数据定义

为 Action 提供元数据，帮助用户理解其功能：

```typescript
export const metadata = {
  name: 'My Action',
  description: 'A brief description of what this action does',
  version: '1.0.0',
  author: 'Your Name',
  category: 'data-processing',
  tags: ['text', 'processing', 'utility'],
  inputs: {
    text: {
      type: 'string',
      description: 'The input text',
      required: true,
      example: 'Hello World',
    },
    options: {
      type: 'object',
      description: 'Processing options',
      required: false,
      default: {},
    },
  },
  outputs: {
    result: {
      type: 'string',
      description: 'The processed result',
    },
    metadata: {
      type: 'object',
      description: 'Processing metadata',
    },
  },
};
```

### 5. 异步操作

正确处理异步操作：

```typescript
export async function execute(input: any): Promise<any> {
  // 等待异步操作完成
  const result1 = await fetchData(input.url1);
  const result2 = await fetchData(input.url2);

  // 或并行执行
  const [data1, data2] = await Promise.all([
    fetchData(input.url1),
    fetchData(input.url2),
  ]);

  return { result1, result2 };
}
```

## 表达式系统

在工作流中，可以使用表达式访问上下文数据：

```yaml
steps:
  - id: step1
    uses: my-action@1.0.0
    with:
      # 访问工作流输入
      input1: ${{ inputs.userInput }}

      # 访问环境变量
      apiKey: ${{ env.API_KEY }}

      # 访问前一步的输出
      previousResult: ${{ steps.step1.outputs.result }}

      # 访问密钥
      secret: ${{ secrets.MY_SECRET }}
```

## 调试 Action

### 1. 使用日志

在 Action 中添加日志帮助调试：

```typescript
export async function execute(input: any): Promise<any> {
  console.log('Input:', input);

  const result = processData(input);
  console.log('Result:', result);

  return result;
}
```

### 2. 测试 Action

在创建 Action 后，可以通过工作流运行来测试：

```yaml
name: Test Action
on: manual

inputs:
  testInput:
    description: Test input
    default: "test value"

steps:
  - id: test
    uses: my-action@1.0.0
    with:
      text: ${{ inputs.testInput }}

  - id: log
    uses: phantom/log@1.0.0
    with:
      message: ${{ steps.test.outputs.result }}
```

## 常见问题

### Q: 如何在 Action 中调用其他 Action？

A: 目前不支持在 Action 中直接调用其他 Action。建议使用工作流来组合多个 Action。

### Q: Action 有超时限制吗？

A: 是的，默认超时为 30 秒。可以在工作流中通过 `timeout` 字段设置：

```yaml
steps:
  - id: long_running
    uses: my-action@1.0.0
    timeout: 300  # 5 分钟
    with:
      data: ${{ inputs.data }}
```

### Q: 如何处理 Action 中的错误？

A: 使用 `continueOnError` 字段让工作流在 Action 失败时继续执行：

```yaml
steps:
  - id: risky_step
    uses: my-action@1.0.0
    continueOnError: true
    with:
      data: ${{ inputs.data }}
```

### Q: 如何共享 Action？

A: 将 Action 标记为 `isPublic: true`，其他用户就可以在他们的工作流中使用。

## 更多资源

- [工作流文档](./WORKFLOWS.md)
- [表达式语法](./WORKFLOWS.md#表达式系统)
- [内置 Action 参考](./WORKFLOWS.md#内置-action)
