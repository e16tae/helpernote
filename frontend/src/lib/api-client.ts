import axios, { AxiosInstance, AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 401 Unauthorized - 토큰 만료 또는 유효하지 않음
    if (error.response?.status === 401) {
      localStorage.removeItem("token");

      // 로그인 페이지가 아닌 경우에만 리다이렉트
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    // 403 Forbidden - 권한 없음
    if (error.response?.status === 403) {
      console.warn("Access forbidden:", error.response.data);
    }

    // 500번대 서버 오류 로깅
    if (error.response?.status && error.response.status >= 500) {
      console.error("Server error:", error.response);
    }

    return Promise.reject(error);
  }
);
