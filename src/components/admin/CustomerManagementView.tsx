import React, { useEffect, useMemo, useState } from 'react';
import { CustomerUser, Order } from '../../types';
import { customerService, CustomerPasswordResetRequest } from '../../services/customerService';
import { adminAuthService } from '../../services/adminAuthService';

interface CustomerManagementViewProps {
  customers: CustomerUser[];
  orders: Order[];
  onShowNotification: (msg: string) => void;
}

export const CustomerManagementView: React.FC<CustomerManagementViewProps> = ({ customers = [], orders = [], onShowNotification }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [directoryCustomers, setDirectoryCustomers] = useState<CustomerUser[]>([]);
  const [resetRequests, setResetRequests] = useState<CustomerPasswordResetRequest[]>([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const customerList = directoryCustomers || [];
  const orderList = orders || [];

  const refreshResetRequests = async () => {
    try {
      const requests = await customerService.listPasswordResetRequests();
      setResetRequests(requests);
    } catch (error) {
      console.warn('[CustomerManagementView] Failed to load password reset requests:', error);
    }
  };

  useEffect(() => {
    let active = true;
    adminAuthService.getSession().then((session) => {
      if (active) setIsSuperAdmin(session?.role === 'SUPER_ADMIN');
    }).catch(() => {
      if (active) setIsSuperAdmin(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    customerService.listCustomersFromServer().then((serverCustomers) => {
      if (!active) return;
      setDirectoryCustomers(serverCustomers);
    }).catch((error) => {
      console.warn('[CustomerManagementView] Failed to load shared customer directory:', error);
      if (active) {
        setDirectoryCustomers([]);
        onShowNotification('Unable to refresh the shared customer directory. Please try again.');
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    void refreshResetRequests();
    const timer = window.setInterval(() => void refreshResetRequests(), 30000);
    return () => window.clearInterval(timer);
  }, [isSuperAdmin]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return customerList.filter((c) => c && ((c.name || '').toLowerCase().includes(q) || (c.id || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.mobile || '').includes(q)));
  }, [customerList, searchQuery]);

  const getCustomerOrders = (customerId: string) => orderList.filter((o) => o && o.customerId === customerId);
  const getCustomerTotalSpend = (customerId: string) => getCustomerOrders(customerId).reduce((sum, o) => sum + o.total, 0);
  const selectedCustomer = customerList.find((c) => c.id === selectedCustomerId);
  const selectedCustomerOrders = selectedCustomer ? getCustomerOrders(selectedCustomer.id) : [];

  const refreshDirectory = async () => {
    try { setDirectoryCustomers(await customerService.listCustomersFromServer()); }
    catch (error) { console.warn('[CustomerManagementView] Failed to refresh directory:', error); }
  };

  const handleApproveReset = async (requestId: string) => {
    setRequestLoading(true);
    try { await customerService.approvePasswordReset(requestId); onShowNotification('Password reset approved. Customer password is now password1234.'); await refreshResetRequests(); }
    catch (error) { onShowNotification(`Unable to approve password reset: ${error instanceof Error ? error.message : 'Server error'}`); }
    finally { setRequestLoading(false); }
  };

  const handleRejectReset = async (requestId: string) => {
    setRequestLoading(true);
    try { await customerService.rejectPasswordReset(requestId); onShowNotification('Password reset request rejected.'); await refreshResetRequests(); }
    catch (error) { onShowNotification(`Unable to reject password reset: ${error instanceof Error ? error.message : 'Server error'}`); }
    finally { setRequestLoading(false); }
  };

  const handleDirectReset = async (customerId: string) => {
    if (!window.confirm('Reset this customer password to password1234?')) return;
    setRequestLoading(true);
    try { await customerService.resetCustomerPassword(customerId); onShowNotification('Customer password reset to password1234.'); }
    catch (error) { onShowNotification(`Unable to reset password: ${error instanceof Error ? error.message : 'Server error'}`); }
    finally { setRequestLoading(false); }
  };

  const handleDeleteCustomer = async (customer: CustomerUser) => {
    if (!window.confirm(`Delete customer ${customer.name} (${customer.id})? Their historical orders will be preserved.`)) return;
    setRequestLoading(true);
    try { await customerService.deleteCustomer(customer.id); setSelectedCustomerId(null); await refreshDirectory(); onShowNotification(`Customer ${customer.name} was deleted.`); }
    catch (error) { onShowNotification(`Unable to delete customer: ${error instanceof Error ? error.message : 'Server error'}`); }
    finally { setRequestLoading(false); }
  };

  return (
    <div className="pt-20 px-3.5 sm:px-5 max-w-5xl mx-auto pb-28 space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div><h2 className="font-serif text-2xl sm:text-[28px] font-bold text-[#26170c] tracking-tight">Customer Directory</h2><p className="text-xs text-[#4f453f] mt-0.5">Registered customer accounts, contact details & lifetime ordering history</p></div>
        <span className="text-xs font-bold px-3 py-1 bg-[#fbddca] text-[#26170c] rounded-full">{customerList.length} Verified Accounts</span>
      </div>

      {isSuperAdmin && resetRequests.length > 0 && <div className="bg-[#fff3e8] border border-[#e0a66d] rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[#9a4b00]">notifications_active</span><div><h3 className="text-sm font-bold text-[#26170c]">Password Reset Requests ({resetRequests.length})</h3><p className="text-[11px] text-[#6d5543]">Super Admin approval is required before a customer password changes.</p></div></div>
        {resetRequests.map((request) => <div key={request.id} className="bg-white rounded-xl border border-[#ead8ca] p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="min-w-0 text-xs"><div className="font-bold text-[#26170c]">{request.customerName} <span className="font-mono text-[10px]">({request.customerId})</span></div><div className="text-[#6d5543] truncate">{request.email} • {request.mobile}</div><div className="text-[10px] text-[#81756e] mt-1">Requested {new Date(request.requestedAt).toLocaleString()}</div></div>
          <div className="flex flex-wrap gap-2"><button type="button" disabled={requestLoading} onClick={() => void handleApproveReset(request.id)} className="px-3 py-2 rounded-lg bg-[#26170c] text-white text-[11px] font-bold disabled:opacity-50 cursor-pointer">Approve & Reset</button><button type="button" disabled={requestLoading} onClick={() => void handleRejectReset(request.id)} className="px-3 py-2 rounded-lg bg-white border border-[#dec1af] text-[#26170c] text-[11px] font-bold disabled:opacity-50 cursor-pointer">Reject</button></div>
        </div>)}
      </div>}

      <div className="relative"><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by Customer ID, name, email, or phone number..." className="w-full pl-10 pr-4 py-3 bg-white border border-[#dec1af] rounded-2xl text-xs sm:text-sm text-[#26170c] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#26170c]" /><span className="material-symbols-outlined absolute left-3 top-3 text-[#81756e] text-[20px]">search</span></div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className={`space-y-3 ${selectedCustomer ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          {filteredCustomers.length === 0 ? <div className="p-8 text-center bg-white rounded-2xl border border-[#f3ecea]"><span className="material-symbols-outlined text-[32px] text-[#81756e] mb-2">person_off</span><p className="text-sm font-bold text-[#26170c]">No registered customers found</p><p className="text-xs text-[#4f453f] mt-1">Try adjusting your search terms</p></div> : filteredCustomers.map((cust) => {
            const custOrders = getCustomerOrders(cust.id); const totalSpent = getCustomerTotalSpend(cust.id); const isSelected = cust.id === selectedCustomerId;
            return <div key={cust.id} onClick={() => setSelectedCustomerId(isSelected ? null : cust.id)} className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${isSelected ? 'border-[#26170c] ring-2 ring-[#26170c]/20 bg-[#fff8f5]' : 'border-[#f3ecea] hover:border-[#dec1af]'}`}>
              <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 rounded-full bg-[#26170c] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">{cust.name.charAt(0)}</div><div className="min-w-0"><div className="flex items-center gap-1.5 flex-wrap"><h4 className="font-serif text-sm sm:text-base font-bold text-[#26170c]">{cust.name}</h4><span className="px-2 py-0.2 bg-[#e1e1c9] text-[#636451] font-mono text-[10px] font-bold rounded-md">{cust.id}</span></div><p className="text-xs text-[#4f453f] mt-0.5 truncate">{cust.email} • {cust.mobile}</p></div></div><span className="px-2 py-0.5 bg-[#8fbc8f]/30 text-[#26170c] text-[10px] font-bold rounded-full flex-shrink-0">{cust.status.toUpperCase()}</span></div>
              <div className="mt-3 pt-2.5 border-t border-[#f3ecea] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[#4f453f]"><div className="flex items-center gap-4 flex-wrap"><span>📦 <strong className="text-[#26170c]">{custOrders.length}</strong> orders</span><span>💰 <strong className="text-[#26170c]">₱{totalSpent.toFixed(2)}</strong> spent</span><span>⭐ <strong className="text-[#26170c]">{cust.stamps || 0}/10</strong> stamps</span></div><span className="text-[#81756e] text-[11px] font-medium">Joined {cust.createdAt}</span></div>
            </div>;
          })}
        </div>

        {selectedCustomer && <div className="lg:col-span-6 bg-white rounded-3xl border border-[#dec1af] p-5 shadow-lg space-y-4">
          <div className="flex justify-between items-start border-b border-[#f3ecea] pb-3"><div><span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#26170c] text-[#fbddca] rounded-md">{selectedCustomer.id}</span><h3 className="font-serif text-xl font-bold text-[#26170c] mt-1">{selectedCustomer.name}</h3><p className="text-xs text-[#81756e]">Member since {selectedCustomer.createdAt}</p></div><button type="button" onClick={() => setSelectedCustomerId(null)} className="p-1 text-[#81756e] hover:text-[#26170c] rounded-lg cursor-pointer"><span className="material-symbols-outlined text-[20px]">close</span></button></div>
          <div className="bg-[#f9f2f0] p-3.5 rounded-2xl space-y-2 text-xs"><div><span className="text-[#81756e] block text-[10px] uppercase font-bold">Email Address</span><span className="font-semibold text-[#26170c]">{selectedCustomer.email}</span></div><div><span className="text-[#81756e] block text-[10px] uppercase font-bold">Mobile Phone</span><span className="font-semibold text-[#26170c]">{selectedCustomer.mobile}</span></div><div><span className="text-[#81756e] block text-[10px] uppercase font-bold">Saved Delivery Address</span><span className="font-semibold text-[#26170c]">{selectedCustomer.address}</span></div></div>
          {isSuperAdmin && <div className="flex flex-col sm:flex-row gap-2"><button type="button" disabled={requestLoading} onClick={() => void handleDirectReset(selectedCustomer.id)} className="flex-1 px-3 py-2.5 rounded-xl bg-[#fbddca] text-[#26170c] text-xs font-bold disabled:opacity-50 cursor-pointer">Reset Password to password1234</button><button type="button" disabled={requestLoading} onClick={() => void handleDeleteCustomer(selectedCustomer)} className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold disabled:opacity-50 cursor-pointer">Delete Customer</button></div>}
          <div className="grid grid-cols-2 gap-3"><div className="p-3 bg-[#e1e1c9]/40 rounded-2xl border border-[#dec1af]/30 text-center"><span className="text-[11px] text-[#636451] font-bold block">Digital Stamp Card</span><span className="font-serif text-xl font-extrabold text-[#26170c]">{selectedCustomer.stamps || 0} / 10</span><span className="text-[10px] text-[#81756e] block mt-0.5">3 stamps to next reward</span></div><div className="p-3 bg-[#fbddca]/40 rounded-2xl border border-[#dec1af]/30 text-center"><span className="text-[11px] text-[#26170c] font-bold block">Reward Points</span><span className="font-serif text-xl font-extrabold text-[#26170c]">{selectedCustomer.points || 0} pts</span><span className="text-[10px] text-[#81756e] block mt-0.5">VIP Tier Member</span></div></div>
          <div><h4 className="font-serif text-sm font-bold text-[#26170c] mb-2 flex items-center justify-between gap-2"><span>Order History ({selectedCustomerOrders.length})</span><span className="text-xs font-normal text-[#81756e]">Total Spend: ₱{getCustomerTotalSpend(selectedCustomer.id).toFixed(2)}</span></h4>{selectedCustomerOrders.length === 0 ? <p className="text-xs text-[#81756e] bg-[#f9f2f0] p-4 rounded-xl text-center">No orders placed yet.</p> : <div className="space-y-2 max-h-64 overflow-y-auto pr-1">{selectedCustomerOrders.map((ord) => <div key={ord.id} className="p-3 bg-[#f9f2f0] rounded-xl border border-[#f3ecea] text-xs flex justify-between items-center gap-3"><div className="min-w-0"><div className="flex items-center gap-1.5 flex-wrap"><span className="font-bold text-[#26170c]">#{ord.orderNumber}</span><span className="px-1.5 py-0.2 bg-[#dec1af]/50 text-[#26170c] rounded text-[10px] font-bold">{ord.status}</span><span className="text-[10px] text-[#81756e]">• {ord.orderType || 'Order'}</span></div><p className="text-[#4f453f] text-[11px] mt-0.5 truncate">{ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}</p></div><span className="font-bold text-sm text-[#26170c] flex-shrink-0">₱{ord.total.toFixed(2)}</span></div>)}</div>}</div>
        </div>}
      </div>
    </div>
  );
};
