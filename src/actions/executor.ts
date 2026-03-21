import { VM } from 'vm2';
import { compileTypeScript, preprocessActionCode, extractMetadata } from './compiler.js';
import type { Action, Workflow, WorkflowRun, StepRun } from '../types.js';
import { ExecutionContext } from './context.js';
import { internalChatCompletion } from './chatCompletion.js';
import { createSandboxInterfaces } from './sandboxInterfaces.js';

/**
 * 验证输入参数是否符合 Action 定义
 */
function validateInputs(input: Record<string, any>, parameters?: any[]): void {
  if (!parameters) return;

  for (const param of parameters) {
    if (param.required && !(param.name in input)) {
      throw new Error(`Missing required parameter: ${param.name}`);
    }

    if (param.name in input) {
      const value = input[param.name];
      const expectedType = param.type;

      // 简单的类型检查
      if (expectedType && typeof value !== expectedType) {
        throw new Error(
          `Parameter '${param.name}' must be ${expectedType}, got ${typeof value}`
        );
      }
    }
  }
}

/**
 * 验证输出是否符合 Action 定义
 */
function validateOutputs(output: any, returnType?: string): void {
  if (!returnType) return;

  if (returnType === 'string' && typeof output !== 'string') {
    throw new Error(`Output must be string, got ${typeof output}`);
  } else if (returnType === 'object' && typeof output !== 'object') {
    throw new Error(`Output must be object, got ${typeof output}`);
  }
}

/**
 * 执行 Action 代码
 * @param action Action 定义
 * @param input 输入参数
 * @param timeout 超时时间（毫秒）
 * @param userId 用户 ID（用于计费）
 * @returns 执行结果和使用统计
 */
export async function executeAction(
  action: Action,
  input: Record<string, any>,
  timeout: number = 30000,
  userId?: string,
  apiKeyId?: string
): Promise<{ result: Record<string, any>; usage?: { promptTokens: number; completionTokens: number } }> {
  try {
    // 1. 预处理代码
    const processedCode = preprocessActionCode(action.code);

    // 2. 编译 TypeScript 为 JavaScript
    const compiledCode = compileTypeScript(processedCode);

    // 3. 验证输入参数
    validateInputs(input, action.parameters);

    // 4. 在 vm2 中执行代码
    // 创建沙箱接口
    // 创建使用统计跟踪器
    const usageTracker = {
      promptTokens: 0,
      completionTokens: 0,
      userId,
      apiKeyId,
    };

    console.log('[executeAction] Creating usageTracker:', { userId, apiKeyId });

    const sandboxInterfaces = createSandboxInterfaces(usageTracker);

    const vm = new VM({
      timeout,
      sandbox: sandboxInterfaces,
    });

    // 5. 在 VM 中执行代码并获取 execute 函数
    const module: { exports: any } = { exports: {} };

    // 获取服务器基础URL
    const port = process.env.PORT || 7143;
    const serverHost = process.env.SERVER_HOST || 'localhost';
    const baseUrl = `http://${serverHost}:${port}`;

    // 在VM代码中注入callChatCompletion函数和usageTracker
    const vmCode = `
      (function(module, exports) {
        const __usageTracker = ${JSON.stringify(usageTracker)};
        const __baseUrl = ${JSON.stringify(baseUrl)};

        // 在沙箱内部定义callChatCompletion，这样它可以访问__usageTracker
        async function callChatCompletion(params) {
          const url = __baseUrl + '/v1/chat/completions';

          const headers = {
            'Content-Type': 'application/json',
          };

          if (__usageTracker?.userId) {
            headers['x-internal-user-id'] = __usageTracker.userId;
          }
          if (__usageTracker?.apiKeyId) {
            headers['x-internal-api-key-id'] = __usageTracker.apiKeyId;
          }

          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(params),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Chat completion failed');
          }

          const data = await response.json();
          if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
          }
          throw new Error('Invalid response format');
        }

        ${compiledCode}
      })
    `;

    const result = vm.run(vmCode);
    result(module, module.exports);

    if (typeof module.exports.execute !== 'function') {
      throw new Error('Action code must export an "execute" function');
    }

    // 6. 调用 execute 函数，确保 input 是对象
    const normalizedInput = typeof input === 'object' ? input : { text: input };
    const actionResult = await module.exports.execute(normalizedInput);

    // 7. 验证输出
    validateOutputs(actionResult, action.returnType);

    return {
      result: actionResult,
      usage: {
        promptTokens: usageTracker.promptTokens,
        completionTokens: usageTracker.completionTokens,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Action execution failed: ${errorMessage}`);
  }
}

/**
 * 获取 Action 的元数据
 * @param action Action 定义
 * @returns 元数据对象
 */
export function getActionMetadata(action: Action): any {
  try {
    const processedCode = preprocessActionCode(action.code);
    const compiledCode = compileTypeScript(processedCode);
    const metadata = extractMetadata(compiledCode);
    
    if (!metadata) {
      console.log('[getActionMetadata] No metadata found in action code');
    } else {
      console.log('[getActionMetadata] Extracted metadata:', Object.keys(metadata));
    }
    
    return metadata;
  } catch (error) {
    console.error('[getActionMetadata] Error extracting metadata:', error);
    return null;
  }
}

/**
 * 验证 Action 代码是否有效
 * @param code Action 代码
 * @returns 是否有效
 */
export function validateActionCode(code: string): { valid: boolean; error?: string } {
  try {
    preprocessActionCode(code);
    compileTypeScript(code);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 工作流执行引擎
 */
export class WorkflowExecutor {
  private context: ExecutionContext;
  private workflow: Workflow;
  private workflowRun: WorkflowRun;

  constructor(
    workflow: Workflow,
    workflowRun: WorkflowRun,
    context: ExecutionContext
  ) {
    this.workflow = workflow;
    this.workflowRun = workflowRun;
    this.context = context;
  }

  /**
   * 执行工作流
   */
  async execute(): Promise<WorkflowRun> {
    this.workflowRun.status = 'running';
    this.workflowRun.startedAt = Date.now();

    try {
      // 执行所有步骤
      for (const step of this.workflow.steps) {
        // 检查条件
        if (step.if) {
          const condition = this.context.evaluateExpression(step.if);
          if (!condition) {
            this.context.addLog(`Skipping step ${step.id} due to condition`, 'info');
            continue;
          }
        }

        // 执行步骤
        const stepRun = await this.executeStep(step);
        this.workflowRun.stepRuns.push(stepRun);

        // 如果步骤失败且不继续，停止执行
        if (stepRun.status === 'failure' && !step.continueOnError) {
          this.workflowRun.status = 'failure';
          this.workflowRun.error = {
            message: `Step ${step.id} failed`,
            stepId: step.id,
          };
          break;
        }
      }

      // 生成输出
      if (this.workflow.outputs) {
        this.workflowRun.outputs = {};
        for (const [key, output] of Object.entries(this.workflow.outputs)) {
          const value = this.context.evaluateExpression(output.value);
          this.workflowRun.outputs[key] = value;
        }
      }

      // 更新状态
      if (this.workflowRun.status !== 'failure') {
        this.workflowRun.status = 'success';
      }
    } catch (error) {
      this.workflowRun.status = 'failure';
      this.workflowRun.error = {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'EXECUTION_ERROR',
      };
      this.context.addLog(`Workflow execution failed: ${error}`, 'error');
    }

    // 完成执行
    this.workflowRun.completedAt = Date.now();
    this.workflowRun.duration = this.workflowRun.completedAt - this.workflowRun.startedAt;
    this.workflowRun.logs = this.context.getLogs();

    return this.workflowRun;
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(step: any): Promise<StepRun> {
    const stepRun: StepRun = {
      id: `${this.workflowRun.id}-${step.id}`,
      stepId: step.id,
      status: 'pending',
      startedAt: Date.now(),
      inputs: step.with,
    };

    try {
      this.context.addLog(`Starting step: ${step.name}`, 'info');
      stepRun.status = 'running';

      // 解析输入参数
      const inputs = this.context.replaceExpressions(step.with || {});
      stepRun.inputs = inputs;

      // 验证 Action 存在
      const actionId = step.uses.split('@')[0];
      // 这里应该调用实际的 Action 执行逻辑
      // 目前返回占位符
      const outputs = { result: 'placeholder' };

      // 记录输出
      this.context.setStepOutput(step.id, outputs);
      stepRun.outputs = outputs;
      stepRun.status = 'success';

      this.context.addLog(`Step ${step.id} completed successfully`, 'info');
    } catch (error) {
      stepRun.status = 'failure';
      stepRun.error = {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'STEP_EXECUTION_ERROR',
      };
      this.context.addLog(`Step ${step.id} failed: ${error}`, 'error');
    }

    stepRun.completedAt = Date.now();
    stepRun.duration = stepRun.completedAt - stepRun.startedAt;

    return stepRun;
  }
}

/**
 * 创建工作流执行器
 */
export function createWorkflowExecutor(
  workflow: Workflow,
  workflowRun: WorkflowRun,
  context: ExecutionContext
): WorkflowExecutor {
  return new WorkflowExecutor(workflow, workflowRun, context);
}

/**
 * 向后兼容：执行 Action 链
 * 这是旧的 API，用于支持现有的组合模型功能
 */
export async function executeActionChain(
  actionIds: string[],
  context: any,
  initialInput?: any
): Promise<{ success: boolean; output?: any; error?: string; executionTime: number }> {
  const startTime = Date.now();

  // 这是一个占位符实现
  // 实际的 Action 链执行应该通过新的工作流系统实现
  return {
    success: true,
    output: initialInput,
    executionTime: Date.now() - startTime,
  };
}
