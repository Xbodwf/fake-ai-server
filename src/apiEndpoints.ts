/**
 * API 端点统一配置
 * 用于启动时展示和文档生成
 */

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  category: string;
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  // OpenAI 兼容 API
  { method: 'POST', path: '/v1/chat/completions', description: '聊天补全', category: 'OpenAI' },
  { method: 'POST', path: '/v1/completions', description: '文本补全（已废弃）', category: 'OpenAI' },
  { method: 'GET', path: '/v1/models', description: '获取模型列表', category: 'OpenAI' },
  { method: 'GET', path: '/v1/models/:id', description: '获取单个模型', category: 'OpenAI' },
  { method: 'POST', path: '/v1/embeddings', description: '向量嵌入', category: 'OpenAI' },
  { method: 'POST', path: '/v1/moderations', description: '内容审核', category: 'OpenAI' },
  { method: 'POST', path: '/v1/images/generations', description: '图像生成', category: 'OpenAI' },
  { method: 'POST', path: '/v1/images/edits', description: '图像编辑', category: 'OpenAI' },
  { method: 'POST', path: '/v1/responses', description: 'Responses API', category: 'OpenAI' },
  
  // Rerank API
  { method: 'POST', path: '/v1/rerank', description: '文档重排序', category: 'Rerank' },
  
  // Anthropic 兼容 API
  { method: 'POST', path: '/v1/messages', description: 'Anthropic Messages API', category: 'Anthropic' },
  
  // Google Gemini 兼容 API
  { method: 'POST', path: '/v1beta/models/:model:generateContent', description: 'Gemini 生成内容', category: 'Google' },
  { method: 'POST', path: '/v1beta/models/:model:streamGenerateContent', description: 'Gemini 流式生成', category: 'Google' },
  { method: 'GET', path: '/v1beta/models', description: 'Gemini 模型列表', category: 'Google' },
  
  // 视频生成 API
  { method: 'POST', path: '/v1/videos/generations', description: '视频生成', category: 'Video' },
  
  // Actions API
  { method: 'GET', path: '/v1/actions/models', description: '获取可访问的 Actions', category: 'Actions' },
  { method: 'POST', path: '/v1/actions/completions', description: '调用 Action', category: 'Actions' },
  
  // 认证 API
  { method: 'POST', path: '/api/auth/register', description: '用户注册', category: 'Auth' },
  { method: 'POST', path: '/api/auth/login', description: '用户登录', category: 'Auth' },
  { method: 'POST', path: '/api/auth/refresh', description: '刷新 Token', category: 'Auth' },
  { method: 'GET', path: '/api/auth/me', description: '获取当前用户', category: 'Auth' },
  
  // 用户 API
  { method: 'GET', path: '/api/user/profile', description: '获取用户资料', category: 'User' },
  { method: 'PUT', path: '/api/user/profile', description: '更新用户资料', category: 'User' },
  { method: 'PUT', path: '/api/user/password', description: '修改密码', category: 'User' },
  { method: 'GET', path: '/api/user/api-keys', description: '获取用户 API Keys', category: 'User' },
  { method: 'POST', path: '/api/user/api-keys', description: '创建 API Key', category: 'User' },
  { method: 'GET', path: '/api/user/usage', description: '获取使用记录', category: 'User' },
  { method: 'GET', path: '/api/user/invoices', description: '获取发票列表', category: 'User' },
  
  // 管理员 API
  { method: 'GET', path: '/api/admin/users', description: '获取用户列表', category: 'Admin' },
  { method: 'PUT', path: '/api/admin/users/:id', description: '更新用户', category: 'Admin' },
  { method: 'GET', path: '/api/admin/models', description: '获取模型列表', category: 'Admin' },
  { method: 'POST', path: '/api/admin/models', description: '创建模型', category: 'Admin' },
  { method: 'PUT', path: '/api/admin/models/:id', description: '更新模型', category: 'Admin' },
  { method: 'DELETE', path: '/api/admin/models/:id', description: '删除模型', category: 'Admin' },
  { method: 'GET', path: '/api/admin/api-keys', description: '获取所有 API Keys', category: 'Admin' },
  { method: 'GET', path: '/api/admin/usage-records', description: '获取使用记录', category: 'Admin' },
  { method: 'GET', path: '/api/admin/settings', description: '获取系统设置', category: 'Admin' },
  { method: 'PUT', path: '/api/admin/settings', description: '更新系统设置', category: 'Admin' },
];

/**
 * 格式化端点列表用于控制台输出
 */
export function formatEndpointsForConsole(): string {
  const categories = [...new Set(API_ENDPOINTS.map(e => e.category))];
  const lines: string[] = [];
  
  for (const category of categories) {
    lines.push(`  ${category}:`);
    const endpoints = API_ENDPOINTS.filter(e => e.category === category);
    for (const endpoint of endpoints) {
      const method = endpoint.method.padEnd(6);
      lines.push(`    ${method} ${endpoint.path} - ${endpoint.description}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * 获取按类别分组的端点
 */
export function getEndpointsByCategory(): Record<string, ApiEndpoint[]> {
  const result: Record<string, ApiEndpoint[]> = {};
  for (const endpoint of API_ENDPOINTS) {
    if (!result[endpoint.category]) {
      result[endpoint.category] = [];
    }
    result[endpoint.category].push(endpoint);
  }
  return result;
}
