import type { Config, Context } from '@netlify/functions';
import { clearCashierCookie, invalidateCashierSession } from './_shared/cashierAuth.mts';
import { enforceSameOrigin, errorResponse, json } from './_shared/http.mts';
export default async function handler(request:Request,context:Context):Promise<Response>{
 if(request.method!=='POST')return json({error:'Method not allowed.'},405);
 try{enforceSameOrigin(request);await invalidateCashierSession(request);clearCashierCookie(context);return json({authenticated:false});}
 catch(e){clearCashierCookie(context);return errorResponse(e);}
}
export const config:Config={path:'/api/cashier/logout',method:['POST']};
