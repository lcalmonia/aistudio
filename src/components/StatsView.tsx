import React from 'react';

interface StatsViewProps {
  todaySales: number;
  cupsServed: number;
  dailyGoal: number;
}

export const StatsView: React.FC<StatsViewProps> = ({
  todaySales,
  cupsServed,
  dailyGoal,
}) => {
  const hourlyData = [
    { time: '7 AM', cups: 18, sales: 2450 },
    { time: '8 AM', cups: 45, sales: 6200 },
    { time: '9 AM', cups: 62, sales: 8550 },
    { time: '10 AM', cups: 51, sales: 7100 },
    { time: '11 AM', cups: 34, sales: 4800 },
    { time: '12 PM', cups: 22, sales: 3200 },
    { time: '1 PM', cups: 10, sales: 1450 },
  ];

  const maxSales = Math.max(...hourlyData.map((d) => d.sales));

  return (
    <div className="pt-20 px-5 max-w-lg mx-auto pb-28">
      {/* Header */}
      <section className="mb-6">
        <h2 className="font-serif text-[28px] font-bold text-[#26170c] tracking-tight">
          Sales & Cafe Analytics
        </h2>
        <p className="text-[15px] text-[#4f453f] mt-0.5">Real-time performance summary • Philippine Peso (₱)</p>
      </section>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm">
          <span className="text-xs font-semibold text-[#636451]">Total Revenue</span>
          <h4 className="font-serif text-2xl font-bold text-[#26170c] mt-1">
            ₱{todaySales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h4>
          <span className="text-[11px] font-bold text-[#5e604d] flex items-center gap-0.5 mt-1">
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +12.5% vs avg
          </span>
        </div>

        <div className="p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm">
          <span className="text-xs font-semibold text-[#636451]">Avg. Ticket</span>
          <h4 className="font-serif text-2xl font-bold text-[#26170c] mt-1">₱325.50</h4>
          <span className="text-[11px] font-medium text-[#4f453f] mt-1 block">2.4 items / order</span>
        </div>

        <div className="p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm">
          <span className="text-xs font-semibold text-[#636451]">Orders / Cups</span>
          <h4 className="font-serif text-2xl font-bold text-[#26170c] mt-1">{cupsServed}</h4>
          <span className="text-[11px] font-semibold text-[#5e604d] mt-1 block">
            {Math.round((cupsServed / dailyGoal) * 100)}% of goal
          </span>
        </div>

        <div className="p-4 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm">
          <span className="text-xs font-semibold text-[#636451]">Peak Rush</span>
          <h4 className="font-serif text-xl font-bold text-[#26170c] mt-1">9:00 - 10:15 AM</h4>
          <span className="text-[11px] font-medium text-[#4f453f] mt-1 block">62 orders / hour</span>
        </div>
      </div>

      {/* Hourly Sales Bar Chart */}
      <section className="mb-6 p-5 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#26170c]">Hourly Throughput</h3>
            <p className="text-xs text-[#4f453f]">Today's hourly sales in ₱</p>
          </div>
          <span className="text-xs font-bold text-[#5e604d] bg-[#e1e1c9] px-2.5 py-1 rounded-full">
            Today
          </span>
        </div>

        <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-2 border-b border-[#d2c4bc]/40">
          {hourlyData.map((h, i) => {
            const barHeightPct = (h.sales / maxSales) * 100;
            const isPeak = h.time === '9 AM';
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[9px] font-bold text-[#26170c]">
                  ₱{(h.sales / 1000).toFixed(1)}k
                </span>
                <div
                  className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ${
                    isPeak ? 'bg-[#26170c]' : 'bg-[#5e604d]'
                  }`}
                  style={{ height: `${barHeightPct}%` }}
                />
                <span className="text-[10px] font-medium text-[#81756e] mt-1">{h.time}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top Performing Items */}
      <section className="p-5 bg-[#eee7e4] rounded-2xl border border-[#e8e1df] shadow-sm">
        <h3 className="font-serif text-lg font-bold text-[#26170c] mb-3">
          Top Bestselling Items
        </h3>
        <div className="space-y-3">
          {[
            { name: 'Spanish Latte (Signature)', count: 94, pct: '34%', rev: '₱13,630.00' },
            { name: 'Signature Ube Tub Cake', count: 58, pct: '21%', rev: '₱11,310.00' },
            { name: 'Creamy Truffle Bacon Carbonara', count: 42, pct: '15%', rev: '₱8,820.00' },
            { name: 'Ceremonial Matcha Latte', count: 36, pct: '13%', rev: '₱5,760.00' },
            { name: 'Classic Beef Tapa Rice Bowl', count: 30, pct: '11%', rev: '₱5,850.00' },
          ].map((drink, i) => (
            <div key={i} className="flex items-center justify-between text-xs bg-white/70 p-2.5 rounded-xl">
              <div>
                <span className="font-bold text-[#26170c]">{drink.name}</span>
                <p className="text-[11px] text-[#81756e]">{drink.count} sold ({drink.pct})</p>
              </div>
              <span className="font-bold text-[#26170c]">{drink.rev}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
