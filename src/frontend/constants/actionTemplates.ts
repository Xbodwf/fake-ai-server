// 多模型协作示例代码
export const DEFAULT_ACTION_CODE = `// 多模型协作示例：使用多个模型进行协作
// 这个示例展示了如何在 Action 中调用多个模型并组合它们的结果

interface ModelResponse {
  model: string;
  content: string;
  tokens: number;
}

interface ActionInput {
  prompt: string;
  context?: string;
  models?: string[];
}

interface ActionOutput {
  summary: string;
  responses: ModelResponse[];
  combinedAnalysis: string;
}

/**
 * 多模型协作 Action
 * 使用多个不同的模型来处理同一个问题，然后综合它们的结果
 *
 * 在工作流中使用示例：
 * steps:
 *   - id: multi_model_analysis
 *     uses: multi-model-collaboration@1.0.0
 *     with:
 *       prompt: \${{ inputs.userQuestion }}
 *       context: \${{ inputs.context }}
 *       models: ["gpt-4", "claude-3-opus"]
 */
export async function execute(input: ActionInput): Promise<ActionOutput> {
  const { prompt, context = '', models = ['gpt-4', 'claude-3-opus'] } = input;

  // 验证输入
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be a string');
  }

  // 并行调用多个模型
  const responses: ModelResponse[] = [];

  for (const model of models) {
    try {
      const response = await callModel({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert analyst. Provide detailed analysis and insights.',
          },
          {
            role: 'user',
            content: context ? \`Context: \${context}\\n\\nQuestion: \${prompt}\` : prompt,
          },
        ],
        temperature: 0.7,
      });

      responses.push({
        model,
        content: response.content,
        tokens: response.tokens_used || 0,
      });
    } catch (error) {
      console.error(\`Failed to call model \${model}:\`, error);
      responses.push({
        model,
        content: \`Error: Failed to get response from \${model}\`,
        tokens: 0,
      });
    }
  }

  // 综合多个模型的结果
  const combinedAnalysis = await synthesizeResponses(prompt, responses);

  return {
    summary: \`Multi-model collaboration completed. Analyzed with \${models.length} models.\`,
    responses,
    combinedAnalysis,
  };
}

/**
 * 调用模型的辅助函数
 * 这个函数会调用系统提供的模型 API
 */
async function callModel(params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
}): Promise<{ content: string; tokens_used: number }> {
  // 调用系统提供的模型 API
  // 实际的 API 调用会由系统处理
  const response = await fetch('/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(\`API request failed: \${response.statusText}\`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    tokens_used: data.usage.total_tokens,
  };
}

/**
 * 综合多个模型响应的辅助函数
 */
async function synthesizeResponses(
  prompt: string,
  responses: ModelResponse[]
): Promise<string> {
  const responseSummary = responses
    .map((r) => \`From \${r.model}:\\n\${r.content}\`)
    .join('\\n\\n---\\n\\n');

  // 调用模型来综合结果
  try {
    const synthesis = await callModel({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a synthesis expert. Combine and reconcile different perspectives into a comprehensive answer.',
        },
        {
          role: 'user',
          content: \`Original Question: \${prompt}\\n\\nResponses from different models:\\n\${responseSummary}\\n\\nPlease synthesize these perspectives.\`,
        },
      ],
      temperature: 0.6,
    });
    return synthesis.content;
  } catch (error) {
    // 如果综合失败，返回原始响应的摘要
    return responseSummary;
  }
}

/**
 * 可选：定义 Action 的元数据
 */
export const metadata = {
  name: 'Multi-Model Collaboration',
  description: 'Use multiple models to analyze the same problem and combine results',
  version: '1.0.0',
  author: 'Phantom Mock',
  category: 'ai-collaboration',
  tags: ['multi-model', 'collaboration', 'analysis'],
  inputs: {
    prompt: {
      type: 'string',
      description: 'The question or prompt to analyze',
      required: true,
    },
    context: {
      type: 'string',
      description: 'Additional context for the analysis',
      required: false,
    },
    models: {
      type: 'array',
      description: 'List of models to use for analysis',
      required: false,
      default: ['gpt-4', 'claude-3-opus'],
    },
  },
  outputs: {
    summary: { type: 'string', description: 'Summary of the analysis' },
    responses: { type: 'array', description: 'Responses from each model' },
    combinedAnalysis: { type: 'string', description: 'Synthesized analysis from all models' },
  },
}`;

export const ACTION_TEMPLATES = [
  {
    name: 'Multi-Model Collaboration',
    description: 'Use multiple models to analyze the same problem and combine results',
    code: DEFAULT_ACTION_CODE,
  },
  {
    name: 'Sequential Processing',
    description: 'Process data through multiple models in sequence',
    code: `// 顺序处理示例：数据通过多个模型依次处理

interface SequentialInput {
  data: string;
  models: string[];
  instructions?: string;
}

interface SequentialOutput {
  originalData: string;
  intermediateResults: any[];
  finalResult: string;
}

export async function execute(input: SequentialInput): Promise<SequentialOutput> {
  const { data, models, instructions = '' } = input;

  const intermediateResults: any[] = [];
  let currentData = data;

  // 依次通过每个模型处理
  for (const model of models) {
    try {
      const result = await callModel(model, currentData, instructions);
      intermediateResults.push({
        model,
        result,
      });
      currentData = result;
    } catch (error) {
      console.error(\`Error processing with \${model}:\`, error);
      throw error;
    }
  }

  return {
    originalData: data,
    intermediateResults,
    finalResult: currentData,
  };
}

async function callModel(model: string, data: string, instructions: string): Promise<string> {
  const response = await fetch('/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: instructions || 'Process the following data.' },
        { role: 'user', content: data },
      ],
    }),
  });

  const result = await response.json();
  return result.choices[0].message.content;
}`,
  },
  {
    name: 'Parallel Processing',
    description: 'Process data with multiple models in parallel',
    code: `// 并行处理示例：多个模型并行处理数据

interface ParallelInput {
  data: string;
  models: string[];
}

interface ParallelOutput {
  originalData: string;
  results: Record<string, string>;
  consensus: string;
}

export async function execute(input: ParallelInput): Promise<ParallelOutput> {
  const { data, models } = input;

  // 并行调用多个模型
  const promises = models.map((model) =>
    callModel(model, data).catch((error) => ({
      error: \`Failed to call \${model}: \${error.message}\`,
    }))
  );

  const results = await Promise.all(promises);

  // 构建结果对象
  const resultMap: Record<string, string> = {};
  results.forEach((result, index) => {
    resultMap[models[index]] = typeof result === 'string' ? result : (result.error || 'Unknown error');
  });

  // 生成共识
  const consensus = generateConsensus(resultMap);

  return {
    originalData: data,
    results: resultMap,
    consensus,
  };
}

async function callModel(model: string, data: string): Promise<string> {
  const response = await fetch('/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: data }],
    }),
  });

  const result = await response.json();
  return result.choices[0].message.content;
}

function generateConsensus(results: Record<string, string>): string {
  return \`Consensus based on \${Object.keys(results).length} models\`;
}`,
  },
];
