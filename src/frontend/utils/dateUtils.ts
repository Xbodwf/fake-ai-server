/**
 * 时间戳转换工具
 * 处理秒级和毫秒级时间戳的统一转换
 */

/**
 * 将时间戳转换为毫秒级
 * @param timestamp 时间戳（可能是秒级或毫秒级）
 * @returns 毫秒级时间戳
 */
export function toMilliseconds(timestamp: number): number {
  // 如果时间戳大于 10000000000，认为是毫秒级
  // 10000000000 毫秒 ≈ 115 天，10000000000 秒 ≈ 317 年
  return timestamp > 10000000000 ? timestamp : timestamp * 1000;
}

/**
 * 格式化时间戳为本地化字符串
 * @param timestamp 时间戳（可能是秒级或毫秒级）
 * @param locale 语言环境，默认为 undefined（使用浏览器默认）
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(timestamp: number, locale?: string): string {
  const ms = toMilliseconds(timestamp);
  return new Date(ms).toLocaleString(locale);
}

/**
 * 格式化时间戳为日期字符串
 * @param timestamp 时间戳（可能是秒级或毫秒级）
 * @param options 日期格式选项
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  timestamp: number,
  options?: Intl.DateTimeFormatOptions
): string {
  const ms = toMilliseconds(timestamp);
  const defaultOptions = options || { month: 'short', day: 'numeric' };
  return new Date(ms).toLocaleDateString(undefined, defaultOptions);
}

/**
 * 格式化时间戳为 ISO 字符串
 * @param timestamp 时间戳（可能是秒级或毫秒级）
 * @returns ISO 格式的日期字符串
 */
export function formatISO(timestamp: number): string {
  const ms = toMilliseconds(timestamp);
  return new Date(ms).toISOString();
}

/**
 * 获取日期部分（YYYY-MM-DD）
 * @param timestamp 时间戳（可能是秒级或毫秒级）
 * @returns 日期字符串（YYYY-MM-DD）
 */
export function getDatePart(timestamp: number): string {
  const ms = toMilliseconds(timestamp);
  return new Date(ms).toISOString().split('T')[0];
}
