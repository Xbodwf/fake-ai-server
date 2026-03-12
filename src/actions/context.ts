import type { WorkflowRun, StepRun } from '../types.js';

/**
 * 工作流执行上下文
 * 管理工作流执行期间的所有状态和数据
 */
export class ExecutionContext {
  workflowId: string;
  runId: string;
  userId: string;

  // 全局环境变量
  env: Record<string, any>;

  // 步骤输出缓存
  steps: Record<string, StepOutput> = {};

  // 工作流输入
  inputs: Record<string, any>;

  // 秘密变量
  secrets: Record<string, string>;

  // 执行日志
  logs: string[] = [];

  constructor(
    workflowId: string,
    runId: string,
    userId: string,
    inputs: Record<string, any> = {},
    env: Record<string, any> = {},
    secrets: Record<string, string> = {}
  ) {
    this.workflowId = workflowId;
    this.runId = runId;
    this.userId = userId;
    this.inputs = inputs;
    this.env = env;
    this.secrets = secrets;
  }

  /**
   * 记录步骤输出
   */
  setStepOutput(stepId: string, outputs: Record<string, any>) {
    this.steps[stepId] = {
      outputs,
      timestamp: Date.now(),
    };
  }

  /**
   * 获取步骤输出
   */
  getStepOutput(stepId: string): Record<string, any> | undefined {
    return this.steps[stepId]?.outputs;
  }

  /**
   * 添加日志
   */
  addLog(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    this.logs.push(logEntry);
  }

  /**
   * 获取所有日志
   */
  getLogs(): string {
    return this.logs.join('\n');
  }

  /**
   * 解析表达式
   * 支持 ${{ steps.stepId.outputs.key }} 和 ${{ inputs.key }} 等语法
   */
  evaluateExpression(expression: string): any {
    if (typeof expression !== 'string') {
      return expression;
    }

    // 移除 ${{ }} 包装
    let expr = expression.trim();
    if (expr.startsWith('${{') && expr.endsWith('}}')) {
      expr = expr.slice(3, -2).trim();
    }

    // 处理不同的表达式类型
    if (expr.startsWith('steps.')) {
      return this.evaluateStepsExpression(expr);
    } else if (expr.startsWith('inputs.')) {
      return this.evaluateInputsExpression(expr);
    } else if (expr.startsWith('env.')) {
      return this.evaluateEnvExpression(expr);
    } else if (expr.startsWith('secrets.')) {
      return this.evaluateSecretsExpression(expr);
    } else {
      // 尝试作为 JavaScript 表达式求值
      return this.evaluateJavaScript(expr);
    }
  }

  /**
   * 解析 steps 表达式
   * 例如: steps.step1.outputs.content
   */
  private evaluateStepsExpression(expr: string): any {
    const parts = expr.split('.');
    if (parts.length < 4 || parts[1] !== 'outputs') {
      return undefined;
    }

    const stepId = parts[0].replace('steps.', '');
    const key = parts.slice(2).join('.');

    const stepOutput = this.getStepOutput(stepId);
    if (!stepOutput) {
      return undefined;
    }

    return this.getNestedValue(stepOutput, key);
  }

  /**
   * 解析 inputs 表达式
   * 例如: inputs.question
   */
  private evaluateInputsExpression(expr: string): any {
    const key = expr.replace('inputs.', '');
    return this.getNestedValue(this.inputs, key);
  }

  /**
   * 解析 env 表达式
   * 例如: env.API_KEY
   */
  private evaluateEnvExpression(expr: string): any {
    const key = expr.replace('env.', '');
    return this.getNestedValue(this.env, key);
  }

  /**
   * 解析 secrets 表达式
   * 例如: secrets.API_KEY
   */
  private evaluateSecretsExpression(expr: string): any {
    const key = expr.replace('secrets.', '');
    return this.getNestedValue(this.secrets, key);
  }

  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * 求值 JavaScript 表达式
   * 注意：这是一个简化的实现，生产环境应该使用更安全的方式
   */
  private evaluateJavaScript(expr: string): any {
    try {
      // 创建一个安全的上下文
      const context = {
        steps: this.steps,
        inputs: this.inputs,
        env: this.env,
      };

      // 使用 Function 构造函数而不是 eval
      const func = new Function(...Object.keys(context), `return ${expr}`);
      return func(...Object.values(context));
    } catch (error) {
      this.addLog(`Failed to evaluate expression: ${expr}`, 'error');
      return undefined;
    }
  }

  /**
   * 替换字符串中的所有表达式
   */
  replaceExpressions(value: any): any {
    if (typeof value === 'string') {
      // 查找所有 ${{ }} 表达式
      const regex = /\$\{\{[^}]+\}\}/g;
      return value.replace(regex, (match) => {
        const result = this.evaluateExpression(match);
        return result !== undefined ? String(result) : match;
      });
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map((item) => this.replaceExpressions(item));
      } else {
        const result: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
          result[key] = this.replaceExpressions(val);
        }
        return result;
      }
    }
    return value;
  }
}

/**
 * 步骤输出
 */
interface StepOutput {
  outputs: Record<string, any>;
  timestamp: number;
}

/**
 * 创建执行上下文
 */
export function createExecutionContext(
  workflowId: string,
  runId: string,
  userId: string,
  inputs: Record<string, any> = {},
  env: Record<string, any> = {},
  secrets: Record<string, string> = {}
): ExecutionContext {
  return new ExecutionContext(workflowId, runId, userId, inputs, env, secrets);
}
