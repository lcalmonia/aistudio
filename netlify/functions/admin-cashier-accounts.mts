import { randomBytes } from 'node:crypto';
import type { Config } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { database } from './_shared/database.mts';
import { invalidateCashierSessions } from './_shared/cashierAuth.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError, requireString } from './_shared/http.mts';
import { hashPassword, validatePassword } from './_shared/password.mts';
export default async function handler(request: Request): Promise<Response> {
 try {
  const actor = await requireAuthenticatedAdmin(request);
  if (!actor.isSuperAdmin) throw new RequestError(403, 'Only Super Admin can manage cashier accounts.');
  const db = database();
  if (request.method === 'GET') return json({accounts: await db.sql`SELECT id, username, name, active, last_login, created_at FROM cashier_users ORDER BY created_at DESC`});
  enforceSameOrigin(request);
  const body = await readJsonObject(request);
  if (request.method === 'POST') {
   const username = requireString(body.username,'Username',{min:3,max:64}).toLowerCase();
   if (!/^[a-z0-9][a-z0-9._-]*$/.test(username)) throw new RequestError(400,'Username may contain lowercase letters, numbers, periods, underscores, and hyphens.');
   const name = requireString(body.displayName,'Display name',{min:2,max:255});
   const password = validatePassword(body.password);
   const active = body.active === undefined ? true : body.active;
   if (typeof active !== 'boolean') throw new RequestError(400,'Active must be a boolean.');
   try {
    const rows = await db.sql`INSERT INTO cashier_users (id,username,name,password_hash,active)
      VALUES (${'cashier_'+randomBytes(12).toString('hex')},${username},${name},${await hashPassword(password)},${active})
      RETURNING id,username,name,active,last_login,created_at`;
    return json({account:rows[0]},201);
   } catch(e) { if (typeof e==='object' && e!==null && 'code' in e && e.code==='23505') throw new RequestError(409,'That cashier username is already in use.'); throw e; }
  }
  if (request.method === 'PATCH') {
   const id = requireString(body.id,'Cashier account ID',{min:1,max:64});
   if (typeof body.active !== 'boolean') throw new RequestError(400,'Active status is required.');
   const rows = await db.sql`UPDATE cashier_users SET active=${body.active},updated_at=NOW() WHERE id=${id} RETURNING id,username,name,active,last_login,created_at`;
   if (!rows.length) throw new RequestError(404,'Cashier account not found.');
   if (!body.active) await invalidateCashierSessions(id);
   return json({account:rows[0]});
  }
  return json({error:'Method not allowed.'},405);
 } catch(e) { return errorResponse(e); }
}
export const config: Config = {path:'/api/admin/cashier-accounts',method:['GET','POST','PATCH']};
