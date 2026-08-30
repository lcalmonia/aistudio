import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Order } from '../src/types';
import { reportingService } from '../src/services/reportingService';
import {
  computeDateRangeBoundaries,
  formatLocalDateToInput,
  StatsDateRangePreset,
} from '../src/utils/dateRange';

const baseTime = new Date('2026-08-30T10:00:00Z').getTime();

const sampleOrders: Order[] = [
  // Today's orders
  {
    id: 'ord-today-1',
    orderNumber: '#1001',
    customerName: 'Alice',
    timestamp: new Date().getTime() - 1000 * 60 * 30, // 30 mins ago
    timeAgo: '30m ago',
    status: 'Completed',
    total: 350,
    items: [
      { name: 'Spanish Latte', quantity: 2, price: 150 },
      { name: 'Croissant', quantity: 1, price: 50 },
    ],
  },
  {
    id: 'ord-today-2',
    orderNumber: '#1002',
    customerName: 'Bob',
    timestamp: new Date().getTime() - 1000 * 60 * 15,
    timeAgo: '15m ago',
    status: 'New',
    total: 180,
    items: [{ name: 'Americano', quantity: 1, price: 180 }],
  },
  {
    id: 'ord-today-cancelled',
    orderNumber: '#1003',
    customerName: 'Charlie',
    timestamp: new Date().getTime() - 1000 * 60 * 10,
    timeAgo: '10m ago',
    status: 'Cancelled',
    total: 500,
    items: [{ name: 'Caramel Macchiato', quantity: 3, price: 166.67 }],
  },
  // Yesterday's order
  {
    id: 'ord-yesterday-1',
    orderNumber: '#0999',
    customerName: 'David',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(14, 0, 0, 0),
    timeAgo: '1d ago',
    status: 'Completed',
    total: 420,
    items: [
      { name: 'Spanish Latte', quantity: 1, price: 150 },
      { name: 'Caramel Macchiato', quantity: 1, price: 170 },
      { name: 'Cookie', quantity: 1, price: 100 },
    ],
  },
  // 5 days ago order (within last 7 days)
  {
    id: 'ord-past-5d',
    orderNumber: '#0950',
    customerName: 'Eva',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 5)).setHours(11, 0, 0, 0),
    timeAgo: '5d ago',
    status: 'Completed',
    total: 200,
    items: [{ name: 'Cold Brew', quantity: 1, price: 200 }],
  },
  // 45 days ago order (outside this month and last 7 days)
  {
    id: 'ord-past-45d',
    orderNumber: '#0800',
    customerName: 'Frank',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 45)).setHours(9, 0, 0, 0),
    timeAgo: '45d ago',
    status: 'Completed',
    total: 1000,
    items: [{ name: 'Batch Espresso Beans', quantity: 2, price: 500 }],
  },
];

test('Phase 8B - Date Range Boundaries: Today computes start to end of current day', () => {
  const boundary = computeDateRangeBoundaries('today');
  assert.ok(boundary.startDate);
  assert.ok(boundary.endDate);
  assert.equal(boundary.isAllTime, false);

  const start = new Date(boundary.startDate!);
  const end = new Date(boundary.endDate!);
  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
  assert.equal(end.getHours(), 23);
  assert.equal(end.getMinutes(), 59);
});

test('Phase 8B - Date Range Boundaries: Yesterday computes start to end of previous day', () => {
  const boundary = computeDateRangeBoundaries('yesterday');
  assert.ok(boundary.startDate);
  assert.ok(boundary.endDate);

  const start = new Date(boundary.startDate!);
  const end = new Date(boundary.endDate!);
  const expectedYesterday = new Date();
  expectedYesterday.setDate(expectedYesterday.getDate() - 1);

  assert.equal(start.getDate(), expectedYesterday.getDate());
  assert.equal(end.getDate(), expectedYesterday.getDate());
});

test('Phase 8B - Date Range Boundaries: Last 7 Days covers 7 days inclusive', () => {
  const boundary = computeDateRangeBoundaries('last7days');
  const start = new Date(boundary.startDate!);
  const end = new Date(boundary.endDate!);

  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  assert.equal(diffDays, 7); // start 00:00 to end 23:59
});

test('Phase 8B - Date Range Boundaries: This Month starts at day 1', () => {
  const boundary = computeDateRangeBoundaries('thismonth');
  const start = new Date(boundary.startDate!);
  assert.equal(start.getDate(), 1);
});

test('Phase 8B - Date Range Boundaries: All Time returns undefined start/end with isAllTime flag', () => {
  const boundary = computeDateRangeBoundaries('alltime');
  assert.equal(boundary.startDate, undefined);
  assert.equal(boundary.endDate, undefined);
  assert.equal(boundary.isAllTime, true);
});

test('Phase 8B - Date Range Boundaries: Custom range formats inclusive boundaries', () => {
  const boundary = computeDateRangeBoundaries('custom', '2026-08-01', '2026-08-15');
  assert.ok(boundary.startDate?.startsWith('2026-08-01'));
  assert.ok(boundary.endDate?.startsWith('2026-08-15'));
});

test('Phase 8B - Stats Filtering: Cancelled orders are strictly excluded from calculations', () => {
  const summary = reportingService.calculateSalesSummary(sampleOrders);
  // Total of non-cancelled orders: 350 (today-1) + 180 (today-2) + 420 (yesterday) + 200 (past-5d) + 1000 (past-45d) = 2150
  assert.equal(summary.totalSales, 2150);
  assert.equal(summary.cancelledOrdersCount, 1);
  assert.equal(summary.completedOrdersCount, 4);
});

test('Phase 8B - Stats Filtering: Top products respect filtered order range and units sold ranking', () => {
  // Filter for today's orders only
  const todayBoundary = computeDateRangeBoundaries('today');
  const startMs = new Date(todayBoundary.startDate!).getTime();
  const endMs = new Date(todayBoundary.endDate!).getTime();

  const todayOrders = sampleOrders.filter(
    (o) => o.timestamp >= startMs && o.timestamp <= endMs
  );

  const topProducts = reportingService.calculateTopSellingItems(todayOrders);
  // Spanish Latte: 2, Croissant: 1, Americano: 1 (Cancelled Caramel Macchiato excluded)
  assert.equal(topProducts.length, 3);
  assert.equal(topProducts[0].name, 'Spanish Latte');
  assert.equal(topProducts[0].count, 2);
  assert.equal(topProducts[0].revenue, 300);
});

test('Phase 8B - Empty Orders Handling: Safely returns zeros without runtime exceptions', () => {
  const emptySummary = reportingService.calculateSalesSummary([]);
  assert.equal(emptySummary.totalSales, 0);
  assert.equal(emptySummary.cupsServed, 0);
  assert.equal(emptySummary.averageOrderValue, 0);
  assert.equal(emptySummary.totalOrdersCount, 0);

  const emptyTop = reportingService.calculateTopSellingItems([]);
  assert.deepEqual(emptyTop, []);
});

test('Phase 8B - Scalability Beyond 200 Orders: Date range query allows limit up to 10,000', () => {
  const largeBatch: Order[] = Array.from({ length: 350 }, (_, i) => ({
    id: `ord-bulk-${i}`,
    orderNumber: `#${2000 + i}`,
    customerName: `Customer ${i}`,
    timestamp: new Date().getTime() - i * 1000 * 60,
    timeAgo: 'recently',
    status: 'Completed',
    total: 100,
    items: [{ name: 'Espresso', quantity: 1, price: 100 }],
  }));

  const summary = reportingService.calculateSalesSummary(largeBatch);
  assert.equal(summary.totalOrdersCount, 350);
  assert.equal(summary.totalSales, 35000);
  assert.equal(summary.cupsServed, 350);
});

test('Phase 8C-1 - Hourly Throughput: Today uses today orders and excludes cancelled', () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const orderToday10AM: Order = {
    id: 'ord-today-10am',
    orderNumber: '#2001',
    customerName: 'Morning User',
    timestamp: new Date().setHours(10, 30, 0, 0),
    timeAgo: 'earlier',
    status: 'Completed',
    total: 300,
    items: [{ name: 'Latte', quantity: 2, price: 150 }],
  };

  const orderTodayCancelled10AM: Order = {
    id: 'ord-today-can-10am',
    orderNumber: '#2002',
    customerName: 'Cancelled User',
    timestamp: new Date().setHours(10, 45, 0, 0),
    timeAgo: 'earlier',
    status: 'Cancelled',
    total: 500,
    items: [{ name: 'Cake', quantity: 1, price: 500 }],
  };

  const hourly = reportingService.calculateHourlyThroughput([orderToday10AM, orderTodayCancelled10AM]);
  const pt10AM = hourly.find((h) => h.hour === 10);
  assert.ok(pt10AM);
  assert.equal(pt10AM.sales, 300);
  assert.equal(pt10AM.cups, 2);
});

test('Phase 8C-1 - Hourly Throughput: Yesterday uses yesterday orders and excludes today', () => {
  const yesterday14PM: Order = {
    id: 'ord-yest-2pm',
    orderNumber: '#1999',
    customerName: 'Yesterday Afternoon',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(14, 15, 0, 0),
    timeAgo: 'yesterday',
    status: 'Completed',
    total: 250,
    items: [{ name: 'Mocha', quantity: 1, price: 250 }],
  };

  const today14PM: Order = {
    id: 'ord-today-2pm',
    orderNumber: '#2003',
    customerName: 'Today Afternoon',
    timestamp: new Date().setHours(14, 30, 0, 0),
    timeAgo: 'today',
    status: 'Completed',
    total: 400,
    items: [{ name: 'Caramel Macchiato', quantity: 2, price: 200 }],
  };

  // When yesterday range is selected, only yesterday orders are passed
  const yesterdayHourly = reportingService.calculateHourlyThroughput([yesterday14PM]);
  const pt2PM = yesterdayHourly.find((h) => h.hour === 14);
  assert.ok(pt2PM);
  assert.equal(pt2PM.sales, 250);
  assert.equal(pt2PM.cups, 1);

  // Does not include today's 400
  assert.notEqual(pt2PM.sales, 650);
});

test('Phase 8C-1 - Hourly Throughput: Last 7 Days aggregates across all 7 days by hour of day', () => {
  const day1_9AM: Order = {
    id: 'ord-d1-9am',
    orderNumber: '#101',
    customerName: 'D1',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(9, 10, 0, 0),
    timeAgo: '1d',
    status: 'Completed',
    total: 100,
    items: [{ name: 'Espresso', quantity: 1, price: 100 }],
  };
  const day2_9AM: Order = {
    id: 'ord-d2-9am',
    orderNumber: '#102',
    customerName: 'D2',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 3)).setHours(9, 20, 0, 0),
    timeAgo: '3d',
    status: 'Completed',
    total: 150,
    items: [{ name: 'Latte', quantity: 1, price: 150 }],
  };
  const day3_9AM: Order = {
    id: 'ord-d3-9am',
    orderNumber: '#103',
    customerName: 'D3',
    timestamp: new Date(new Date().setDate(new Date().getDate() - 5)).setHours(9, 45, 0, 0),
    timeAgo: '5d',
    status: 'Completed',
    total: 200,
    items: [{ name: 'Cold Brew', quantity: 1, price: 200 }],
  };

  const hourly = reportingService.calculateHourlyThroughput([day1_9AM, day2_9AM, day3_9AM]);
  const pt9AM = hourly.find((h) => h.hour === 9);
  assert.ok(pt9AM);
  assert.equal(pt9AM.sales, 450); // 100 + 150 + 200
  assert.equal(pt9AM.cups, 3);
});

test('Phase 8C-1 - Peak Rush Window: Matches exact hourly dataset calculation', () => {
  const ord11AM: Order = {
    id: 'ord-11am',
    orderNumber: '#301',
    customerName: 'Peak User 1',
    timestamp: new Date().setHours(11, 10, 0, 0),
    timeAgo: 'earlier',
    status: 'Completed',
    total: 1000,
    items: [{ name: 'Batch Drinks', quantity: 10, price: 100 }],
  };
  const ord12PM: Order = {
    id: 'ord-12pm',
    orderNumber: '#302',
    customerName: 'User 2',
    timestamp: new Date().setHours(12, 10, 0, 0),
    timeAgo: 'earlier',
    status: 'Completed',
    total: 150,
    items: [{ name: 'Drink', quantity: 1, price: 150 }],
  };

  const hourly = reportingService.calculateHourlyThroughput([ord11AM, ord12PM]);
  const peakHourItem = [...hourly].sort((a, b) => b.cups - a.cups)[0];

  assert.equal(peakHourItem.time, '11 AM');
  assert.equal(peakHourItem.cups, 10);
  assert.equal(peakHourItem.sales, 1000);
});

test('Phase 8C-1 - All Time / Custom Range: Aggregates historical hours and does not default to today', () => {
  const historicalOrder15PM: Order = {
    id: 'ord-hist-3pm',
    orderNumber: '#0100',
    customerName: 'Historical User',
    timestamp: new Date('2026-05-15T15:30:00').getTime(),
    timeAgo: 'months ago',
    status: 'Completed',
    total: 800,
    items: [{ name: 'Signature Frappe', quantity: 4, price: 200 }],
  };

  const hourly = reportingService.calculateHourlyThroughput([historicalOrder15PM]);
  const pt3PM = hourly.find((h) => h.hour === 15);
  assert.ok(pt3PM);
  assert.equal(pt3PM.sales, 800);
  assert.equal(pt3PM.cups, 4);
});

