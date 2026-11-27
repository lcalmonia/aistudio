import type { Config, Context } from '@netlify/functions';
import { clearCashierCookie, requireAuthenticatedCashier } from './_shared/cashierAuth.mts';
import { errorResponse, json } from './_shared/http.mts';
export default async function handler(request:Request,context:Context):Promise<Response>{
 if(request.method!=='GET')return json({error:'Method not allowed.'},405);
 try{return json({authenticated:true,cashier:await requireAuthenticatedCashier(request)});}
 catch(e){const response=errorResponse(e);if(response.status===401)clearCashierCookie(context);return response;}
}
export const config:Config={path:'/api/cashier/session',method:['GET']};
