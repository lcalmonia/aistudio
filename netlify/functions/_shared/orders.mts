import { database } from './database.mts';
import { RequestError } from './http.mts';
import crypto from 'crypto';

export type OrderStatus = 'New' | 'Brewing' | 'Ready' | 'Completed' | 'Pending' | 'Preparing' | 'Cancelled';

export interface OrderItemInput {
  name: string;
  quantity: number;
  customization?: string;
  price: number;
  completed?: boolean;
  temperature?: 'Hot' | 'Iced';
  size?: string;
}

export interface OrderItemRecord extends OrderItemInput {
  id?: number;
  order_id?: string;
  line_position?: number;
  created_at?: string;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  time_ago: string;
  timestamp: number | string;
  status: OrderStatus;
  total: number | string;
  image?: string | null;
  notes?: string | null;
  order_type?: 'Dine-In' | 'Takeout' | 'Delivery' | null;
  table_number?: string | null;
  delivery_address?: string | null;
  payment_method?: 'GCash' | 'Maya' | 'Cash' | 'Card' | null;
  subtotal?: number | string | null;
  discount?: number | string | null;
  delivery_fee?: number | string | null;
  is_customer_order?: boolean | null;
  created_at: string | Date;
  updated_at: string | Date;
  completed_at?: string | Date | null;
  cancelled_at?: string | Date | null;
}

export interface FormattedOrder {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  timeAgo: string;
  timestamp: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  status: OrderStatus;
  items: OrderItemInput[];
  total: number;
  image?: string;
  notes?: string;
  orderType?: 'Dine-In' | 'Takeout' | 'Delivery';
  tableNumber?: string;
  deliveryAddress?: string;
  paymentMethod?: 'GCash' | 'Maya' | 'Cash' | 'Card';
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
  isCustomerOrder?: boolean;
}

export interface CreateOrderPayload {
  id?: string;
  orderNumber?: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  orderType?: 'Dine-In' | 'Takeout' | 'Delivery';
  tableNumber?: string;
  deliveryAddress?: string;
  paymentMethod?: 'GCash' | 'Maya' | 'Cash' | 'Card';
  notes?: string;
  image?: string;
  status?: OrderStatus;
  items: OrderItemInput[];
  total?: number;
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
  isCustomerOrder?: boolean;
  timestamp?: number;
  timeAgo?: string;
}

export const VALID_ORDER_STATUSES: OrderStatus[] = [
  'New',
  'Brewing',
  'Ready',
  'Completed',
  'Pending',
  'Preparing',
  'Cancelled',
];

export function computeTimeAgo(timestampMs: number): string {
  const diffSec = Math.floor((Date.now() - timestampMs) / 1000);
  if (diffSec < 45) return 'Just now';
  if (diffSec < 90) return '1m ago';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function generateOrderNumber(): string {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `ILK-${randNum}`;
}

export function generateOrderId(isCustomerOrder = false): string {
  const prefix = isCustomerOrder ? 'ord-cust' : 'ord';
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  return `${prefix}-${Date.now()}-${randomSuffix}`;
}

export function mapOrderRecord(row: OrderRecord, items: OrderItemRecord[] = []): FormattedOrder {
  const parsedTimestamp = Number(row.timestamp) || Date.now();
  const createdAtIso = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);
  const updatedAtIso = row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at);
  const completedAtIso = row.completed_at ? (row.completed_at instanceof Date ? row.completed_at.toISOString() : String(row.completed_at)) : undefined;
  const cancelledAtIso = row.cancelled_at ? (row.cancelled_at instanceof Date ? row.cancelled_at.toISOString() : String(row.cancelled_at)) : undefined;

  const formattedItems: OrderItemInput[] = items.map((item) => ({
    name: item.name,
    quantity: Number(item.quantity) || 1,
    customization: item.customization || undefined,
    price: Number(item.price) || 0,
    completed: item.completed ?? undefined,
    temperature: item.temperature || undefined,
    size: item.size || undefined,
  }));

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id || undefined,
    customerName: row.customer_name,
    customerEmail: row.customer_email || undefined,
    customerPhone: row.customer_phone || undefined,
    timeAgo: computeTimeAgo(parsedTimestamp),
    timestamp: parsedTimestamp,
    createdAt: createdAtIso,
    updatedAt: updatedAtIso,
    completedAt: completedAtIso,
    cancelledAt: cancelledAtIso,
    status: row.status,
    items: formattedItems,
    total: Number(row.total) || 0,
    image: row.image || undefined,
    notes: row.notes || undefined,
    orderType: row.order_type || undefined,
    tableNumber: row.table_number || undefined,
    deliveryAddress: row.delivery_address || undefined,
    paymentMethod: row.payment_method || undefined,
    subtotal: row.subtotal != null ? Number(row.subtotal) : undefined,
    discount: row.discount != null ? Number(row.discount) : undefined,
    deliveryFee: row.delivery_fee != null ? Number(row.delivery_fee) : undefined,
    isCustomerOrder: row.is_customer_order ?? undefined,
  };
}

export async function fetchOrdersFromDatabase(options: {
  customerId?: string;
  orderId?: string;
  orderNumber?: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
} = {}): Promise<FormattedOrder[]> {
  const db = database();
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (options.orderId) {
    conditions.push(`o.id = $${paramIndex++}`);
    values.push(options.orderId);
  }

  if (options.orderNumber) {
    conditions.push(`(o.order_number = $${paramIndex} OR o.order_number = $${paramIndex + 1})`);
    values.push(options.orderNumber);
    values.push(options.orderNumber.replace(/^#/, ''));
    paramIndex += 2;
  }

  if (options.customerId) {
    conditions.push(`o.customer_id = $${paramIndex++}`);
    values.push(options.customerId);
  }

  if (options.status) {
    conditions.push(`o.status = $${paramIndex++}`);
    values.push(options.status);
  }

  if (options.startDate) {
    conditions.push(`(
      o.created_at >= $${paramIndex}::timestamptz 
      OR (o.timestamp IS NOT NULL AND o.timestamp >= (EXTRACT(EPOCH FROM $${paramIndex}::timestamptz) * 1000)::bigint)
    )`);
    values.push(options.startDate);
    paramIndex++;
  }

  if (options.endDate) {
    conditions.push(`(
      o.created_at <= $${paramIndex}::timestamptz 
      OR (o.timestamp IS NOT NULL AND o.timestamp <= (EXTRACT(EPOCH FROM $${paramIndex}::timestamptz) * 1000)::bigint)
    )`);
    values.push(options.endDate);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitClause = options.limit ? `LIMIT ${Math.min(options.limit, 10000)}` : 'LIMIT 200';

  const query = `
    SELECT 
      o.*,
      COALESCE(
        json_agg(
          json_build_object(
            'line_position', oi.line_position,
            'name', oi.name,
            'quantity', oi.quantity,
            'customization', oi.customization,
            'price', oi.price,
            'completed', oi.completed,
            'temperature', oi.temperature,
            'size', oi.size
          ) ORDER BY oi.line_position ASC
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'
      ) AS items_json
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    ${whereClause}
    GROUP BY o.id
    ORDER BY o.created_at DESC, o.timestamp DESC
    ${limitClause}
  `;

  const result = await db.pool.query(query, values);
  return result.rows.map((row: OrderRecord & { items_json: OrderItemRecord[] }) => {
    return mapOrderRecord(row, row.items_json || []);
  });
}

export async function fetchOrderById(orderId: string): Promise<FormattedOrder | null> {
  const orders = await fetchOrdersFromDatabase({ orderId, limit: 1 });
  return orders[0] || null;
}

export async function insertOrderToDatabase(payload: CreateOrderPayload): Promise<FormattedOrder> {
  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    throw new RequestError(400, 'Order must contain at least one item.');
  }

  const cleanCustomerName = (payload.customerName || 'Walk-in Guest').trim();
  if (!cleanCustomerName) {
    throw new RequestError(400, 'Customer name is required.');
  }

  const validItems: OrderItemInput[] = [];
  let calculatedSubtotal = 0;

  for (let i = 0; i < payload.items.length; i++) {
    const item = payload.items[i];
    if (!item || typeof item.name !== 'string' || !item.name.trim()) {
      throw new RequestError(400, `Item at position ${i + 1} must have a valid name.`);
    }
    const qty = Number(item.quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new RequestError(400, `Item "${item.name}" must have a positive quantity.`);
    }
    const price = Number(item.price);
    if (isNaN(price) || price < 0) {
      throw new RequestError(400, `Item "${item.name}" must have a valid price.`);
    }

    const temp = item.temperature === 'Hot' || item.temperature === 'Iced' ? item.temperature : undefined;

    validItems.push({
      name: item.name.trim(),
      quantity: Math.floor(qty),
      customization: item.customization?.trim() || undefined,
      price: price,
      completed: typeof item.completed === 'boolean' ? item.completed : undefined,
      temperature: temp,
      size: item.size?.trim() || undefined,
    });

    calculatedSubtotal += price * Math.floor(qty);
  }

  const subtotal = payload.subtotal != null ? Math.max(0, Number(payload.subtotal)) : calculatedSubtotal;
  const discount = payload.discount != null ? Math.max(0, Number(payload.discount)) : 0;
  const deliveryFee = payload.deliveryFee != null ? Math.max(0, Number(payload.deliveryFee)) : 0;
  const total = payload.total != null ? Math.max(0, Number(payload.total)) : Math.max(0, subtotal - discount + deliveryFee);

  const isCustomerOrder = Boolean(payload.isCustomerOrder);
  const orderId = payload.id?.trim() || generateOrderId(isCustomerOrder);
  
  let orderNumber = payload.orderNumber?.trim() || generateOrderNumber();
  if (!orderNumber.startsWith('#') && !orderNumber.startsWith('ILK-')) {
    orderNumber = `ILK-${orderNumber}`;
  }

  const status: OrderStatus = payload.status && VALID_ORDER_STATUSES.includes(payload.status)
    ? payload.status
    : 'New';

  const timestamp = Number(payload.timestamp) || Date.now();
  const timeAgo = payload.timeAgo || computeTimeAgo(timestamp);

  const db = database();
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insert order header
    const insertOrderQuery = `
      INSERT INTO orders (
        id, order_number, customer_id, customer_name, customer_email, customer_phone,
        time_ago, timestamp, status, total, image, notes, order_type, table_number,
        delivery_address, payment_method, subtotal, discount, delivery_fee,
        is_customer_order, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, NOW(), NOW()
      )
      RETURNING *
    `;

    const orderValues = [
      orderId,
      orderNumber,
      payload.customerId?.trim() || null,
      cleanCustomerName,
      payload.customerEmail?.trim() || null,
      payload.customerPhone?.trim() || null,
      timeAgo,
      timestamp,
      status,
      total,
      payload.image || null,
      payload.notes?.trim() || null,
      payload.orderType || null,
      payload.tableNumber?.trim() || null,
      payload.deliveryAddress?.trim() || null,
      payload.paymentMethod || null,
      subtotal,
      discount,
      deliveryFee,
      isCustomerOrder,
    ];

    const orderResult = await client.query(insertOrderQuery, orderValues);
    const orderRow: OrderRecord = orderResult.rows[0];

    // 2. Insert order items
    const insertedItems: OrderItemRecord[] = [];
    for (let pos = 0; pos < validItems.length; pos++) {
      const item = validItems[pos];
      const insertItemQuery = `
        INSERT INTO order_items (
          order_id, line_position, name, quantity, customization, price, completed, temperature, size
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
        RETURNING *
      `;
      const itemValues = [
        orderId,
        pos,
        item.name,
        item.quantity,
        item.customization || null,
        item.price,
        item.completed ?? null,
        item.temperature || null,
        item.size || null,
      ];
      const itemResult = await client.query(insertItemQuery, itemValues);
      insertedItems.push(itemResult.rows[0]);
    }

    await client.query('COMMIT');
    return mapOrderRecord(orderRow, insertedItems);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateOrderStatusInDatabase(orderId: string, status: OrderStatus): Promise<FormattedOrder> {
  if (!VALID_ORDER_STATUSES.includes(status)) {
    throw new RequestError(400, `Invalid order status "${status}". Allowed: ${VALID_ORDER_STATUSES.join(', ')}`);
  }

  const db = database();
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    let updateQuery = `
      UPDATE orders
      SET status = $1,
          updated_at = NOW()
    `;
    const params: unknown[] = [status];
    let paramIndex = 2;

    if (status === 'Completed') {
      updateQuery += `, completed_at = COALESCE(completed_at, NOW())`;
    } else if (status === 'Cancelled') {
      updateQuery += `, cancelled_at = COALESCE(cancelled_at, NOW())`;
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(orderId);

    const updateResult = await client.query(updateQuery, params);
    if (updateResult.rowCount === 0) {
      throw new RequestError(404, `Order "${orderId}" not found.`);
    }

    const orderRow: OrderRecord = updateResult.rows[0];

    // Fetch order items
    const itemsResult = await client.query(
      `SELECT * FROM order_items WHERE order_id = $1 ORDER BY line_position ASC`,
      [orderId]
    );

    await client.query('COMMIT');
    return mapOrderRecord(orderRow, itemsResult.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
