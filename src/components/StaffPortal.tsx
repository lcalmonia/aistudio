import React, { useCallback, useEffect, useRef, useState } from 'react';

type StaffOrder = {
  id: string; order_number: string; customer_name: string; status: string;
  order_type?: string | null; table_number?: string | null; notes?: string | null;
  created_at: string; updated_at: string;
  items: Array<{name:string;quantity:number;customization?:string|null;temperature?:string|null;size?:string|null}>;
};
type StaffIdentity = {id:string;username:string;displayName:string};

async function request<T>(path:string, init?:RequestInit):Promise<T>{
  const response=await fetch(path,{...init,credentials:'same-origin',headers:{...(init?.body?{'Content-Type':'application/json'}:{}),...init?.headers}});
  const data=await response.json().catch(()=>({})) as T & {error?:string};
  if(!response.ok) throw new Error(data.error||'Request failed.');
  return data;
}

export const StaffPortal:React.FC=()=>{
  const [staff,setStaff]=useState<StaffIdentity|null>(null);
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [orders,setOrders]=useState<StaffOrder[]>([]);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [busyOrder,setBusyOrder]=useState<string|null>(null);
  const [refreshing,setRefreshing]=useState(false);
  const cursorRef=useRef<string|null>(null);

  const refresh=useCallback(async(initial=false)=>{
    if(!staff)return;
    setRefreshing(true);
    try{
      const query=!initial&&cursorRef.current?('?updatedSince='+encodeURIComponent(cursorRef.current)):'';
      const result=await request<{orders:StaffOrder[];serverTime:string}>('/api/staff/orders'+query);
      setOrders(current=>{
        if(initial)return result.orders;
        const next=new Map(current.map(order=>[order.id,order]));
        for(const order of result.orders){
          if(['Completed','Cancelled'].includes(order.status))next.delete(order.id);
          else next.set(order.id,order);
        }
        return Array.from(next.values()).sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
      });
      cursorRef.current=result.serverTime;
      setError('');
    }catch(e){setError(e instanceof Error?e.message:'Unable to refresh orders.');}
    finally{setRefreshing(false);}
  },[staff,cursor]);

  useEffect(()=>{
    let alive=true;
    request<{authenticated:boolean;staff:StaffIdentity}>('/api/staff/session').then(result=>{
      if(!alive)return;setStaff(result.staff);
    }).catch(()=>{if(alive)setLoading(false);});
    return()=>{alive=false;};
  },[]);

  useEffect(()=>{
    if(!staff){setLoading(false);return;}
    let alive=true;
    const run=async()=>{if(!alive||document.visibilityState!=='visible')return;await refresh(!cursorRef.current);setLoading(false);};
    void run();
    const timer=window.setInterval(()=>void run(),15000);
    const onFocus=()=>{if(document.visibilityState==='visible')void run();};
    document.addEventListener('visibilitychange',onFocus);
    window.addEventListener('focus',onFocus);
    return()=>{alive=false;window.clearInterval(timer);document.removeEventListener('visibilitychange',onFocus);window.removeEventListener('focus',onFocus);};
  },[staff,refresh]);

  const login=async(event:React.FormEvent)=>{
    event.preventDefault();setError('');setLoading(true);
    try{const result=await request<{staff:StaffIdentity}>('/api/staff/login',{method:'POST',body:JSON.stringify({username,password})});setStaff(result.staff);setPassword('');cursorRef.current=null;}
    catch(e){setError(e instanceof Error?e.message:'Unable to sign in.');}
    finally{setLoading(false);}
  };

  const logout=async()=>{try{await request('/api/staff/logout',{method:'POST',body:'{}'});}catch{}setStaff(null);setOrders([]);cursorRef.current=null;};

  const updateStatus=async(order:StaffOrder,status:'Brewing'|'Preparing'|'Ready')=>{
    setBusyOrder(order.id);setError('');
    try{
      await request('/api/staff/orders/'+encodeURIComponent(order.id)+'/status',{method:'PATCH',body:JSON.stringify({status})});
      await refresh(true);
    }catch(e){setError(e instanceof Error?e.message:'Unable to update order status.');}
    finally{setBusyOrder(null);}
  };

  if(!staff)return <main className="min-h-screen bg-[#fff8f5] flex items-center justify-center p-4 text-[#26170c]"><form onSubmit={login} className="w-full max-w-sm bg-white border border-[#dec1af] rounded-2xl p-6 shadow-sm space-y-4"><div><p className="text-[10px] font-bold uppercase tracking-widest text-[#81756e]">iLuvKeyks · Staff Access</p><h1 className="font-serif text-2xl font-bold mt-1">Staff Portal</h1><p className="text-sm text-[#81756e] mt-1">Orders and preparation status only.</p></div>{error&&<p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{error}</p>}<label className="block text-sm font-semibold">Username<input className="mt-1 w-full border border-[#dec1af] rounded-lg px-3 py-2" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" required/></label><label className="block text-sm font-semibold">Password<input className="mt-1 w-full border border-[#dec1af] rounded-lg px-3 py-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label><button disabled={loading} className="w-full rounded-lg bg-[#26170c] text-white py-3 font-bold disabled:opacity-60">{loading?'Please wait…':'Sign In'}</button></form></main>;

  const activeCount=orders.filter(order=>order.status==='New').length;
  return <main className="min-h-screen bg-[#fff8f5] text-[#26170c] pb-8"><header className="sticky top-0 z-10 bg-white border-b border-[#eadbd3] px-4 py-3 flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-widest text-[#81756e] font-bold">iLuvKeyks · Staff</p><h1 className="font-serif text-xl font-bold">Order Board</h1><p className="text-xs text-[#81756e]">Signed in: {staff.displayName}</p></div><div className="flex gap-2"><button onClick={()=>void refresh(true)} className="border border-[#dec1af] rounded-lg px-3 py-2 text-sm">{refreshing?'Refreshing…':'Refresh'}</button><button onClick={()=>void logout()} className="bg-[#26170c] text-white rounded-lg px-3 py-2 text-sm">Sign out</button></div></header><section className="max-w-3xl mx-auto p-3 sm:p-5 space-y-3"><div className="flex items-center justify-between"><p className="text-sm font-semibold">{orders.length} active order(s) · {activeCount} new</p><span className="text-xs text-[#81756e]">Auto-refresh: 15 sec</span></div>{error&&<div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm">{error}</div>}{loading?<p className="p-8 text-center text-sm text-[#81756e]">Loading orders…</p>:orders.length===0?<div className="bg-white rounded-xl border border-[#eadbd3] p-8 text-center"><p className="font-semibold">No active orders</p><p className="text-sm text-[#81756e] mt-1">New orders will appear here automatically.</p></div>:orders.map(order=><article key={order.id} className="bg-white border border-[#eadbd3] rounded-xl p-4 shadow-sm space-y-3"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-lg">#{order.order_number}</h2><p className="text-sm text-[#6f625a]">{order.customer_name} · {order.order_type||'Order'}{order.table_number?' · Table '+order.table_number:''}</p><p className="text-xs text-[#81756e]">{new Date(order.created_at).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</p></div><span className={'text-xs font-bold rounded-full px-3 py-1 '+(order.status==='New'?'bg-amber-100 text-amber-900':order.status==='Ready'?'bg-green-100 text-green-900':'bg-blue-100 text-blue-900')}>{order.status}</span></div><ul className="divide-y divide-[#f1e8e3]">{order.items.map((item,index)=><li key={index} className="py-2 text-sm"><div className="flex gap-2"><strong className="min-w-8">{item.quantity}×</strong><div className="flex-1"><p className="font-semibold">{item.name}{item.size?' · '+item.size:''}{item.temperature?' · '+item.temperature:''}</p>{item.customization&&<p className="text-xs text-[#6f625a] whitespace-pre-wrap">{item.customization}</p>}</div></div></li>)}</ul>{order.notes&&<p className="bg-[#fff8f5] rounded-lg p-2 text-sm"><strong>Note:</strong> {order.notes}</p>}<div className="flex gap-2">{order.status==='New'&&<button disabled={busyOrder===order.id} onClick={()=>void updateStatus(order,'Brewing')} className="flex-1 rounded-lg bg-[#26170c] text-white py-2.5 text-sm font-bold disabled:opacity-50">Accept · Start Preparing</button>}{(order.status==='Brewing'||order.status==='Preparing')&&<button disabled={busyOrder===order.id} onClick={()=>void updateStatus(order,'Ready')} className="flex-1 rounded-lg bg-green-700 text-white py-2.5 text-sm font-bold disabled:opacity-50">Mark Ready</button>}</div></article>)}</section></main>;
};
