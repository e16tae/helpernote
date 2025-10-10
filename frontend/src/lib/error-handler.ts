import { AxiosError } from 'axios';

// User-friendly error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  TIMEOUT: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 데이터를 찾을 수 없습니다.',
  BAD_REQUEST: '잘못된 요청입니다. 입력 정보를 확인해주세요.',
  CONFLICT: '이미 존재하는 데이터입니다.',
  INTERNAL_SERVER: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  UNKNOWN: '알 수 없는 오류가 발생했습니다.',
};

/**
 * Convert API error to user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return ERROR_MESSAGES.UNKNOWN;
  }

  // Check if it's an Axios error
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;

    // Network error (no response from server)
    if (!axiosError.response) {
      if (axiosError.code === 'ECONNABORTED') {
        return ERROR_MESSAGES.TIMEOUT;
      }
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    // HTTP status code errors
    const status = axiosError.response.status;
    const serverMessage = axiosError.response.data?.error || axiosError.response.data?.message;

    switch (status) {
      case 400:
        return serverMessage || ERROR_MESSAGES.BAD_REQUEST;
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return serverMessage || ERROR_MESSAGES.NOT_FOUND;
      case 409:
        return serverMessage || ERROR_MESSAGES.CONFLICT;
      case 500:
      case 502:
      case 503:
      case 504:
        return ERROR_MESSAGES.INTERNAL_SERVER;
      default:
        return serverMessage || ERROR_MESSAGES.UNKNOWN;
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message || ERROR_MESSAGES.UNKNOWN;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return ERROR_MESSAGES.UNKNOWN;
}

/**
 * Type guard to check if error is an Axios error
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError === true;
}

/**
 * Get error title based on error type
 */
export function getErrorTitle(error: unknown): string {
  if (!error) {
    return '오류';
  }

  if (isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (!axiosError.response) {
      return '연결 오류';
    }

    const status = axiosError.response.status;

    switch (status) {
      case 400:
        return '잘못된 요청';
      case 401:
        return '인증 필요';
      case 403:
        return '접근 거부';
      case 404:
        return '찾을 수 없음';
      case 409:
        return '중복 데이터';
      case 500:
      case 502:
      case 503:
      case 504:
        return '서버 오류';
      default:
        return '오류';
    }
  }

  return '오류';
}

/**
 * Check if error is retryable (network errors, timeouts, 5xx errors)
 */
export function isRetryableError(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false;
  }

  const axiosError = error as AxiosError;

  // Network errors are retryable
  if (!axiosError.response) {
    return true;
  }

  // 5xx server errors are retryable
  const status = axiosError.response.status;
  return status >= 500 && status < 600;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = isRetryableError,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
