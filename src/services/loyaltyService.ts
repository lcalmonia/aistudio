import { customerService } from './customerService';

export const loyaltyService = {
  async getCustomerLoyalty(customerId: string): Promise<{ stamps: number; points: number } | null> {
    const customer = await customerService.getCustomer(customerId);
    if (!customer) return null;
    return {
      stamps: customer.stamps || 0,
      points: customer.points || 0,
    };
  },

  async addPoints(customerId: string, pointsEarned: number): Promise<number | null> {
    const customer = await customerService.getCustomer(customerId);
    if (!customer) return null;
    const newPoints = (customer.points || 0) + pointsEarned;
    await customerService.updateCustomer(customerId, { points: newPoints });
    return newPoints;
  },

  async addStamp(
    customerId: string,
    maxStamps: number = 10
  ): Promise<{ stamps: number; unlockedReward: boolean } | null> {
    const customer = await customerService.getCustomer(customerId);
    if (!customer) return null;
    const currentStamps = customer.stamps || 0;
    const nextStamps = (currentStamps % maxStamps) + 1;
    const unlockedReward = nextStamps === maxStamps;
    await customerService.updateCustomer(customerId, { stamps: nextStamps });
    return { stamps: nextStamps, unlockedReward };
  },

  async redeemPoints(
    customerId: string,
    pointsCost: number
  ): Promise<{ success: boolean; remainingPoints?: number; error?: string }> {
    const customer = await customerService.getCustomer(customerId);
    if (!customer) return { success: false, error: 'Customer not found.' };
    const currentPoints = customer.points || 0;
    if (currentPoints < pointsCost) {
      return { success: false, error: 'Insufficient loyalty reward points.' };
    }
    const remaining = currentPoints - pointsCost;
    await customerService.updateCustomer(customerId, { points: remaining });
    return { success: true, remainingPoints: remaining };
  },

  /**
   * Helper to calculate reward stamp increment and points calculation from an order total.
   */
  calculateOrderRewards(
    orderTotal: number,
    currentStamps: number = 0,
    currentPoints: number = 0,
    maxStamps: number = 10
  ): { nextStamps: number; earnedPoints: number; totalPoints: number; unlockedReward: boolean } {
    const nextStamps = (currentStamps % maxStamps) + 1;
    const earnedPoints = Math.floor(orderTotal / 10);
    const totalPoints = currentPoints + earnedPoints;
    const unlockedReward = nextStamps === maxStamps;

    return {
      nextStamps,
      earnedPoints,
      totalPoints,
      unlockedReward,
    };
  },
};
