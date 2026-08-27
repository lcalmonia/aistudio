import React from 'react';
import { Order, MenuItem } from '../types';
import { reportingService } from '../services/reportingService';

interface StatsViewProps {
  orders: Order[];
  menuItems?: MenuItem[];
  dailyGoal: number;
}

export const StatsView: React.FC<StatsViewProps> = ({
  orders,
  menuItems = [],
  dailyGoal,
}) => {
  const summary = reportingService.calculateSalesSummary(orders);
  const hourlyData = reportingService.calculateHourlyThroughput(orders);
  const topProducts = reportingService.calculateTopSellingItems(orders, menuItems);

  const maxSales = Math.max(...hourlyData.map((d) => d.sales), 1);
  const goalPercentage = dailyGoal > 0 ? Math.min(100, Math.round((summary.cupsServed / dailyGoal) * 100)) : 0;

  // Find peak hour from real data
  const peakHourItem = [...hourlyData].sort((a, b) => b.cups - a.cups)[0];
  const hasSales = summary.totalSales > 0;

  return (
    <div className="pt-20 px-3.5 sm:px-5 max-w-lg mx-auto pb-28">
      {/* Header */}
      <section className="mb-5 sm:mb-6">
        <h2 className="font-serif text-2xl sm:text-[28px] font-bold text-[#26170c] tracking-tight">
          Sales & Cafe Analytics
        </h2>
        <p className="text-xs sm:text-[15px] text-[#4f453f] mt-0.5">
          Real-time performance summary • Philippine Peso (₱)
        </p>
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
            {summary.totalOrdersCount} {summary.totalOrdersCount === 1 ? 'order' : 'orders'} total
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

      {/* Hourly Sales Bar Chart */}
      <section className="mb-5 sm:mb-6 p-4 sm:p-5 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#26170c]">Hourly Throughput</h3>
            <p className="text-xs text-[#4f453f]">Today's hourly sales in ₱</p>
          </div>
          <span className="text-xs font-bold text-[#5e604d] bg-[#e1e1c9] px-2.5 py-1 rounded-full">
            Today
          </span>
        </div>

        {!hasSales ? (
          <div className="py-8 text-center border-t border-dashed border-[#dec1af]/60">
            <span className="material-symbols-outlined text-[28px] text-[#81756e] mb-1">bar_chart</span>
            <p className="text-xs font-semibold text-[#26170c]">No Sales Recorded Today</p>
            <p className="text-[11px] text-[#81756e] mt-0.5">
              Hourly sales volume bars will calibrate dynamically as orders are fulfilled.
            </p>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-36 pt-4 pb-2 border-b border-[#d2c4bc]/40">
            {hourlyData.map((h, i) => {
              const barHeightPct = maxSales > 0 ? (h.sales / maxSales) * 100 : 0;
              const isPeak = peakHourItem && peakHourItem.time === h.time && h.sales > 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[8px] sm:text-[9px] font-bold text-[#26170c]">
                    {h.sales > 0 ? `₱${(h.sales / 1000).toFixed(1)}k` : '₱0'}
                  </span>
                  <div
                    className={`w-full max-w-[24px] sm:max-w-[28px] rounded-t-lg transition-all duration-500 min-h-[4px] ${
                      isPeak ? 'bg-[#26170c]' : h.sales > 0 ? 'bg-[#5e604d]' : 'bg-[#e8e1df]'
                    }`}
                    style={{ height: `${Math.max(4, barHeightPct)}%` }}
                  />
                  <span className="text-[9px] sm:text-[10px] font-medium text-[#81756e] mt-1 truncate">
                    {h.time}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Top Performing Items */}
      <section className="p-4 sm:p-5 bg-[#eee7e4] rounded-2xl border border-[#e8e1df] shadow-sm">
        <h3 className="font-serif text-base sm:text-lg font-bold text-[#26170c] mb-3">
          Top Bestselling Items
        </h3>

        {topProducts.length === 0 ? (
          <div className="py-6 text-center bg-white/50 rounded-xl border border-dashed border-[#dec1af]">
            <p className="text-xs font-semibold text-[#26170c]">No item sales data yet</p>
            <p className="text-[11px] text-[#81756e] mt-0.5">
              Rankings update in real-time as customers order from the menu.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {topProducts.slice(0, 5).map((item, i) => (
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
