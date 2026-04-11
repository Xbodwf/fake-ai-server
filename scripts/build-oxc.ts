#!/usr/bin/env node

/**
 * 使用oxc快速编译TypeScript后端代码
 * oxc可以同时生成JavaScript和类型声明文件(.d.ts)
 */

import { promises as fs } from 'fs';
import path from 'path';
// @ts-ignore - oxc-transform类型定义可能不完整
import { transformSync } from 'oxc-transform';

const SRC_DIR = './src';
const DIST_DIR = './dist';

interface TransformResult {
  code: string;
  declaration?: string;
  map?: string;
  errors: any[];
}

async function compileFile(filePath: string, outPath: string): Promise<void> {
  const code = await fs.readFile(filePath, 'utf-8');
  
  console.log(`[oxc] Processing: ${filePath}`);
  
  // 使用oxc转换TypeScript，同时生成声明文件
  const result: TransformResult = transformSync(filePath, code, {
    typescript: {
      declaration: true, // 生成.d.ts声明文件
    },
    sourcemap: true,
  });
  
  console.log(`[oxc] Result keys:`, Object.keys(result));
  console.log(`[oxc] Code type:`, typeof result.code);
  console.log(`[oxc] Declaration type:`, typeof result.declaration);
  
  // 检查错误
  if (result.errors && result.errors.length > 0) {
    console.error(`[ERROR] ${filePath}:`, result.errors);
    throw new Error(`Compilation failed: ${filePath}`);
  }
  
  // 确保输出目录存在
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  
  // 写入编译后的JavaScript代码
  const jsPath = outPath.replace('.ts', '.js');
  const jsCode = typeof result.code === 'string' ? result.code : String(result.code);
  await fs.writeFile(jsPath, jsCode);
  
  // 写入类型声明文件
  if (result.declaration) {
    const dtsPath = outPath.replace('.ts', '.d.ts');
    const dtsCode = typeof result.declaration === 'string' ? result.declaration : String(result.declaration);
    await fs.writeFile(dtsPath, dtsCode);
    console.log(`[oxc] Generated .d.ts: ${dtsPath}`);
  }
  
  // 写入sourcemap
  if (result.map) {
    const mapPath = jsPath + '.map';
    const mapCode = typeof result.map === 'string' ? result.map : JSON.stringify(result.map);
    await fs.writeFile(mapPath, mapCode);
  }
  
  console.log(`[OK] ${filePath}`);
}

async function walkDir(dir: string, outDir: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const outPath = path.join(outDir, entry.name);
    
    if (entry.isDirectory()) {
      // 跳过frontend目录（由vite处理）
      if (entry.name === 'frontend') continue;
      await walkDir(fullPath, outPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      await compileFile(fullPath, outPath);
    }
  }
}

async function main(): Promise<void> {
  console.log('[oxc] 开始编译后端代码...');
  const start = Date.now();
  
  try {
    // 清理dist目录
    await fs.rm(DIST_DIR, { recursive: true, force: true });
    
    // 编译src目录
    await walkDir(SRC_DIR, DIST_DIR);
    
    const elapsed = Date.now() - start;
    console.log(`[oxc] 编译完成！耗时 ${elapsed}ms`);
  } catch (error) {
    console.error('[oxc] 编译失败:', error);
    process.exit(1);
  }
}

main();
