import type { Model, ChatCompletionRequest } from '../types.js';
import { getModel, getAllModels } from '../storage.js';
import { executeActionChain } from '../actions/executor.js';

/**
 * 组合模型执行上下文
 */
export interface CompositeModelContext {
  userId: string;
  apiKeyId: string;
  originalRequest: ChatCompletionRequest;
}

/**
 * 检查模型是否为组合模型
 */
export function isCompositeModel(model: Model): boolean {
  return model.isComposite === true && (model.actions?.length ?? 0) > 0;
}

/**
 * 获取组合模型的所有依赖模型
 */
export function getCompositeModelDependencies(model: Model): Model[] {
  if (!isCompositeModel(model)) return [];

  const dependencies: Model[] = [];
  const visited = new Set<string>();

  function traverse(modelId: string) {
    if (visited.has(modelId)) return;
    visited.add(modelId);

    const m = getModel(modelId);
    if (!m) return;

    dependencies.push(m);

    if (isCompositeModel(m)) {
      // 递归获取依赖的模型
      const allModels = getAllModels();
      for (const action of m.actions || []) {
        // 这里可以进一步解析 action 中引用的模型
      }
    }
  }

  traverse(model.id);
  return dependencies;
}

/**
 * 执行组合模型
 */
export async function executeCompositeModel(
  model: Model,
  request: ChatCompletionRequest,
  context: CompositeModelContext
): Promise<any> {
  if (!isCompositeModel(model)) {
    throw new Error(`Model ${model.id} is not a composite model`);
  }

  // 准备 Action 执行上下文
  const actionContext = {
    userId: context.userId,
    apiKeyId: context.apiKeyId,
    variables: {
      request,
      model,
    },
  };

  // 执行 Action 链
  const result = await executeActionChain(
    model.actions || [],
    actionContext,
    {
      messages: request.messages,
      model: model.id,
    }
  );

  if (!result.success) {
    throw new Error(`Composite model execution failed: ${result.error}`);
  }

  return result.output;
}

/**
 * 验证组合模型配置
 */
export function validateCompositeModel(model: Model): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!model.isComposite) {
    errors.push('Model is not marked as composite');
  }

  if (!model.actions || model.actions.length === 0) {
    errors.push('Composite model must have at least one action');
  }

  if (model.actionChain && model.actionChain.length > 0) {
    for (let i = 0; i < model.actionChain.length; i++) {
      const chain = model.actionChain[i];
      if (!chain.actionId) {
        errors.push(`Action chain item ${i} is missing actionId`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 创建组合模型示例
 */
export function createCompositeModelExample(): Model {
  return {
    id: 'gemini-3-mix',
    object: 'model',
    created: Math.floor(Date.now() / 1000),
    owned_by: 'system',
    description: 'Multi-model collaboration: outline → detailed → polish',
    isComposite: true,
    actions: ['action_outline', 'action_detailed', 'action_polish'],
    actionChain: [
      {
        actionId: 'action_outline',
        paramMapping: { input: 'request.messages[0].content' },
      },
      {
        actionId: 'action_detailed',
        paramMapping: { input: 'previousOutput' },
      },
      {
        actionId: 'action_polish',
        paramMapping: { input: 'previousOutput' },
      },
    ],
    pricing: {
      input: 0.075,
      output: 0.3,
      unit: 'K',
    },
    supported_features: ['chat', 'vision'],
    type: 'text',
  };
}
