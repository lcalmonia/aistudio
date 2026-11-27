import type { Config } from '@netlify/functions';
import { database } from './_shared/database.mts';
import { requireAuthenticatedCashier } from './_shared/cashierAuth.mts';
import { errorResponse,json } from './_shared/http.mts';
export default async function handler(request:Request):Promise<Response>{
 if(request.method!=='GET')return json({error:'Method not allowed.'},405);
 try{
  await requireAuthenticatedCashier(request);const db=database();
  const [items,addons]=await Promise.all([
   db.sql`SELECT id,name,category,price,temperature,sizes,add_on_ids,modifier_category_ids FROM menu_items WHERE available=TRUE ORDER BY category,name`,
   db.sql`SELECT id,name,category,item_type,price,applicable_temperature,available,required,selection_type,applicable_categories,sort_order FROM add_ons WHERE available=TRUE ORDER BY category,name`
  ]);
  return json({items,addons},200,'private, max-age=60, stale-while-revalidate=120');
 }catch(e){return errorResponse(e);}
}
export const config:Config={path:'/api/cashier/catalog',method:['GET']};
