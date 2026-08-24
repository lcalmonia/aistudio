import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import confetti from 'canvas-confetti';

interface ActiveOrdersViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onOpenNewOrder: () => void;
  onShowNotification: (msg: string) => void;
}

export const ActiveOrdersView: React.FC<ActiveOrdersViewProps> = ({
  orders,
  onUpdateOrderStatus,
  onOpenNewOrder,
  onShowNotification,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'New' | 'Brewing' | 'Ready' | 'Completed'>('All');
  const [activeMenuOrderId, setActiveMenuOrderId] = useState<string | null>(null);

  // Counts
  const newCount = orders.filter((o) => o.status === 'New').length;
  const brewingCount = orders.filter((o) => o.status === 'Brewing' || o.status === 'Preparing').length;
  const readyCount = orders.filter((o) => o.status === 'Ready').length;
  const completedCount = orders.filter((o) => o.status === 'Completed').length;
  const allActiveCount = orders.filter((o) => o.status !== 'Completed').length;

  const filteredOrders = orders.filter((order) => {
    if (selectedFilter === 'All') return order.status !== 'Completed';
    if (selectedFilter === 'New') return order.status === 'New';
    if (selectedFilter === 'Brewing') return order.status === 'Brewing' || order.status === 'Preparing';
    if (selectedFilter === 'Ready') return order.status === 'Ready';
    if (selectedFilter === 'Completed') return order.status === 'Completed';
    return true;
  });

  const handleStatusAdvance = (order: Order) => {
    if (order.status === 'New') {
      onUpdateOrderStatus(order.id, 'Brewing');
      onShowNotification(`Order #${order.orderNumber} is now brewing! ☕`);
    } else if (order.status === 'Brewing' || order.status === 'Preparing') {
      onUpdateOrderStatus(order.id, 'Ready');
      onShowNotification(`Order #${order.orderNumber} marked ready for pickup! 🔔`);
    } else if (order.status === 'Ready') {
      onUpdateOrderStatus(order.id, 'Completed');
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#26170c', '#8fbc8f', '#e1e1c9', '#fbddca']
      });
      onShowNotification(`Order #${order.orderNumber} completed! Have a great day.`);
    }
  };

  const handleRemindCustomer = (order: Order) => {
    onShowNotification(`Sent SMS reminder to ${order.customerName} (${order.customerPhone || 'customer'})! 📱`);
  };

  return (
    <div className="pt-20 px-3.5 sm:px-5 max-w-lg mx-auto pb-28">
      {/* Sub-header & Filter Tabs */}
      <section className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <h2 className="font-serif text-2xl sm:text-[28px] font-bold text-[#26170c] tracking-tight">
            Active Orders
          </h2>
          <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 bg-[#e1e1c9] text-[#636451] rounded-full whitespace-nowrap">
            Live Barista View
          </span>
        </div>

        {/* Scrollable Filter Chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrolling-hide no-scrollbar">
          <button
            onClick={() => setSelectedFilter('All')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${
              selectedFilter === 'All'
                ? 'bg-[#3d2b1f] text-[#ac9181] shadow-sm font-bold'
                : 'bg-[#f3ecea] text-[#4f453f] border border-[#d2c4bc] hover:bg-[#e8e1df]'
            }`}
          >
            All ({allActiveCount})
          </button>
          <button
            onClick={() => setSelectedFilter('New')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${
              selectedFilter === 'New'
                ? 'bg-[#3d2b1f] text-[#ac9181] shadow-sm font-bold'
                : 'bg-[#f3ecea] text-[#4f453f] border border-[#d2c4bc] hover:bg-[#e8e1df]'
            }`}
          >
            New ({newCount})
          </button>
          <button
            onClick={() => setSelectedFilter('Brewing')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${
              selectedFilter === 'Brewing'
                ? 'bg-[#3d2b1f] text-[#ac9181] shadow-sm font-bold'
                : 'bg-[#f3ecea] text-[#4f453f] border border-[#d2c4bc] hover:bg-[#e8e1df]'
            }`}
          >
            Brewing ({brewingCount})
          </button>
          <button
            onClick={() => setSelectedFilter('Ready')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${
              selectedFilter === 'Ready'
                ? 'bg-[#3d2b1f] text-[#ac9181] shadow-sm font-bold'
                : 'bg-[#f3ecea] text-[#4f453f] border border-[#d2c4bc] hover:bg-[#e8e1df]'
            }`}
          >
            Ready ({readyCount})
          </button>
          {completedCount > 0 && (
            <button
              onClick={() => setSelectedFilter('Completed')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${
                selectedFilter === 'Completed'
                  ? 'bg-[#3d2b1f] text-[#ac9181] shadow-sm font-bold'
                  : 'bg-[#f3ecea] text-[#4f453f] border border-[#d2c4bc] hover:bg-[#e8e1df]'
              }`}
            >
              Completed ({completedCount})
            </button>
          )}
        </div>
      </section>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] p-6">
            <div className="w-12 h-12 bg-[#e1e1c9] rounded-full flex items-center justify-center mx-auto mb-3 text-[#636451]">
              <span className="material-symbols-outlined">coffee</span>
            </div>
            <h4 className="font-serif text-lg font-bold text-[#26170c]">No orders in this state</h4>
            <p className="text-xs text-[#4f453f] mt-1">
              {selectedFilter === 'Completed'
                ? 'Completed orders will appear here as they are picked up.'
                : 'All caught up! Tap the + button to enter a new counter order.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order, idx) => {
            const isNew = order.status === 'New';
            const isBrewing = order.status === 'Brewing' || order.status === 'Preparing';
            const isReady = order.status === 'Ready';
            const isCompleted = order.status === 'Completed';

            let borderClass = 'border-l-4 border-[#5e604d]';
            let badgeClass = 'bg-[#e1e1c9] text-[#636451]';
            let statusLabel = 'BREWING';

            if (isNew) {
              borderClass = 'border-l-4 border-[#ba1a1a]';
              badgeClass = 'bg-[#ffdad6] text-[#93000a]';
              statusLabel = 'NEW';
            } else if (isReady) {
              borderClass = 'border-l-4 border-[#26170c]';
              badgeClass = 'bg-[#3d2b1f] text-[#ac9181]';
              statusLabel = 'READY';
            } else if (isCompleted) {
              borderClass = 'border-l-4 border-[#81756e]';
              badgeClass = 'bg-[#e8e1df] text-[#4f453f]';
              statusLabel = 'COMPLETED';
            }

            return (
              <React.Fragment key={order.id}>
                <article className={`bg-[#f9f2f0] rounded-2xl p-3.5 sm:p-4 shadow-[0_4px_12px_rgba(61,43,31,0.06)] ${borderClass} flex flex-col gap-3 transition-all relative border border-[#f3ecea]`}>
                  {/* Header Row */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                          {statusLabel}
                        </span>
                        <span className="text-[#4f453f] text-xs font-medium truncate">
                          #{order.orderNumber} • {order.timeAgo}
                        </span>
                        {order.customerId && (
                          <span className="px-1.5 py-0.2 bg-[#dec1af]/50 text-[#26170c] font-mono text-[10px] font-bold rounded">
                            {order.customerId}
                          </span>
                        )}
                        {order.orderType && (
                          <span className="px-1.5 py-0.2 bg-[#e1e1c9] text-[#636451] text-[10px] font-semibold rounded">
                            {order.orderType} {order.tableNumber ? `(${order.tableNumber})` : ''}
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-lg sm:text-[22px] font-bold text-[#26170c] truncate">
                        {order.customerName}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-[#81756e] mt-0.5 flex-wrap">
                        {order.customerPhone && (
                          <span>📞 {order.customerPhone}</span>
                        )}
                        {order.paymentMethod && (
                          <span>💳 {order.paymentMethod}</span>
                        )}
                        {order.deliveryAddress && (
                          <span className="truncate max-w-[200px]">📍 {order.deliveryAddress}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm sm:text-base font-bold text-[#26170c]">
                        ₱{order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="bg-[#e8e1df]/35 rounded-xl p-3 space-y-1.5">
                    {order.items.map((item, itemIdx) => {
                      const isStruck = isReady || isCompleted || item.completed;
                      return (
                        <p
                          key={itemIdx}
                          className={`text-sm text-[#1d1b1a] ${
                            isStruck ? 'line-through decoration-[#81756e] opacity-65' : ''
                          }`}
                        >
                          <span className="font-bold">{item.quantity}x</span> {item.name}{' '}
                          {item.customization && (
                            <span className="text-[#4f453f] text-xs font-normal">
                              ({item.customization})
                            </span>
                          )}
                        </p>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {isNew && (
                      <>
                        <button
                          onClick={() => handleStatusAdvance(order)}
                          className="flex-1 bg-[#8FBC8F] hover:bg-[#7ea97e] text-[#26170c] font-bold text-sm py-2.5 rounded-full transition-all active:scale-95 shadow-sm"
                        >
                          Accept Order
                        </button>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveMenuOrderId(activeMenuOrderId === order.id ? null : order.id)
                            }
                            className="p-2 text-[#4f453f] rounded-full border border-[#d2c4bc] hover:bg-[#f3ecea] transition-colors flex items-center justify-center"
                            aria-label="Order actions"
                          >
                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                          </button>
                          {activeMenuOrderId === order.id && (
                            <div className="absolute right-0 bottom-full mb-2 w-44 bg-white rounded-xl shadow-xl border border-[#e8e1df] py-1 z-20 text-xs">
                              <button
                                onClick={() => {
                                  onShowNotification(`Printed Barista ticket #${order.orderNumber}`);
                                  setActiveMenuOrderId(null);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-[#f3ecea] text-[#26170c] flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-[16px]">print</span>
                                Print Barista Chit
                              </button>
                              <button
                                onClick={() => {
                                  handleRemindCustomer(order);
                                  setActiveMenuOrderId(null);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-[#f3ecea] text-[#26170c] flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-[16px]">sms</span>
                                Text Customer
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {isBrewing && (
                      <button
                        onClick={() => handleStatusAdvance(order)}
                        className="flex-1 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-semibold text-sm py-2.5 rounded-full transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Ready for Pickup
                      </button>
                    )}

                    {isReady && (
                      <>
                        <button
                          onClick={() => handleStatusAdvance(order)}
                          className="flex-1 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-semibold text-sm py-2.5 rounded-full transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[18px]">done_all</span>
                          Complete Order
                        </button>
                        <button
                          onClick={() => handleRemindCustomer(order)}
                          className="bg-[#f3ecea] text-[#4f453f] hover:bg-[#e8e1df] px-4 py-2.5 rounded-full text-xs font-semibold border border-[#d2c4bc] transition-all active:scale-95"
                        >
                          Remind
                        </button>
                      </>
                    )}

                    {isCompleted && (
                      <div className="w-full flex items-center justify-between text-xs text-[#5e604d] font-medium py-1">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-[#8fbc8f]">check_circle</span>
                          Picked up & finalized
                        </span>
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'Brewing')}
                          className="text-[#81756e] hover:underline"
                        >
                          Reopen
                        </button>
                      </div>
                    )}
                  </div>
                </article>

                {/* Atmosphere Card injected after 2nd order (matching Image 3 design) */}
                {idx === 1 && (
                  <div className="relative h-48 rounded-2xl overflow-hidden my-4 group shadow-md border border-[#26170c]/10">
                    <div className="absolute inset-0 bg-[#26170c]/40 z-10" />
                    <div
                      className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{
                        backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuC4q_k-h8c5xkS9Ugc-Hxu7JQhOuiUWNjnY_lrIv_Ug1wNGQ7s5Dqyk9fzRaIL5rcUYsLki70EV-7Mf9f2PImOqwH8ZBrGdq6wcm8kOfoUk1r_N1FlpuaeVS36SML8Jujd2ux7_R_5cTGzDBvBPqwyw6L9BrcV5x5g6RqSKFKHsCTNt24cKe6jTAmP_cLISMak30IoDYfs3gjUVVKnJcanTdu7IPB9gcTHlCVs2VQ9IbisQu1OD7wls')`
                      }}
                    />
                    <div className="absolute bottom-4 left-4 z-20 text-white">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="w-2 h-2 rounded-full bg-[#8fbc8f] animate-ping" />
                        <h4 className="font-serif text-[22px] font-bold text-white leading-tight">
                          Cafe Pulse
                        </h4>
                      </div>
                      <p className="text-xs text-white/90 font-medium">
                        {allActiveCount + 2} orders in queue • Avg. prep time: 4m
                      </p>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
};
