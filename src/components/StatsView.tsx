import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Order, MenuItem, AdminPrincipal } from '../types';
import { reportingService } from '../services/reportingService';
import { orderService } from '../services/orderService';
import {
  StatsDateRangePreset,
  computeDateRangeBoundaries,
  formatLocalDateToInput,
} from '../utils/dateRange';

interface StatsViewProps {
  orders?: Order[];
  menuItems?: MenuItem[];
  dailyGoal?: number;
  onRefresh?: () => Promise<void> | void;
  admin?: AdminPrincipal | null;
}

export const StatsView: React.FC<StatsViewProps> = ({
  orders: propOrders = [],
  menuItems = [],
  dailyGoal = 100,
  onRefresh,
  admin,
}) => {
  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';

  const [selectedPreset, setSelectedPreset] = useState<StatsDateRangePreset>('today');
  const [customStart, setCustomStart] = useState<string>(() => formatLocalDateToInput(new Date()));
  const [customEnd, setCustomEnd] = useState<string>(() => formatLocalDateToInput(new Date()));
  const [customError, setCustomError] = useState<string | null>(null);

  // Range orders state
  const [rangeOrders, setRangeOrders] = useState<Order[]>([]);
  const [isLoadingRange, setIsLoadingRange] = useState<boolean>(false);

  // Ensure Admin role cannot remain on an unauthorized preset
  useEffect(() => {
    if (!isSuperAdmin && selectedPreset !== 'today' && selectedPreset !== 'yesterday') {
      setSelectedPreset('today');
    }
  }, [isSuperAdmin, selectedPreset]);

  // Compute active date boundaries
  const boundary = useMemo(() => {
    const effectivePreset =
      !isSuperAdmin && selectedPreset !== 'today' && selectedPreset !== 'yesterday'
        ? 'today'
        : selectedPreset;
    return computeDateRangeBoundaries(effectivePreset, customStart, customEnd);
  }, [isSuperAdmin, selectedPreset, customStart, customEnd]);

  // Fetch orders from PostgreSQL when date range changes
  const fetchRangeOrders = useCallback(async () => {
    try {
      setIsLoadingRange(true);
      if (boundary.isAllTime) {
        // Query up to 10000 historical orders for All Time without 200 order limit
        const allOrders = await orderService.listOrders({ limit: 10000 });
        setRangeOrders(allOrders);
      } else {
        const filtered = await orderService.listOrders({
          startDate: boundary.startDate,
          endDate: boundary.endDate,
          limit: 10000,
        });
        setRangeOrders(filtered);
      }
    } catch (err) {
      console.error('[StatsView] Failed to fetch range orders:', err);
      // Fallback: filter in-memory propOrders
      if (boundary.isAllTime) {
        setRangeOrders(propOrders);
      } else if (boundary.startDate && boundary.endDate) {
        const startMs = new Date(boundary.startDate).getTime();
        const endMs = new Date(boundary.endDate).getTime();
        const fallbackList = propOrders.filter(
          (o) => o.timestamp >= startMs && o.timestamp <= endMs
        );
        setRangeOrders(fallbackList);
      }
    } finally {
      setIsLoadingRange(false);
    }
  }, [boundary.isAllTime, boundary.startDate, boundary.endDate, propOrders]);

  useEffect(() => {
    fetchRangeOrders();
  }, [fetchRangeOrders]);

  // Manual refresh handler with double-click protection
  const handleManualRefresh = async () => {
    if (isLoadingRange) return;
    if (onRefresh) {
      try {
        await onRefresh();
      } catch (err) {
        console.error('[StatsView] Parent refresh failed:', err);
      }
    }
    await fetchRangeOrders();
  };

  // Handle Custom Date Change with validation
  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStart(start);
    setCustomEnd(end);
    if (start && end && start > end) {
      setCustomError('Start date cannot be after end date.');
    } else {
      setCustomError(null);
    }
  };

  // Aggregations based on selected range orders
  const summary = useMemo(() => {
    return reportingService.calculateSalesSummary(rangeOrders);
  }, [rangeOrders]);

  const topProducts = useMemo(() => {
    return reportingService.calculateTopSellingItems(rangeOrders, menuItems);
  }, [rangeOrders, menuItems]);

  // Hourly Throughput aggregation for the selected date range
  const hourlyData = useMemo(() => {
    return reportingService.calculateHourlyThroughput(rangeOrders);
  }, [rangeOrders]);

  const maxSales = Math.max(...hourlyData.map((d) => d.sales), 1);
  const goalPercentage = dailyGoal > 0 ? Math.min(100, Math.round((summary.cupsServed / dailyGoal) * 100)) : 0;
  const peakHourItem = [...hourlyData].sort((a, b) => b.cups - a.cups)[0];
  const hasHourlySales = hourlyData.some((h) => h.sales > 0);

  const rangeLabel = useMemo(() => {
    if (selectedPreset === 'today') return 'Today';
    if (selectedPreset === 'yesterday') return 'Yesterday';
    if (selectedPreset === 'last7days') return 'Last 7 Days';
    if (selectedPreset === 'thismonth') {
      const now = new Date();
      return now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }
    if (selectedPreset === 'alltime') return 'All Time';
    return `${boundary.startDisplay} to ${boundary.endDisplay}`;
  }, [selectedPreset, boundary.startDisplay, boundary.endDisplay]);

  const presets: { key: StatsDateRangePreset; label: string }[] = useMemo(() => {
    if (isSuperAdmin) {
      return [
        { key: 'today', label: 'Today' },
        { key: 'yesterday', label: 'Yesterday' },
        { key: 'last7days', label: 'Last 7 Days' },
        { key: 'thismonth', label: 'This Month' },
        { key: 'alltime', label: 'All Time' },
        { key: 'custom', label: 'Custom Range' },
      ];
    }
    return [
      { key: 'today', label: 'Today' },
      { key: 'yesterday', label: 'Yesterday' },
    ];
  }, [isSuperAdmin]);

  const handleSelectPreset = (presetKey: StatsDateRangePreset) => {
    if (!isSuperAdmin && presetKey !== 'today' && presetKey !== 'yesterday') {
      return;
    }
    setSelectedPreset(presetKey);
  };

  return (
    <div className="pt-20 pb-28 px-3.5 sm:px-5 w-full max-w-[1400px] mx-auto">
      {/* Header */}
      <section className="mb-4 sm:mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl sm:text-[28px] font-bold text-[#26170c] tracking-tight">
            Sales & Cafe Analytics
          </h2>
          <p className="text-xs sm:text-[15px] text-[#4f453f] mt-0.5">
            Real-time performance summary • Philippine Peso (₱)
          </p>
        </div>
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isLoadingRange}
          title="Refresh analytics data"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#e1e1c9] text-[#5e604d] hover:bg-[#d5d5b8] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-2xs whitespace-nowrap flex-shrink-0"
        >
          <span className={`material-symbols-outlined text-[16px] ${isLoadingRange ? 'animate-spin' : ''}`}>
            sync
          </span>
          <span>{isLoadingRange ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </section>

      {/* Date Range Selector Section */}
      <section className="mb-5 p-3 sm:p-4 bg-white rounded-2xl border border-[#dec1af]/60 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#81756e] flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-[#5e604d]">date_range</span>
            Reporting Period
          </span>
          {isLoadingRange && (
            <span className="text-[11px] font-semibold text-[#81756e] flex items-center gap-1 animate-pulse">
              <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
              Updating data...
            </span>
          )}
        </div>

        {/* Date Presets (Wrapping pills) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map((preset) => {
            const isSelected = selectedPreset === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => handleSelectPreset(preset.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#26170c] text-white shadow-xs'
                    : 'bg-[#f9f2f0] text-[#4f453f] hover:bg-[#eae2e0] border border-[#dec1af]/40'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Range Inputs */}
        {isSuperAdmin && selectedPreset === 'custom' && (
          <div className="pt-2 border-t border-[#dec1af]/30 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#4f453f] mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => handleCustomDateChange(e.target.value, customEnd)}
                  className="w-full px-3 py-1.5 text-xs bg-[#fff8f5] border border-[#dec1af] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#26170c] text-[#26170c] font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#4f453f] mb-1">
                  End Date (Inclusive)
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => handleCustomDateChange(customStart, e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#fff8f5] border border-[#dec1af] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#26170c] text-[#26170c] font-medium"
                />
              </div>
            </div>
            {customError && (
              <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {customError}
              </p>
            )}
          </div>
        )}
      </section>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-5 sm:mb-6">
        {/* Total Revenue */}
        <div className="p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm">
          <span className="text-xs font-semibold text-[#636451]">Total Revenue</span>
          <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#26170c] mt-1 truncate">
            ₱{summary.totalSales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h4>
          <span className="text-[11px] font-medium text-[#5e604d] flex items-center gap-0.5 mt-1">
            {summary.totalOrdersCount} {summary.totalOrdersCount === 1 ? 'order' : 'orders'} in period
          </span>
        </div>

        {/* Avg. Ticket */}
        <div className="p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm">
          <span className="text-xs font-semibold text-[#636451]">Avg. Ticket</span>
          <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#26170c] mt-1 truncate">
            ₱{summary.averageOrderValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h4>
          <span className="text-[11px] font-medium text-[#4f453f] mt-1 block">
            {summary.completedOrdersCount} completed
          </span>
        </div>

        {/* Orders / Cups */}
        <div className="p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm">
          <span className="text-xs font-semibold text-[#636451]">Cups & Items Served</span>
          <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#26170c] mt-1">{summary.cupsServed}</h4>
          <span className="text-[11px] font-semibold text-[#5e604d] mt-1 block">
            {goalPercentage}% of {dailyGoal} cup goal
          </span>
        </div>

        {/* Peak Rush */}
        <div className="p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm">
          <span className="text-xs font-semibold text-[#636451]">Peak Rush Window</span>
          <h4 className="font-serif text-lg sm:text-xl font-bold text-[#26170c] mt-1">
            {peakHourItem && peakHourItem.cups > 0 ? peakHourItem.time : 'No peak yet'}
          </h4>
          <span className="text-[11px] font-medium text-[#4f453f] mt-1 block">
            {peakHourItem && peakHourItem.cups > 0 ? `${peakHourItem.cups} items served` : 'Awaiting orders'}
          </span>
        </div>
      </div>

      {/* Hourly Sales Bar Chart (Dynamic by Selected Date Range) */}
      <section className="mb-5 sm:mb-6 p-4 sm:p-5 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#26170c]">
              Hourly Throughput — {rangeLabel}
            </h3>
            <p className="text-xs text-[#4f453f]">
              {selectedPreset === 'today'
                ? "Today's hourly sales in ₱"
                : selectedPreset === 'yesterday'
                ? "Yesterday's hourly sales in ₱"
                : `Hourly sales aggregated across ${rangeLabel.toLowerCase()} in ₱`}
            </p>
          </div>
          <span className="text-xs font-bold text-[#5e604d] bg-[#e1e1c9] px-2.5 py-1 rounded-full">
            {rangeLabel}
          </span>
        </div>

        {!hasHourlySales ? (
          <div className="py-8 text-center border-t border-dashed border-[#dec1af]/60">
            <span className="material-symbols-outlined text-[28px] text-[#81756e] mb-1">bar_chart</span>
            <p className="text-xs font-semibold text-[#26170c]">No Sales Recorded in Period</p>
            <p className="text-[11px] text-[#81756e] mt-0.5">
              Hourly sales volume bars calibrate dynamically as orders are fulfilled.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2 -mx-1 px-1">
            <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-36 pt-4 pb-2 border-b border-[#d2c4bc]/40 min-w-[620px] sm:min-w-0">
              {hourlyData.map((h, i) => {
                const barHeightPct = maxSales > 0 ? (h.sales / maxSales) * 100 : 0;
                const isPeak = peakHourItem && peakHourItem.time === h.time && h.sales > 0;
                return (
                  <div
                    key={i}
                    title={`${h.time}: ₱${h.sales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${h.cups} items)`}
                    className="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-[18px]"
                  >
                    <span className="text-[7px] sm:text-[8px] font-bold text-[#26170c] truncate max-w-full">
                      {h.sales > 0 ? `₱${(h.sales / 1000).toFixed(1)}k` : '₱0'}
                    </span>
                    <div
                      className={`w-full max-w-[18px] sm:max-w-[22px] rounded-t-sm sm:rounded-t-md transition-all duration-500 min-h-[4px] ${
                        isPeak ? 'bg-[#26170c]' : h.sales > 0 ? 'bg-[#5e604d]' : 'bg-[#e8e1df]'
                      }`}
                      style={{ height: `${Math.max(4, barHeightPct)}%` }}
                    />
                    <span className="text-[7px] sm:text-[9px] font-medium text-[#81756e] mt-1 whitespace-nowrap">
                      {h.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Top Performing Items for Selected Period */}
      <section className="p-4 sm:p-5 bg-[#eee7e4] rounded-2xl border border-[#e8e1df] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#26170c]">
            Top Bestselling Items
          </h3>
          <span className="text-[11px] font-semibold text-[#81756e]">
            {selectedPreset === 'alltime' ? 'All Time' : `${boundary.startDisplay} to ${boundary.endDisplay}`}
          </span>
        </div>

        {topProducts.length === 0 ? (
          <div className="py-6 text-center bg-white/50 rounded-xl border border-dashed border-[#dec1af]">
            <p className="text-xs font-semibold text-[#26170c]">No item sales in selected period</p>
            <p className="text-[11px] text-[#81756e] mt-0.5">
              Rankings update automatically as orders are placed and completed.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {(topProducts || []).slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-white/80 p-2.5 rounded-xl border border-[#dec1af]/30">
                <div className="min-w-0 flex-1 pr-2">
                  <span className="font-bold text-[#26170c] truncate block">{item.name}</span>
                  <p className="text-[11px] text-[#81756e]">
                    {item.count} sold ({item.percentage}%)
                  </p>
                </div>
                <span className="font-bold text-[#26170c] whitespace-nowrap">{item.formattedRevenue}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
