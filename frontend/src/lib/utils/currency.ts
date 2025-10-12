/**
 * 통화 관련 유틸리티 함수
 */

/**
 * 문자열 또는 숫자를 안전하게 숫자로 변환
 * @param value - 변환할 값 (string | number | null | undefined)
 * @returns 변환된 숫자 또는 0
 */
export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 숫자를 한국 원화 형식으로 포맷
 * @param amount - 포맷할 금액
 * @returns 포맷된 문자열 (예: ₩1,000,000)
 */
export function formatCurrency(amount: number | string): string {
  const numericAmount = toNumber(amount);
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(numericAmount);
}

/**
 * 문자열 금액을 직접 포맷 (toNumber + formatCurrency 조합)
 * @param value - 변환할 값
 * @returns 포맷된 문자열
 */
export function formatCurrencyFromString(value: string | number | null | undefined): string {
  return formatCurrency(toNumber(value));
}
