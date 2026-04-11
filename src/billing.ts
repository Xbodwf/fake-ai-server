import type { Model, UsageRecord } from './types.js';
import { Tiktoken, encodingForModel } from 'js-tiktoken';

// Token 编码器缓存
const encoderCache = new Map<string, Tiktoken>();

/**
 * 获取模型的 token 编码器
 */
function getEncoder(modelId: string): Tiktoken {
  if (encoderCache.has(modelId)) {
    return encoderCache.get(modelId)!;
  }

  try {
    // 尝试为特定模型获取编码器
    const encoder = encodingForModel(modelId as any);
    encoderCache.set(modelId, encoder);
    return encoder;
  } catch {
    // 如果模型不支持，使用 cl100k_base（GPT-4/GPT-3.5 的编码）
    try {
      const encoder = encodingForModel('gpt-4');
      encoderCache.set(modelId, encoder);
      return encoder;
    } catch {
      // 如果还是失败，返回 null，使用估算方法
      return null as any;
    }
  }
}

/**
 * 精确计算 token 数量
 */
export function calculateTokens(text: string, modelId?: string): number {
  if (!text) return 0;

  // 如果提供了模型 ID，尝试使用精确计数
  if (modelId) {
    try {
      const encoder = getEncoder(modelId);
      if (encoder) {
        const tokens = encoder.encode(text);
        return tokens.length;
      }
    } catch (error) {
      console.warn(`[Billing] 精确计数失败，使用估算: ${error}`);
    }
  }

  // 回退到估算方法
  return estimateTokens(text);
}

/**
 * 估算 token 数量（简单方法）
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  // 改进的估算方法：
  // - 英文：平均 4 个字符 = 1 token
  // - 中文：平均 1.5 个字符 = 1 token
  // - 代码：平均 3 个字符 = 1 token

  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = text.length - chineseChars;

  // 中文字符按 1.5:1 计算，其他字符按 4:1 计算
  const chineseTokens = Math.ceil(chineseChars / 1.5);
  const otherTokens = Math.ceil(otherChars / 4);

  return chineseTokens + otherTokens;
}

/**
 * 计算费用
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: Model
): number {
  if (!model.pricing) {
    return 0;
  }

  const pricingType = model.pricing.type || 'token';

  if (pricingType === 'request') {
    // 按请求计费
    return model.pricing.perRequest || 0;
  }

  if (pricingType === 'tiered' && model.pricing.tieredPricing) {
    // 阶梯计费
    const tieredPricing = model.pricing.tieredPricing;
    let baseTokens: number;

    // 根据配置确定计算基数
    switch (tieredPricing.baseOn) {
      case 'input':
        baseTokens = promptTokens;
        break;
      case 'output':
        baseTokens = completionTokens;
        break;
      case 'total':
      default:
        baseTokens = promptTokens + completionTokens;
        break;
    }

    // 找到对应的阶梯
    const tiers = tieredPricing.tiers.sort((a, b) => a.min - b.min);
    let matchedTier = tiers[0]; // 默认使用第一个阶梯

    for (const tier of tiers) {
      if (baseTokens >= tier.min && (tier.max === null || baseTokens <= tier.max)) {
        matchedTier = tier;
        break;
      }
    }

    // 计算总费用：总token数 * (每K tokens价格 / 1000)
    const totalTokens = promptTokens + completionTokens;
    return (totalTokens * (matchedTier.pricePerToken || 0)) / 1000;
  }

  // 按 token 计费（默认）
  const unit = model.pricing.unit || 'K';
  const divisor = unit === 'M' ? 1000000 : 1000;

  const inputCost = (promptTokens * (model.pricing.input || 0)) / divisor;
  const outputCost = (completionTokens * (model.pricing.output || 0)) / divisor;

  return inputCost + outputCost;
}

/**
 * 创建使用记录
 */
export function createUsageRecord(
  userId: string,
  apiKeyId: string,
  model: string,
  endpoint: string,
  promptTokens: number,
  completionTokens: number,
  cost: number,
  requestId: string
): UsageRecord {
  return {
    id: generateId(),
    userId,
    apiKeyId,
    model,
    endpoint,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    cost,
    timestamp: Date.now(),
    requestId,
  };
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

