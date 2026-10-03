/**
 * Upay ImpactIQ — Voice AI Growth Agent Types
 * Defines the complete state machine, tool specifications, multi-turn contexts,
 * live execution timeline, and campaign generation schemas for the Voice Agent.
 */

export type VoiceAgentState =
  | "IDLE"
  | "LISTENING"
  | "PROCESSING"
  | "EXECUTING"
  | "SPEAKING"
  | "COMPLETED"
  | "ERROR";

export interface ExecutionTimelineStep {
  id: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
  timestamp?: string;
  detail?: string;
}

export interface GeneratedVoiceCampaign {
  id: string;
  name: string;
  event?: string;
  objective: string;
  targetSegment: string;
  audienceCount: number;
  offerType: string;
  offerDescription: string;
  discountValue: string;
  channel: string;
  timing: string;
  budgetBDT: number;
  expectedResponseRate: number; // 0-1
  expectedUplift: number; // 0-1 (e.g. +45%)
  expectedIncrementalTransactions: number;
  expectedIncrementalValueBDT: number;
  fatigueRisk: "Low" | "Medium" | "High";
  organicProtectedCount: number;
  experimentPlan: {
    type: string;
    treatmentSize: number;
    controlSize: number;
    hypothesis: string;
    metrics: string[];
  };
  approvalStatus: "DRAFT_PENDING_APPROVAL" | "APPROVED_LAUNCHED" | "CANCELLED";
  isLaunched?: boolean;
  launchedAt?: string;
}

export interface VoiceConversationTurn {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  languageDetected?: "en" | "bn" | "banglish";
  intent?: string;
  toolsInvoked?: { name: string; args: any; resultSummary: string }[];
  campaignPreview?: GeneratedVoiceCampaign;
  isApprovalPrompt?: boolean;
  isLaunchConfirmation?: boolean;
  explanationDetails?: {
    segment: string;
    responseProb: string;
    organicBaseline: string;
    uplift: string;
    fatigue: string;
    rationale: string;
  };
  opportunityBriefs?: {
    id: string;
    title: string;
    priority: "HIGH" | "MEDIUM";
    audience: string;
    reason: string;
    estimatedImpact: string;
    suggestedAction: string;
  }[];
}

// ─── TOOL INPUT & OUTPUT DEFINITIONS ─────────────────────────────────────────

export interface CustomerAnalysisParams {
  lifecycle?: string;
  transactionBehavior?: string;
  segment?: string;
  activityLevel?: string;
  season?: string;
  minSpend?: number;
}

export interface CustomerAnalysisResult {
  totalAnalyzed: number;
  matchingCustomers: number;
  segmentsIdentified: string[];
  averageSpendBDT: number;
  dominantService: string;
  organicPropensityRate: number;
  insights: string[];
}

export interface PredictResponseParams {
  segment: string;
  offerType: string;
  channel: string;
  timing: string;
}

export interface CalculateUpliftParams {
  segment: string;
  offerType: string;
  channel: string;
}

export interface CalculateFatigueParams {
  segment: string;
  targetService: string;
}

export interface PredictNextBehaviorParams {
  customerIdOrSegment: string;
}

export interface GenerateCampaignParams {
  objective?: string;
  season?: string;
  targetSegment?: string;
  offerType?: string;
  budgetBDT?: number;
  channel?: string;
  timing?: string;
  durationDays?: number;
}

export interface OptimizeBudgetParams {
  availableBudgetBDT: number;
  targetEventsOrCampaigns?: string[];
  customCaps?: Record<string, number>;
}

export interface CreateExperimentParams {
  campaignId: string;
  treatmentSplit?: number; // 0.8
  controlSplit?: number; // 0.2
  hypothesis?: string;
}

export interface AnalyzeCampaignParams {
  campaignNameOrId: string;
}

export interface VoiceOpportunityItem {
  id: string;
  title: string;
  priority: "HIGH" | "MEDIUM";
  audience: string;
  reason: string;
  estimatedImpact: string;
  suggestedAction: string;
}
