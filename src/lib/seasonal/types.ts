/**
 * Upay ImpactIQ — Seasonal Growth Studio Core Types
 * Defines the complete seasonal context, causal uplift, fatigue,
 * Knapsack budget optimization, experiment intelligence, and decision trace models.
 */

export type SeasonalEventId =
  | "university_admission"
  | "eid_ul_fitr"
  | "eid_ul_adha"
  | "ramadan"
  | "pohela_boishakh"
  | "salary_month_end"
  | "shopping_season"
  | "exam_season"
  | "new_user_acquisition"
  | "win_back_season"
  | "custom";

export type LifecycleStage = "Acquisition" | "Activation" | "Retention" | "Win-back";

export type ChannelType = "Push Notification" | "SMS" | "In-App Banner" | "Email";

export type ActionCategory = "Promotional" | "Non-Promotional" | "No Promotional Action";

export interface CandidateAction {
  id: string;
  name: string;
  category: ActionCategory;
  type: 
    | "cashback_admission"
    | "cashback_recharge"
    | "cashback_merchant"
    | "cashback_send_money"
    | "reward_gift_card"
    | "reward_referral"
    | "reminder_payment"
    | "reminder_recharge"
    | "insight_money"
    | "message_reengagement"
    | "recommendation_product"
    | "no_action";
  description: string;
  unitCostBDT: number; // 0 for non-promotional and no_action
  defaultDiscountValue?: string;
  channel: ChannelType;
  optimalTime: string;
}

export interface SeasonalEventTemplate {
  id: SeasonalEventId;
  name: string;
  icon: string;
  badgeColor: string;
  description: string;
  startDate: string;
  endDate: string;
  businessObjective: string;
  targetProduct: string;
  availableBudgetBDT: number;
  maxCampaignCapacity: number;
  eligibleCustomerSegments: string[];
  preferredChannels: ChannelType[];
  candidateOffers: CandidateAction[];
  possibleBehaviors: { name: string; relevanceRate: number }[];
  isCustom?: boolean;
}

export interface CustomerSeasonalEvaluation {
  customerId: string;
  name: string;
  phone: string;
  avatarSeed: string;
  accountAgeDays: number;
  lifecycleStage: LifecycleStage;
  
  // Seasonal relevance & predicted next behaviors
  predictedBehaviors: { behavior: string; probability: number }[];
  primaryPredictedBehavior: string;
  behaviorConfidence: number; // 0-1
  seasonalRelevanceScore: number; // 0-1

  // Causal Uplift & Probabilities
  pResponseWithOffer: number; // 0-1
  pResponseWithoutOffer: number; // 0-1 (Counterfactual organic probability)
  uplift: number; // With Offer - Without Offer
  upliftSegment: "PERSUADABLE" | "SURE_THING" | "LOST_CAUSE" | "SLEEPING_DOG";
  
  // Organic Transaction Protection
  isOrganicProtected: boolean;
  organicProtectionReason?: string;

  // Fatigue Engine
  fatigueScore: number; // 0-1
  fatigueLevel: "Low" | "Medium" | "High";
  fatigueMetrics: {
    offersReceived7d: number;
    offersReceived30d: number;
    sameCategoryOfferCount: number;
    daysSinceLastOffer: number;
    responseRateTrend: number; // -1 to 1
    redemptionRateTrend: number;
    engagementTrend: number;
    categoryFatigue: {
      recharge: number;
      merchant: number;
      sendMoney: number;
      billPay: number;
    };
  };

  // Decision Output
  recommendedAction: CandidateAction;
  recommendedChannel: ChannelType;
  recommendedTiming: string;
  expectedTransactionValueBDT: number;
  expectedIncrementalValueBDT: number; // Uplift * ExpTxValue - Cost * P(Resp) - Fatigue Penalty
  decisionPriority: "HIGH PRIORITY / TARGET" | "LOW PRIORITY / NO CASHBACK" | "SUPPRESS" | "NUDGE_ONLY";
  decisionReasoning: string[];
  
  // Decision Trace Stages for Explanations
  traceStages: {
    rawData: {
      txCount30d: number;
      avgSpendBDT: number;
      lastServiceUsed: string;
      daysSinceLastTx: number;
    };
    featureVector: {
      rfmScore: string;
      categorySaturation: string;
      contactFrequency: string;
      priceSensitivity: string;
    };
    modelInference: {
      modelName: string;
      tLearnerScore: number;
      intentModelAccuracy: string;
    };
    counterfactualAnalysis: {
      treatmentResponseRate: string;
      controlBaselineRate: string;
      netCausalLift: string;
    };
    fatigueAssessment: {
      penaltyFactor: number;
      fatigueRecommendation: string;
    };
    valueOptimization: {
      expectedGrossIncrementalBDT: number;
      incentiveCostBDT: number;
      netEIVBDT: number;
    };
    finalAction: {
      actionCode: string;
      explanation: string;
    };
  };
}

export interface BudgetAllocation {
  campaignId: string;
  campaignName: string;
  icon: string;
  budgetAllocatedBDT: number;
  targetCount: number;
  expectedIncrementalTxns: number;
  expectedIncrementalValueBDT: number;
  marginalROI: number;
  isCapped?: boolean;
}

export interface BudgetOptimizationResult {
  totalBudgetBDT: number;
  allocatedBudgetBDT: number;
  unallocatedBudgetBDT: number;
  expectedIncrementalTransactions: number;
  expectedIncrementalValueBDT: number;
  overallROI: number;
  allocations: BudgetAllocation[];
  diminishingReturnWarning?: string;
}

export interface SeasonalCampaignCalendarCard {
  id: string;
  title: string;
  icon: string;
  dateRange: string;
  month: string;
  status: "ACTIVE" | "AI OPTIMIZED" | "SCHEDULED" | "AI RECOMMENDED";
  targetAudience: string;
  budgetBDT: number;
  aiConfidence: number; // 0-1
  fatigueRisk: "Low" | "Medium" | "High";
  expectedIncrementalValueBDT: number;
  primaryMetric: string;
  whyNowChecks: {
    label: string;
    passed: boolean;
    detail: string;
  }[];
}

export interface CampaignLearningReport {
  id: string;
  campaignName: string;
  eventName: string;
  dateConducted: string;
  targetedAudience: number;
  treatmentAudience: number;
  controlAudience: number;
  predictedUplift: number; // e.g. 0.42 = +42%
  actualUplift: number; // e.g. 0.38 = +38%
  predictionGapPoints: number; // e.g. 4 percentage points
  incrementalTransactions: number;
  campaignCostBDT: number;
  incrementalValueBDT: number;
  netIncrementalROI: number;
  fatigueChangePct: number;
  statisticalConfidence: number;
  isSignificant: boolean;
  aiKeyLearning: string;
  feedbackToModels: string[];
}

export interface CopilotMessage {
  id: string;
  sender: "user" | "copilot";
  timestamp: string;
  text: string;
  structuredPlan?: {
    campaignName: string;
    objective: string;
    recommendedSegments: string[];
    candidateOffers: string[];
    expectedUplift: string;
    expectedIncrementalValue: string;
    budgetAllocationBDT: string;
    timing: string;
    channels: string[];
    fatigueRisks: string;
    organicProtectionSummary: string;
    experimentDesign: string;
  };
  excludedCustomersSummary?: {
    totalExcluded: number;
    organicProtected: number;
    highFatigue: number;
    negativeUplift: number;
    estimatedSavingsBDT: number;
    sampleExcluded: { id: string; name: string; reason: string; organicProb: string }[];
  };
}
