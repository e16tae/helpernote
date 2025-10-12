import { z } from 'zod';

/**
 * 환경 변수 스키마 정의
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url('NEXT_PUBLIC_API_URL must be a valid URL')
    .default('http://localhost:8000'),
});

/**
 * 환경 변수 타입
 */
export type Env = z.infer<typeof envSchema>;

/**
 * 환경 변수 검증 및 파싱
 */
function validateEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n');

      throw new Error(`Environment variable validation failed:\n${issues}`);
    }
    throw error;
  }
}

/**
 * 검증된 환경 변수 (애플리케이션 시작 시 한번 검증됨)
 */
export const env = validateEnv();
