import { ExecutionContext } from '../context.js';
import {
  callModelAction,
  transformTextAction,
  httpRequestAction,
  delayAction,
  logAction,
  saveResultAction,
  conditionalAction,
  parallelAction,
} from './actions.js';

/**
 * 内置 Actions 映射
 */
const BUILTIN_ACTIONS_MAP: Record<string, (inputs: Record<string, any>, context: ExecutionContext) => Promise<Record<string, any>>> = {
  'phantom/call-model': callModelAction,
  'phantom/transform-text': transformTextAction,
  'phantom/http-request': httpRequestAction,
  'phantom/delay': delayAction,
  'phantom/log': logAction,
  'phantom/save-result': saveResultAction,
  'phantom/conditional': conditionalAction,
  'phantom/parallel': parallelAction,
};

/**
 * 执行内置 Action
 */
export async function executeBuiltinAction(
  actionId: string,
  inputs: Record<string, any>,
  context: ExecutionContext
): Promise<Record<string, any>> {
  const action = BUILTIN_ACTIONS_MAP[actionId];

  if (!action) {
    throw new Error(`Unknown builtin action: ${actionId}`);
  }

  return action(inputs, context);
}

/**
 * 获取所有内置 Actions ID
 */
export function getBuiltinActionIds(): string[] {
  return Object.keys(BUILTIN_ACTIONS_MAP);
}
