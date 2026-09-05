import React, { useState, useEffect } from 'react';
import { Order, StoreSettings } from '../../types';
import { startCustomerOrderTracking } from '../../services/customerOrderTracker';

interface CustomerOrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onTrackOrder?: (order: Order) => void;
  storeSettings?: StoreSettings;
}

export const CustomerOrderSuccessModal: React.FC<CustomerOrderSuccessModalProps> = ({
  isOpen,
  onClose,
  order,
  storeSettings,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(order);

  useEffect(() => {
    setTrackedOrder(order);
    if (!order) return;
    return startCustomerOrderTracking(order, (updated) => {
      setTrackedOrder((current) => {
        if (!current || current.id === updated.id) return updated;
        return current;
      });
    });
  }, [order]);

  const displayOrder = trackedOrder || order;

  useEffect(() => {
    if (displayOrder) {
      if (displayOrder.status === 'New' || displayOrder.status === 'Pending') setActiveStep(1);
      else if (displayOrder.status === 'Brewing' || displayOrder.status === 'Preparing') setActiveStep(2);
      else if (displayOrder.status === 'Ready') setActiveStep(3);
      else if (displayOrder.status === 'Completed') setActiveStep(4);
    }
  }, [displayOrder, displayOrder?.status]);

  if (!isOpen || !displayOrder) return null;

  const storeName = storeSettings?.storeName || 'iLuvKeyks';
  const receiptFooter = storeSettings?.receiptFooter || 'Thank you for supporting your local cafe! Tag us @iluvkeyks.ph 🍰☕';
  const wifiSsid = storeSettings?.wifiSsid;
  const wifiPassword = storeSettings?.wifiPassword;

  const steps = [
    { title: 'Order Received', desc: 'Sent to barista & kitchen queue', icon: 'receipt' },
    { title: 'Brewing & Baking', desc: 'Handcrafting your order fresh', icon: 'coffee_maker' },
    { title: 'Ready', desc: displayOrder.orderType === 'Dine-In' ? 'Serving to your table' : displayOrder.orderType === 'Delivery' ? 'Rider on the way' : 'Ready at the pickup counter', icon: displayOrder.orderType === 'Delivery' ? 'two_wheeler' : 'check_circle' },
    { title: 'Completed', desc: `Enjoy your ${storeName} treat!`, icon: 'favorite' },
  ];

  return (
    <div
      id="customer-order-success-modal"
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#fff8f5] w-full max-w-md rounded-3xl shadow-2xl border border-[#dec1af]/60 overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#26170c]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#26170c] text-white p-5 text-center relative">
          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2.5 border border-white/20">
            <span className="material-symbols-outlined text-[28px] text-[#8fbc8f]">task_alt</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#dec1af]">Order Confirmed</span>
          <h3 className="font-serif text-2xl font-bold mt-0.5">Thank You, {displayOrder.customerName}!</h3>
          <p className="text-xs text-[#dec1af]/80 mt-1">Order #{displayOrder.orderNumber} • {displayOrder.orderType || 'Dine-In'}</p>
          <button onClick={onClose} className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"><span className="material-symbols-outlined text-[18px]">close</span></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-[#f3ecea] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4f453f]">Live Barista Status</span>
              <span className="px-2 py-0.5 bg-[#e1e1c9] text-[#636451] rounded-full text-[10px] font-bold">{displayOrder.status}</span>
            </div>
            <div className="relative pl-6 space-y-3.5 border-l-2 border-[#dec1af]">
              {steps.map((s, idx) => {
                const stepNum = idx + 1;
                const isPassed = activeStep >= stepNum;
                const isCurrent = activeStep === stepNum;
                return <div key={s.title} className="relative">
                  <div className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${isPassed ? 'bg-[#26170c] border-[#26170c] text-white shadow-xs' : 'bg-white border-[#dec1af] text-[#81756e]'}`}>{isPassed ? <span className="material-symbols-outlined text-[12px]">check</span> : stepNum}</div>
                  <div><h5 className={`text-xs font-bold ${isCurrent ? 'text-[#26170c]' : isPassed ? 'text-[#4f453f]' : 'text-[#81756e]'}`}>{s.title}</h5><p className="text-[11px] text-[#81756e]">{s.desc}</p></div>
                </div>;
              })}
            </div>
            <p className="text-[10px] text-[#81756e] mt-3 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#8fbc8f] animate-pulse" />Live updates every few seconds</p>
          </div>

          <div className="p-3 bg-[#f9f2f0] rounded-2xl border border-[#dec1af]/60 flex items-center justify-between text-xs">
            <div><span className="text-[10px] uppercase font-bold text-[#81756e]">Fulfillment</span><p className="font-bold text-[#26170c]">{displayOrder.orderType === 'Dine-In' ? `Dine-In (${displayOrder.tableNumber || 'Table 4'})` : displayOrder.orderType === 'Delivery' ? `Delivery (${displayOrder.deliveryAddress || 'Address on file'})` : 'Store Pick-up Counter'}</p></div>
            <div className="text-right"><span className="text-[10px] uppercase font-bold text-[#81756e]">Payment</span><p className="font-bold text-[#26170c]">{displayOrder.paymentMethod || 'GCash'}</p></div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#f3ecea] shadow-xs space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#4f453f] border-b border-[#f3ecea] pb-1.5">Order Receipt</h4>
            {displayOrder.items.map((it, idx) => <div key={idx} className="flex justify-between items-start text-xs"><div className="flex-1 pr-2"><div className="flex items-center gap-1.5"><span className="font-bold text-[#26170c]">{it.quantity}x</span><span className="font-bold text-[#26170c]">{it.name}</span></div>{it.customization && <p className="text-[11px] text-[#81756e] pl-4">{it.customization}</p>}</div><span className="font-serif font-bold text-[#26170c]">₱{(it.price * it.quantity).toFixed(2)}</span></div>)}
            <div className="pt-2 border-t border-[#f3ecea] space-y-1 text-xs">
              {displayOrder.discount ? <div className="flex justify-between text-[#636451] font-medium"><span>Promo Discount</span><span>-₱{displayOrder.discount.toFixed(2)}</span></div> : null}
              {displayOrder.deliveryFee ? <div className="flex justify-between text-[#4f453f]"><span>Delivery Fee</span><span>₱{displayOrder.deliveryFee.toFixed(2)}</span></div> : null}
              <div className="flex justify-between font-serif font-bold text-sm text-[#26170c] pt-1"><span>Total Paid</span><span>₱{displayOrder.total.toFixed(2)}</span></div>
            </div>
            {wifiSsid && <div className="mt-2 p-2 bg-[#f9f2f0] rounded-xl text-[10px] text-[#4f453f] flex items-center justify-between"><span className="font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-[#26170c]">wifi</span><span>Free Guest Wi-Fi:</span></span><span className="font-mono text-[#26170c] font-bold">{wifiSsid} • {wifiPassword}</span></div>}
            {receiptFooter && <p className="text-[10px] text-center text-[#81756e] italic pt-1 border-t border-[#f3ecea]">"{receiptFooter}"</p>}
          </div>
        </div>

        <div className="p-4 bg-[#f9f2f0] border-t border-[#dec1af]/60 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 py-3 px-4 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-bold text-xs rounded-2xl shadow-md active:scale-95 transition-all text-center cursor-pointer">Order More Delights</button>
        </div>
      </div>
    </div>
  );
};
