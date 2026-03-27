import { useTranslation } from 'react-i18next';

/**
 * 安全错误处理工具
 * 用于简化前端错误处理，避免信息泄露
 */

// 错误类型定义
export interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

// 安全错误消息映射
const ERROR_MESSAGES = {
  // 认证错误
  'Invalid email or password': 'auth.invalidCredentials',
  'Account is disabled': 'auth.accountDisabled',
  'Invalid refresh token': 'auth.invalidRefreshToken',
  'User not found': 'auth.userNotFound',
  
  // 注册错误
  'Missing required fields': 'auth.missingFields',
  'Password must be at least 6 characters': 'auth.passwordTooShort',
  'Invite code is required': 'auth.inviteCodeRequired',
  'Invalid invite code': 'auth.invalidInviteCode',
  'Invite code has no remaining quota': 'auth.inviteCodeNoQuota',
  'Email already exists': 'auth.emailExists',
  'Verification code is required': 'auth.verificationCodeRequired',
  'Invalid or expired verification code': 'auth.invalidVerificationCode',
  
  // 通用错误
  'Login failed': 'auth.loginFailed',
  'Registration failed': 'auth.registerFailed',
  'Failed to send verification code': 'auth.sendCodeFailed',
  'Token refresh failed': 'auth.tokenRefreshFailed',
  
  // 用户操作错误
  'Failed to update profile': 'user.updateProfileFailed',
  'Failed to set UID': 'user.setUidFailed',
  'Failed to change password': 'user.changePasswordFailed',
  'UID is required': 'user.uidRequired',
  
  // API错误
  'Failed to load data': 'common.loadDataFailed',
  'Network error': 'common.networkError',
  'Server error': 'common.serverError',
  'Unauthorized': 'common.unauthorized',
  'Forbidden': 'common.forbidden',
  'Not found': 'common.notFound',
} as const;

// 错误分类
const ERROR_CATEGORIES = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  SERVER: 'server',
  CLIENT: 'client',
  UNKNOWN: 'unknown',
} as const;

/**
 * 获取安全的错误消息
 * @param error 错误对象
 * @returns 安全的错误消息（翻译键）
 */
export function getSafeErrorMessage(error: ApiError): string {
  if (!error) {
    return 'common.unknownError';
  }

  // 检查网络错误
  if (!error.response) {
    return 'common.networkError';
  }

  const status = error.response.status;
  const errorMessage = error.response.data?.error || error.response.data?.message || error.message || '';

  // 根据状态码分类
  switch (status) {
    case 400:
      return handleBadRequestError(errorMessage);
    case 401:
      return handleUnauthorizedError(errorMessage);
    case 403:
      return handleForbiddenError(errorMessage);
    case 404:
      return handleNotFoundError(errorMessage);
    case 409:
      return handleConflictError(errorMessage);
    case 500:
    case 502:
    case 503:
    case 504:
      return handleServerError(errorMessage);
    default:
      return handleUnknownError(errorMessage);
  }
}

/**
 * 处理400错误
 */
function handleBadRequestError(errorMessage: string): string {
  // 检查是否有已知的错误消息映射
  for (const [key, translationKey] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.includes(key)) {
      return translationKey;
    }
  }
  
  // 默认的验证错误
  return 'common.validationError';
}

/**
 * 处理401错误
 */
function handleUnauthorizedError(errorMessage: string): string {
  for (const [key, translationKey] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.includes(key)) {
      return translationKey;
    }
  }
  return 'common.unauthorized';
}

/**
 * 处理403错误
 */
function handleForbiddenError(errorMessage: string): string {
  for (const [key, translationKey] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.includes(key)) {
      return translationKey;
    }
  }
  return 'common.forbidden';
}

/**
 * 处理404错误
 */
function handleNotFoundError(errorMessage: string): string {
  for (const [key, translationKey] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.includes(key)) {
      return translationKey;
    }
  }
  return 'common.notFound';
}

/**
 * 处理409错误
 */
function handleConflictError(errorMessage: string): string {
  for (const [key, translationKey] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.includes(key)) {
      return translationKey;
    }
  }
  return 'common.conflict';
}

/**
 * 处理服务器错误
 */
function handleServerError(errorMessage: string): string {
  // 服务器错误不返回具体信息，避免泄露
  return 'common.serverError';
}

/**
 * 处理未知错误
 */
function handleUnknownError(errorMessage: string): string {
  // 对于未知错误，返回通用错误消息
  return 'common.unknownError';
}

/**
 * 获取错误分类
 */
export function getErrorCategory(error: ApiError): string {
  if (!error || !error.response) {
    return ERROR_CATEGORIES.NETWORK;
  }

  const status = error.response.status;
  
  switch (true) {
    case status >= 500:
      return ERROR_CATEGORIES.SERVER;
    case status === 401 || status === 403:
      return ERROR_CATEGORIES.AUTH;
    case status === 400 || status === 409:
      return ERROR_CATEGORIES.VALIDATION;
    case status === 404:
      return ERROR_CATEGORIES.CLIENT;
    default:
      return ERROR_CATEGORIES.UNKNOWN;
  }
}

/**
 * 检查是否为网络错误
 */
export function isNetworkError(error: ApiError): boolean {
  return !error.response;
}

/**
 * 检查是否为服务器错误
 */
export function isServerError(error: ApiError): boolean {
  return error.response?.status ? error.response.status >= 500 : false;
}

/**
 * 检查是否为认证错误
 */
export function isAuthError(error: ApiError): boolean {
  return error.response?.status === 401 || error.response?.status === 403;
}

/**
 * 检查是否为验证错误
 */
export function isValidationError(error: ApiError): boolean {
  return error.response?.status === 400 || error.response?.status === 409;
}

/**
 * React Hook for error handling
 */
export function useErrorHandler() {
  const { t } = useTranslation();

  /**
   * 获取翻译后的错误消息
   */
  const getTranslatedError = (error: ApiError): string => {
    const errorKey = getSafeErrorMessage(error);
    return t(errorKey);
  };

  /**
   * 处理错误并显示通知
   */
  const handleError = (error: ApiError, showNotification = true): string => {
    const errorMessage = getTranslatedError(error);
    
    if (showNotification) {
      // 这里可以集成通知系统，例如使用Toast或Alert
      console.error('Error occurred:', error);
      // TODO: 集成通知系统
    }
    
    return errorMessage;
  };

  return {
    getTranslatedError,
    handleError,
    getErrorCategory,
    isNetworkError,
    isServerError,
    isAuthError,
    isValidationError,
  };
}