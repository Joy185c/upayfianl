import { CustomerProfile, DecisionTrace } from "../intelligence/types";
import { AudienceCondition, AudienceRuleGroup, AudienceEvaluation, Operator } from "./types";

/**
 * Extracts a flattened feature map for a customer combining raw features and AI decisions
 */
function extractCustomerContext(
  customer: CustomerProfile,
  trace?: DecisionTrace
): Record<string, any> {
  return {
    ...customer.features,
    lifecycle: customer.lifecycle,
    // Add computed trace values if available
    uplift: trace?.uplift ?? 0,
    fatigueScore: trace?.fatigueScore ?? 0,
    expectedIncrementalValue: trace?.expectedIncrementalValue ?? 0,
    decisionScore: trace?.decisionScore ?? 0,
    currentAction: trace?.action ?? "MONITOR",
  };
}

/**
 * Evaluates a single condition against a customer's context
 */
function evaluateCondition(context: Record<string, any>, condition: AudienceCondition): boolean {
  const customerValue = context[condition.field];
  
  if (customerValue === undefined) return false;

  const targetValue = condition.value;

  switch (condition.operator) {
    case "EQ":
      return customerValue === targetValue;
    case "NEQ":
      return customerValue !== targetValue;
    case "GT":
      return Number(customerValue) > Number(targetValue);
    case "GTE":
      return Number(customerValue) >= Number(targetValue);
    case "LT":
      return Number(customerValue) < Number(targetValue);
    case "LTE":
      return Number(customerValue) <= Number(targetValue);
    case "IN":
      return Array.isArray(targetValue) && targetValue.includes(String(customerValue));
    case "NOT_IN":
      return Array.isArray(targetValue) && !targetValue.includes(String(customerValue));
    default:
      return false;
  }
}

/**
 * Evaluates a group of conditions (AND / OR)
 */
function evaluateRuleGroup(context: Record<string, any>, group: AudienceRuleGroup): boolean {
  if (!group.conditions || group.conditions.length === 0) return true;

  if (group.logic === "AND") {
    return group.conditions.every(condition => evaluateCondition(context, condition));
  } else {
    // OR
    return group.conditions.some(condition => evaluateCondition(context, condition));
  }
}

/**
 * Evaluates an entire audience definition against the customer base
 */
export function evaluateAudience(
  customers: CustomerProfile[],
  decisions: DecisionTrace[],
  ruleGroups: AudienceRuleGroup[]
): AudienceEvaluation {
  
  const customerIds: string[] = [];
  const excludedCustomerIds: string[] = [];

  for (const customer of customers) {
    // Get the highest scoring trace for this customer across all campaigns
    // Or if filtering for a specific campaign, we would pass that specific trace.
    // For general audience builder, we use their primary NBO trace.
    const customerTraces = decisions.filter(d => d.customerId === customer.id);
    let bestTrace = customerTraces[0];
    for (const t of customerTraces) {
      if (t.decisionScore > (bestTrace?.decisionScore ?? -Infinity)) {
        bestTrace = t;
      }
    }

    const context = extractCustomerContext(customer, bestTrace);
    
    // Evaluate across all groups (Implicit AND between groups)
    let isMatch = true;
    for (const group of ruleGroups) {
      if (!evaluateRuleGroup(context, group)) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) {
      customerIds.push(customer.id);
    } else {
      excludedCustomerIds.push(customer.id);
    }
  }

  return {
    customerIds,
    count: customerIds.length,
    excludedCustomerIds,
  };
}

/**
 * Basic NLP parser to convert natural language to conditions
 */
export function parseNaturalLanguageToConditions(query: string): AudienceRuleGroup {
  const conditions: AudienceCondition[] = [];
  const lowerQuery = query.toLowerCase();

  // Basic NLP heuristics based on common phrases
  if (lowerQuery.includes("inactive") || lowerQuery.includes("haven't transacted")) {
    const match = lowerQuery.match(/(\d+)\s*days/);
    if (match) {
      conditions.push({
        id: crypto.randomUUID(),
        field: "daysSinceLastTx",
        operator: "GT",
        value: Number(match[1])
      });
    }
  }

  if (lowerQuery.includes("win-back") || lowerQuery.includes("winback")) {
    conditions.push({
      id: crypto.randomUUID(),
      field: "lifecycle",
      operator: "EQ",
      value: "WIN-BACK"
    });
  }

  if (lowerQuery.includes("high fatigue") || lowerQuery.includes("fatigued")) {
    conditions.push({
      id: crypto.randomUUID(),
      field: "fatigueScore",
      operator: "GT",
      value: 0.7
    });
  }
  
  if (lowerQuery.includes("low fatigue")) {
    conditions.push({
      id: crypto.randomUUID(),
      field: "fatigueScore",
      operator: "LT",
      value: 0.4
    });
  }

  if (lowerQuery.includes("positive uplift") || lowerQuery.includes("respond to")) {
    conditions.push({
      id: crypto.randomUUID(),
      field: "uplift",
      operator: "GT",
      value: 0.1
    });
  }

  return {
    id: crypto.randomUUID(),
    logic: "AND",
    conditions
  };
}
