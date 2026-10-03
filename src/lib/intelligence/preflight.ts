import { CustomerProfile, Campaign, OfferType } from "./types";
import { calculateUplift, calculateFatigue } from "./models";

export interface CampaignPreflightConfig {
  name: string;
  objective: string;
  description: string;
  status: string;
  
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  
  service: string;
  operator: string;
  
  rewardType: string;
  rewardValue: number;
  maxReward: number;
  minTransaction: number;
  
  audienceType: "AI" | "CUSTOM";
  
  totalBudget: number;
  maxRedemptions: number;
  usesPerCustDay: number;
  
  excludeHighFatigue: boolean;
  cooldownDays: number;
  
  enableExperiment: boolean;
  treatmentPct: number;
}

export interface PreflightRecommendation {
  id: string;
  category: "AUDIENCE" | "FATIGUE" | "BUDGET" | "OFFER_FIT" | "FREQUENCY";
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  reason: string;
  affectedMetric: string;
  suggestedAction: string;
  targetField?: keyof CampaignPreflightConfig;
}

export interface CampaignPreflightResult {
  campaignScore: number;
  
  predictedTreatmentResponse: number;
  predictedControlResponse: number;
  estimatedUplift: number;
  expectedIncrementalValue: number;
  
  audienceSize: number;
  eligibleCustomerCount: number;
  excludedCustomerCount: number;
  
  audienceQuality: number;
  offerFit: number;
  budgetEfficiency: number;
  fatigueRisk: number;
  
  positiveFactors: string[];
  riskFactors: string[];
  recommendations: PreflightRecommendation[];
}

export function analyzeCampaignPreflight(
  config: CampaignPreflightConfig,
  audience: CustomerProfile[]
): CampaignPreflightResult {
  
  // 1. Map config to a temporary Campaign object so we can use existing calculateUplift
  // Using a mock offerType mapping based on service
  let tempOfferType: OfferType = "recharge_cashback";
  if (config.service === "merchant") tempOfferType = "merchant_cashback";
  if (config.objective === "winback") tempOfferType = "winback_benefit";

  const tempCampaign: Campaign = {
    id: "TEMP_PREFLIGHT",
    name: config.name,
    offerType: tempOfferType,
    cashbackAmount: config.rewardValue, // or average reward
    minTransaction: config.minTransaction,
    budgetTotal: config.totalBudget,
    budgetUsed: 0,
    capacityLimit: config.maxRedemptions,
    channel: "in_app",
    targetProduct: config.service,
    duration: 7,
    isActive: true,
  };

  let totalTreatmentResponse = 0;
  let totalControlResponse = 0;
  let totalIncrementalValue = 0;
  let totalUplift = 0;
  
  let eligibleCount = 0;
  let excludedCount = 0;
  let persuadableCount = 0;
  let fatigueScoreSum = 0;
  let offerFitSum = 0;

  for (const customer of audience) {
    // 2. Existing Engine Checks (Eligibility, Consent, Fatigue)
    let isEligible = true;
    if (customer.features.marketingConsent === false) isEligible = false;
    
    const fatigue = calculateFatigue(customer);
    
    if (config.excludeHighFatigue && fatigue.fatigueLevel === "HIGH") {
      isEligible = false;
    }

    if (!isEligible) {
      excludedCount++;
      continue;
    }

    eligibleCount++;
    
    // 3. Existing Uplift & EIV Engine
    const upliftResult = calculateUplift(customer, tempCampaign);
    
    totalTreatmentResponse += upliftResult.pResponseWithOffer;
    totalControlResponse += upliftResult.pResponseWithoutOffer;
    totalUplift += upliftResult.uplift;
    
    if (upliftResult.upliftSegment === "PERSUADABLE") {
      persuadableCount++;
    }
    
    const expectedTxValue = customer.features.avgTxValue30d > 0 ? customer.features.avgTxValue30d : 100;
    totalIncrementalValue += (upliftResult.uplift * expectedTxValue);

    // 4. Offer Fit Assessment (Reusing Service Affinity from Feature Engine)
    // If campaign is recharge, how much do they recharge?
    let fit = 0.5; // base fit
    if (config.service === "recharge" && customer.features.rechargeCount30d > 1) fit += 0.2;
    if (config.service === "recharge" && customer.features.rechargeCount30d > 5) fit += 0.2;
    if (config.service === "merchant" && customer.features.merchantPayCount30d > 1) fit += 0.2;
    if (config.service === "merchant" && customer.features.merchantPayCount30d > 5) fit += 0.2;
    if (customer.features.mostUsedService === config.service) fit += 0.1;
    
    offerFitSum += Math.min(fit, 1.0);
    fatigueScoreSum += fatigue.fatigueScore;
  }

  // Averages across eligible
  const avgTreatment = eligibleCount > 0 ? totalTreatmentResponse / eligibleCount : 0;
  const avgControl = eligibleCount > 0 ? totalControlResponse / eligibleCount : 0;
  const avgUplift = eligibleCount > 0 ? totalUplift / eligibleCount : 0;
  
  const audienceQuality = eligibleCount > 0 ? (persuadableCount / eligibleCount) * 100 : 0;
  const offerFit = eligibleCount > 0 ? (offerFitSum / eligibleCount) * 100 : 0;
  const fatigueRisk = eligibleCount > 0 ? (fatigueScoreSum / eligibleCount) * 100 : 0;
  
  // Budget Efficiency: How much of the total budget is expected to generate incremental value?
  // Cost = (Avg Reward) * Expected Redemptions
  // Value = Expected Incremental Value
  // We'll calculate a score 0-100 based on ROI
  let budgetEfficiency = 0;
  const expectedRedemptions = avgTreatment * eligibleCount;
  const estimatedCost = expectedRedemptions * config.rewardValue;
  
  if (estimatedCost > 0) {
    const roi = totalIncrementalValue / estimatedCost;
    // Normalize ROI to a 0-100 score, say 1.0 ROI = 50, 2.0+ ROI = 100
    budgetEfficiency = Math.min(Math.max((roi * 50), 0), 100);
  }

  // Penalize if budget is too low for audience size
  if (config.totalBudget > 0 && estimatedCost > config.totalBudget) {
    budgetEfficiency = Math.max(budgetEfficiency - 20, 0); 
  }

  // Calculate Final AI Campaign Score
  // Normalized 0-100
  let score = 0;
  score += audienceQuality * 0.35; // 35% weight
  score += offerFit * 0.25;        // 25% weight
  score += budgetEfficiency * 0.30; // 30% weight
  score -= (fatigueRisk * 0.10);    // -10% penalty
  
  // Clamp score
  const finalScore = Math.min(Math.max(Math.round(score), 0), 100);

  // Generate Explanations
  const positiveFactors: string[] = [];
  const riskFactors: string[] = [];
  const recommendations: PreflightRecommendation[] = [];

  if (audienceQuality > 60) positiveFactors.push("High concentration of persuadable customers.");
  if (audienceQuality < 30) riskFactors.push("Low persuadable ratio. Many users may be 'Sure Things' or 'Lost Causes'.");
  
  if (offerFit > 70) positiveFactors.push("Strong historical affinity for the targeted service category.");
  if (offerFit < 40) riskFactors.push("Audience shows low historical engagement with this service.");
  
  if (budgetEfficiency > 80) positiveFactors.push("Excellent projected ROI and budget utilization.");
  if (estimatedCost > config.totalBudget) riskFactors.push("Budget constraint: Campaign budget may exhaust before reaching all persuadable customers.");
  
  if (fatigueRisk > 50) riskFactors.push("High average fatigue in the target audience.");
  if (fatigueRisk < 20) positiveFactors.push("Low audience fatigue. Good opportunity for engagement.");

  if (excludedCount > (audience.length * 0.3)) {
    riskFactors.push("Over 30% of base audience is excluded due to fatigue or eligibility rules.");
  }

  // Generate Structured Actionable Recommendations

  if (estimatedCost > config.totalBudget) {
    recommendations.push({
      id: "REC_BUDGET",
      category: "BUDGET",
      priority: "HIGH",
      title: "Review Campaign Budget",
      reason: `Projected reward cost (৳${Math.ceil(estimatedCost).toLocaleString()}) may exceed the available budget (৳${config.totalBudget.toLocaleString()}) for the selected audience.`,
      affectedMetric: "Budget Efficiency",
      suggestedAction: `Increase budget to at least ৳${Math.ceil(estimatedCost).toLocaleString()} OR reduce audience/reward exposure.`,
      targetField: "totalBudget"
    });
  }

  if (audienceQuality < 40) {
    recommendations.push({
      id: "REC_AUDIENCE",
      category: "AUDIENCE",
      priority: "HIGH",
      title: "Prioritize Persuadable Customers",
      reason: `Only ${audienceQuality.toFixed(0)}% of the audience is highly responsive to this incentive. You are targeting users who would transact anyway.`,
      affectedMetric: "Audience Quality",
      suggestedAction: "Change audience strategy to focus on Persuadable customers via ImpactIQ Targeting.",
      targetField: "audienceType"
    });
  }

  if (offerFit < 50) {
    recommendations.push({
      id: "REC_OFFER_FIT",
      category: "OFFER_FIT",
      priority: "MEDIUM",
      title: "Review Target Service / Offer",
      reason: `The selected audience has relatively weak historical affinity (Offer Fit: ${offerFit.toFixed(0)}/100) with the '${config.service}' service.`,
      affectedMetric: "Offer Fit",
      suggestedAction: "Review the target service or change the audience to users with higher service affinity.",
      targetField: "service"
    });
  }
  
  if (fatigueRisk > 40 && !config.excludeHighFatigue) {
    recommendations.push({
      id: "REC_FATIGUE",
      category: "FATIGUE",
      priority: "HIGH",
      title: "Exclude High-Fatigue Customers",
      reason: `Average audience fatigue risk is elevated (${fatigueRisk.toFixed(0)}/100). Exposure could lead to churn.`,
      affectedMetric: "Fatigue Risk",
      suggestedAction: "Enable 'Exclude High-Fatigue' to automatically suppress over-marketed customers.",
      targetField: "excludeHighFatigue"
    });
  }
  
  if (config.cooldownDays < 3 && expectedRedemptions > 1000) {
    recommendations.push({
      id: "REC_FREQUENCY",
      category: "FREQUENCY",
      priority: "MEDIUM",
      title: "Increase Customer Cooldown",
      reason: "High expected redemptions with a short cooldown may rapidly increase customer fatigue.",
      affectedMetric: "Fatigue Risk",
      suggestedAction: "Increase cooldown period to at least 7 days to reduce exposure frequency.",
      targetField: "cooldownDays"
    });
  }

  return {
    campaignScore: finalScore,
    predictedTreatmentResponse: avgTreatment,
    predictedControlResponse: avgControl,
    estimatedUplift: avgUplift,
    expectedIncrementalValue: totalIncrementalValue,
    audienceSize: audience.length,
    eligibleCustomerCount: eligibleCount,
    excludedCustomerCount: excludedCount,
    audienceQuality,
    offerFit,
    budgetEfficiency,
    fatigueRisk,
    positiveFactors,
    riskFactors,
    recommendations
  };
}
