import * as ts from 'typescript';

/**
 * 编译 TypeScript 代码为 JavaScript
 * @param code TypeScript 代码
 * @returns 编译后的 JavaScript 代码
 */
export function compileTypeScript(code: string): string {
  try {
    const result = ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        lib: ['ES2020'],
      },
    });

    return result.outputText;
  } catch (error) {
    throw new Error(`TypeScript compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 预处理 Action 代码，添加必要的包装
 * @param code Action 代码
 * @returns 处理后的代码
 */
export function preprocessActionCode(code: string): string {
  // 确保代码导出 execute 函数
  if (!code.includes('export') || !code.includes('execute')) {
    throw new Error('Action code must export an "execute" function');
  }

  return code;
}

/**
 * 从编译后的代码中提取 execute 函数
 * @param compiledCode 编译后的 JavaScript 代码
 * @returns execute 函数
 */
export function extractExecuteFunction(compiledCode: string): Function {
  // 创建一个模块对象来捕获导出
  const module: { exports: any } = { exports: {} };

  // 在沙箱中执行代码
  const func = new Function('module', 'exports', compiledCode);
  func(module, module.exports);

  if (typeof module.exports.execute !== 'function') {
    throw new Error('Action code must export an "execute" function');
  }

  return module.exports.execute;
}

/**
 * 从编译后的代码中提取元数据
 * @param compiledCode 编译后的 JavaScript 代码
 * @returns 元数据对象
 */
export function extractMetadata(compiledCode: string): any {
  const module: { exports: any } = { exports: {} };

  const func = new Function('module', 'exports', compiledCode);
  func(module, module.exports);

  return module.exports.metadata || null;
}
