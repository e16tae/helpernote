/**
 * 전화번호 포맷팅 유틸리티
 */

/**
 * 전화번호를 010-1234-5678 형식으로 포맷팅
 */
export function formatPhoneNumber(value: string): string {
  // 숫자만 추출
  const numbers = value.replace(/[^\d]/g, '');

  // 길이에 따라 포맷팅
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }

  // 11자리 초과시 11자리까지만
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

/**
 * 포맷된 전화번호에서 숫자만 추출
 */
export function unformatPhoneNumber(value: string): string {
  return value.replace(/[^\d]/g, '');
}

/**
 * 전화번호 유효성 검사
 */
export function isValidPhoneNumber(value: string): boolean {
  const numbers = unformatPhoneNumber(value);

  // 한국 전화번호: 010, 011, 016, 017, 018, 019로 시작하는 10~11자리
  const mobileRegex = /^01(?:0|1|6|7|8|9)\d{7,8}$/;

  // 지역번호: 02, 031-9 등으로 시작
  const landlineRegex = /^0(2|3[1-9]|4[1-4]|5[1-5]|6[1-4])\d{7,8}$/;

  return mobileRegex.test(numbers) || landlineRegex.test(numbers);
}

/**
 * React 입력 필드용 전화번호 change handler
 */
export function handlePhoneInput(
  e: React.ChangeEvent<HTMLInputElement>,
  setValue: (value: string) => void
): void {
  const formatted = formatPhoneNumber(e.target.value);
  setValue(formatted);
}
