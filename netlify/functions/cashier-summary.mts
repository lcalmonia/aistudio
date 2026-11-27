import type { Config } from '@netlify/functions';
import { database } from './_shared/database.mts';
import { requireAuthenticatedCashier } from './_shared/cashierAuth.mts';
import { errorResponse,json } from './_shared/http.mts';
export default async function handler(request:Request):Promise<Response>{
 if(request.method!=='GET')return json({error:'Method not allowed.'},405);
 try{
  const cashier=await requireAuthenticatedCashier(request);const db=database();
  const rows=await db.sql`SELECT COUNT(*)::int AS transactions,COALESCE(SUM(total),0)::numeric(12,2) AS sales,
    COALESCE(SUM(total) FILTER(WHERE payment_method='Cash'),0)::numeric(12,2) AS cash,
    COALESCE(SUM(total) FILTER(WHERE payment_method='GCash'),0)::numeric(12,2) AS gcash,
    COALESCE(SUM(total) FILTER(WHERE payment_method='Maya'),0)::numeric(12,2) AS maya,
    COALESCE(SUM(total) FILTER(WHERE payment_method='Card'),0)::numeric(12,2) AS card
    FROM orders
    WHERE cashier_user_id=${cashier.id} AND payment_status='Paid' AND status<>'Cancelled'
      AND created_at >= ((date_trunc('day', NOW() AT TIME ZONE 'Asia/Manila')) AT TIME ZONE 'Asia/Manila')`;
  const recent=await db.sql`SELECT id,order_number,total,payment_method,order_type,created_at FROM orders
    WHERE cashier_user_id=${cashier.id} AND payment_status='Paid' AND status<>'Cancelled'
      AND created_at >= ((date_trunc('day', NOW() AT TIME ZONE 'Asia/Manila')) AT TIME ZONE 'Asia/Manila')
    ORDER BY created_at DESC LIMIT 12`;
  return json({summary:rows[0],recent});
 }catch(e){return errorResponse(e);}
}
export const config:Config={path:'/api/cashier/summary',method:['GET']};
