import React, { useState } from 'react';
import { CustomerUser, Order } from '../../types';

interface CustomerManagementViewProps {
  customers: CustomerUser[];
  orders: Order[];
  onShowNotification: (msg: string) => void;
}

export const CustomerManagementView: React.FC<CustomerManagementViewProps> = ({
  customers = [],
  orders = [],
  onShowNotification,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const customerList = customers || [];
  const orderList = orders || [];

  const filteredCustomers = customerList.filter((c) => {
    if (!c) return false;
    const q = searchQuery.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.id || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.mobile || '').includes(q)
    );
  });

  const getCustomerOrders = (customerId: string) => {
    return orderList.filter((o) => o && o.customerId === customerId);
  };

  const getCustomerTotalSpend = (customerId: string) => {
    const custOrders = getCustomerOrders(customerId);
    return custOrders.reduce((sum, o) => sum + o.total, 0);
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedCustomerOrders = selectedCustomer ? getCustomerOrders(selectedCustomer.id) : [];

  return (
    <div className="pt-20 px-3.5 sm:px-5 max-w-4xl mx-auto pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-5">
        <div>
          <h2 className="font-serif text-2xl sm:text-[28px] font-bold text-[#26170c] tracking-tight">
            Customer Directory
          </h2>
          <p className="text-xs text-[#4f453f] mt-0.5">
            Registered customer accounts, contact details & lifetime ordering history
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-[#fbddca] text-[#26170c] rounded-full">
          {customers.length} Verified Accounts
        </span>
      </div>

      {/* Search & Filter */}
      <div className="mb-5 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Customer ID, name, email, or phone number..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-[#dec1af] rounded-2xl text-xs sm:text-sm text-[#26170c] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#26170c]"
        />
        <span className="material-symbols-outlined absolute left-3 top-3 text-[#81756e] text-[20px]">
          search
        </span>
      </div>

      {/* Main Grid: Customer List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Customer Cards List */}
        <div className={`space-y-3 ${selectedCustomer ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#f3ecea]">
              <span className="material-symbols-outlined text-[32px] text-[#81756e] mb-2">person_off</span>
              <p className="text-sm font-bold text-[#26170c]">No registered customers found</p>
              <p className="text-xs text-[#4f453f] mt-1">Try adjusting your search terms</p>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const custOrders = getCustomerOrders(cust.id);
              const totalSpent = getCustomerTotalSpend(cust.id);
              const isSelected = cust.id === selectedCustomerId;

              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(isSelected ? null : cust.id)}
                  className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                    isSelected
                      ? 'border-[#26170c] ring-2 ring-[#26170c]/20 bg-[#fff8f5]'
                      : 'border-[#f3ecea] hover:border-[#dec1af]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#26170c] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {cust.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-serif text-sm sm:text-base font-bold text-[#26170c]">
                            {cust.name}
                          </h4>
                          <span className="px-2 py-0.2 bg-[#e1e1c9] text-[#636451] font-mono text-[10px] font-bold rounded-md">
                            {cust.id}
                          </span>
                        </div>
                        <p className="text-xs text-[#4f453f] mt-0.5">{cust.email} • {cust.mobile}</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 bg-[#8fbc8f]/30 text-[#26170c] text-[10px] font-bold rounded-full">
                      {cust.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#f3ecea] flex items-center justify-between text-xs text-[#4f453f]">
                    <div className="flex items-center gap-4">
                      <span>📦 <strong className="text-[#26170c]">{custOrders.length}</strong> orders</span>
                      <span>💰 <strong className="text-[#26170c]">₱{totalSpent.toFixed(2)}</strong> spent</span>
                      <span>⭐ <strong className="text-[#26170c]">{cust.stamps || 0}/10</strong> stamps</span>
                    </div>
                    <span className="text-[#81756e] text-[11px] font-medium">
                      Joined {cust.createdAt}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Customer Detailed Drawer / Panel */}
        {selectedCustomer && (
          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#dec1af] p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-start border-b border-[#f3ecea] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#26170c] text-[#fbddca] rounded-md">
                  {selectedCustomer.id}
                </span>
                <h3 className="font-serif text-xl font-bold text-[#26170c] mt-1">
                  {selectedCustomer.name}
                </h3>
                <p className="text-xs text-[#81756e]">Member since {selectedCustomer.createdAt}</p>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-1 text-[#81756e] hover:text-[#26170c] rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Profile Info */}
            <div className="bg-[#f9f2f0] p-3.5 rounded-2xl space-y-2 text-xs">
              <div>
                <span className="text-[#81756e] block text-[10px] uppercase font-bold">Email Address</span>
                <span className="font-semibold text-[#26170c]">{selectedCustomer.email}</span>
              </div>
              <div>
                <span className="text-[#81756e] block text-[10px] uppercase font-bold">Mobile Phone</span>
                <span className="font-semibold text-[#26170c]">{selectedCustomer.mobile}</span>
              </div>
              <div>
                <span className="text-[#81756e] block text-[10px] uppercase font-bold">Saved Delivery Address</span>
                <span className="font-semibold text-[#26170c]">{selectedCustomer.address}</span>
              </div>
            </div>

            {/* Loyalty Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#e1e1c9]/40 rounded-2xl border border-[#dec1af]/30 text-center">
                <span className="text-[11px] text-[#636451] font-bold block">Digital Stamp Card</span>
                <span className="font-serif text-xl font-extrabold text-[#26170c]">
                  {selectedCustomer.stamps || 0} / 10
                </span>
                <span className="text-[10px] text-[#81756e] block mt-0.5">3 stamps to next reward</span>
              </div>
              <div className="p-3 bg-[#fbddca]/40 rounded-2xl border border-[#dec1af]/30 text-center">
                <span className="text-[11px] text-[#26170c] font-bold block">Reward Points</span>
                <span className="font-serif text-xl font-extrabold text-[#26170c]">
                  {selectedCustomer.points || 0} pts
                </span>
                <span className="text-[10px] text-[#81756e] block mt-0.5">VIP Tier Member</span>
              </div>
            </div>

            {/* Customer's Order History */}
            <div>
              <h4 className="font-serif text-sm font-bold text-[#26170c] mb-2 flex items-center justify-between">
                <span>Order History ({selectedCustomerOrders.length})</span>
                <span className="text-xs font-normal text-[#81756e]">
                  Total Spend: ₱{getCustomerTotalSpend(selectedCustomer.id).toFixed(2)}
                </span>
              </h4>

              {selectedCustomerOrders.length === 0 ? (
                <p className="text-xs text-[#81756e] bg-[#f9f2f0] p-4 rounded-xl text-center">
                  No orders placed yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {selectedCustomerOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 bg-[#f9f2f0] rounded-xl border border-[#f3ecea] text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#26170c]">#{ord.orderNumber}</span>
                          <span className="px-1.5 py-0.2 bg-[#dec1af]/50 text-[#26170c] rounded text-[10px] font-bold">
                            {ord.status}
                          </span>
                          <span className="text-[10px] text-[#81756e]">• {ord.orderType || 'Order'}</span>
                        </div>
                        <p className="text-[#4f453f] text-[11px] mt-0.5">
                          {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </div>
                      <span className="font-bold text-sm text-[#26170c]">
                        ₱{ord.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
