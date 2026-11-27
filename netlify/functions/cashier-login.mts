import type { Config, Context } from '@netlify/functions';
import { database } from './_shared/database.mts';
import { createCashierSession, setCashierCookie } from './_shared/cashierAuth.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, requireString } from './_shared/http.mts';
import { normalizeUsername } from './_shared/auth.mts';
import { verifyPassword } from './_shared/password.mts';
const DUMMY_HASH='scrypt$32768$8$1$jhZgDMKz7QUdCGb3crdFSQ$WkpkNGh_YU8DsRzUzrdFtOcs8Trb2doXu1KS__AqSnXCVwF7MN9IgiHGnO1zHi1rW6112WiSCWi9CoPkW0Z8ZA';
export default async function handler(request:Request,context:Context):Promise<Response>{
 if(request.method!=='POST')return json({error:'Method not allowed.'},405);
 try{
  enforceSameOrigin(request);const body=await readJsonObject(request);
  const username=normalizeUsername(requireString(body.username,'Username',{min:3,max:64}));
  const password=requireString(body.password,'Password',{min:1,max:128,trim:false});
  const db=database();const rows=await db.sql`SELECT id,username,name,password_hash,active FROM cashier_users WHERE LOWER(username)=${username} LIMIT 1`;
  const account=rows[0] as {id:string;username:string;name:string;password_hash:string;active:boolean}|undefined;
  const valid=await verifyPassword(password,account?.password_hash||DUMMY_HASH);
  if(!account||!account.active||!valid)return json({error:'Invalid username or password.'},401);
  await db.sql`UPDATE cashier_users SET last_login=NOW(),updated_at=NOW() WHERE id=${account.id}`;
  const token=await createCashierSession(account.id);setCashierCookie(context,request,token);
  return json({authenticated:true,cashier:{id:account.id,username:account.username,displayName:account.name}});
 }catch(e){return errorResponse(e);}
}
export const config:Config={path:'/api/cashier/login',method:['POST'],rateLimit:{action:'rate_limit',aggregateBy:['ip'],windowSize:60,windowLimit:10}};
