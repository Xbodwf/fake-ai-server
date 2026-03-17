/**
 * 格式化虚拟货币显示
 * @param amount 金额
 * @param decimals 小数位数
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(amount: number, decimals: number = 4): string {
  return `🔮${amount.toFixed(decimals)}`;
}

/**
 * 格式化虚拟货币显示（简化版，用于显示）
 * @param amount 金额
 * @returns 格式化后的货币字符串
 */
export function formatCurrencyShort(amount: number): string {
  return `🔮${amount.toFixed(2)}`;
}
