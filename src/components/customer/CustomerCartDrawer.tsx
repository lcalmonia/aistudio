import React, { useState, useEffect } from 'react';
import { CustomerCartItem, Order, OrderItem, StoreSettings, CustomerUser } from '../../types';

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

export const CustomerCartDrawer: React.FC<CustomerCartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onPlaceOrder,
  storeSettings,
  currentCustomer,
}) => {
  // Fulfillment details
  const [fulfillmentType, setFulfillmentType] = useState<'Dine-In' | 'Takeout' | 'Delivery'>('Dine-In');
  const [customerName, setCustomerName] = useState(currentCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentCustomer?.mobile || '');
  const [tableNumber, setTableNumber] = useState('Table 4');
  const [deliveryAddress, setDeliveryAddress] = useState(currentCustomer?.address || '');
  const [orderNotes, setOrderNotes] = useState('');

  // Update fields if current customer changes
  useEffect(() => {
    if (currentCustomer) {
      if (!customerName) setCustomerName(currentCustomer.name);
      if (!customerPhone) setCustomerPhone(currentCustomer.mobile);
      if (!deliveryAddress) setDeliveryAddress(currentCustomer.address);
    }
  }, [currentCustomer]);

  // Voucher / Promo Code
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent?: number; discountAmount?: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'Maya' | 'Cash' | 'Card'>('GCash');

  if (!isOpen) return null;

  const baseDeliveryFee = storeSettings?.deliveryFee ?? 49;
  const freeThreshold = storeSettings?.freeDeliveryThreshold ?? 500;

  // Subtotal Calculation
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  // Discount Calculation
  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountPercent) {
      discount = (subtotal * appliedPromo.discountPercent) / 100;
    } else if (appliedPromo.discountAmount) {
      discount = Math.min(subtotal, appliedPromo.discountAmount);
    }
  }

  // Delivery Fee Calculation
  const deliveryFee = fulfillmentType === 'Delivery' ? (subtotal >= freeThreshold ? 0 : baseDeliveryFee) : 0;
  const grandTotal = Math.max(0, subtotal - discount + deliveryFee);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'ILUVKEYKS10' || code === 'WELCOME10') {
      setAppliedPromo({ code, discountPercent: 10 });
      setPromoInput('');
    } else if (code === 'SWEET50' || code === 'KEYKS50') {
      setAppliedPromo({ code, discountAmount: 50 });
      setPromoInput('');
    } else {
      setPromoError('Invalid voucher code. Try "ILUVKEYKS10" or "SWEET50"');
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    const orderNum = `ILK-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderItems: OrderItem[] = cartItems.map((c) => {
      const parts: string[] = [];
      if (c.selectedTemperature && c.selectedTemperature !== 'N/A') {
        parts.push(c.selectedTemperature);
      }
      if (c.selectedSize) {
        parts.push(c.selectedSize.name);
      }
      if (c.sweetnessLevel) {
        parts.push(`Sugar: ${c.sweetnessLevel}`);
      }
      if (c.iceLevel && c.selectedTemperature === 'Iced') {
        parts.push(c.iceLevel);
      }
      if (c.selectedAddons && c.selectedAddons.length > 0) {
        parts.push(`+${c.selectedAddons.map((a) => a.name).join(', ')}`);
      }
      if (c.specialInstructions) {
        parts.push(`Note: ${c.specialInstructions}`);
      }

      return {
        name: c.isBundle && c.bundleData ? c.bundleData.name : c.menuItem.name,
        quantity: c.quantity,
        customization: parts.length > 0 ? parts.join(' • ') : 'Standard Preparation',
        price: c.unitPrice,
        temperature: c.selectedTemperature === 'Hot' || c.selectedTemperature === 'Iced' ? c.selectedTemperature : undefined,
        size: c.selectedSize?.name,
      };
    });

    const newOrder: Order = {
      id: `ord-cust-${Date.now()}`,
      orderNumber: orderNum,
      customerId: currentCustomer?.id || 'CUST-00001',
      customerName: customerName.trim() || currentCustomer?.name || (fulfillmentType === 'Dine-In' ? `${tableNumber} Guest` : 'Customer'),
      customerEmail: currentCustomer?.email,
      timeAgo: 'Just now',
      timestamp: Date.now(),
      status: 'New',
      items: orderItems,
      total: grandTotal,
      subtotal,
      discount,
      deliveryFee,
      image: cartItems[0]?.menuItem?.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
      notes: orderNotes.trim() || undefined,
      customerPhone: customerPhone.trim() || currentCustomer?.mobile || '+63 (917) 000-0000',
      orderType: fulfillmentType,
      tableNumber: fulfillmentType === 'Dine-In' ? tableNumber : undefined,
      deliveryAddress: fulfillmentType === 'Delivery' ? (deliveryAddress || currentCustomer?.address) : undefined,
      paymentMethod,
      isCustomerOrder: true,
    };

    onPlaceOrder(newOrder);
    onClearCart();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        id="cart-drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-[130] backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
      />

      {/* Drawer */}
      <div
        id="customer-cart-drawer"
        className="fixed right-0 top-0 h-full w-full max-w-md bg-[#fff8f5] z-[140] shadow-2xl flex flex-col justify-between overflow-hidden animate-slideLeft border-l border-[#dec1af]"
      >
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-[#f3ecea] bg-[#f9f2f0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#26170c] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#26170c]">Your Order Bag</h3>
              <p className="text-xs text-[#4f453f]">
                {cartItems.length} item{cartItems.length === 1 ? '' : 's'} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#e8e1df] text-[#4f453f] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Bag"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-[#26170c]">
          {cartItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#f3ecea] flex items-center justify-center text-[#81756e]">
                <span className="material-symbols-outlined text-[32px]">local_cafe</span>
              </div>
              <h4 className="font-serif text-lg font-bold text-[#26170c]">Your bag is empty</h4>
              <p className="text-xs text-[#4f453f] max-w-xs mx-auto">
                Explore our handcrafted espresso, milk teas, cakes in tub, and pastas to begin!
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-[#26170c] hover:bg-[#3d2b1f] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Fulfillment Switcher */}
              <div className="bg-[#f3ecea] p-1 rounded-2xl flex border border-[#dec1af]/60">
                {(['Dine-In', 'Takeout', 'Delivery'] as const).map((type) => {
                  const isSelected = fulfillmentType === type;
                  const icon =
                    type === 'Dine-In'
                      ? 'table_restaurant'
                      : type === 'Takeout'
                      ? 'takeout_dining'
                      : 'two_wheeler';

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFulfillmentType(type)}
                      className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#26170c] text-white shadow-xs'
                          : 'text-[#4f453f] hover:bg-[#eae2e0]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{icon}</span>
                      <span>{type}</span>
                    </button>
                  );
                })}
              </div>

              {/* Specific Fulfillment Information */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#f3ecea] space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f453f] mb-1">
                      Your Name <span className="text-[#ba1a1a]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sofia Santos"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#f9f2f0] rounded-xl border border-[#dec1af] font-medium focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f453f] mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="0917-XXX-XXXX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#f9f2f0] rounded-xl border border-[#dec1af] font-medium focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                    />
                  </div>
                </div>

                {fulfillmentType === 'Dine-In' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f453f] mb-1">
                      Table / Booth Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="Table 4"
                        className="flex-1 px-3 py-1.5 text-xs bg-[#f9f2f0] rounded-xl border border-[#dec1af] font-bold text-[#26170c]"
                      />
                      <div className="flex gap-1">
                        {['Table 1', 'Table 2', 'Table 4', 'Barista Bar'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTableNumber(t)}
                            className="px-2 py-1 bg-[#f3ecea] hover:bg-[#dec1af] text-[10px] font-bold text-[#26170c] rounded-lg"
                          >
                            {t.replace('Table ', 'T')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {fulfillmentType === 'Delivery' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f453f] mb-1">
                      Delivery Address / Unit / Landmark <span className="text-[#ba1a1a]">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. Unit 304, Green Residences, Taft Ave, Manila"
                      className="w-full px-3 py-1.5 text-xs bg-[#f9f2f0] rounded-xl border border-[#dec1af] font-medium focus:outline-none focus:ring-1 focus:ring-[#26170c] resize-none"
                    />
                    <p className="text-[10px] text-[#81756e] mt-0.5">
                      {subtotal >= 500 ? (
                        <span className="text-[#636451] font-bold">🎉 FREE Delivery applied! (Orders ₱500+)</span>
                      ) : (
                        <span>Standard delivery fee: ₱49.00 (Free for orders ₱500+)</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Items List in Bag */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4f453f]">
                    Items in Cart
                  </span>
                  <button
                    onClick={onClearCart}
                    className="text-[11px] text-[#ba1a1a] hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>

                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-2xl border border-[#f3ecea] shadow-xs flex gap-3 items-start"
                  >
                    <img
                      src={item.menuItem.image}
                      alt={item.menuItem.name}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h5 className="text-xs font-bold text-[#26170c] leading-tight">
                          {item.menuItem.name}
                        </h5>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-[#81756e] hover:text-[#ba1a1a] -mr-1 -mt-1 p-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>

                      {/* Customization pills */}
                      <div className="mt-1 text-[11px] text-[#4f453f] space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.selectedTemperature && item.selectedTemperature !== 'N/A' && (
                            <span className="px-1.5 py-0.2 bg-[#f3ecea] rounded text-[10px] font-semibold text-[#26170c]">
                              {item.selectedTemperature}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="px-1.5 py-0.2 bg-[#f3ecea] rounded text-[10px] font-semibold text-[#26170c]">
                              {item.selectedSize.name}
                            </span>
                          )}
                          {item.sweetnessLevel && (
                            <span className="px-1.5 py-0.2 bg-[#f3ecea] rounded text-[10px] text-[#4f453f]">
                              {item.sweetnessLevel} sugar
                            </span>
                          )}
                          {item.iceLevel && item.selectedTemperature === 'Iced' && (
                            <span className="px-1.5 py-0.2 bg-[#f3ecea] rounded text-[10px] text-[#4f453f]">
                              {item.iceLevel}
                            </span>
                          )}
                        </div>

                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <p className="text-[10px] text-[#81756e]">
                            + {item.selectedAddons.map((a) => a.name).join(', ')}
                          </p>
                        )}
                        {item.specialInstructions && (
                          <p className="text-[10px] italic text-[#81756e]">
                            "{item.specialInstructions}"
                          </p>
                        )}
                      </div>

                      {/* Quantity and Price */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-[#f9f2f0] px-2 py-0.5 rounded-lg border border-[#dec1af]/50">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="text-[#26170c] font-bold text-xs hover:opacity-70 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-[#26170c] min-w-[14px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="text-[#26170c] font-bold text-xs hover:opacity-70 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs font-serif font-bold text-[#26170c]">
                          ₱{item.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Voucher / Coupon Code */}
              <div className="bg-white p-3 rounded-2xl border border-[#f3ecea]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f453f] mb-1.5">
                  Have a Promo Voucher?
                </label>
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-2 bg-[#e1e1c9]/40 border border-[#636451]/30 rounded-xl">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#636451]">
                        loyalty
                      </span>
                      <span className="text-xs font-bold text-[#26170c]">{appliedPromo.code}</span>
                      <span className="text-[10px] text-[#636451] font-semibold">
                        ({appliedPromo.discountPercent ? `${appliedPromo.discountPercent}% OFF` : `₱${appliedPromo.discountAmount} OFF`})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAppliedPromo(null)}
                      className="text-[11px] text-[#ba1a1a] hover:underline font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="e.g. ILUVKEYKS10, SWEET50"
                      className="flex-1 px-3 py-1.5 text-xs bg-[#f9f2f0] rounded-xl border border-[#dec1af] uppercase font-bold focus:outline-none focus:ring-1 focus:ring-[#26170c]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-[#26170c] text-white text-xs font-bold rounded-xl hover:bg-[#3d2b1f] active:scale-95 transition-all"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {promoError && <p className="text-[10px] text-[#ba1a1a] mt-1 font-medium">{promoError}</p>}
              </div>

              {/* Payment Method Selector */}
              <div className="bg-white p-3 rounded-2xl border border-[#f3ecea]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f453f] mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(['GCash', 'Maya', 'Cash', 'Card'] as const).map((method) => {
                    const isSelected = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                          isSelected
                            ? 'bg-[#26170c] text-white border-[#26170c] shadow-xs'
                            : 'bg-[#f9f2f0] text-[#4f453f] border-[#dec1af] hover:bg-[#eae2e0]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {method === 'GCash' || method === 'Maya'
                            ? 'phone_android'
                            : method === 'Cash'
                            ? 'payments'
                            : 'credit_card'}
                        </span>
                        <span>{method}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Barista Notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f453f] mb-1">
                  Overall Order Note
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Please pack coffee and pastries separately"
                  className="w-full px-3 py-1.5 text-xs bg-white rounded-xl border border-[#dec1af] font-medium focus:outline-none"
                />
              </div>

              {/* Order Cost Breakdown */}
              <div className="p-3.5 bg-[#f9f2f0] rounded-2xl border border-[#dec1af]/60 space-y-1.5 text-xs">
                <div className="flex justify-between text-[#4f453f]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#26170c]">₱{subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-[#636451] font-bold">
                    <span>Discount ({appliedPromo?.code})</span>
                    <span>-₱{discount.toFixed(2)}</span>
                  </div>
                )}

                {fulfillmentType === 'Delivery' && (
                  <div className="flex justify-between text-[#4f453f]">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-[#26170c]">
                      {deliveryFee === 0 ? 'FREE' : `₱${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#dec1af]/80 flex justify-between items-baseline font-serif">
                  <span className="text-sm font-bold text-[#26170c]">Total Amount</span>
                  <span className="text-lg sm:text-xl font-bold text-[#26170c]">
                    ₱{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sticky Checkout Bar */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-[#f9f2f0] border-t border-[#dec1af]/60">
            <button
              onClick={handleCheckout}
              className="w-full py-3.5 px-4 bg-[#26170c] hover:bg-[#3d2b1f] text-white font-bold text-sm rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Place {fulfillmentType} Order</span>
              </div>
              <span className="font-serif font-bold text-base sm:text-lg">
                ₱{grandTotal.toFixed(2)}
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};
