import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";
import { env } from "./env";
import { logger } from "./logger";

const API_URL = env.NEXT_PUBLIC_API_URL;

/**
 * API 에러 인터페이스
 */
export interface ApiError {
  message: string;
  statusCode?: number;
  field?: string;
}

/**
 * Axios 에러에서 사용자 친화적인 에러 메시지 추출
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;

    // 서버 응답 메시지 우선
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    // HTTP 상태 코드별 기본 메시지
    switch (axiosError.response?.status) {
      case 400:
        return "잘못된 요청입니다.";
      case 401:
        return "인증이 필요합니다.";
      case 403:
        return "접근 권한이 없습니다.";
      case 404:
        return "요청한 리소스를 찾을 수 없습니다.";
      case 409:
        return "이미 존재하는 데이터입니다.";
      case 422:
        return "입력 데이터가 올바르지 않습니다.";
      case 429:
        return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
      case 500:
        return "서버 오류가 발생했습니다.";
      case 502:
        return "게이트웨이 오류가 발생했습니다.";
      case 503:
        return "서비스를 일시적으로 사용할 수 없습니다.";
      default:
        break;
    }

    // 네트워크 오류
    if (axiosError.code === "ERR_NETWORK") {
      return "네트워크 연결을 확인해주세요.";
    }

    // 타임아웃
    if (axiosError.code === "ECONNABORTED") {
      return "요청 시간이 초과되었습니다.";
    }

    return axiosError.message || "알 수 없는 오류가 발생했습니다.";
  }

  // 일반 에러
  if (error instanceof Error) {
    return error.message;
  }

  return "알 수 없는 오류가 발생했습니다.";
}

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30초 타임아웃
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  withCredentials: true,
});

type RetryAxiosRequestConfig = (AxiosRequestConfig & { _retry?: boolean }) | undefined;

const AUTH_ENDPOINTS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/forgot-password",
];

let isRefreshing = false;
const failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  config: NonNullable<RetryAxiosRequestConfig>;
}> = [];
let isHandlingUnauthorized = false;

function shouldAttemptRefresh(config: RetryAxiosRequestConfig): config is NonNullable<RetryAxiosRequestConfig> {
  if (!config?.url) return false;
  return !AUTH_ENDPOINTS.some((endpoint) => config.url?.includes(endpoint));
}

function shouldSkipUnauthorizedHandling(config: RetryAxiosRequestConfig): boolean {
  if (!config?.url) return false;
  // 로그인/회원가입/비밀번호 재설정 요청은 프런트가 자체적으로 에러를 처리해야 함
  return ["/api/auth/login", "/api/auth/register", "/api/auth/forgot-password"].some((endpoint) =>
    config.url!.includes(endpoint)
  );
}

function processQueue(error: unknown | null) {
  while (failedQueue.length) {
    const { resolve, reject, config } = failedQueue.shift()!;
    if (error) {
      reject(error);
    } else {
      resolve(apiClient(config));
    }
  }
}

function enqueueRequest(originalRequest: NonNullable<RetryAxiosRequestConfig>) {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject, config: originalRequest });

    if (!isRefreshing) {
      isRefreshing = true;
      refreshClient
        .post("/api/auth/refresh", {})
        .then(() => {
          processQueue(null);
        })
        .catch((refreshError) => {
          processQueue(refreshError);
        })
        .finally(() => {
          isRefreshing = false;
        });
    }
  });
}

function handleUnauthorized() {
  if (typeof window === "undefined" || isHandlingUnauthorized) {
    return;
  }

  isHandlingUnauthorized = true;

  const hasSessionCookie =
    typeof document !== "undefined" &&
    /(?:^|;\s*)(token|refresh_token)=/.test(document.cookie);

  if (hasSessionCookie && typeof fetch === "function") {
    fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      // swallow network errors when tearing down a session
    });
  }

  if (!window.location.pathname.startsWith("/login")) {
    window.location.replace("/login");
    return;
  }

  isHandlingUnauthorized = false;
}

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const endpoint = error.config?.url || "unknown";
    const status = error.response?.status;

    // 401 Unauthorized - 토큰 만료 또는 유효하지 않음
    if (status === 401) {
      logger.warn("Unauthorized request", { endpoint });
      const originalRequest = error.config as RetryAxiosRequestConfig;

      if (shouldSkipUnauthorizedHandling(originalRequest)) {
        return Promise.reject(error);
      }

      if (originalRequest && !originalRequest._retry && shouldAttemptRefresh(originalRequest)) {
        originalRequest._retry = true;

        try {
          return await enqueueRequest(originalRequest);
        } catch (refreshError) {
          handleUnauthorized();
          return Promise.reject(refreshError);
        }
      }

      handleUnauthorized();
    }

    if (status === 403) {
      logger.warn("Access forbidden", {
        endpoint,
        data: error.response?.data,
      });
    }

    // 500번대 서버 오류 로깅
    if (status && status >= 500) {
      logger.apiError(endpoint, error, {
        status,
        data: error.response?.data,
      });
    }

    // 기타 에러 로깅
    if (status && status >= 400 && status < 500) {
      logger.debug("Client error", {
        endpoint,
        status,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);
