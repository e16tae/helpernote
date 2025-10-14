/**
 * 로그 레벨
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * 로그 엔트리 인터페이스
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  source?: string;
}

/**
 * 로거 클래스
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * 로그 엔트리 생성
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
    source?: string
  ): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      source,
    };
  }

  /**
   * 콘솔에 로그 출력
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    const message = entry.source ? `${prefix} [${entry.source}]` : prefix;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.message, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.message, entry.data || '');
        break;
    }
  }

  /**
   * 외부 로깅 서비스로 전송 (향후 확장)
   */
  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // TODO: Sentry, LogRocket, 또는 커스텀 로깅 서비스로 전송
    // 프로덕션 환경에서만 활성화
    if (this.isDevelopment) {
      return;
    }

    // 예시:
    // await fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(entry),
    // });
  }

  /**
   * Debug 레벨 로그
   */
  debug(message: string, data?: unknown, source?: string): void {
    if (!this.isDevelopment) return;

    const entry = this.createLogEntry(LogLevel.DEBUG, message, data, source);
    this.logToConsole(entry);
  }

  /**
   * Info 레벨 로그
   */
  info(message: string, data?: unknown, source?: string): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, data, source);
    this.logToConsole(entry);
  }

  /**
   * Warning 레벨 로그
   */
  warn(message: string, data?: unknown, source?: string): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, data, source);
    this.logToConsole(entry);
  }

  /**
   * Error 레벨 로그
   */
  error(message: string, error?: unknown, source?: string): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, error, source);
    this.logToConsole(entry);

    // 에러는 항상 외부 서비스로 전송 시도
    this.sendToExternalService(entry).catch((err) => {
      console.error('Failed to send log to external service:', err);
    });
  }

  /**
   * API 에러 로깅 (전용 메서드)
   */
  apiError(endpoint: string, error: unknown, context?: Record<string, unknown>): void {
    this.error(
      `API request failed: ${endpoint}`,
      {
        error,
        context,
      },
      'API'
    );
  }

  /**
   * 사용자 액션 로깅
   */
  userAction(action: string, data?: unknown): void {
    this.info(`User action: ${action}`, data, 'UserAction');
  }
}

/**
 * 싱글톤 로거 인스턴스
 */
export const logger = new Logger();
