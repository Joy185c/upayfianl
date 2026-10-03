/**
 * ImpactIQ Intelligence Engine — Core Types
 * All types for the unified intelligence pipeline
 */

// ─── Raw Customer Features ────────────────────────────────────────────────────
import { AudienceDefinition } from "../audience/types";

export interface CustomerFeatures {
  customerId: string;
  // Transaction features
  transactions7d: number;
  transactions30d: number;
  transactions90d: number;
  totalTxValue30d: number;
  avgTxValue30d: number;
  daysSinceLastTx: number;
  txFrequency: number; // tx/day over 30d
  txTrend: number; // positive = increasing

  // Service features
  rechargeCount30d: number;
  merchantPayCount30d: number;
  billPayCount30d: number;
  sendMoneyCount30d: number;
  cashoutCount30d: number;
  addMoneyCount30d: number;

  // Campaign features
  offersReceived7d: number;
  offersReceived30d: number;
  campaignResponseRate: number; // 0-1
  campaignRedemptionRate: number; // 0-1
  sameCategoryOfferCount: number;
  daysSinceLastOffer: number;
  daysSinceLastRedemption: number;

  // Engagement
  preferredHour: number; // 0-23
  preferredChannel: "push" | "sms" | "in_app";
  activeDays30d: number;
  activityTrend: number; // -1 to 1

  // Lifecycle
  accountAge: number; // days
  servicesDiversity: number; // 0-1 (how many services used)
  inactivityDays: number;
  mostUsedService: string;

  // Experiment
  treatmentCount: number;
  controlCount: number;
  historicalResponseRate: number;
  historicalUplift: number;

  // Consent
  marketingConsent?: boolean;
}

// ─── Customer Profile ─────────────────────────────────────────────────────────

export type LifecycleStage =
  | "ACQUISITION"
  | "ACTIVATION"
  | "ENGAGEMENT"
  | "RETENTION"
  | "WIN_BACK";

export type CustomerSegmentType =
  | "new_user"
  | "active_user"
  | "high_value"
  | "recharge_heavy"
  | "merchant_heavy"
  | "bill_payment"
  | "send_money"
  | "dormant"
  | "win_back"
  | "offer_sensitive"
  | "offer_fatigued"
  | "sure_thing"
  | "persuadable"
  | "lost_cause"
  | "negative_uplift";

export interface CustomerProfile {
  id: string;
  displayName: string;
  phone: string;
  accountAge: number;
  segment: CustomerSegmentType;
  features: CustomerFeatures;
  lifecycle: LifecycleStage;
  avgMonthlyValue: number;
  totalTransactions: number;
}

// ─── Predictions ──────────────────────────────────────────────────────────────

export type UpliftSegment =
  | "PERSUADABLE"
  | "SURE_THING"
  | "LOST_CAUSE"
  | "NEGATIVE_UPLIFT";

export interface ResponsePrediction {
  customerId: string;
  offerId: string;
  pResponseWithOffer: number; // P(Response | Treatment)
  pResponseWithoutOffer: number; // P(Response | Control)
  uplift: number; // difference
  upliftSegment: UpliftSegment;
  confidence: number;
}

export type FatigueLevel = "LOW" | "MEDIUM" | "HIGH";

export interface FatiguePrediction {
  customerId: string;
  fatigueScore: number; // 0-1
  fatigueLevel: FatigueLevel;
  offersReceivedRecently: number;
  daysSinceLastOffer: number;
  responseDeclineRate: number;
}

// ─── Decision Engine Output ───────────────────────────────────────────────────

export type DecisionAction =
  | "TARGET"
  | "HOLD"
  | "DO_NOT_TARGET"
  | "MONITOR";

export type OfferType =
  | "recharge_cashback"
  | "merchant_cashback"
  | "bill_payment_benefit"
  | "send_money_benefit"
  | "add_money_benefit"
  | "recharge_reminder"
  | "bill_reminder"
  | "merchant_reminder"
  | "winback_benefit"
  | "no_promotional_action";

export interface DecisionTrace {
  customerId: string;
  offerId: string;
  offerType: OfferType;
  offerName: string;

  // Checks
  eligibilityPass: boolean;
  consentPass: boolean;

  // ML outputs
  pResponseWithOffer: number;
  pResponseWithoutOffer: number;
  uplift: number;
  upliftSegment: UpliftSegment;

  // Context
  lifecycle: LifecycleStage;
  fatigueLevel: FatigueLevel;
  fatigueScore: number;

  // Value calculation
  expectedTransactionValue: number;
  expectedIncrementalValue: number;
  offerCost: number;
  fatiguePenalty: number;
  decisionScore: number;

  // Final decision
  action: DecisionAction;
  recommendedChannel: "push" | "sms" | "in_app";
  recommendedHour: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  reason: string;

  // Customer-friendly reason (ImpactIQ)
  customerReason: string[];
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  name: string;
  offerType: OfferType;
  cashbackAmount: number;
  minTransaction: number;
  budgetTotal: number;
  budgetUsed: number;
  capacityLimit: number; // max customers
  channel: "push" | "sms" | "in_app";
  targetProduct: string;
  duration: number; // days
  isActive: boolean;
}

// ─── Budget Optimizer ─────────────────────────────────────────────────────────

export interface BudgetAllocationItem {
  campaignId: string;
  campaignName: string;
  allocatedBudget: number;
  expectedIncrementalTxns: number;
  expectedIncrementalValue: number;
  customersTargeted: number;
  roi: number;
}

export interface BudgetOptimizationResult {
  totalBudget: number;
  totalAllocated: number;
  allocations: BudgetAllocationItem[];
  totalExpectedIncrementalTxns: number;
  totalExpectedIncrementalValue: number;
  budgetUtilization: number;
  excludedCampaigns: string[];
  constraintSummary: string;
}

// ─── Experiment ───────────────────────────────────────────────────────────────

export interface ExperimentResult {
  experimentId: string;
  campaignId: string;
  campaignName: string;
  treatmentSize: number;
  controlSize: number;
  simulatedTreatmentResponseRate: number;
  simulatedControlResponseRate: number;
  simulatedObservedLift: number; // treatment - control
  predictedLift: number; // from uplift model
  predictionGap: number; // |predicted - observed| / predicted
  incrementalConversions: number;
  incrementalValue: number;
  campaignCost: number;
  roi: number;
  statisticalSignificance: number; // p-value proxy
  isSignificant: boolean;
  status: "running" | "completed";
}

export interface ExperimentRecommendation {
  id: string;
  targetSegment: string;
  controlVariant: string;
  testVariant: string;
  alternativeVariant?: string;
  recommendedTiming: string;
  recommendedChannel: string;
  expectedImpact: "High" | "Medium" | "Low";
  learningValue: "High" | "Medium" | "Low";
  aiReasons: string[];
}

// ─── Intelligence Engine State ────────────────────────────────────────────────

export interface IntelligenceState {
  customers: CustomerProfile[];
  decisions: DecisionTrace[];
  experiments: ExperimentResult[];
  experimentRecommendations: ExperimentRecommendation[];
  budgetResult: BudgetOptimizationResult | null;
  campaigns: Campaign[];
  audienceDefinitions: AudienceDefinition[];
  lastRunAt: string | null;
  isRunning: boolean;

  // Aggregated KPIs
  kpis: {
    totalCustomers: number;
    eligibleCustomers: number;
    aiRecommended: number;
    persuadable: number;
    sureThing: number;
    lostCause: number;
    negativeUplift: number;
    highFatigue: number;
    mediumFatigue: number;
    lowFatigue: number;
    expectedIncrementalTxns: number;
    expectedIncrementalValue: number;
    estimatedROI: number;
    // Lifecycle
    acquisition: number;
    activation: number;
    engagement: number;
    retention: number;
    win_back: number;
  };
}
