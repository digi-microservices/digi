export type PlanName = "free" | "pro";

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "cancelled"
  | "trialing";

export interface PlanLimits {
  diskGb: number;
  maxServices: number;
  canChooseDomain: boolean;
  canUseCustomDomain: boolean;
  extraStoragePricePer32Gb: number; // in pence
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    diskGb: 16,
    maxServices: 3,
    canChooseDomain: false,
    canUseCustomDomain: false,
    extraStoragePricePer32Gb: 0,
  },
  pro: {
    diskGb: 64,
    maxServices: 25,
    canChooseDomain: true,
    canUseCustomDomain: true,
    extraStoragePricePer32Gb: 500, // £5 in pence
  },
};

export const STORAGE_INCREMENT_GB = 32;
export const STORAGE_INCREMENT_PRICE_PENCE = 500; // £5
