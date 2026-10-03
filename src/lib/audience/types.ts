export type ActionType = "TARGET" | "HOLD" | "SUPPRESS" | "MONITOR";

export type Operator = 
  | "EQ" 
  | "NEQ" 
  | "GT" 
  | "GTE" 
  | "LT" 
  | "LTE" 
  | "IN" 
  | "NOT_IN";

export interface AudienceCondition {
  id: string;
  field: string;
  operator: Operator;
  value: string | number | boolean | string[];
}

export interface AudienceRuleGroup {
  id: string;
  logic: "AND" | "OR";
  conditions: AudienceCondition[];
}

export interface AudienceDefinition {
  id: string;
  name: string;
  sourceAction?: ActionType;
  ruleGroups: AudienceRuleGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface AudienceEvaluation {
  customerIds: string[];
  count: number;
  excludedCustomerIds: string[];
}

export const AUDIENCE_FIELDS = [
  // Customer Profile
  { id: "accountAge", label: "Account Age (Days)", type: "number", category: "Profile" },
  { id: "lifecycle", label: "Lifecycle Stage", type: "string", category: "Profile" },
  
  // Activity
  { id: "daysSinceLastTx", label: "Days Since Last Transaction", type: "number", category: "Activity" },
  { id: "txFrequency", label: "Transaction Frequency (Per Month)", type: "number", category: "Activity" },
  { id: "avgTxValue30d", label: "Average Transaction Value (30d)", type: "number", category: "Activity" },
  
  // Service Usage
  { id: "mostUsedService", label: "Most Used Service", type: "string", category: "Service Usage" },
  { id: "rechargeCount30d", label: "Recharge Count (30d)", type: "number", category: "Service Usage" },
  
  // Campaign
  { id: "offersReceived30d", label: "Offers Received (30d)", type: "number", category: "Campaign" },
  { id: "daysSinceLastOffer", label: "Days Since Last Offer", type: "number", category: "Campaign" },
  { id: "campaignResponseRate", label: "Campaign Response Rate", type: "number", category: "Campaign" },
  
  // Intelligence (Computed)
  { id: "uplift", label: "Calculated Uplift", type: "number", category: "Intelligence" },
  { id: "fatigueScore", label: "Fatigue Score", type: "number", category: "Intelligence" },
  { id: "expectedIncrementalValue", label: "Expected Incremental Value", type: "number", category: "Intelligence" },
  { id: "decisionScore", label: "Decision Score", type: "number", category: "Intelligence" },
  
  // Decision
  { id: "currentAction", label: "Current AI Action", type: "string", category: "Decision" },
];
