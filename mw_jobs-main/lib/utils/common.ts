import { Logger, AppError } from '../util/logger';

/**
 * Common utility functions to reduce code duplication
 */

/**
 * Safely gets an environment variable with proper error handling
 * @deprecated Use EnvironmentConfig instead
 */
export function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new AppError(
      `Missing required environment variable: ${key}`,
      'MISSING_ENVIRONMENT_VARIABLE',
      {
        function: 'getEnvVar',
        file: 'lib/utils/common.ts',
        additionalData: { environmentVariable: key }
      }
    );
  }
  return value;
}

/**
 * Formats date from YYYY-MM-DD to DD/MM display format
 */
export function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

/**
 * Formats date range from start and end dates to display format
 * Uses LTR direction marker to ensure proper display in RTL context
 */
export function formatDateRangeDisplay(startDate: string, endDate: string): string {
  const startFormatted = formatDateDisplay(startDate);
  const endFormatted = formatDateDisplay(endDate);
  
  if (startDate === endDate) {
    return `\u202D${startFormatted}\u202C`; // LTR override
  }
  return `\u202D${startFormatted} - ${endFormatted}\u202C`; // LTR override
}

/**
 * Formats time range for display
 * Uses LTR direction marker to ensure proper display in RTL context
 */
export function formatTimeRangeDisplay(startTime: string, endTime: string): string {
  return `\u202D${startTime} - ${endTime}\u202C`; // LTR override
}

/**
 * Creates a filename for event sheets with date range
 */
export function createEventSheetName(name: string, startDate: string, endDate: string): string {
  const dateRange = formatDateRangeDisplay(startDate, endDate);
  return `${name} ${dateRange}`;
}

/**
 * Formats date from YYYY-MM-DD to Hebrew display format
 */
export function formatDateHebrew(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}

/**
 * Creates an ISO datetime string from date and time
 */
export function createISODateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

/**
 * Adds hours to an ISO datetime string
 */
export function addHours(isoString: string, hours: number): string {
  const date = new Date(isoString);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

/**
 * Validates that a date string is in YYYY-MM-DD format
 */
export function isValidDateString(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * Validates that a time string is in HH:MM format
 */
export function isValidTimeString(timeStr: string): boolean {
  return /^\d{2}:\d{2}$/.test(timeStr);
}

/**
 * Creates a unique request ID for logging
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Safely parses a number with validation
 */
export function parseNumber(value: string | number, fieldName: string): number {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(num)) {
    throw new AppError(
      `Invalid number format for field: ${fieldName}`,
      'INVALID_NUMBER_FORMAT',
      {
        function: 'parseNumber',
        file: 'lib/utils/common.ts',
        additionalData: { fieldName, originalValue: value }
      }
    );
  }
  return num;
}

/**
 * Checks if a string is empty or only whitespace
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Truncates a string to a maximum length with ellipsis
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Delays execution for a specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an async operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        Logger.error(new AppError(
          `Operation failed after ${maxRetries} attempts`,
          'MAX_RETRIES_EXCEEDED',
          {
            function: 'retryOperation',
            file: 'lib/utils/common.ts',
            additionalData: { maxRetries, lastError: error instanceof Error ? error.message : String(error) }
          }
        ));
        throw error;
      }
      
      const delayMs = baseDelay * Math.pow(2, attempt - 1);
      Logger.warn(`Operation failed, retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})`, {
        error: error instanceof Error ? error.message : String(error),
        attempt,
        maxRetries
      });
      
      await delay(delayMs);
    }
  }
  
  throw lastError;
}
