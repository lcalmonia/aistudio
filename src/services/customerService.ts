import { CustomerUser } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateCustomerId } from './idGenerator';

class CustomerApiError extends Error {
  constructor(message: string, public readonly status?: number) { super(message); }
}
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new CustomerApiError(data.error || 'The customer request could not be completed.', response.status);
  return data;
}
export interface CustomerPasswordResetRequest { id:string; customerId:string; customerName:string; email:string; mobile:string; requestedAt:string; status:string; reviewedAt:string|null; }
export const customerService = {
  async listCustomers(): Promise<CustomerUser[]> { return storageAdapter.getCustomers(); },
  async listCustomersFromServer(): Promise<CustomerUser[]> { const response=await api<{customers:CustomerUser[]}>('/api/customers',{method:'GET'}); if(!response||!Array.isArray(response.customers)) throw new CustomerApiError('Invalid customer directory response.'); storageAdapter.setCustomers(response.customers); return response.customers; },
  async getCustomer(id:string):Promise<CustomerUser|null>{ return storageAdapter.getCustomers().find(c=>c.id===id)||null; },
  async createCustomer(data:{name:string;email:string;mobile:string;address:string;password?:string}):Promise<{success:boolean;customer?:CustomerUser;error?:string}>{
    const customers=storageAdapter.getCustomers(); const cleanEmail=data.email.trim().toLowerCase(); const cleanMobile=data.mobile.trim();
    if(customers.find(c=>c.email.toLowerCase()===cleanEmail)) return {success:false,error:'An account with this email address already exists. Please log in.'};
    const newCustomer:CustomerUser={id:generateCustomerId(),name:data.name.trim(),email:cleanEmail,mobile:cleanMobile,address:data.address.trim(),createdAt:new Date().toISOString().split('T')[0],status:'active',role:'customer',stamps:0,points:0};
    try{const response=await api<{customer:CustomerUser}>('/api/customers',{method:'POST',body:JSON.stringify({...newCustomer,password:data.password})}); if(!response?.customer)return {success:false,error:'Registration failed.'}; const savedCustomer=response.customer; storageAdapter.setCustomers([savedCustomer,...customers.filter(c=>c.id!==savedCustomer.id)]); return {success:true,customer:savedCustomer};}catch(err){return {success:false,error:err instanceof Error?err.message:'Registration failed.'};}
  },
  async loginCustomer(identifier:string,password:string):Promise<CustomerUser>{const response=await api<{customer:CustomerUser}>('/api/customer-password',{method:'POST',body:JSON.stringify({action:'login',identifier,password})}); if(!response?.customer)throw new CustomerApiError('Invalid customer login response.'); storageAdapter.setCurrentCustomer(response.customer); const customers=storageAdapter.getCustomers(); storageAdapter.setCustomers([response.customer,...customers.filter(c=>c.id!==response.customer!.id)]); return response.customer;},
  async changeCustomerPassword(customerId:string,currentPassword:string,newPassword:string):Promise<void>{await api('/api/customer-password',{method:'POST',body:JSON.stringify({action:'change',customerId,currentPassword,newPassword})});},
  async requestPasswordReset(identifier:string):Promise<void>{await api('/api/customer-password',{method:'POST',body:JSON.stringify({action:'request',identifier})});},
  async listPasswordResetRequests():Promise<CustomerPasswordResetRequest[]>{const response=await api<{requests:CustomerPasswordResetRequest[]}>('/api/customer-password',{method:'GET'});return response.requests||[];},
  async approvePasswordReset(requestId:string):Promise<void>{await api('/api/customer-password',{method:'POST',body:JSON.stringify({action:'approve',requestId})});},
  async rejectPasswordReset(requestId:string):Promise<void>{await api('/api/customer-password',{method:'POST',body:JSON.stringify({action:'reject',requestId})});},
  async resetCustomerPassword(customerId:string):Promise<void>{await api('/api/customer-password',{method:'POST',body:JSON.stringify({action:'reset',customerId})});},
  async deleteCustomer(customerId:string):Promise<void>{await api('/api/customer-password',{method:'POST',body:JSON.stringify({action:'delete',customerId})});const customers=storageAdapter.getCustomers();storageAdapter.setCustomers(customers.filter(c=>c.id!==customerId));if(storageAdapter.getCurrentCustomer()?.id===customerId)storageAdapter.setCurrentCustomer(null);},
  async updateCustomer(id:string,updates:Partial<CustomerUser>):Promise<{success:boolean;customer?:CustomerUser;error?:string}>{const customers=storageAdapter.getCustomers();const index=customers.findIndex(c=>c.id===id);if(index===-1)return {success:false,error:'Customer not found.'};const updatedCustomer={...customers[index],...updates};customers[index]=updatedCustomer;storageAdapter.setCustomers(customers);const current=storageAdapter.getCurrentCustomer();if(current&&current.id===id)storageAdapter.setCurrentCustomer(updatedCustomer);return {success:true,customer:updatedCustomer};},
  async deactivateCustomer(id:string):Promise<{success:boolean;error?:string}>{const updated=storageAdapter.getCustomers().map(c=>c.id===id?{...c,status:'inactive' as const}:c);storageAdapter.setCustomers(updated);return {success:true};},
  async saveCustomers(customers:CustomerUser[]):Promise<CustomerUser[]>{storageAdapter.setCustomers(customers);return customers;},
};
