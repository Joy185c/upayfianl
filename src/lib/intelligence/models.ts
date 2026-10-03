/**
 * ImpactIQ — Core ML Models (TypeScript implementation for Vercel edge)
 * 
 * T-Learner-style two-model inference pipeline using separately calibrated 
 * treatment and control logistic-regression weights.
 */

import {
  CustomerProfile,
  Campaign,
  ResponsePrediction,
  FatiguePrediction,
  UpliftSegment,
  FatigueLevel,
} from "./types";

// ─── Constants & Weights ──────────────────────────────────────────────────────

const MODEL_WEIGHTS = {
  // Treatment Model (P(Response | Offer))
  treatment: {
    bias: -1.2,
    txFrequency: 1.8,
    rechargeCount: 0.1,
    merchantCount: 0.15,
    offersReceived: 0.1, // Small positive for being active, but fatigue handles overload
    recentRedemption: 1.5,
    accountAge: 0.001,
    campaignMatch: 2.5, // strong predictor
  },
  // Control Model (P(Response | No Offer))
  control: {
    bias: -2.0,
    txFrequency: 2.2, // baseline habit is stronger without offer
    rechargeCount: 0.15,
    merchantCount: 0.18,
    offersReceived: 0.0,
    recentRedemption: 0.0,
    accountAge: 0.002,
    campaignMatch: 1.0, // Natural affinity without offer
  },
};

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

// ─── 1. Response Prediction & Uplift (T-Learner Approach) ─────────────────────

export function calculateUplift(
  customer: CustomerProfile,
  campaign: Campaign
): ResponsePrediction {
  const f = customer.features;

  // Feature Engineering
  const isTargetCategory = f.mostUsedService === campaign.targetProduct ? 1 : 0;
  const recentRedemption = f.daysSinceLastRedemption < 30 ? 1 : 0;
  
  // High fatigue negatively impacts treatment response more than control
  const fatiguePenalty = (f.offersReceived30d > 8) ? (f.offersReceived30d * 0.15) : 0;

  // Model A: Treatment (Customer receives offer)
  const zTreatment =
    MODEL_WEIGHTS.treatment.bias +
    (f.txFrequency * MODEL_WEIGHTS.treatment.txFrequency) +
    (f.rechargeCount30d * MODEL_WEIGHTS.treatment.rechargeCount) +
    (f.merchantPayCount30d * MODEL_WEIGHTS.treatment.merchantCount) +
    (f.offersReceived30d * MODEL_WEIGHTS.treatment.offersReceived) +
    (recentRedemption * MODEL_WEIGHTS.treatment.recentRedemption) +
    (f.accountAge * MODEL_WEIGHTS.treatment.accountAge) +
    (isTargetCategory * MODEL_WEIGHTS.treatment.campaignMatch) -
    fatiguePenalty;

  // Model B: Control (Customer does NOT receive offer)
  const zControl =
    MODEL_WEIGHTS.control.bias +
    (f.txFrequency * MODEL_WEIGHTS.control.txFrequency) +
    (f.rechargeCount30d * MODEL_WEIGHTS.control.rechargeCount) +
    (f.merchantPayCount30d * MODEL_WEIGHTS.control.merchantCount) +
    (f.accountAge * MODEL_WEIGHTS.control.accountAge) +
    (isTargetCategory * MODEL_WEIGHTS.control.campaignMatch);

  const pTreatment = sigmoid(zTreatment);
  const pControl = sigmoid(zControl);

  const uplift = pTreatment - pControl;

  // Assign Segment naturally based on calculated probabilities
  let segment: UpliftSegment = "LOST_CAUSE";
  
  if (uplift < 0) {
    segment = "NEGATIVE_UPLIFT";
  } else if (pTreatment > 0.65 && pControl > 0.6) {
    segment = "SURE_THING";
  } else if (uplift > 0.1) {
    segment = "PERSUADABLE";
  }

  return {
    customerId: customer.id,
    offerId: campaign.id,
    pResponseWithOffer: Number(pTreatment.toFixed(4)),
    pResponseWithoutOffer: Number(pControl.toFixed(4)),
    uplift: Number(uplift.toFixed(4)),
    upliftSegment: segment,
    confidence: 0.85, // Static for demo
  };
}

// ─── 2. Offer Fatigue Detection ───────────────────────────────────────────────

export function calculateFatigue(customer: CustomerProfile): FatiguePrediction {
  const f = customer.features;
  
  // Fatigue increases exponentially with recent offers and decays with time
  let fatigueScore = 0;
  
  // Recent offer intensity
  const weeklyIntensity = f.offersReceived7d / 2; // 2 offers/week is baseline
  const monthlyIntensity = f.offersReceived30d / 5; // 5 offers/month is baseline
  
  // Same category saturation
  const categorySaturation = f.sameCategoryOfferCount / 3;
  
  // Base calculation
  fatigueScore = (weeklyIntensity * 0.5) + (monthlyIntensity * 0.3) + (categorySaturation * 0.2);
  
  // Time decay
  if (f.daysSinceLastOffer > 14) {
    fatigueScore *= 0.5; // halved if no offers in 2 weeks
  } else if (f.daysSinceLastOffer > 7) {
    fatigueScore *= 0.8;
  }
  
  // Response adjustment (customers who redeem don't get fatigued as fast)
  if (f.campaignRedemptionRate > 0.5) {
    fatigueScore *= 0.7; 
  } else if (f.campaignRedemptionRate < 0.1 && f.offersReceived30d > 2) {
    fatigueScore *= 1.3; // Ignored offers increase fatigue faster
  }
  
  // Bound between 0 and 1
  fatigueScore = Math.max(0, Math.min(1, fatigueScore));
  
  // Level mapping
  let level: FatigueLevel = "LOW";
  if (fatigueScore > 0.7) level = "HIGH";
  else if (fatigueScore > 0.4) level = "MEDIUM";

  return {
    customerId: customer.id,
    fatigueScore: Number(fatigueScore.toFixed(3)),
    fatigueLevel: level,
    offersReceivedRecently: f.offersReceived30d,
    daysSinceLastOffer: f.daysSinceLastOffer,
    responseDeclineRate: Number((f.offersReceived30d > 0 ? (1 - f.campaignResponseRate) * 0.5 : 0).toFixed(2))
  };
}
