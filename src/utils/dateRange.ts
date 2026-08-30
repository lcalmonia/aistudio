export type StatsDateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'thismonth'
  | 'alltime'
  | 'custom';

export interface DateRangeBoundary {
  startDate?: string; // ISO string
  endDate?: string;   // ISO string
  startDisplay: string;
  endDisplay: string;
  isAllTime: boolean;
}

/**
 * Format a local Date to YYYY-MM-DD string
 */
export function formatLocalDateToInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes exact start and end boundaries in local business time
 */
export function computeDateRangeBoundaries(
  preset: StatsDateRangePreset,
  customStart?: string,
  customEnd?: string
): DateRangeBoundary {
  const now = new Date();

  if (preset === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      startDisplay: formatLocalDateToInput(start),
      endDisplay: formatLocalDateToInput(end),
      isAllTime: false,
    };
  }

  if (preset === 'yesterday') {
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
    const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      startDisplay: formatLocalDateToInput(start),
      endDisplay: formatLocalDateToInput(end),
      isAllTime: false,
    };
  }

  if (preset === 'last7days') {
    // Current day plus previous 6 calendar days = 7 days total
    const past7 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const start = new Date(past7.getFullYear(), past7.getMonth(), past7.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      startDisplay: formatLocalDateToInput(start),
      endDisplay: formatLocalDateToInput(end),
      isAllTime: false,
    };
  }

  if (preset === 'thismonth') {
    // 1st day of current calendar month through today end of day
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      startDisplay: formatLocalDateToInput(start),
      endDisplay: formatLocalDateToInput(end),
      isAllTime: false,
    };
  }

  if (preset === 'alltime') {
    return {
      startDate: undefined,
      endDate: undefined,
      startDisplay: 'Earliest',
      endDisplay: 'Latest',
      isAllTime: true,
    };
  }

  // Custom range
  const startDateObj = customStart
    ? new Date(`${customStart}T00:00:00`)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endDateObj = customEnd
    ? new Date(`${customEnd}T23:59:59.999`)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return {
    startDate: startDateObj.toISOString(),
    endDate: endDateObj.toISOString(),
    startDisplay: customStart || formatLocalDateToInput(startDateObj),
    endDisplay: customEnd || formatLocalDateToInput(endDateObj),
    isAllTime: false,
  };
}
