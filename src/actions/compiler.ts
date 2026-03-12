import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

/**
 * 编译 TypeScript 代码为 JavaScript
 * @param code TypeScript 代码
 * @returns 编译后的 JavaScript 代码
 */
export function compileTypeScript(code: string): string {
  const tempDir = join(process.cwd(), '.temp');
  const tempFile = join(tempDir, `action_${randomBytes(8).toString('hex')}.ts`);
  const jsFile = tempFile.replace('.ts', '.js');

  try {
    // 写入临时 TypeScript 文件
    writeFileSync(tempFile, code);

    // 使用 tsc 编译
    execSync(`npx tsc ${tempFile} --outDir ${tempDir} --module commonjs --target es2020 --lib es2020`, {
      stdio: 'pipe',
    });

    // 读取编译后的 JavaScript
    const compiledCode = readFileSync(jsFile, 'utf-8');

    return compiledCode;
  } catch (error) {
    throw new Error(`TypeScript compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // 清理临时文件
    try {
      unlinkSync(tempFile);
      unlinkSync(jsFile);
    } catch (e) {
      // 忽略清理错误
    }
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
  const module = { exports: {} };

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
  const module = { exports: {} };

  const func = new Function('module', 'exports', compiledCode);
  func(module, module.exports);

  return module.exports.metadata || null;
}
