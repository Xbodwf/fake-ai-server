/**
 * Action 代码处理工具
 * 用于在代码中注入或替换 metadata
 */

/**
 * 在代码中注入 metadata
 * 将用户配置的 metadata 作为默认值注入到代码中
 *
 * @param code - 原始 Action 代码
 * @param metadata - 用户配置的 metadata
 * @returns 注入 metadata 后的代码
 */
export function injectMetadata(code: string, metadata: any): string {
  const metadataStr = JSON.stringify(metadata, null, 2);

  // 如果代码中已经有 metadata，替换它
  if (code.includes('export const metadata')) {
    // 使用更安全的方式：找到 export const metadata 的开始，然后找到对应的 };
    const exportMatch = code.match(/export\s+const\s+metadata\s*=/);
    if (exportMatch) {
      const startIndex = exportMatch.index!;

      // 从 = 之后开始查找，找到匹配的 };
      let braceCount = 0;
      let inString = false;
      let stringChar = '';
      let foundEnd = false;
      let endIndex = startIndex + exportMatch[0].length;

      for (let i = startIndex + exportMatch[0].length; i < code.length; i++) {
        const char = code[i];

        // 处理字符串
        if ((char === '"' || char === "'" || char === '`') && code[i - 1] !== '\\') {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
          }
          continue;
        }

        if (inString) continue;

        // 计算大括号
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0 && code[i + 1] === ';') {
            endIndex = i + 2;
            foundEnd = true;
            break;
          }
        }
      }

      if (foundEnd) {
        const before = code.substring(0, startIndex);
        const after = code.substring(endIndex);
        return `${before}export const metadata = ${metadataStr};${after}`;
      }
    }
  }

  // 如果代码中没有 metadata，在末尾添加
  return `${code}\n\nexport const metadata = ${metadataStr};`;
}

/**
 * 从代码中提取 metadata
 *
 * @param code - Action 代码
 * @returns 提取的 metadata 对象，如果提取失败返回 null
 */
export function extractMetadataFromCode(code: string): any {
  try {
    const metadataMatch = code.match(/export\s+const\s+metadata\s*=\s*({[\s\S]*?});/);
    if (metadataMatch) {
      const metadataStr = metadataMatch[1];
      // 使用 Function 构造器安全地解析对象
      const metadataObj = new Function(`return ${metadataStr}`)();
      return metadataObj;
    }
    return null;
  } catch (error) {
    console.error('Failed to extract metadata:', error);
    return null;
  }
}

/**
 * 合并两个 metadata 对象
 * 用户配置的 metadata 会覆盖代码中的 metadata
 *
 * @param codeMetadata - 从代码中提取的 metadata
 * @param userMetadata - 用户在 Inspector 中配置的 metadata
 * @returns 合并后的 metadata
 */
export function mergeMetadata(codeMetadata: any, userMetadata: any): any {
  // 深度合并，用户配置优先
  return {
    ...codeMetadata,
    ...userMetadata,
    // 对于嵌套对象，也需要合并
    config: {
      ...codeMetadata?.config,
      ...userMetadata?.config,
    },
    schema: {
      ...codeMetadata?.schema,
      ...userMetadata?.schema,
    },
  };
}
