import { Order, MenuItem, SalesSummary, HourlySalesPoint, TopSellingProduct } from '../types';

export const reportingService = {
  /**
   * Calculates total gross sales from active and completed orders (excluding Cancelled).
   */
  calculateTotalSales(orders: Order[] = []): number {
    const list = orders || [];
    return list
      .filter((o) => o && o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);
  },

  /**
   * Calculates total items/cups served from orders.
   */
  calculateCupsServed(orders: Order[] = []): number {
    const list = orders || [];
    return list
      .filter((o) => o && o.status !== 'Cancelled')
      .reduce((totalCups, order) => {
        const orderItemQty = (order.items || []).reduce((itemSum, item) => itemSum + (item.quantity || 1), 0);
        return totalCups + (orderItemQty > 0 ? orderItemQty : 1);
      }, 0);
  },

  /**
   * Calculates average ticket / order value.
   */
  calculateAverageOrderValue(orders: Order[] = []): number {
    const list = orders || [];
    const validOrders = list.filter((o) => o && o.status !== 'Cancelled');
    if (validOrders.length === 0) return 0;
    const totalSales = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    return totalSales / validOrders.length;
  },

  /**
   * Calculates active / pending order count in the queue.
   */
  calculateActiveOrdersCount(orders: Order[] = []): number {
    const list = orders || [];
    return list.filter(
      (o) => o && (o.status === 'New' || o.status === 'Brewing' || o.status === 'Preparing' || o.status === 'Ready' || o.status === 'Pending')
    ).length;
  },

  /**
   * Generates hourly throughput breakdown based on actual order timestamps.
   * Aggregates valid non-cancelled orders across the given range by all 24 hours of the day (12 AM - 11 PM).
   */
  calculateHourlyThroughput(orders: Order[] = []): HourlySalesPoint[] {
    const list = orders || [];
    const hours = [
      { label: '12 AM', hour: 0 },
      { label: '1 AM', hour: 1 },
      { label: '2 AM', hour: 2 },
      { label: '3 AM', hour: 3 },
      { label: '4 AM', hour: 4 },
      { label: '5 AM', hour: 5 },
      { label: '6 AM', hour: 6 },
      { label: '7 AM', hour: 7 },
      { label: '8 AM', hour: 8 },
      { label: '9 AM', hour: 9 },
      { label: '10 AM', hour: 10 },
      { label: '11 AM', hour: 11 },
      { label: '12 PM', hour: 12 },
      { label: '1 PM', hour: 13 },
      { label: '2 PM', hour: 14 },
      { label: '3 PM', hour: 15 },
      { label: '4 PM', hour: 16 },
      { label: '5 PM', hour: 17 },
      { label: '6 PM', hour: 18 },
      { label: '7 PM', hour: 19 },
      { label: '8 PM', hour: 20 },
      { label: '9 PM', hour: 21 },
      { label: '10 PM', hour: 22 },
      { label: '11 PM', hour: 23 },
    ];

    const validOrders = list.filter((o) => o && o.status !== 'Cancelled');

    return hours.map(({ label, hour }) => {
      const matchingOrders = validOrders.filter((o) => {
        const orderHour = new Date(o.timestamp).getHours();
        return orderHour === hour;
      });

      const sales = matchingOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const cups = matchingOrders.reduce((sum, o) => {
        return sum + (o.items || []).reduce((itemSum, item) => itemSum + (item.quantity || 1), 0);
      }, 0);

      return {
        time: label,
        hour,
        cups,
        sales,
      };
    });
  },

  /**
   * Calculates top selling items based on actual order items.
   */
  calculateTopSellingItems(orders: Order[] = [], menuItems?: MenuItem[]): TopSellingProduct[] {
    const list = orders || [];
    const validOrders = list.filter((o) => o && o.status !== 'Cancelled');
    const productMap = new Map<string, { count: number; revenue: number }>();

    validOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const name = (item.name || '').trim();
        if (!name) return;
        const count = item.quantity || 1;
        const price = item.price || 0;
        const revenue = price * count;

        const existing = productMap.get(name) || { count: 0, revenue: 0 };
        productMap.set(name, {
          count: existing.count + count,
          revenue: existing.revenue + revenue,
        });
      });
    });

    const totalItemsSold = Array.from(productMap.values()).reduce((sum, item) => sum + item.count, 0);

    const sorted = Array.from(productMap.entries())
      .map(([name, data]) => {
        const percentage = totalItemsSold > 0 ? Math.round((data.count / totalItemsSold) * 100) : 0;
        return {
          name,
          count: data.count,
          percentage,
          revenue: data.revenue,
          formattedRevenue: `₱${data.revenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        };
      })
      .sort((a, b) => b.count - a.count);

    return sorted;
  },

  /**
   * Full consolidated sales and order summary.
   */
  calculateSalesSummary(orders: Order[] = []): SalesSummary {
    const list = orders || [];
    const validOrders = list.filter((o) => o && o.status !== 'Cancelled');
    const totalSales = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const cupsServed = this.calculateCupsServed(list);
    const totalOrdersCount = list.length;
    const averageOrderValue = validOrders.length > 0 ? totalSales / validOrders.length : 0;
    const activeOrdersCount = this.calculateActiveOrdersCount(list);
    const completedOrdersCount = list.filter((o) => o && o.status === 'Completed').length;
    const pendingOrdersCount = list.filter((o) => o && (o.status === 'Pending' || o.status === 'New')).length;
    const cancelledOrdersCount = list.filter((o) => o && o.status === 'Cancelled').length;

    return {
      totalSales,
      cupsServed,
      totalOrdersCount,
      averageOrderValue,
      activeOrdersCount,
      completedOrdersCount,
      pendingOrdersCount,
      cancelledOrdersCount,
    };
  },
};
