import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Order, MenuItem, AdminPrincipal } from '../types';
import { reportingService } from '../services/reportingService';
import { orderService } from '../services/orderService';
import { statsResetService } from '../services/statsResetService';
import { StatsDateRangePreset, computeDateRangeBoundaries, formatLocalDateToInput } from '../utils/dateRange';

interface StatsViewProps {
  orders?: Order[];
  menuItems?: MenuItem[];
  dailyGoal?: number;
  onRefresh?: () => Promise<void> | void;
  admin?: AdminPrincipal | null;
}

type PaymentTotals = { GCash: number; Maya: number; Cash: number; Card: number; Unspecified: number };

const EMPTY_PAYMENT_TOTALS: PaymentTotals = { GCash: 0, Maya: 0, Cash: 0, Card: 0, Unspecified: 0 };

function parsePaymentBreakdown(paymentMethod: unknown, orderTotal: number): PaymentTotals {
  const result = { ...EMPTY_PAYMENT_TOTALS };
  const raw = typeof paymentMethod === 'string' ? paymentMethod.trim() : '';
  if (!raw) {
    result.Unspecified += orderTotal;
    return result;
  }

  const splitPrefix = 'Split Payment: ';
  if (!raw.startsWith(splitPrefix)) {
    if (raw === 'GCash' || raw === 'Maya' || raw === 'Cash' || raw === 'Card') result[raw] += orderTotal;
    else result.Unspecified += orderTotal;
    return result;
  }

  const entries = raw.slice(splitPrefix.length).split(' + ');
  let parsedTotal = 0;
  entries.forEach((entry) => {
    const match = entry.trim().match(/^(GCash|Maya|Cash|Card)\s+₱?([\d,]+(?:\.\d{1,2})?)$/i);
    if (!match) return;
    const method = match[1] as keyof Omit<PaymentTotals, 'Unspecified'>;
    const amount = Number(match[2].replace(/,/g, ''));
    if (!Number.isFinite(amount) || amount < 0) return;
    result[method] += amount;
    parsedTotal += amount;
  });

  if (Math.abs(parsedTotal - orderTotal) > 0.01) result.Unspecified += Math.max(0, orderTotal - parsedTotal);
  return result;
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
  const [customStart, setCustomStart] = useState(() => formatLocalDateToInput(new Date()));
  const [customEnd, setCustomEnd] = useState(() => formatLocalDateToInput(new Date()));
  const [customError, setCustomError] = useState<string | null>(null);
  const [rangeOrders, setRangeOrders] = useState<Order[]>([]);
  const [isLoadingRange, setIsLoadingRange] = useState(false);
  const [statsResetAt, setStatsResetAt] = useState<string | null>(null);
  const [isResettingStats, setIsResettingStats] = useState(false);

  useEffect(() => {
    let active = true;
    statsResetService.getResetAt()
      .then((resetAt) => { if (active) setStatsResetAt(resetAt); })
      .catch((err) => console.error('[StatsView] Failed to load stats reset state:', err));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isSuperAdmin && selectedPreset !== 'today' && selectedPreset !== 'yesterday') setSelectedPreset('today');
  }, [isSuperAdmin, selectedPreset]);

  const boundary = useMemo(() => {
    const effectivePreset = !isSuperAdmin && selectedPreset !== 'today' && selectedPreset !== 'yesterday' ? 'today' : selectedPreset;
    return computeDateRangeBoundaries(effectivePreset, customStart, customEnd);
  }, [isSuperAdmin, selectedPreset, customStart, customEnd]);

  const fetchRangeOrders = useCallback(async () => {
    try {
      setIsLoadingRange(true);
      const resetMs = statsResetAt ? new Date(statsResetAt).getTime() : 0;
      if (boundary.isAllTime) {
        setRangeOrders(await orderService.listOrders({ startDate: resetMs > 0 ? new Date(resetMs).toISOString() : undefined, limit: 10000 }));
        return;
      }
      const startMs = boundary.startDate ? new Date(boundary.startDate).getTime() : 0;
      const endMs = boundary.endDate ? new Date(boundary.endDate).getTime() : Number.POSITIVE_INFINITY;
      const effectiveStartMs = Math.max(startMs, resetMs);
      if (effectiveStartMs > endMs) {
        setRangeOrders([]);
        return;
      }
      setRangeOrders(await orderService.listOrders({
        startDate: effectiveStartMs > 0 ? new Date(effectiveStartMs).toISOString() : boundary.startDate,
        endDate: boundary.endDate,
        limit: 10000,
      }));
    } catch (err) {
      console.error('[StatsView] Failed to fetch range orders:', err);
      if (boundary.isAllTime) setRangeOrders(propOrders);
      else if (boundary.startDate && boundary.endDate) {
        const startMs = new Date(boundary.startDate).getTime();
        const endMs = new Date(boundary.endDate).getTime();
        setRangeOrders(propOrders.filter((o) => o.timestamp >= startMs && o.timestamp <= endMs));
      }
    } finally {
      setIsLoadingRange(false);
    }
  }, [boundary.isAllTime, boundary.startDate, boundary.endDate, propOrders, statsResetAt]);

  useEffect(() => { fetchRangeOrders(); }, [fetchRangeOrders]);

  const handleManualRefresh = async () => {
    if (isLoadingRange) return;
    try { await onRefresh?.(); } catch (err) { console.error('[StatsView] Parent refresh failed:', err); }
    await fetchRangeOrders();
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStart(start);
    setCustomEnd(end);
    setCustomError(start && end && start > end ? 'Start date cannot be after end date.' : null);
  };

  const summary = useMemo(() => reportingService.calculateSalesSummary(rangeOrders), [rangeOrders]);

  const paymentBreakdown = useMemo(() => {
    const breakdown = { ...EMPTY_PAYMENT_TOTALS };
    rangeOrders.filter((order) => order && order.status !== 'Cancelled').forEach((order) => {
      const parsed = parsePaymentBreakdown(order.paymentMethod, Number(order.total) || 0);
      breakdown.GCash += parsed.GCash;
      breakdown.Maya += parsed.Maya;
      breakdown.Cash += parsed.Cash;
      breakdown.Card += parsed.Card;
      breakdown.Unspecified += parsed.Unspecified;
    });
    return breakdown;
  }, [rangeOrders]);

  const topProducts = useMemo(() => reportingService.calculateTopSellingItems(rangeOrders, menuItems), [rangeOrders, menuItems]);
  const hourlyData = useMemo(() => reportingService.calculateHourlyThroughput(rangeOrders), [rangeOrders]);
  const maxSales = Math.max(...hourlyData.map((d) => d.sales), 1);
  const goalPercentage = dailyGoal > 0 ? Math.min(100, Math.round((summary.cupsServed / dailyGoal) * 100)) : 0;
  const peakHourItem = [...hourlyData].sort((a, b) => b.cups - a.cups)[0];
  const hasHourlySales = hourlyData.some((h) => h.sales > 0);

  const rangeLabel = useMemo(() => {
    if (selectedPreset === 'today') return 'Today';
    if (selectedPreset === 'yesterday') return 'Yesterday';
    if (selectedPreset === 'last7days') return 'Last 7 Days';
    if (selectedPreset === 'thismonth') return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    if (selectedPreset === 'alltime') return 'All Time';
    return `${boundary.startDisplay} to ${boundary.endDisplay}`;
  }, [selectedPreset, boundary.startDisplay, boundary.endDisplay]);

  const presets: { key: StatsDateRangePreset; label: string }[] = useMemo(() => isSuperAdmin
    ? [
        { key: 'today', label: 'Today' }, { key: 'yesterday', label: 'Yesterday' }, { key: 'last7days', label: 'Last 7 Days' },
        { key: 'thismonth', label: 'This Month' }, { key: 'alltime', label: 'All Time' }, { key: 'custom', label: 'Custom Range' },
      ]
    : [{ key: 'today', label: 'Today' }, { key: 'yesterday', label: 'Yesterday' }], [isSuperAdmin]);

  const handleResetStats = async () => {
    if (!isSuperAdmin || isResettingStats) return;
    if (!window.confirm('RESET SALES STATISTICS? This clears the Stats tab by starting a new reporting period now. Orders and other records are NOT deleted.')) return;
    try {
      setIsResettingStats(true);
      const resetAt = await statsResetService.reset();
      setStatsResetAt(resetAt);
      setRangeOrders([]);
    } catch (error) {
      console.error('[StatsView] Failed to reset stats:', error);
      window.alert('Unable to reset sales statistics. No records were changed.');
    } finally { setIsResettingStats(false); }
  };

  return (
    <div className="pt-20 pb-28 px-3.5 sm:px-5 w-full max-w-[1400px] mx-auto">
      <section className="mb-4 sm:mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl sm:text-[28px] font-bold text-[#26170c] tracking-tight">Sales & Cafe Analytics</h2>
          <p className="text-xs sm:text-[15px] text-[#4f453f] mt-0.5">Real-time performance summary • Philippine Peso (₱)</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleManualRefresh} disabled={isLoadingRange} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#e1e1c9] text-[#5e604d] disabled:opacity-50">
            <span className={`material-symbols-outlined text-[16px] ${isLoadingRange ? 'animate-spin' : ''}`}>sync</span>{isLoadingRange ? 'Refreshing...' : 'Refresh'}
          </button>
          {isSuperAdmin && <button type="button" onClick={handleResetStats} disabled={isResettingStats} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#ffdad6] text-[#93000a] border border-[#f2b8b5] disabled:opacity-50"><span className="material-symbols-outlined text-[16px]">delete_sweep</span>{isResettingStats ? 'Resetting...' : 'Reset Stats'}</button>}
        </div>
      </section>

      <section className="mb-5 p-3 sm:p-4 bg-white rounded-2xl border border-[#dec1af]/60 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2"><span className="text-[11px] font-bold uppercase tracking-wider text-[#81756e] flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-[#5e604d]">date_range</span>Reporting Period</span>{isLoadingRange && <span className="text-[11px] text-[#81756e]">Updating data...</span>}</div>
        <div className="flex flex-wrap items-center gap-1.5">{presets.map((preset) => <button key={preset.key} type="button" onClick={() => setSelectedPreset(preset.key)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedPreset === preset.key ? 'bg-[#26170c] text-white' : 'bg-[#f9f2f0] text-[#4f453f] border border-[#dec1af]/40'}`}>{preset.label}</button>)}</div>
        {isSuperAdmin && selectedPreset === 'custom' && <div className="pt-2 border-t border-[#dec1af]/30 grid grid-cols-1 sm:grid-cols-2 gap-2.5"><div><label className="block text-[11px] font-bold text-[#4f453f] mb-1">Start Date</label><input type="date" value={customStart} onChange={(e) => handleCustomDateChange(e.target.value, customEnd)} className="w-full px-3 py-1.5 text-xs bg-[#fff8f5] border border-[#dec1af] rounded-lg" /></div><div><label className="block text-[11px] font-bold text-[#4f453f] mb-1">End Date (Inclusive)</label><input type="date" value={customEnd} onChange={(e) => handleCustomDateChange(customStart, e.target.value)} className="w-full px-3 py-1.5 text-xs bg-[#fff8f5] border border-[#dec1af] rounded-lg" /></div>{customError && <p className="text-[11px] font-semibold text-rose-600 sm:col-span-2">{customError}</p>}</div>}
      </section>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-5 sm:mb-6">
        <div className="p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm">
          <span className="text-xs font-semibold text-[#636451]">Total Revenue</span>
          <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#26170c] mt-1">₱{summary.totalSales.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}</h4>
          <span className="text-[11px] font-medium text-[#5e604d]">{summary.totalOrdersCount} {summary.totalOrdersCount === 1 ? 'order' : 'orders'} in period</span>
          <div className="mt-3 pt-3 border-t border-[#dec1af]/50"><span className="text-[10px] font-bold uppercase tracking-wider text-[#81756e]">Payment Breakdown</span><div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">{(['GCash','Maya','Cash','Card'] as const).map((method) => <div key={method} className="flex items-center justify-between gap-2 text-[10px]"><span className="font-semibold text-[#4f453f]">{method}</span><span className="font-bold text-[#26170c]">₱{paymentBreakdown[method].toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>)}</div>{paymentBreakdown.Unspecified > 0 && <div className="flex items-center justify-between gap-2 text-[10px] mt-1.5 pt-1.5 border-t border-[#dec1af]/30"><span className="font-semibold text-[#81756e]">Unspecified</span><span className="font-bold text-[#81756e]">₱{paymentBreakdown.Unspecified.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>}</div>
        </div>
        <div className="p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm"><span className="text-xs font-semibold text-[#636451]">Avg. Ticket</span><h4 className="font-serif text-xl sm:text-2xl font-bold text-[#26170c] mt-1">₱{summary.averageOrderValue.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}</h4><span className="text-[11px] font-medium text-[#4f453f] mt-1 block">{summary.completedOrdersCount} completed</span></div>
        <div className="p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm"><span className="text-xs font-semibold text-[#636451]">Cups & Items Served</span><h4 className="font-serif text-xl sm:text-2xl font-bold text-[#26170c] mt-1">{summary.cupsServed}</h4><span className="text-[11px] font-semibold text-[#5e604d] mt-1 block">{goalPercentage}% of {dailyGoal} cup goal</span></div>
        <div className="p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm"><span className="text-xs font-semibold text-[#636451]">Peak Rush Window</span><h4 className="font-serif text-lg sm:text-xl font-bold text-[#26170c] mt-1">{peakHourItem && peakHourItem.cups > 0 ? peakHourItem.time : 'No peak yet'}</h4><span className="text-[11px] font-medium text-[#4f453f] mt-1 block">{peakHourItem && peakHourItem.cups > 0 ? `${peakHourItem.cups} items served` : 'Awaiting orders'}</span></div>
      </div>

      <section className="mb-5 sm:mb-6 p-4 sm:p-5 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm">
        <div className="flex justify-between items-center mb-4"><div><h3 className="font-serif text-base sm:text-lg font-bold text-[#26170c]">Hourly Throughput — {rangeLabel}</h3><p className="text-xs text-[#4f453f]">{selectedPreset === 'today' ? "Today's hourly sales in ₱" : selectedPreset === 'yesterday' ? "Yesterday's hourly sales in ₱" : `Hourly sales aggregated across ${rangeLabel.toLowerCase()} in ₱`}</p></div><span className="text-xs font-bold text-[#5e604d] bg-[#e1e1c9] px-2.5 py-1 rounded-full">{rangeLabel}</span></div>
        {!hasHourlySales ? <div className="py-8 text-center border-t border-dashed border-[#dec1af]/60"><span className="material-symbols-outlined text-[28px] text-[#81756e]">bar_chart</span><p className="text-xs font-semibold text-[#26170c]">No Sales Recorded in Period</p></div> : <div className="overflow-x-auto pb-2 -mx-1 px-1"><div className="flex items-end justify-between gap-1 sm:gap-1.5 h-36 pt-4 pb-2 border-b border-[#d2c4bc]/40 min-w-[620px] sm:min-w-0">{hourlyData.map((h,i) => { const height = maxSales > 0 ? (h.sales/maxSales)*100 : 0; const isPeak = peakHourItem && peakHourItem.time === h.time && h.sales > 0; return <div key={i} title={`${h.time}: ₱${h.sales.toFixed(2)} (${h.cups} items)`} className="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-[18px]"><span className="text-[7px] sm:text-[8px] font-bold text-[#26170c]">{h.sales > 0 ? `₱${(h.sales/1000).toFixed(1)}k` : '₱0'}</span><div className={`w-full max-w-[18px] sm:max-w-[22px] rounded-t-md min-h-[4px] ${isPeak ? 'bg-[#26170c]' : h.sales > 0 ? 'bg-[#5e604d]' : 'bg-[#e8e1df]'}`} style={{height:`${Math.max(4,height)}%`}} /><span className="text-[7px] sm:text-[9px] font-medium text-[#81756e] mt-1 whitespace-nowrap">{h.time}</span></div>; })}</div></div>}
      </section>

      <section className="p-4 sm:p-5 bg-[#eee7e4] rounded-2xl border border-[#e8e1df] shadow-sm"><div className="flex items-center justify-between mb-3"><h3 className="font-serif text-base sm:text-lg font-bold text-[#26170c]">Top Bestselling Items</h3><span className="text-[11px] font-semibold text-[#81756e]">{selectedPreset === 'alltime' ? 'All Time' : `${boundary.startDisplay} to ${boundary.endDisplay}`}</span></div>{topProducts.length === 0 ? <div className="py-6 text-center bg-white/50 rounded-xl border border-dashed border-[#dec1af]"><p className="text-xs font-semibold text-[#26170c]">No item sales in selected period</p></div> : <div className="space-y-2.5">{topProducts.slice(0,5).map((item,i) => <div key={i} className="flex items-center justify-between text-xs bg-white/80 p-2.5 rounded-xl border border-[#dec1af]/30"><div className="min-w-0 flex-1 pr-2"><span className="font-bold text-[#26170c] truncate block">{item.name}</span><p className="text-[11px] text-[#81756e]">{item.count} sold ({item.percentage}%)</p></div><span className="font-bold text-[#26170c] whitespace-nowrap">{item.formattedRevenue}</span></div>)}</div>}</section>
    </div>
  );
};
