import React, { useState } from 'react';
import { AdminPrincipal, Order, OrderStatus } from '../types';
import confetti from 'canvas-confetti';

interface ActiveOrdersViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, paymentMethod?: 'GCash' | 'Maya' | 'Cash' | 'Card') => void;
  onOpenNewOrder: () => void;
  onShowNotification: (msg: string) => void;
  onRefreshOrders?: () => void;
  isSyncing?: boolean;
  admin?: AdminPrincipal | null;
}

export const ActiveOrdersView: React.FC<ActiveOrdersViewProps> = ({
  orders = [],
  onUpdateOrderStatus,
  onOpenNewOrder,
  onShowNotification,
  onRefreshOrders,
  isSyncing = false,
  admin,
}) => {
  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Today' | 'New' | 'Brewing' | 'Ready' | 'Completed'>('All');
  const [activeMenuOrderId, setActiveMenuOrderId] = useState<string | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [paymentMode, setPaymentMode] = useState<'single' | 'split'>('single');
  const [singlePayment, setSinglePayment] = useState<'GCash' | 'Maya' | 'Cash' | 'Card'>('Cash');
  const [splitLines, setSplitLines] = useState<Array<{ method: 'GCash' | 'Maya' | 'Cash' | 'Card'; amount: number }>>([
    { method: 'Cash', amount: 0 },
    { method: 'GCash', amount: 0 },
  ]);
  const [paymentError, setPaymentError] = useState('');

  const orderList = orders || [];
  const newCount = orderList.filter((o) => o && o.status === 'New').length;
  const brewingCount = orderList.filter((o) => o && (o.status === 'Brewing' || o.status === 'Preparing')).length;
  const readyCount = orderList.filter((o) => o && o.status === 'Ready').length;
  const completedCount = orderList.filter((o) => o && o.status === 'Completed').length;
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const todayCount = orderList.filter((o) => o && o.timestamp >= todayStart.getTime() && o.timestamp <= todayEnd.getTime()).length;
  const allActiveCount = orderList.filter((o) => o && o.status !== 'Completed').length;

  const filteredOrders = orderList.filter((order) => {
    if (!order) return false;
    if (selectedFilter === 'All') return order.status !== 'Completed';
    if (selectedFilter === 'Today') return order.timestamp >= todayStart.getTime() && order.timestamp <= todayEnd.getTime();
    if (selectedFilter === 'New') return order.status === 'New';
    if (selectedFilter === 'Brewing') return order.status === 'Brewing' || order.status === 'Preparing';
    if (selectedFilter === 'Ready') return order.status === 'Ready';
    if (selectedFilter === 'Completed') return order.status === 'Completed';
    return true;
  });

  const openPayment = (order: Order) => {
    setPaymentOrder(order);
    setPaymentMode('single');
    setSinglePayment((order.paymentMethod as 'GCash' | 'Maya' | 'Cash' | 'Card') || 'Cash');
    setSplitLines([{ method: 'Cash', amount: 0 }, { method: 'GCash', amount: 0 }]);
    setPaymentError('');
  };

  const handleStatusAdvance = (order: Order) => {
    if (order.status === 'New') {
      onUpdateOrderStatus(order.id, 'Brewing');
      onShowNotification(`Order #${order.orderNumber} is now brewing! ☕`);
    } else if (order.status === 'Brewing' || order.status === 'Preparing') {
      onUpdateOrderStatus(order.id, 'Ready');
      onShowNotification(`Order #${order.orderNumber} marked ready for pickup! 🔔`);
    } else if (order.status === 'Ready') {
      openPayment(order);
    }
  };

  const handleRemindCustomer = (order: Order) => {
    onShowNotification(`Sent SMS reminder to ${order.customerName} (${order.customerPhone || 'customer'})! 📱`);
  };

  const handleResetOrders = async () => {
    if (!isSuperAdmin) return;
    const confirmed = window.confirm('RESET ALL ORDERS? This permanently deletes every current and previous transaction from the Orders tab. This does not change menu, inventory, customers, or rewards.');
    if (!confirmed) return;
    try {
      const { orderResetService } = await import('../services/orderResetService');
      const deletedOrders = await orderResetService.resetAllOrders();
      setSelectedFilter('All');
      if (onRefreshOrders) await onRefreshOrders();
      onShowNotification(`Orders reset successfully. ${deletedOrders} transaction(s) deleted.`);
    } catch (error) {
      console.error('[ActiveOrdersView] Failed to reset orders:', error);
      onShowNotification('Unable to reset orders. No records were deleted.');
    }
  };

  const splitTotal = splitLines.reduce((sum, line) => sum + Math.max(0, Number(line.amount) || 0), 0);
  const orderTotal = paymentOrder?.total || 0;
  const splitMatches = Math.abs(splitTotal - orderTotal) < 0.01;

  const completeOrder = async () => {
    if (!paymentOrder) return;
    if (paymentMode === 'single') {
      const order = paymentOrder;
      setPaymentOrder(null);
      onUpdateOrderStatus(order.id, 'Completed', singlePayment);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 }, colors: ['#26170c', '#8fbc8f', '#e1e1c9', '#fbddca'] });
      onShowNotification(`Order #${order.orderNumber} completed via ${singlePayment}. Have a great day.`);
      return;
    }

    const validLines = splitLines.filter((line) => Number(line.amount) > 0);
    if (validLines.length < 2) {
      setPaymentError('Please enter amounts for at least two payment methods.');
      return;
    }
    if (!splitMatches) {
      setPaymentError(`Payment total must equal ${money(orderTotal)}. Current total is ${money(splitTotal)}.`);
      return;
    }

    const order = paymentOrder;
    const breakdown = validLines.map((line) => `${line.method} ${money(line.amount)}`).join(' + ');
    setPaymentOrder(null);
    // The existing order API stores payment_method as text at runtime; the server validates the Split Payment prefix.
    onUpdateOrderStatus(order.id, 'Completed', (`Split Payment: ${breakdown}` as unknown) as 'GCash' | 'Maya' | 'Cash' | 'Card');
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 }, colors: ['#26170c', '#8fbc8f', '#e1e1c9', '#fbddca'] });
    onShowNotification(`Order #${order.orderNumber} completed with split payment: ${breakdown}.`);
  };

  const money = (n: number) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="pt-20 pb-28 px-3.5 sm:px-5 w-full max-w-[1400px] mx-auto">
      <section className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <h2 className="font-serif text-2xl sm:text-[28px] font-bold text-[#26170c] tracking-tight">Active Orders</h2>
          <div className="flex items-center gap-2">
            {onRefreshOrders && <button type="button" onClick={onRefreshOrders} disabled={isSyncing} title="Sync orders from server" className="flex items-center justify-center p-1.5 rounded-full text-[#636451] hover:bg-[#e1e1c9] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"><span className={`material-symbols-outlined text-[18px] ${isSyncing ? 'animate-spin' : ''}`}>sync</span></button>}
            {isSuperAdmin && <button type="button" onClick={handleResetOrders} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-[#ffdad6] text-[#93000a] border border-[#f2b8b5] hover:bg-[#ffc9c4] active:scale-95 transition-all whitespace-nowrap"><span className="material-symbols-outlined text-[15px]">delete_sweep</span>Reset Orders</button>}
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-2.5 py-1 bg-[#e1e1c9] text-[#636451] rounded-full whitespace-nowrap"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Live Server</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrolling-hide no-scrollbar">
          {(['All', 'Today', 'New', 'Brewing', 'Ready', ...(completedCount > 0 ? ['Completed'] : [])] as const).map((filter) => {
            const label = filter === 'All' ? `All (${allActiveCount})` : filter === 'Today' ? `Today (${todayCount})` : filter === 'New' ? `New (${newCount})` : filter === 'Brewing' ? `Brewing (${brewingCount})` : filter === 'Ready' ? `Ready (${readyCount})` : `Completed (${completedCount})`;
            return <button key={filter} onClick={() => setSelectedFilter(filter)} className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${selectedFilter === filter ? 'bg-[#3d2b1f] text-[#ac9181] shadow-sm font-bold' : 'bg-[#f3ecea] text-[#4f453f] border border-[#d2c4bc] hover:bg-[#e8e1df]'}`}>{label}</button>;
          })}
        </div>
      </section>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-[#f9f2f0] rounded-2xl border border-[#f3ecea] p-6"><div className="w-12 h-12 bg-[#e1e1c9] rounded-full flex items-center justify-center mx-auto mb-3 text-[#636451]"><span className="material-symbols-outlined">coffee</span></div><h4 className="font-serif text-lg font-bold text-[#26170c]">No orders in this state</h4><p className="text-xs text-[#4f453f] mt-1">{selectedFilter === 'Completed' ? 'Completed orders will appear here as they are picked up.' : 'All caught up! Tap the + button to enter a new counter order.'}</p></div>
        ) : filteredOrders.map((order, idx) => {
          const isNew = order.status === 'New';
          const isBrewing = order.status === 'Brewing' || order.status === 'Preparing';
          const isReady = order.status === 'Ready';
          const isCompleted = order.status === 'Completed';
          let borderClass = 'border-l-4 border-[#5e604d]'; let badgeClass = 'bg-[#e1e1c9] text-[#636451]'; let statusLabel = 'BREWING';
          if (isNew) { borderClass = 'border-l-4 border-[#ba1a1a]'; badgeClass = 'bg-[#ffdad6] text-[#93000a]'; statusLabel = 'NEW'; }
          else if (isReady) { borderClass = 'border-l-4 border-[#26170c]'; badgeClass = 'bg-[#3d2b1f] text-[#ac9181]'; statusLabel = 'READY'; }
          else if (isCompleted) { borderClass = 'border-l-4 border-[#81756e]'; badgeClass = 'bg-[#e8e1df] text-[#4f453f]'; statusLabel = 'COMPLETED'; }
          return <React.Fragment key={order.id}>
            <article className={`bg-[#f9f2f0] rounded-2xl p-3.5 sm:p-4 shadow-[0_4px_12px_rgba(61,43,31,0.06)] ${borderClass} flex flex-col gap-3 transition-all relative border border-[#f3ecea]`}>
              <div className="flex justify-between items-start gap-2"><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5 mb-1 flex-wrap"><span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>{statusLabel}</span><span className="text-[#4f453f] text-xs font-medium truncate">#{order.orderNumber} • {order.timeAgo}</span>{order.customerId && <span className="px-1.5 py-0.2 bg-[#dec1af]/50 text-[#26170c] font-mono text-[10px] font-bold rounded">{order.customerId}</span>}{order.orderType && <span className="px-1.5 py-0.2 bg-[#e1e1c9] text-[#636451] text-[10px] font-semibold rounded">{order.orderType} {order.tableNumber ? `(${order.tableNumber})` : ''}</span>}</div><h3 className="font-serif text-lg sm:text-[22px] font-bold text-[#26170c] truncate">{order.customerName}</h3><div className="flex items-center gap-2 text-[11px] text-[#81756e] mt-0.5 flex-wrap">{order.customerPhone && <span>📞 {order.customerPhone}</span>}{order.paymentMethod && <span>💳 {order.paymentMethod}</span>}{order.deliveryAddress && <span className="truncate max-w-[200px]">📍 {order.deliveryAddress}</span>}</div></div><div className="text-right flex-shrink-0"><span className="text-sm sm:text-base font-bold text-[#26170c]">{money(order.total)}</span></div></div>
              <div className="bg-[#e8e1df]/35 rounded-xl p-3 space-y-1.5">{order.items.map((item, itemIdx) => { const isStruck = isReady || isCompleted || item.completed; return <p key={itemIdx} className={`text-sm text-[#1d1b1a] ${isStruck ? 'line-through decoration-[#81756e] opacity-65' : ''}`}><span className="font-bold">{item.quantity}x</span> {item.name}{' '}{item.customization && <span className="text-[#4f453f] text-xs font-normal">({item.customization})</span>}</p>; })}</div>
              <div className="flex items-center gap-2 pt-1">
                {isNew && <><button onClick={() => handleStatusAdvance(order)} className="flex-1 bg-[#8FBC8F] hover:bg-[#7ea97e] text-[#26170c] font-bold text-sm py-2.5 rounded-full transition-all active:scale-95 shadow-sm">Accept Order</button><div className="relative"><button onClick={() => setActiveMenuOrderId(activeMenuOrderId === order.id ? null : order.id)} className="p-2 text-[#4f453f] rounded-full border border-[#d2c4bc] hover:bg-[#f3ecea] transition-colors flex items-center justify-center" aria-label="Order actions"><span className="material-symbols-outlined text-[20px]">more_vert</span></button>{activeMenuOrderId === order.id && <div className="absolute right-0 bottom-full mb-2 w-44 bg-white rounded-xl shadow-xl border border-[#e8e1df] py-1 z-20 text-xs"><button onClick={() => { onShowNotification(`Printed Barista ticket #${order.orderNumber}`); setActiveMenuOrderId(null); }} className="w-full text-left px-3 py-2 hover:bg-[#f3ecea] text-[#26170c] flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">print</span>Print Barista Chit</button><button onClick={() => { handleRemindCustomer(order); setActiveMenuOrderId(null); }} className="w-full text-left px-3 py-2 hover:bg-[#f3ecea] text-[#26170c] flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">sms</span>Text Customer</button></div>}</div></>}
                {isBrewing && <button onClick={() => handleStatusAdvance(order)} className="flex-1 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-semibold text-sm py-2.5 rounded-full transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-[18px]">check_circle</span>Ready for Pickup</button>}
                {isReady && <><button onClick={() => handleStatusAdvance(order)} className="flex-1 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-semibold text-sm py-2.5 rounded-full transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-[18px]">done_all</span>Complete Order</button><button onClick={() => handleRemindCustomer(order)} className="bg-[#f3ecea] text-[#4f453f] hover:bg-[#e8e1df] px-4 py-2.5 rounded-full text-xs font-semibold border border-[#d2c4bc] transition-all active:scale-95">Remind</button></>}
                {isCompleted && <div className="w-full flex items-center justify-between text-xs text-[#5e604d] font-medium py-1"><span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-[#8fbc8f]">check_circle</span>Picked up & finalized</span><button onClick={() => onUpdateOrderStatus(order.id, 'Brewing')} className="text-[#81756e] hover:underline">Reopen</button></div>}
              </div>
            </article>
            {idx === 1 && <div className="relative h-48 rounded-2xl overflow-hidden my-4 group shadow-md border border-[#26170c]/10"><div className="absolute inset-0 bg-[#26170c]/40 z-10" /><div className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuC4q_k-h8c5xkS9Ugc-Hxu7JQhOuiUWNjnY_lrIv_Ug1wNGQ7s5Dqyk9fzRaIL5rcUYsLki70EV-7Mf9f2PImOqwH8ZBrGdq6wcm8kOfoUk1r_N1FlpuaeVS36SML8Jujd2ux7_R_5cTGzDBvBPqwyw6L9BrcV5x5g6RqSKFKHsCTNt24cKe6jTAmP_cLISMak30IoDYfs3gjUVVKnJcanTdu7IPB9gcTHlCVs2VQ9IbisQu1OD7wls')` }} /><div className="absolute bottom-4 left-4 z-20 text-white"><div className="flex items-center gap-2 mb-0.5"><span className="w-2 h-2 rounded-full bg-[#8fbc8f] animate-ping" /><h4 className="font-serif text-[22px] font-bold text-white leading-tight">Cafe Pulse</h4></div><p className="text-xs text-white/90 font-medium">{allActiveCount + 2} orders in queue • Avg. prep time: 4m</p></div></div>}
          </React.Fragment>;
        })}
      </div>

      {paymentOrder && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="payment-method-title">
        <div className="w-full max-w-md bg-[#fff8f5] rounded-2xl shadow-2xl border border-[#e8e1df] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f3ecea] bg-[#f9f2f0] flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#636451]">Payment Method</p><h3 id="payment-method-title" className="font-serif text-xl font-bold text-[#26170c] mt-0.5">How did the customer pay?</h3><p className="text-xs text-[#81756e] mt-1">Order #{paymentOrder.orderNumber} • {money(paymentOrder.total)}</p></div><button type="button" onClick={() => setPaymentOrder(null)} className="p-2 rounded-full text-[#4f453f] hover:bg-[#e8e1df]" aria-label="Close payment method dialog"><span className="material-symbols-outlined">close</span></button></div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3 mb-4"><button type="button" onClick={() => { setPaymentMode('single'); setPaymentError(''); }} className={`py-2.5 rounded-xl text-sm font-bold border ${paymentMode === 'single' ? 'bg-[#26170c] text-white border-[#26170c]' : 'bg-white text-[#4f453f] border-[#d2c4bc]'}`}>Single Payment</button><button type="button" onClick={() => { setPaymentMode('split'); setPaymentError(''); }} className={`py-2.5 rounded-xl text-sm font-bold border ${paymentMode === 'split' ? 'bg-[#26170c] text-white border-[#26170c]' : 'bg-white text-[#4f453f] border-[#d2c4bc]'}`}>Split Payment</button></div>
            {paymentMode === 'single' ? <div className="grid grid-cols-2 gap-3">{(['GCash', 'Maya', 'Cash', 'Card'] as const).map((method) => <button key={method} type="button" onClick={() => { setSinglePayment(method); setPaymentError(''); }} className={`min-h-[64px] rounded-xl border font-bold ${singlePayment === method ? 'bg-[#26170c] text-white border-[#26170c]' : 'bg-white text-[#26170c] border-[#dec1af]'}`}>{method}</button>)}</div> : <div className="space-y-3"><p className="text-xs text-[#81756e]">Combine two or more payment methods. Amounts must total exactly {money(paymentOrder.total)}.</p>{splitLines.map((line, index) => <div key={index} className="grid grid-cols-[1fr_110px_36px] gap-2 items-center"><select value={line.method} onChange={(e) => { const next = [...splitLines]; next[index] = { ...next[index], method: e.target.value as typeof line.method }; setSplitLines(next); setPaymentError(''); }} className="w-full p-2.5 rounded-lg border border-[#d2c4bc] bg-white text-sm font-semibold">{(['GCash', 'Maya', 'Cash', 'Card'] as const).map((method) => <option key={method} value={method}>{method}</option>)}</select><input type="number" min="0" step="0.01" value={line.amount || ''} onChange={(e) => { const next = [...splitLines]; next[index] = { ...next[index], amount: Number(e.target.value) || 0 }; setSplitLines(next); setPaymentError(''); }} placeholder="Amount" className="w-full p-2.5 rounded-lg border border-[#d2c4bc] bg-white text-sm text-right" />{splitLines.length > 2 ? <button type="button" onClick={() => setSplitLines(splitLines.filter((_, i) => i !== index))} className="w-9 h-9 rounded-lg bg-[#eee2dd] text-[#4f453f] font-bold">×</button> : <span />}</div>)}<button type="button" onClick={() => setSplitLines([...splitLines, { method: 'Cash', amount: 0 }])} className="w-full py-2.5 rounded-xl border border-dashed border-[#5e604d] bg-white text-[#5e604d] text-sm font-bold">+ Add Payment Method</button><div className={`rounded-xl p-3 text-sm font-bold flex justify-between ${splitMatches ? 'bg-[#e1e1c9] text-[#5e604d]' : 'bg-[#ffdad6] text-[#93000a]'}`}><span>Entered: {money(splitTotal)}</span><span>{splitMatches ? '✓ Matches Total' : `Remaining: ${money(Math.max(0, orderTotal - splitTotal))}`}</span></div></div>}
            {paymentError && <p className="text-xs text-[#a52b22] mt-3">{paymentError}</p>}
            <button type="button" onClick={completeOrder} className="w-full mt-4 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-bold py-3 rounded-xl">Complete Order</button>
          </div>
        </div>
      </div>}
    </div>
  );
};
