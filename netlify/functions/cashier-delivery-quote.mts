import type { Config } from '@netlify/functions';
import { requireAuthenticatedCashier } from './_shared/cashierAuth.mts';
import { resolveDeliveryPolicy } from './_shared/deliveryZones.mts';
import { enforceSameOrigin,errorResponse,json,readJsonObject,RequestError } from './_shared/http.mts';
export default async function handler(request:Request):Promise<Response>{
 if(request.method!=='POST')return json({error:'Method not allowed.'},405);
 try{enforceSameOrigin(request);await requireAuthenticatedCashier(request);const body=await readJsonObject(request);const address=typeof body.address==='string'?body.address.trim():'';const subtotal=Number(body.subtotal);if(!address)throw new RequestError(400,'Enter a complete delivery address.');if(!Number.isFinite(subtotal)||subtotal<0)throw new RequestError(400,'Invalid order subtotal.');const policy=await resolveDeliveryPolicy(address,subtotal);return json({deliveryFee:policy.fee,freeDeliveryThreshold:policy.freeDeliveryThreshold,zone:policy.zone?.name||null});}catch(e){return errorResponse(e);}
}
export const config:Config={path:'/api/cashier/delivery-quote',method:['POST']};
