import React, { useEffect, useMemo, useState } from 'react';
import { CustomerCartItem, CustomerUser, Order, OrderItem, StoreSettings } from '../../types';
import { promoVoucherService, PromoVoucher } from '../../services/promoVoucherService';

interface CustomerCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CustomerCartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onPlaceOrder: (order: Order) => void;
  storeSettings?: StoreSettings;
  currentCustomer?: CustomerUser | null;
}

type AppliedPromo = PromoVoucher & { discount: number };

export const CustomerCartDrawer: React.FC<CustomerCartDrawerProps> = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onClearCart, onPlaceOrder, storeSettings, currentCustomer }) => {
  const [fulfillmentType, setFulfillmentType] = useState<'Dine-In' | 'Takeout' | 'Delivery'>('Dine-In');
  const [customerName, setCustomerName] = useState(currentCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentCustomer?.mobile || '');
  const [tableNumber, setTableNumber] = useState('Table 1');
  const [deliveryAddress, setDeliveryAddress] = useState(currentCustomer?.address || '');
  const [orderNotes, setOrderNotes] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'Maya' | 'Cash' | 'Card'>('GCash');

  useEffect(() => {
    if (currentCustomer) {
      setCustomerName(currentCustomer.name || '');
      setCustomerPhone(currentCustomer.mobile || '');
      setDeliveryAddress(currentCustomer.address || '');
    }
  }, [currentCustomer]);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.totalPrice, 0), [cartItems]);
  const baseDeliveryFee = storeSettings?.deliveryFee ?? 49;
  const freeThreshold = storeSettings?.freeDeliveryThreshold ?? 500;
  const discount = appliedPromo ? Math.min(subtotal, appliedPromo.discount) : 0;
  const deliveryFee = fulfillmentType === 'Delivery' ? (subtotal >= freeThreshold ? 0 : baseDeliveryFee) : 0;
  const grandTotal = Math.max(0, subtotal - discount + deliveryFee);

  useEffect(() => {
    if (appliedPromo && subtotal < appliedPromo.minimumOrderAmount) {
      setAppliedPromo(null);
      setPromoError('The applied voucher no longer meets its minimum order amount.');
    }
  }, [subtotal, appliedPromo]);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoError(null);
    setPromoLoading(true);
    try {
      const result = await promoVoucherService.validate(code, subtotal);
      setAppliedPromo({ ...result.voucher, discount: result.discount });
      setPromoInput('');
    } catch (error) {
      if (code === 'ILUVKEYKS10' || code === 'WELCOME10') {
        setAppliedPromo({ id:'legacy-10', code, description:'Legacy promo', discountType:'percentage', discountValue:10, minimumOrderAmount:0, maxUses:0, usedCount:0, expiresAt:null, active:true, discount:subtotal*0.10 });
        setPromoInput('');
      } else if (code === 'SWEET50' || code === 'KEYKS50') {
        setAppliedPromo({ id:'legacy-50', code, description:'Legacy promo', discountType:'fixed', discountValue:50, minimumOrderAmount:0, maxUses:0, usedCount:0, expiresAt:null, active:true, discount:Math.min(subtotal,50) });
        setPromoInput('');
      } else {
        setPromoError(error instanceof Error ? error.message : 'Invalid or expired voucher code.');
      }
    } finally {
      setPromoLoading(false);
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    const orderItems: OrderItem[] = cartItems.map((c) => {
      const parts: string[] = [];
      if (c.selectedTemperature && c.selectedTemperature !== 'N/A') parts.push(c.selectedTemperature);
      if (c.selectedSize) parts.push(c.selectedSize.name);
      if (c.sweetnessLevel) parts.push(`Sugar: ${c.sweetnessLevel}`);
      if (c.iceLevel && c.selectedTemperature === 'Iced') parts.push(c.iceLevel);
      if (c.selectedAddons?.length) parts.push(`+${c.selectedAddons.map((a) => a.name).join(', ')}`);
      if (c.specialInstructions) parts.push(`Note: ${c.specialInstructions}`);
      return { name:c.isBundle && c.bundleData ? c.bundleData.name : c.menuItem.name, quantity:c.quantity, customization:parts.length ? parts.join(' • ') : 'Standard Preparation', price:c.unitPrice, temperature:c.selectedTemperature === 'Hot' || c.selectedTemperature === 'Iced' ? c.selectedTemperature : undefined, size:c.selectedSize?.name };
    });
    const newOrder: Order = {
      id:`ord-cust-${Date.now()}`, orderNumber:`ILK-${Math.floor(1000+Math.random()*9000)}`, customerId:currentCustomer?.id,
      customerName:customerName.trim() || currentCustomer?.name || (fulfillmentType === 'Dine-In' ? `${tableNumber} Guest` : 'Customer'), customerEmail:currentCustomer?.email,
      timeAgo:'Just now', timestamp:Date.now(), status:'New', items:orderItems, total:grandTotal, subtotal, discount, deliveryFee,
      image:cartItems[0]?.menuItem?.image, notes:orderNotes.trim() || undefined, customerPhone:customerPhone.trim() || currentCustomer?.mobile || undefined,
      orderType:fulfillmentType, tableNumber:fulfillmentType === 'Dine-In' ? tableNumber : undefined, deliveryAddress:fulfillmentType === 'Delivery' ? (deliveryAddress || currentCustomer?.address) : undefined,
      paymentMethod, isCustomerOrder:true,
    };
    onPlaceOrder(newOrder); onClearCart(); onClose();
  };

  if (!isOpen) return null;

  return <>
    <div onClick={onClose} className="fixed inset-0 bg-black/50 z-[130] backdrop-blur-xs animate-fadeIn" />
    <div id="customer-cart-drawer" className="fixed right-0 top-0 h-full w-full max-w-full sm:max-w-md bg-[#fff8f5] z-[140] shadow-2xl flex flex-col border-l border-[#dec1af]">
      <div className="px-4 sm:px-5 py-3.5 border-b border-[#f3ecea] bg-[#f9f2f0] flex items-center justify-between">
        <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-[#26170c] text-white flex items-center justify-center"><span className="material-symbols-outlined text-[18px]">shopping_bag</span></div><div><h3 className="font-serif text-lg font-bold text-[#26170c]">Your Order Bag</h3><p className="text-[11px] text-[#4f453f]">{cartItems.length} item{cartItems.length===1?'':'s'} selected</p></div></div>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#e8e1df] flex items-center justify-center cursor-pointer" aria-label="Close Bag"><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 text-[#26170c]">
        {cartItems.length===0 ? <div className="py-16 text-center"><h4 className="font-serif text-lg font-bold">Your bag is empty</h4><button onClick={onClose} className="mt-4 px-5 py-2.5 bg-[#26170c] text-white text-xs font-bold rounded-xl">Browse Menu</button></div> : <>
          <div className="bg-[#f3ecea] p-1 rounded-2xl flex border border-[#dec1af]/60 gap-1">{(['Dine-In','Takeout','Delivery'] as const).map(type=><button key={type} type="button" onClick={()=>setFulfillmentType(type)} className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer ${fulfillmentType===type?'bg-[#26170c] text-white':'text-[#4f453f]'}`}>{type}</button>)}</div>
          <div className="bg-white p-3.5 rounded-2xl border border-[#f3ecea] space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input required value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="Your Name *" className="w-full px-3 py-2 text-xs bg-[#f9f2f0] rounded-xl border border-[#dec1af]"/><input value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} placeholder="Mobile Number" className="w-full px-3 py-2 text-xs bg-[#f9f2f0] rounded-xl border border-[#dec1af]"/></div>
            {fulfillmentType==='Dine-In'&&<input value={tableNumber} onChange={e=>setTableNumber(e.target.value)} placeholder="Table / Booth Number" className="w-full px-3 py-2 text-xs bg-[#f9f2f0] rounded-xl border border-[#dec1af]"/>}
            {fulfillmentType==='Delivery'&&<textarea rows={2} required value={deliveryAddress} onChange={e=>setDeliveryAddress(e.target.value)} placeholder="Delivery Address / Unit / Landmark *" className="w-full px-3 py-2 text-xs bg-[#f9f2f0] rounded-xl border border-[#dec1af] resize-none"/>}
          </div>
          <div className="space-y-2.5"><div className="flex justify-between"><span className="text-xs font-bold uppercase tracking-wider text-[#4f453f]">Items in Cart</span><button onClick={onClearCart} className="text-[11px] text-[#ba1a1a] font-semibold">Clear All</button></div>{cartItems.map(item=><div key={item.id} className="p-3 bg-white rounded-2xl border border-[#f3ecea] flex gap-3"><img src={item.menuItem.image} alt={item.menuItem.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0"/><div className="flex-1 min-w-0"><div className="flex justify-between gap-2"><h5 className="text-xs font-bold truncate">{item.menuItem.name}</h5><button onClick={()=>onRemoveItem(item.id)} className="text-[#81756e] cursor-pointer"><span className="material-symbols-outlined text-[16px]">close</span></button></div><div className="mt-1 text-[10px] text-[#81756e] space-y-0.5">{item.selectedTemperature&&item.selectedTemperature!=='N/A'&&<div>{item.selectedTemperature}</div>}{item.selectedSize&&<div>{item.selectedSize.name}</div>}{item.sweetnessLevel&&<div>{item.sweetnessLevel} sugar</div>}{item.iceLevel&&item.selectedTemperature==='Iced'&&<div>{item.iceLevel}</div>}{item.selectedAddons?.length&&<div>+ {item.selectedAddons.map(a=>a.name).join(', ')}</div>}{item.specialInstructions&&<div>"{item.specialInstructions}"</div>}</div><div className="mt-2 flex items-center justify-between"><div className="flex items-center gap-2 bg-[#f9f2f0] px-2 py-1 rounded-lg border border-[#dec1af]/50"><button onClick={()=>onUpdateQuantity(item.id,-1)} className="font-bold">-</button><span className="text-xs font-bold min-w-[14px] text-center">{item.quantity}</span><button onClick={()=>onUpdateQuantity(item.id,1)} className="font-bold">+</button></div><span className="text-xs font-bold">₱{item.totalPrice.toFixed(2)}</span></div></div></div>)}</div>
          <div className="bg-white p-3 rounded-2xl border border-[#f3ecea]"><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5">Have a Promo Voucher?</label>{appliedPromo?<div className="flex items-center justify-between p-2 bg-[#e1e1c9]/40 rounded-xl"><span className="text-xs font-bold truncate">{appliedPromo.code} ({appliedPromo.discountType==='percentage'?`${appliedPromo.discountValue}% OFF`:`₱${appliedPromo.discountValue.toFixed(2)} OFF`})</span><button onClick={()=>setAppliedPromo(null)} className="text-[11px] text-[#ba1a1a] font-bold">Remove</button></div>:<form onSubmit={handleApplyPromo} className="flex gap-2"><input value={promoInput} onChange={e=>setPromoInput(e.target.value)} placeholder="e.g. SEPTEMBER10" className="flex-1 px-3 py-1.5 text-xs bg-[#f9f2f0] rounded-xl border border-[#dec1af] uppercase font-bold min-w-0"/><button disabled={promoLoading} className="px-3.5 py-1.5 bg-[#26170c] text-white text-xs font-bold rounded-xl disabled:opacity-50">{promoLoading?'...':'Apply'}</button></form>}{promoError&&<p className="text-[10px] text-[#ba1a1a] mt-1">{promoError}</p>}</div>
          <div className="bg-white p-3 rounded-2xl border border-[#f3ecea]"><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5">Payment Method</label><div className="grid grid-cols-4 gap-1.5">{(['GCash','Maya','Cash','Card'] as const).map(method=><button key={method} type="button" onClick={()=>setPaymentMethod(method)} className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${paymentMethod===method?'bg-[#26170c] text-white border-[#26170c]':'bg-[#f9f2f0] border-[#dec1af]'}`}>{method}</button>)}</div></div>
          <div><label className="text-[10px] font-bold uppercase tracking-wider">Overall Order Note</label><input value={orderNotes} onChange={e=>setOrderNotes(e.target.value)} placeholder="e.g. Please pack coffee and pastries separately" className="w-full mt-1 px-3 py-2 text-xs bg-white rounded-xl border border-[#dec1af]"/></div>
          <div className="p-3.5 bg-[#f9f2f0] rounded-2xl border border-[#dec1af]/60 space-y-1.5 text-xs"><div className="flex justify-between"><span>Subtotal</span><span className="font-semibold">₱{subtotal.toFixed(2)}</span></div>{discount>0&&<div className="flex justify-between text-[#636451] font-bold"><span>Discount ({appliedPromo?.code})</span><span>-₱{discount.toFixed(2)}</span></div>}{fulfillmentType==='Delivery'&&<div className="flex justify-between"><span>Delivery Fee</span><span>{deliveryFee===0?'FREE':`₱${deliveryFee.toFixed(2)}`}</span></div>}<div className="pt-2 border-t border-[#dec1af]/80 flex justify-between font-serif"><span className="font-bold">Total Amount</span><span className="text-lg font-bold">₱{grandTotal.toFixed(2)}</span></div></div>
        </>}
      </div>
      {cartItems.length>0&&<div className="p-4 bg-[#f9f2f0] border-t border-[#dec1af]/60"><button onClick={handleCheckout} className="w-full py-3.5 px-4 bg-[#26170c] text-white font-bold text-sm rounded-2xl flex items-center justify-between cursor-pointer"><span>Place {fulfillmentType} Order</span><span>₱{grandTotal.toFixed(2)}</span></button></div>}
    </div>
  </>;
};
