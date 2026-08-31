import test from 'node:test';
import assert from 'node:assert/strict';
import { enforceStatsDateRangeAccess, AuthenticatedAdmin } from '../netlify/functions/_shared/auth.mts';
import { computeDateRangeBoundaries, formatLocalDateToInput } from '../netlify/functions/_shared/dateRange.mts';
import { reportingService } from '../src/services/reportingService.ts';
import { Order, MenuItem } from '../src/types.ts';

const superAdmin: AuthenticatedAdmin = {
  authenticated: true,
  userId: 'super-admin-1',
  role: 'SUPER_ADMIN',
  username: 'superadmin',
  displayName: 'Super Admin',
  hasProfilePicture: false,
  isSuperAdmin: true,
  isAdmin: false,
  sessionId: 'sess-super-1',
};

const staffAdmin: AuthenticatedAdmin = {
  authenticated: true,
  userId: 'admin-1',
  role: 'ADMIN',
  username: 'staffadmin',
  displayName: 'Staff Admin',
  hasProfilePicture: false,
  isSuperAdmin: false,
  isAdmin: true,
  sessionId: 'sess-admin-1',
};

test('Phase A-3 - Admin Role: Allows Today preset for ADMIN', () => {
  assert.doesNotThrow(() => {
    enforceStatsDateRangeAccess(staffAdmin, { preset: 'today' });
  });
});

test('Phase A-3 - Admin Role: Allows Yesterday preset for ADMIN', () => {
  assert.doesNotThrow(() => {
    enforceStatsDateRangeAccess(staffAdmin, { preset: 'yesterday' });
  });
});

test('Phase A-3 - Admin Role: Rejects Last 7 Days preset for ADMIN with 403', () => {
  assert.throws(
    () => {
      enforceStatsDateRangeAccess(staffAdmin, { preset: 'last7days' });
    },
    (err: any) => {
      assert.equal(err.status, 403);
      assert.match(err.message, /Admins are restricted to viewing stats for Today and Yesterday only/);
      return true;
    }
  );
});

test('Phase A-3 - Admin Role: Rejects This Month preset for ADMIN with 403', () => {
  assert.throws(
    () => {
      enforceStatsDateRangeAccess(staffAdmin, { preset: 'thismonth' });
    },
    (err: any) => {
      assert.equal(err.status, 403);
      assert.match(err.message, /Admins are restricted to viewing stats for Today and Yesterday only/);
      return true;
    }
  );
});

test('Phase A-3 - Admin Role: Rejects All Time preset/flag for ADMIN with 403', () => {
  assert.throws(
    () => {
      enforceStatsDateRangeAccess(staffAdmin, { preset: 'alltime' });
    },
    (err: any) => {
      assert.equal(err.status, 403);
      return true;
    }
  );

  assert.throws(
    () => {
      enforceStatsDateRangeAccess(staffAdmin, { isAllTime: true });
    },
    (err: any) => {
      assert.equal(err.status, 403);
      return true;
    }
  );

  assert.throws(
    () => {
      enforceStatsDateRangeAccess(staffAdmin, { limit: 10000 });
    },
    (err: any) => {
      assert.equal(err.status, 403);
      return true;
    }
  );
});

test('Phase A-3 - Admin Role: Allows explicit Today date boundaries for ADMIN', () => {
  const todayBoundaries = computeDateRangeBoundaries('today');
  assert.doesNotThrow(() => {
    enforceStatsDateRangeAccess(staffAdmin, {
      startDate: todayBoundaries.startDate,
      endDate: todayBoundaries.endDate,
    });
  });
});

test('Phase A-3 - Admin Role: Allows explicit Yesterday date boundaries for ADMIN', () => {
  const yesterdayBoundaries = computeDateRangeBoundaries('yesterday');
  assert.doesNotThrow(() => {
    enforceStatsDateRangeAccess(staffAdmin, {
      startDate: yesterdayBoundaries.startDate,
      endDate: yesterdayBoundaries.endDate,
    });
  });
});

test('Phase A-3 - Admin Role: Rejects historical custom date ranges (e.g. 7 days ago) for ADMIN with 403', () => {
  const last7Boundaries = computeDateRangeBoundaries('last7days');
  assert.throws(
    () => {
      enforceStatsDateRangeAccess(staffAdmin, {
        startDate: last7Boundaries.startDate,
        endDate: last7Boundaries.endDate,
      });
    },
    (err: any) => {
      assert.equal(err.status, 403);
      assert.match(err.message, /Admins are restricted to viewing stats for Today and Yesterday only/);
      return true;
    }
  );
});

test('Phase A-3 - Admin Role: Rejects multi-day spanning date ranges for ADMIN with 403', () => {
  const now = new Date();
  const past30Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  assert.throws(
    () => {
      enforceStatsDateRangeAccess(staffAdmin, {
        startDate: past30Days.toISOString(),
        endDate: now.toISOString(),
      });
    },
    (err: any) => {
      assert.equal(err.status, 403);
      return true;
    }
  );
});

test('Phase A-3 - Super Admin: Allows all presets (Today, Yesterday, Last 7 Days, This Month, All Time, Custom)', () => {
  assert.doesNotThrow(() => {
    enforceStatsDateRangeAccess(superAdmin, { preset: 'today' });
    enforceStatsDateRangeAccess(superAdmin, { preset: 'yesterday' });
    enforceStatsDateRangeAccess(superAdmin, { preset: 'last7days' });
    enforceStatsDateRangeAccess(superAdmin, { preset: 'thismonth' });
    enforceStatsDateRangeAccess(superAdmin, { preset: 'alltime' });
    enforceStatsDateRangeAccess(superAdmin, { isAllTime: true });
    enforceStatsDateRangeAccess(superAdmin, { limit: 10000 });
    enforceStatsDateRangeAccess(superAdmin, {
      startDate: new Date('2025-01-01').toISOString(),
      endDate: new Date('2025-12-31').toISOString(),
    });
  });
});

test('Phase A-3 - Reporting Preservation: calculateSalesSummary computes correct metrics', () => {
  const testOrders: Order[] = [
    {
      id: 'ord-1',
      orderNumber: '#1001',
      customerName: 'Alice',
      timestamp: Date.now(),
      timeAgo: 'just now',
      status: 'Completed',
      total: 350,
      items: [
        { name: 'Spanish Latte', quantity: 2, price: 150 },
        { name: 'Croissant', quantity: 1, price: 50 },
      ],
    },
    {
      id: 'ord-2',
      orderNumber: '#1002',
      customerName: 'Bob',
      timestamp: Date.now(),
      timeAgo: '5m ago',
      status: 'Cancelled',
      total: 500,
      items: [{ name: 'Caramel Macchiato', quantity: 2, price: 250 }],
    },
    {
      id: 'ord-3',
      orderNumber: '#1003',
      customerName: 'Charlie',
      timestamp: Date.now(),
      timeAgo: '10m ago',
      status: 'Ready',
      total: 150,
      items: [{ name: 'Americano', quantity: 1, price: 150 }],
    },
  ];

  const summary = reportingService.calculateSalesSummary(testOrders);
  // Cancelled order (500) excluded from sales calculation
  assert.equal(summary.totalSales, 500); // 350 + 150
  assert.equal(summary.completedOrdersCount, 1);
  assert.equal(summary.activeOrdersCount, 1); // 'Ready' is active
  assert.equal(summary.totalOrdersCount, 3);
  assert.equal(summary.cupsServed, 4); // 2+1 + 1
  assert.equal(summary.averageOrderValue, 250); // 500 / 2
});

test('Phase A-3 - Reporting Preservation: calculateHourlyThroughput preserves 24h distribution', () => {
  const testOrders: Order[] = [
    {
      id: 'ord-10',
      orderNumber: '#2001',
      customerName: 'Morning',
      timestamp: new Date().setHours(8, 30, 0, 0),
      timeAgo: 'morning',
      status: 'Completed',
      total: 300,
      items: [{ name: 'Latte', quantity: 2, price: 150 }],
    },
  ];

  const hourly = reportingService.calculateHourlyThroughput(testOrders);
  assert.equal(hourly.length, 24);
  const hour8 = hourly.find((h) => h.hour === 8);
  assert.ok(hour8);
  assert.equal(hour8.sales, 300);
  assert.equal(hour8.cups, 2);
});
