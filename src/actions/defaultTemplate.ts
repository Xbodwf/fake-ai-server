/**
 * 默认 Action 模板
 * 这是一个可运行的多模型协作示例
 */

export const DEFAULT_ACTION_TEMPLATE = `// 多模型协作 Action
// 使用 gpt-5-nano 生成提纲，gemini-3-flash-preview 回答，gemini-2-flash 综合

interface ActionInput {
  prompt: string;
  context?: string;
}

interface ActionOutput {
  outline: string;
  answer: string;
  synthesis: string;
}

/**
 * 生命周期：初始化
 */
export async function onInit(config: any): Promise<void> {
  console.log('Action initialized with config:', config);
}

/**
 * 生命周期：配置变更
 */
export async function onConfigChange(config: any): Promise<void> {
  console.log('Config changed:', config);
}

/**
 * 执行多模型协作
 */
export async function execute(input: ActionInput): Promise<ActionOutput> {
  const { prompt, context = '' } = input;

  // 验证输入
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be a string');
  }

  try {
    // 从 metadata 中获取模型配置
    const outlineModel = metadata.config.models.outline;
    const answerModel = metadata.config.models.answer;
    const synthesisModel = metadata.config.models.synthesis;

    // 第一步：使用配置的模型生成提纲
    const outline = await callChatCompletion({
      model: outlineModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert outline generator. Create a clear, structured outline for the given topic.',
        },
        {
          role: 'user',
          content: context ? \`Context: \${context}\\n\\nTopic: \${prompt}\` : prompt,
        },
      ],
      temperature: metadata.config.temperature || 0.7,
    });

    // 第二步：使用配置的模型详细回答
    const answer = await callChatCompletion({
      model: answerModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert analyst. Provide detailed, comprehensive answers based on the outline.',
        },
        {
          role: 'user',
          content: \`Outline:\\n\${outline}\\n\\nPlease provide a detailed answer based on this outline.\`,
        },
      ],
      temperature: metadata.config.temperature || 0.7,
    });

    // 第三步：使用配置的模型综合结果
    const synthesis = await callChatCompletion({
      model: synthesisModel,
      messages: [
        {
          role: 'system',
          content: 'You are a synthesis expert. Combine the outline and answer into a comprehensive, well-structured response.',
        },
        {
          role: 'user',
          content: \`Original Question: \${prompt}\\n\\nOutline:\\n\${outline}\\n\\nDetailed Answer:\\n\${answer}\\n\\nPlease synthesize these into a final, comprehensive response.\`,
        },
      ],
      temperature: metadata.config.synthesisTemp || 0.6,
    });

    return {
      outline,
      answer,
      synthesis,
    };
  } catch (error) {
    throw new Error(\`Action execution failed: \${error instanceof Error ? error.message : 'Unknown error'}\`);
  }
}

/**
 * Action 元数据 - 定义配置 schema 和默认值
 */
export const metadata = {
  name: 'Multi-Model Collaboration',
  description: 'Use multiple models to generate outline, answer, and synthesis',
  version: '1.0.0',
  author: 'Phantom Mock',
  category: 'ai-collaboration',
  tags: ['multi-model', 'collaboration', 'analysis'],

  // 配置 schema - 在 Inspector 中展示和编辑
  schema: {
    models: {
      type: 'object',
      label: 'Models',
      description: 'Configure which models to use',
      properties: {
        outline: {
          type: 'string',
          label: 'Outline Model',
          description: 'Model for generating outline',
          default: 'gpt-5-nano',
        },
        answer: {
          type: 'string',
          label: 'Answer Model',
          description: 'Model for detailed answer',
          default: 'gemini-3-flash-preview',
        },
        synthesis: {
          type: 'string',
          label: 'Synthesis Model',
          description: 'Model for synthesis',
          default: 'gemini-2-flash',
        },
      },
    },
    temperature: {
      type: 'number',
      label: 'Temperature',
      description: 'Temperature for outline and answer generation',
      default: 0.7,
      min: 0,
      max: 2,
      step: 0.1,
    },
    synthesisTemp: {
      type: 'number',
      label: 'Synthesis Temperature',
      description: 'Temperature for synthesis generation',
      default: 0.6,
      min: 0,
      max: 2,
      step: 0.1,
    },
    maxRetries: {
      type: 'number',
      label: 'Max Retries',
      description: 'Maximum number of retries on failure',
      default: 3,
      min: 1,
      max: 10,
    },
  },

  // 当前配置值
  config: {
    models: {
      outline: 'gpt-5-nano',
      answer: 'gemini-3-flash-preview',
      synthesis: 'gemini-2-flash',
    },
    temperature: 0.7,
    synthesisTemp: 0.6,
    maxRetries: 3,
  },

  // 输入输出定义
  inputs: {
    prompt: {
      type: 'string',
      description: 'The question or topic to analyze',
      required: true,
    },
    context: {
      type: 'string',
      description: 'Additional context for the analysis',
      required: false,
    },
  },
  outputs: {
    outline: {
      type: 'string',
      description: 'Structured outline generated by the outline model',
    },
    answer: {
      type: 'string',
      description: 'Detailed answer from the answer model',
    },
    synthesis: {
      type: 'string',
      description: 'Synthesized response from the synthesis model',
    },
  },
};\n`;
