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
  orders = [],
  onViewAllOrders,
  onSelectOrder,
  cupsServed,
  dailyGoal,
  todaySales,
  newMembers,
  onLogBrew,
  onOpenNewOrder,
}) => {
  const activeOrdersCount = (orders || []).filter(
    (o) => o && (o.status === 'New' || o.status === 'Brewing' || o.status === 'Ready' || o.status === 'Preparing' || o.status === 'Pending')
  ).length;

  const goalPercentage = dailyGoal > 0 ? Math.min(100, Math.round((cupsServed / dailyGoal) * 100)) : 0;

  // Get recent 3 orders for display
  const recentOrders = (orders || []).slice(0, 3);

  return (
    <div className="pt-20 pb-28 px-3.5 sm:px-5 max-w-lg mx-auto">
      {/* Header Section */}
      <section className="mb-5 sm:mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl sm:text-[28px] font-bold text-[#26170c] tracking-tight leading-tight">
            Dashboard
          </h2>
          <p className="text-sm sm:text-[15px] text-[#4f453f] mt-0.5">Real-time store overview & active queue.</p>
        </div>
        <button
          onClick={onOpenNewOrder}
          className="px-3.5 py-2 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>New Order</span>
        </button>
      </section>

      {/* Bento Grid Metrics */}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-5 sm:mb-6">
        {/* Large Metric: Today's Sales */}
        <div className="col-span-2 p-4 sm:p-5 bg-[#f9f2f0] rounded-2xl shadow-[0_4px_12px_rgba(61,43,31,0.06)] relative overflow-hidden border border-[#f3ecea]">
          <div className="relative z-10">
            <p className="text-xs sm:text-sm font-semibold text-[#636451] mb-1">Today's Total Sales</p>
            <h3 className="font-serif text-2xl sm:text-3xl md:text-[40px] font-bold text-[#26170c] tracking-tight leading-tight truncate">
              ₱{todaySales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-[#5e604d] font-semibold text-xs">
              <span className="material-symbols-outlined text-[16px]">payments</span>
              <span>{orders.length} total orders recorded today</span>
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
            <p className="text-[11px] sm:text-xs font-semibold text-[#4f453f] mt-0.5">Active Queue</p>
          </div>
        </div>

        {/* Small Metric: Registered Customers */}
        <div className="p-3.5 sm:p-4 bg-[#f9f2f0] rounded-2xl shadow-[0_4px_12px_rgba(61,43,31,0.06)] flex flex-col justify-between border border-[#f3ecea]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#e1e1c9] rounded-full flex items-center justify-center mb-2 sm:mb-3">
            <span className="material-symbols-outlined text-[#636451] text-[18px] sm:text-[20px]">group</span>
          </div>
          <div>
            <h4 className="font-serif text-xl sm:text-[24px] font-bold text-[#26170c]">{newMembers}</h4>
            <p className="text-[11px] sm:text-xs font-semibold text-[#4f453f] mt-0.5">Registered Customers</p>
          </div>
        </div>
      </section>

      {/* Sales Targets Section (Daily Brew Goal) */}
      <section className="mb-6 sm:mb-7 p-4 sm:p-5 bg-[#eee7e4] rounded-2xl border border-[#e8e1df] shadow-[0_4px_12px_rgba(61,43,31,0.04)]">
        <div className="flex justify-between items-end mb-3.5 sm:mb-4">
          <div>
            <h3 className="font-serif text-lg sm:text-[22px] font-bold text-[#26170c]">Daily Brew Goal</h3>
            <p className="text-xs sm:text-sm text-[#4f453f] mt-0.5">Target: {dailyGoal} Cups / Drinks</p>
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
          <span className="text-[#636451] font-medium">
            {cupsServed >= dailyGoal ? 'Goal achieved for today!' : `${dailyGoal - cupsServed} cups remaining to goal`}
          </span>
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
          {orders.length > 0 && (
            <button
              onClick={onViewAllOrders}
              className="text-xs font-bold text-[#5e604d] hover:underline cursor-pointer"
            >
              View all ({orders.length})
            </button>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-6 bg-[#f9f2f0] rounded-2xl border border-dashed border-[#dec1af] text-center">
            <div className="w-12 h-12 rounded-full bg-[#dec1af]/30 flex items-center justify-center mx-auto mb-2 text-[#636451]">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <h4 className="font-serif text-base font-bold text-[#26170c]">No Orders Yet</h4>
            <p className="text-xs text-[#4f453f] mt-1 max-w-xs mx-auto">
              New customer orders from the online catalog or POS will appear here automatically.
            </p>
            <button
              onClick={onOpenNewOrder}
              className="mt-3 px-4 py-2 bg-[#26170c] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#3d2b1f] transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
              Create POS Order
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {recentOrders.map((order) => {
              const badgeBg =
                order.status === 'Ready'
                  ? 'bg-green-100 text-green-800'
                  : order.status === 'Completed'
                  ? 'bg-[#e8e1df] text-[#4f453f]'
                  : order.status === 'Cancelled'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-[#e1e1c9] text-[#636451]';

              const mainItemName = order.items[0]?.name || 'Specialty Drink';
              const itemCount = order.items.reduce((s, i) => s + (i.quantity || 1), 0);

              return (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="p-3 bg-[#f9f2f0] rounded-xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-[#f3ecea] transition-colors gap-2.5 border-l-4 border-[#5e604d]"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#e8e1df] rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                      {order.image ? (
                        <img
                          className="object-cover w-full h-full"
                          src={order.image}
                          alt={mainItemName}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-[20px] text-[#81756e]">local_cafe</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs sm:text-sm font-semibold text-[#26170c] truncate">
                        {mainItemName} {order.items.length > 1 ? `+${order.items.length - 1} more` : ''}
                      </h5>
                      <p className="text-[11px] sm:text-xs text-[#4f453f] truncate">
                        #{order.orderNumber} • {order.customerName} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-block px-2 sm:px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeBg}`}>
                      {order.status}
                    </span>
                    <p className="text-xs font-bold text-[#26170c] mt-0.5">
                      ₱{order.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
