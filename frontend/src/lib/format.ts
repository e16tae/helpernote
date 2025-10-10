/**
 * Format a number as Korean Won currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

/**
 * Format a date to Korean locale string
 */
export function formatDate(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return formatStr
    .replace('yyyy', String(year))
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes);
}

/**
 * Get Korean work type label
 */
export function getWorkTypeLabel(workType: 'daily' | 'weekly' | 'monthly' | 'long-term'): string {
  const labels = {
    daily: '일용직',
    weekly: '주간',
    monthly: '월간',
    'long-term': '장기',
  };
  return labels[workType];
}

/**
 * Get Korean salary type label
 */
export function getSalaryTypeLabel(salaryType: 'hourly' | 'daily' | 'monthly'): string {
  const labels = {
    hourly: '시급',
    daily: '일급',
    monthly: '월급',
  };
  return labels[salaryType];
}

/**
 * Get Korean gender label
 */
export function getGenderLabel(gender: 'male' | 'female' | 'other'): string {
  const labels = {
    male: '남성',
    female: '여성',
    other: '기타',
  };
  return labels[gender];
}

/**
 * Calculate fee amount from salary and rate
 */
export function calculateFeeAmount(salary: number | string, feeRate: number | string): number {
  const salaryNum = typeof salary === 'string' ? parseFloat(salary) : salary;
  const rateNum = typeof feeRate === 'string' ? parseFloat(feeRate) : feeRate;
  return Math.round(salaryNum * rateNum / 100);
}

/**
 * Format fee amount as Korean Won with calculation display
 */
export function formatFeeCalculation(salary: number | string, feeRate: number | string): string {
  const salaryNum = typeof salary === 'string' ? parseFloat(salary) : salary;
  const rateNum = typeof feeRate === 'string' ? parseFloat(feeRate) : feeRate;
  const amount = calculateFeeAmount(salaryNum, rateNum);
  return `${formatCurrency(amount)} (${rateNum}%)`;
}

/**
 * Get matching status badge variant
 */
export function getMatchingStatusBadgeVariant(status: 'InProgress' | 'Completed' | 'Cancelled'): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'Completed':
      return 'default';
    case 'Cancelled':
      return 'destructive';
    case 'InProgress':
    default:
      return 'secondary';
  }
}

/**
 * Get matching status label
 */
export function getMatchingStatusLabel(status: 'InProgress' | 'Completed' | 'Cancelled'): string {
  const labels = {
    InProgress: '진행중',
    Completed: '완료',
    Cancelled: '취소',
  };
  return labels[status];
}
