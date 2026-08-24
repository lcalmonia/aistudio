import React from 'react';
import { Order } from '../types';

interface DashboardViewProps {
  orders: Order[];
  onViewAllOrders: () => void;
  onSelectOrder: (order: Order) => void;
  cupsServed: number;
  dailyGoal: number;
  todaySales: number;
  newMembers: number;
  onLogBrew: () => void;
  onOpenNewOrder: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  onViewAllOrders,
  onSelectOrder,
  cupsServed,
  dailyGoal,
  todaySales,
  newMembers,
  onLogBrew,
  onOpenNewOrder,
}) => {
  const activeOrdersCount = orders.filter(
    (o) => o.status === 'New' || o.status === 'Brewing' || o.status === 'Ready' || o.status === 'Preparing' || o.status === 'Pending'
  ).length;

  const goalPercentage = Math.min(100, Math.round((cupsServed / dailyGoal) * 100));

  // Get recent 2-3 orders for display
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="pt-20 pb-28 px-3.5 sm:px-5 max-w-lg mx-auto">
      {/* Header Section */}
      <section className="mb-5 sm:mb-6">
        <h2 className="font-serif text-2xl sm:text-[28px] font-bold text-[#26170c] tracking-tight leading-tight">
          Dashboard
        </h2>
        <p className="text-sm sm:text-[15px] text-[#4f453f] mt-0.5">Here's what's happening today.</p>
      </section>

      {/* Bento Grid Metrics */}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-5 sm:mb-6">
        {/* Large Metric: Today's Sales */}
        <div className="col-span-2 p-4 sm:p-5 bg-[#f9f2f0] rounded-2xl shadow-[0_4px_12px_rgba(61,43,31,0.06)] relative overflow-hidden border border-[#f3ecea]">
          <div className="relative z-10">
            <p className="text-xs sm:text-sm font-semibold text-[#636451] mb-1">Today's Sales</p>
            <h3 className="font-serif text-2xl sm:text-3xl md:text-[40px] font-bold text-[#26170c] tracking-tight leading-tight truncate">
              ₱{todaySales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center gap-1.5 mt-2.5 sm:mt-3 text-[#5e604d] font-bold text-xs">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">trending_up</span>
              <span>+12.5% from yesterday</span>
            </div>
          </div>
          {/* Abstract organic shape */}
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#e1e1c9]/40 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Small Metric: Active Orders */}
        <div
          onClick={onViewAllOrders}
          className="p-3.5 sm:p-4 bg-[#f9f2f0] rounded-2xl shadow-[0_4px_12px_rgba(61,43,31,0.06)] flex flex-col justify-between cursor-pointer hover:bg-[#f3ecea] transition-colors border border-[#f3ecea]"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#3d2b1f] rounded-full flex items-center justify-center mb-2 sm:mb-3">
            <span className="material-symbols-outlined text-[#ac9181] text-[18px] sm:text-[20px]">coffee</span>
          </div>
          <div>
            <h4 className="font-serif text-xl sm:text-[24px] font-bold text-[#26170c]">{activeOrdersCount}</h4>
            <p className="text-[11px] sm:text-xs font-semibold text-[#4f453f] mt-0.5">Active Orders</p>
          </div>
        </div>

        {/* Small Metric: New Members */}
        <div className="p-3.5 sm:p-4 bg-[#f9f2f0] rounded-2xl shadow-[0_4px_12px_rgba(61,43,31,0.06)] flex flex-col justify-between border border-[#f3ecea]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#e1e1c9] rounded-full flex items-center justify-center mb-2 sm:mb-3">
            <span className="material-symbols-outlined text-[#636451] text-[18px] sm:text-[20px]">person_add</span>
          </div>
          <div>
            <h4 className="font-serif text-xl sm:text-[24px] font-bold text-[#26170c]">{newMembers}</h4>
            <p className="text-[11px] sm:text-xs font-semibold text-[#4f453f] mt-0.5">New Members</p>
          </div>
        </div>
      </section>

      {/* Sales Targets Section (Daily Brew Goal) */}
      <section className="mb-6 sm:mb-7 p-4 sm:p-5 bg-[#eee7e4] rounded-2xl border border-[#e8e1df] shadow-[0_4px_12px_rgba(61,43,31,0.04)]">
        <div className="flex justify-between items-end mb-3.5 sm:mb-4">
          <div>
            <h3 className="font-serif text-lg sm:text-[22px] font-bold text-[#26170c]">Daily Brew Goal</h3>
            <p className="text-xs sm:text-sm text-[#4f453f] mt-0.5">Target: {dailyGoal} Cups</p>
          </div>
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#5e604d] animate-steam absolute top-0.5 left-1/3 text-[14px] sm:text-[16px]">
              filter_vintage
            </span>
            <span className="material-symbols-outlined text-[#26170c] text-[26px] sm:text-[32px]">
              local_cafe
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-[#1d1b1a]">
            <span>{cupsServed} cups served</span>
            <span>{goalPercentage}%</span>
          </div>
          <div className="h-3 w-full bg-[#e8e1df] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5e604d] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${goalPercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Log Action */}
        <div className="mt-4 pt-3 border-t border-[#d2c4bc]/40 flex justify-between items-center text-xs">
          <span className="text-[#636451] font-medium">Rush status: On pace</span>
          <button
            onClick={onLogBrew}
            className="px-3 py-1.5 bg-[#fff8f5] hover:bg-white text-[#26170c] font-semibold rounded-full border border-[#d2c4bc] shadow-sm transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            Log Cup
          </button>
        </div>
      </section>

      {/* Live Orders Section */}
      <section className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-serif text-lg sm:text-[20px] font-bold text-[#26170c]">Recent Orders</h3>
          <button
            onClick={onViewAllOrders}
            className="text-xs font-bold text-[#5e604d] hover:underline cursor-pointer"
          >
            View all
          </button>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {recentOrders.map((order, idx) => {
            const isOatLatte = order.orderNumber === 'AB-4421' || idx === 0;
            const borderClass = isOatLatte ? 'border-l-4 border-[#5e604d]' : 'border-l-4 border-[#d2c4bc]';
            const badgeText = order.status === 'New' ? 'Preparing' : order.status === 'Ready' ? 'Ready' : order.status === 'Brewing' ? 'Preparing' : 'Pending';
            const badgeBg = isOatLatte ? 'bg-[#e1e1c9] text-[#636451]' : 'bg-[#e8e1df] text-[#4f453f]';

            const defaultImg = isOatLatte
              ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEPK9an39rFEkfnp4LRaMqlPguV-s_RqdDV3FcNMZJuxAA2NG3s4Vj1YCqZGozzqYBUaORRDaOp1QySWD3zavJSY4WfpCoG_tOmX6LnCt7kbG-aSamCO4-gV_vKuAsnEqCQcBJQV1oJXYCXqiAz0xdScWn3LHH2FL9FY8Os11FNYgSA8OYNMaTpGUSs6lVsJ4RLjDLzmTHawjWGN39KIROIBlVnGpeNKU6y-nW8S2RGne8Y87fgfSG'
              : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmh1VJlNrtaKb9bbtKPTLK4IphKvCgpGc1kJMjlcZ4qzTW0_7t-9hcffyNkhWQyBKjbnMBs1uepxo43ktt9u0jFkTPpZV84m34YO0G4HFZsoIUlmJatcfLBJQlG2nxudO94hIvWms1qlw4R6EluIGUP6WzrHLppvfZVDk0dW2mc3j0niFNR7upTXtEOGW0BX5aRUxW_VRi9nckzxIcfBVxhPHMIMZBglRRwaxwPqZM7RTlWgYVfsnJ';

            const mainItemName = order.items[0]?.name || 'Espresso Drink';

            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className={`p-3 bg-[#f9f2f0] rounded-xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-[#f3ecea] transition-colors gap-2.5 ${borderClass}`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#e8e1df] rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                    <img
                      className="object-cover w-full h-full"
                      src={order.image || defaultImg}
                      alt={mainItemName}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs sm:text-sm font-semibold text-[#26170c] truncate">{mainItemName}</h5>
                    <p className="text-[11px] sm:text-xs text-[#4f453f] truncate">
                      Order #{order.orderNumber} • {order.timeAgo}
                    </p>
                  </div>
                </div>
                <span className={`px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap flex-shrink-0 ${badgeBg}`}>
                  {badgeText}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
