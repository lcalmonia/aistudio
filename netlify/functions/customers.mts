import type { Config } from '@netlify/functions';
import { requireAuthenticatedAdmin } from './_shared/auth.mts';
import { database } from './_shared/database.mts';
import { enforceSameOrigin, errorResponse, json, readJsonObject, RequestError } from './_shared/http.mts';
import { hashPassword } from './_shared/password.mts';

function mapCustomer(row: Record<string, unknown>) {
  const rawCreatedAt = row.created_at;
  const createdAt = rawCreatedAt instanceof Date ? rawCreatedAt.toISOString().slice(0, 10) : String(rawCreatedAt || '').slice(0, 10);
  return { id:String(row.id), name:String(row.name), username:String(row.username || ''), email:String(row.email), mobile:String(row.mobile), address:String(row.address), createdAt, status:row.status==='inactive'?'inactive':'active', role:'customer', stamps:Number(row.stamps)||0, points:Number(row.points)||0 };
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === 'GET') {
      await requireAuthenticatedAdmin(request);
      const db=database();
      const result=await db.pool.query(`SELECT id,name,username,email,mobile,address,status,role,stamps,points,created_at FROM customers ORDER BY created_at DESC,name ASC`);
      return json({customers:result.rows.map(mapCustomer)});
    }
    if (request.method === 'POST') {
      enforceSameOrigin(request); const body=await readJsonObject(request); const password=typeof body.password==='string'?body.password:'';
      if(password&&(password.length<6||password.length>128))throw new RequestError(400,'Password must be between 6 and 128 characters.');
      const id=typeof body.id==='string'?body.id.trim():''; const name=typeof body.name==='string'?body.name.trim():''; const username=typeof body.username==='string'?body.username.trim().toLowerCase():''; const email=typeof body.email==='string'?body.email.trim().toLowerCase():''; const mobile=typeof body.mobile==='string'?body.mobile.trim():''; const address=typeof body.address==='string'?body.address.trim():'';
      if(!id||!name||!username||!email||!mobile||!address)throw new RequestError(400,'Customer name, username, email, mobile, address, and ID are required.');
      if(!/^[a-z0-9._-]{3,32}$/.test(username))throw new RequestError(400,'Username must be 3-32 characters and use only letters, numbers, dots, underscores, or hyphens.');
      const db=database(); const existing=await db.pool.query(`SELECT id FROM customers WHERE email=$1 OR id=$2 OR LOWER(username)=$3 LIMIT 1`,[email,id,username]); if(existing.rows.length>0)throw new RequestError(409,'A customer account with this email, username, or ID already exists.');
      const loyalty=await db.pool.query(`SELECT welcome_enabled,welcome_stamps,welcome_points FROM loyalty_settings WHERE id='default' LIMIT 1`); const welcome=loyalty.rows[0];
      const stamps=welcome?.welcome_enabled?Math.max(0,Math.floor(Number(welcome.welcome_stamps)||0)):0; const points=welcome?.welcome_enabled?Math.max(0,Math.floor(Number(welcome.welcome_points)||0)):0;
      const passwordHash=password?await hashPassword(password):null;
      const result=await db.pool.query(`INSERT INTO customers (id,name,username,email,mobile,address,status,role,stamps,points,password_hash,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,'active','customer',$7,$8,$9,NOW(),NOW()) RETURNING id,name,username,email,mobile,address,status,role,stamps,points,created_at`,[id,name,username,email,mobile,address,stamps,points,passwordHash]);
      return json({customer:mapCustomer(result.rows[0])},201);
    }
    return json({error:'Method not allowed.'},405);
  } catch(error) { return errorResponse(error); }
}
export const config: Config={path:'/api/customers',method:['GET','POST']};
