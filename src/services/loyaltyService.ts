import { LoyaltyTransaction, Order } from '../types';
import { customerService } from './customerService';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';
import { loyaltyConfigService } from './loyaltyConfigService';

export const loyaltyService = {
  async getCustomerLoyalty(customerId: string): Promise<{ stamps:number; points:number } | null> { const customer=await customerService.getCustomer(customerId); if(!customer)return null; return {stamps:customer.stamps||0,points:customer.points||0}; },
  async addPoints(customerId:string,pointsEarned:number,referenceOrderId?:string,reason:string='Order loyalty reward'):Promise<number|null>{const customer=await customerService.getCustomer(customerId);if(!customer)return null;const newPoints=(customer.points||0)+Math.max(0,Math.floor(pointsEarned));await customerService.updateCustomer(customerId,{points:newPoints});if(pointsEarned>0)storageAdapter.addLoyaltyTransaction({id:generateEntityId('loy'),customerId,type:'earn_points',amount:Math.floor(pointsEarned),referenceOrderId,reason,timestamp:Date.now(),createdAt:new Date().toISOString()});return newPoints;},
  async addStamp(customerId:string,maxStamps:number=10,referenceOrderId?:string,reason:string='Order loyalty stamp'):Promise<{stamps:number;unlockedReward:boolean}|null>{const customer=await customerService.getCustomer(customerId);if(!customer)return null;const currentStamps=customer.stamps||0;const nextStamps=(currentStamps%maxStamps)+1;const unlockedReward=nextStamps===maxStamps;await customerService.updateCustomer(customerId,{stamps:nextStamps});storageAdapter.addLoyaltyTransaction({id:generateEntityId('loy'),customerId,type:'earn_stamps',amount:1,referenceOrderId,reason:unlockedReward?`${reason} (Reward Unlocked!)`:reason,timestamp:Date.now(),createdAt:new Date().toISOString()});return {stamps:nextStamps,unlockedReward};},
  async redeemPoints(customerId:string,pointsCost:number,reason:string='Reward discount redemption'):Promise<{success:boolean;remainingPoints?:number;error?:string}>{const customer=await customerService.getCustomer(customerId);if(!customer)return {success:false,error:'Customer not found.'};const currentPoints=customer.points||0;if(currentPoints<pointsCost)return {success:false,error:'Insufficient loyalty reward points.'};const remaining=currentPoints-pointsCost;await customerService.updateCustomer(customerId,{points:remaining});storageAdapter.addLoyaltyTransaction({id:generateEntityId('loy'),customerId,type:'redeem_points',amount:pointsCost,reason,timestamp:Date.now(),createdAt:new Date().toISOString()});return {success:true,remainingPoints:remaining};},
  async redeemStamps(customerId:string,stampsCost:number,reason:string='Digital stamp reward redemption'):Promise<{success:boolean;remainingStamps?:number;error?:string}>{const customer=await customerService.getCustomer(customerId);if(!customer)return {success:false,error:'Customer not found.'};const current=customer.stamps||0;if(current<stampsCost)return {success:false,error:'Insufficient digital stamps.'};const remaining=current-stampsCost;await customerService.updateCustomer(customerId,{stamps:remaining});storageAdapter.addLoyaltyTransaction({id:generateEntityId('loy'),customerId,type:'redeem_stamps',amount:stampsCost,reason,timestamp:Date.now(),createdAt:new Date().toISOString()});return {success:true,remainingStamps:remaining};},
  async listTransactions(customerId?:string):Promise<LoyaltyTransaction[]>{const txs=storageAdapter.getLoyaltyTransactions();return customerId?txs.filter(t=>t.customerId===customerId):txs;},
  async awardOrderRewards(customerId:string,order:Order):Promise<{stampsAdded:number;pointsAdded:number;qualified:boolean;reason:string}> {
    const config=await loyaltyConfigService.get(); const s=config.settings; const orderType=order.orderType||'Dine-In';
    const eligibleAmount=Math.max(0,Number(order.subtotal ?? order.total)-Number(order.discount||0));
    if(orderType==='Delivery') {
      if(eligibleAmount<s.pointsMinimumPurchase) return {stampsAdded:0,pointsAdded:0,qualified:false,reason:'Delivery order did not reach the minimum purchase for points.'};
      let points=0; if(s.pointsMode==='fixed') points=Math.max(0,Math.floor(s.fixedPoints)); else points=Math.max(0,Math.floor((eligibleAmount/s.currencyUnit)*s.pointsPerCurrency));
      if(points>0) await this.addPoints(customerId,points,order.id,'Delivery order reward points');
      return {stampsAdded:0,pointsAdded:points,qualified:points>0,reason:points>0?`Earned ${points} reward points.`:'No reward points configured for this qualifying delivery order.'};
    }
    if(orderType==='Dine-In'||orderType==='Takeout') {
      if(eligibleAmount<s.stampMinimumPurchase) return {stampsAdded:0,pointsAdded:0,qualified:false,reason:'Dine-In/Takeout order did not reach the minimum purchase for a digital stamp.'};
      const count=Math.max(1,Math.floor(s.stampsPerQualifyingOrder)); let added=0; let current=(await this.getCustomerLoyalty(customerId))?.stamps||0;
      for(let i=0;i<count;i++){await this.addStamp(customerId,s.stampCycle,order.id,'Qualifying Dine-In/Takeout order');added++;current=(current%s.stampCycle);}
      return {stampsAdded:added,pointsAdded:0,qualified:true,reason:`Earned ${added} digital stamp${added===1?'':'s'}.`};
    }
    return {stampsAdded:0,pointsAdded:0,qualified:false,reason:'Order type is not eligible for loyalty rewards.'};
  },
  calculateOrderRewards(orderTotal:number,currentStamps:number=0,currentPoints:number=0,maxStamps:number=10){const nextStamps=(currentStamps%maxStamps)+1;const earnedPoints=Math.floor(orderTotal/10);return {nextStamps,earnedPoints,totalPoints:currentPoints+earnedPoints,unlockedReward:nextStamps===maxStamps};},
};
