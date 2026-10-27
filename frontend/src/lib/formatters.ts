/**
 * Formatting utilities for VND currency and local Vietnamese Date/Time
 */

/**
 * Formats a number to Vietnamese Dong currency format (e.g. "1.250.000 ₫" or "1.250.000 đ")
 */
export function formatCurrencyVND(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '0 ₫';
  }
  const numericAmount = Math.round(Number(amount));
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

/**
 * Formats an integer amount with thousand separators (e.g. 1.250.000 for #,##0)
 */
export function formatNumberVND(value: number | string | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0';
  }
  const numericVal = Math.round(Number(value));
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(numericVal);
}

/**
 * Pads a single-digit number with leading zero
 */
function pad(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Formats a Date or date string to local Vietnamese date-time: "dd/MM/yyyy HH:mm"
 * Does not use UTC toISOString to avoid timezone date shifts.
 */
export function formatDateTime(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formats a Date or date string to local Vietnamese date: "dd/MM/yyyy"
 */
export function formatDate(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formats a Date or date string to "MM/yyyy"
 */
export function formatMonthYear(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${month}/${year}`;
}

/**
 * Formats a countdown duration in minutes to user-friendly Vietnamese text
 * e.g. 72 mins -> "Còn 1h 12p", -15 mins -> "Quá hạn 15p"
 */
export function formatCountdownMinutes(remainingMinutes: number | null): string {
  if (remainingMinutes === null) return '';
  if (remainingMinutes < 0) {
    const overdue = Math.abs(remainingMinutes);
    const hours = Math.floor(overdue / 60);
    const mins = overdue % 60;
    if (hours > 0) {
      return `Quá hạn ${hours}h ${mins > 0 ? `${mins}p` : ''}`.trim();
    }
    return `Quá hạn ${mins}p`;
  }

  const hours = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;
  if (hours > 0) {
    return mins > 0 ? `Còn ${hours}h ${mins}p` : `Còn ${hours}h`;
  }
  return `Còn ${mins}p`;
}

/**
 * Formats an amount with standard vi-VN thousand separators up to 9 digits.
 * If number has more than 9 digits, keeps first 9 digits formatted and appends '...'
 * e.g. 120000000 -> "120.000.000"
 * e.g. 337611799976 -> "337.611.799..."
 */
export function formatMax9DigitsAmount(amount: number): string {
  const raw = Math.round(amount).toString();
  if (raw.length <= 9) {
    return amount.toLocaleString('vi-VN');
  }
  const first9 = raw.slice(0, 9);
  const formatted9 = Number(first9).toLocaleString('vi-VN');
  return `${formatted9}...`;
}
