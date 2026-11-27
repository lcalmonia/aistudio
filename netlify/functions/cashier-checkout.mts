import { randomBytes } from 'node:crypto';
import type { Config } from '@netlify/functions';
import { database } from './_shared/database.mts';
import { requireAuthenticatedCashier } from './_shared/cashierAuth.mts';
import { resolveDeliveryPolicy } from './_shared/deliveryZones.mts';
import { enforceSameOrigin,errorResponse,json,readJsonObject,RequestError,requireString } from './_shared/http.mts';

type CartLine={menuItemId:string;quantity:number;sizeName?:string;addonIds?:string[];temperature?:string};
const money=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;
export default async function handler(request:Request):Promise<Response>{
 if(request.method!=='POST')return json({error:'Method not allowed.'},405);
 try{
  enforceSameOrigin(request);const cashier=await requireAuthenticatedCashier(request);const body=await readJsonObject(request);
  const idem=requireString(body.idempotencyKey,'Transaction key',{min:12,max:80});
  const orderType=body.orderType;
  if(!['Dine-In','Takeout','Delivery'].includes(String(orderType)))throw new RequestError(400,'Choose Dine-In, Takeout, or Delivery.');
  const paymentMethod=body.paymentMethod;
  if(!['Cash','GCash','Maya','Card'].includes(String(paymentMethod)))throw new RequestError(400,'Choose a valid payment method.');
  const lines=body.items;
  if(!Array.isArray(lines)||lines.length===0||lines.length>80)throw new RequestError(400,'Add at least one item to the order.');
  const db=database();
  const previous=await db.sql`SELECT id,order_number,total,status,payment_status FROM orders WHERE cashier_idempotency_key=${idem} LIMIT 1`;
  if(previous.length)return json({order:previous[0],duplicate:true});
  const menuIds=[...new Set(lines.map((x)=>String((x as CartLine)?.menuItemId||'')))];
  if(menuIds.some(x=>!x))throw new RequestError(400,'An order item is invalid.');
  const menuRows=await db.pool.query('SELECT id,name,category,price,temperature,sizes,add_on_ids FROM menu_items WHERE available=TRUE AND id = ANY($1::text[])',[menuIds]);
  const menu=new Map(menuRows.rows.map((x:any)=>[x.id,x]));
  if(menu.size!==menuIds.length)throw new RequestError(409,'A selected product is no longer available. Refresh the menu.');
  const addonIds=[...new Set(lines.flatMap((x)=>Array.isArray((x as CartLine).addonIds)?(x as CartLine).addonIds!:[]))];
  const addonRows=addonIds.length?await db.pool.query('SELECT id,name,price,available FROM add_ons WHERE id = ANY($1::text[]) AND available=TRUE',[addonIds]):{rows:[] as any[]};
  const addons=new Map(addonRows.rows.map((x:any)=>[x.id,x]));
  if(addons.size!==addonIds.length)throw new RequestError(409,'A selected add-on is no longer available. Refresh the menu.');
  const orderItems:any[]=[];let subtotal=0;
  for(let i=0;i<lines.length;i++){
   const line=lines[i] as CartLine;const product:any=menu.get(line.menuItemId);
   const qty=Number(line.quantity);if(!Number.isInteger(qty)||qty<1||qty>99)throw new RequestError(400,'Item quantity must be between 1 and 99.');
   const sizes=Array.isArray(product.sizes)?product.sizes:(typeof product.sizes==='string'?JSON.parse(product.sizes||'[]'):[]);
   let sizeDelta=0;let sizeName='';
   if(line.sizeName){const size=sizes.find((x:any)=>String(x.name)===line.sizeName);if(!size)throw new RequestError(400,'The selected size is not valid for '+product.name+'.');sizeDelta=Number(size.priceDelta??size.price_delta)||0;sizeName=String(size.name);}
   const allowed=Array.isArray(product.add_on_ids)?product.add_on_ids:[];
   const chosen=Array.isArray(line.addonIds)?[...new Set(line.addonIds)]:[];
   for(const id of chosen)if(!allowed.includes(id))throw new RequestError(400,'An add-on is not available for '+product.name+'.');
   const selected=chosen.map(id=>addons.get(id) as any);
   const addonPrice=selected.reduce((sum:number,a:any)=>sum+Number(a.price||0),0);
   const unit=money(Number(product.price)+sizeDelta+addonPrice);
   if(!Number.isFinite(unit)||unit<0)throw new RequestError(400,'Invalid product price.');
   const temp=['Hot','Iced'].includes(String(line.temperature))?String(line.temperature):undefined;
   const customization=[sizeName,...selected.map((a:any)=>a.name)].filter(Boolean).join(', ')||undefined;
   orderItems.push({name:String(product.name),quantity:qty,price:unit,size:sizeName||undefined,temperature:temp,customization});
   subtotal+=unit*qty;
  }
  subtotal=money(subtotal);
  const customerName=typeof body.customerName==='string'&&body.customerName.trim()?body.customerName.trim():'Walk-in Guest';
  const customerPhone=typeof body.customerPhone==='string'?body.customerPhone.trim():'';
  const deliveryAddress=typeof body.deliveryAddress==='string'?body.deliveryAddress.trim():'';
  const tableNumber=typeof body.tableNumber==='string'?body.tableNumber.trim():'';
  const notes=typeof body.notes==='string'?body.notes.trim():'';
  let deliveryFee=0;
  if(orderType==='Delivery'){
   if(!customerName||!customerPhone||!deliveryAddress)throw new RequestError(400,'Delivery requires customer name, contact number, and complete address.');
   const policy=await resolveDeliveryPolicy(deliveryAddress,subtotal);deliveryFee=policy.fee;
  }
  if(orderType==='Dine-In'&&!tableNumber)throw new RequestError(400,'Enter the table number for Dine-In.');
  const total=money(subtotal+deliveryFee);
  const tendered=Number(body.amountTendered??0);
  if(paymentMethod==='Cash'&&(!Number.isFinite(tendered)||tendered<total))throw new RequestError(400,'Cash received must be at least the total amount due.');
  const id='ord-pos-'+randomBytes(12).toString('hex');
  const orderNumber='ILK-'+Date.now().toString().slice(-9)+'-'+randomBytes(2).toString('hex').toUpperCase();
  const client=await db.pool.connect();
  try{
   await client.query('BEGIN');
   const inserted=await client.query(`INSERT INTO orders (
    id,order_number,customer_name,customer_phone,time_ago,timestamp,status,total,notes,order_type,table_number,delivery_address,
    payment_method,subtotal,discount,delivery_fee,is_customer_order,created_at,updated_at,completed_at,
    cashier_user_id,payment_status,cashier_idempotency_key
   ) VALUES ($1,$2,$3,$4,'Just now',$5,'New',$6,$7,$8,$9,$10,$11,$12,0,$13,FALSE,NOW(),NOW(),NULL,$14,'Paid',$15)
   RETURNING id,order_number,total,status,payment_status,created_at`,
   [id,orderNumber,customerName,customerPhone||null,Date.now(),total,notes||null,orderType,tableNumber||null,deliveryAddress||null,paymentMethod,subtotal,deliveryFee,cashier.id,idem]);
   for(let pos=0;pos<orderItems.length;pos++){
    const item=orderItems[pos];
    await client.query(`INSERT INTO order_items(order_id,line_position,name,quantity,customization,price,completed,temperature,size)
      VALUES($1,$2,$3,$4,$5,$6,FALSE,$7,$8)`,
      [id,pos,item.name,item.quantity,item.customization||null,item.price,item.temperature||null,item.size||null]);
   }
   await client.query('COMMIT');
   return json({order:inserted.rows[0],change:paymentMethod==='Cash'?money(tendered-total):0,subtotal,deliveryFee,total});
  }catch(e){await client.query('ROLLBACK');if(typeof e==='object'&&e!==null&&'code'in e&&e.code==='23505'){const existing=await db.sql`SELECT id,order_number,total,status,payment_status FROM orders WHERE cashier_idempotency_key=${idem} LIMIT 1`;if(existing.length)return json({order:existing[0],duplicate:true});}throw e;}
  finally{client.release();}
 }catch(e){return errorResponse(e);}
}
export const config:Config={path:'/api/cashier/checkout',method:['POST']};
