import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeTimeAgo,
  generateOrderId,
  generateOrderNumber,
  mapOrderRecord,
  OrderStatus,
  VALID_ORDER_STATUSES,
  OrderRecord,
  OrderItemRecord,
} from '../netlify/functions/_shared/orders.mts';
import { RequestError } from '../netlify/functions/_shared/http.mts';

test('Order ID and Order Number generation follow expected format and uniqueness', () => {
  const orderId1 = generateOrderId(false);
  const orderId2 = generateOrderId(true);
  const orderNum1 = generateOrderNumber();
  const orderNum2 = generateOrderNumber();

  assert.match(orderId1, /^ord-\d+-[a-f0-9]+$/);
  assert.match(orderId2, /^ord-cust-\d+-[a-f0-9]+$/);
  assert.match(orderNum1, /^ILK-\d{4}$/);
  assert.match(orderNum2, /^ILK-\d{4}$/);
  assert.notEqual(orderId1, orderId2);
});

test('computeTimeAgo returns accurate human-readable relative time strings', () => {
  const now = Date.now();
  assert.equal(computeTimeAgo(now - 10 * 1000), 'Just now');
  assert.equal(computeTimeAgo(now - 65 * 1000), '1m ago');
  assert.equal(computeTimeAgo(now - 5 * 60 * 1000), '5m ago');
  assert.equal(computeTimeAgo(now - 2 * 3600 * 1000), '2h ago');
  assert.equal(computeTimeAgo(now - 48 * 3600 * 1000), '2d ago');
});

test('mapOrderRecord correctly maps database records to frontend Order shape with numeric parsing', () => {
  const mockRow: OrderRecord = {
    id: 'ord-12345',
    order_number: 'ILK-3768',
    customer_id: 'cust_8f293b',
    customer_name: 'Maria Santos',
    customer_email: 'maria@example.com',
    customer_phone: '09171234567',
    time_ago: 'Just now',
    timestamp: '1724778899000',
    status: 'New',
    total: '245.50',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
    notes: 'Extra hot please',
    order_type: 'Dine-In',
    table_number: 'Table 4',
    delivery_address: null,
    payment_method: 'GCash',
    subtotal: '245.50',
    discount: '0.00',
    delivery_fee: '0.00',
    is_customer_order: true,
    created_at: new Date('2026-08-27T10:00:00Z'),
    updated_at: new Date('2026-08-27T10:00:00Z'),
    completed_at: null,
    cancelled_at: null,
  };

  const mockItems: OrderItemRecord[] = [
    {
      id: 1,
      order_id: 'ord-12345',
      line_position: 0,
      name: 'Spanish Latte',
      quantity: 1,
      customization: 'Oat Milk • Less Sweet',
      price: 185,
      temperature: 'Iced',
      size: 'Large',
      completed: false,
    },
    {
      id: 2,
      order_id: 'ord-12345',
      line_position: 1,
      name: 'Butter Croissant',
      quantity: 1,
      customization: 'Warmed',
      price: 60.5,
      completed: false,
    },
  ];

  const formatted = mapOrderRecord(mockRow, mockItems);

  assert.equal(formatted.id, 'ord-12345');
  assert.equal(formatted.orderNumber, 'ILK-3768');
  assert.equal(formatted.customerName, 'Maria Santos');
  assert.equal(formatted.total, 245.5);
  assert.equal(typeof formatted.total, 'number');
  assert.equal(formatted.timestamp, 1724778899000);
  assert.equal(typeof formatted.timestamp, 'number');
  assert.equal(formatted.status, 'New');
  assert.equal(formatted.items.length, 2);
  assert.equal(formatted.items[0].name, 'Spanish Latte');
  assert.equal(formatted.items[0].price, 185);
  assert.equal(formatted.items[0].temperature, 'Iced');
  assert.equal(formatted.items[1].name, 'Butter Croissant');
  assert.equal(formatted.items[1].price, 60.5);
  assert.equal(formatted.isCustomerOrder, true);
});

test('Valid order statuses includes all KDS progression phases', () => {
  const expectedStatuses: OrderStatus[] = ['New', 'Brewing', 'Ready', 'Completed', 'Pending', 'Preparing', 'Cancelled'];
  for (const status of expectedStatuses) {
    assert.ok(VALID_ORDER_STATUSES.includes(status), `Missing status: ${status}`);
  }
});
