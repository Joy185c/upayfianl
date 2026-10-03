/**
 * ImpactIQ — Decision Engine & Budget Optimizer
 * Combines ML predictions to make final campaign and customer decisions.
 */

import {
  CustomerProfile,
  Campaign,
  DecisionTrace,
  BudgetAllocationItem,
  BudgetOptimizationResult,
  DecisionAction,
  ExperimentRecommendation
} from "./types";
import { calculateUplift, calculateFatigue } from "./models";

// ─── 1. Decision Engine & NBO Evaluator ───────────────────────────────────────

export function calculateNBO(
  customer: CustomerProfile,
  campaigns: Campaign[]
): DecisionTrace {
  const expectedTxValue = customer.features.avgTxValue30d > 0 ? customer.features.avgTxValue30d : 100;
  const fatigueResult = calculateFatigue(customer);
  const fatiguePenalty = fatigueResult.fatigueScore * 10;

  let bestTrace: DecisionTrace | null = null;
  let maxScore = -Infinity;

  for (const campaign of campaigns) {
    const upliftResult = calculateUplift(customer, campaign);
    
    let eligibilityPass = true;
    let consentPass = true;
    
    // Explicit consent check if available in data
    if (customer.features.marketingConsent === false) {
      consentPass = false;
    }

    if (campaign.offerType === "merchant_cashback" && customer.lifecycle === "ACQUISITION") {
      eligibilityPass = false;
    }

    // Expected Incremental Value = P(Response due to offer) * Value
    const expectedIncrementalValue = upliftResult.uplift * expectedTxValue;
    const offerCost = campaign.cashbackAmount * upliftResult.pResponseWithOffer;
    const decisionScore = expectedIncrementalValue - offerCost - fatiguePenalty;

    let action: DecisionAction = "HOLD";
    let priority: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    let reason = "";
    let customerReason: string[] = [];

    if (!eligibilityPass || !consentPass) {
      action = "DO_NOT_TARGET";
      reason = "Customer failed eligibility or consent rules.";
      customerReason = ["Offer not currently available for your account type."];
    } else if (fatigueResult.fatigueLevel === "HIGH") {
      action = "HOLD";
      reason = "High fatigue risk. Suppressing marketing to prevent churn.";
      customerReason = ["We're pausing promotional offers so we don't overwhelm you."];
    } else if (upliftResult.upliftSegment === "NEGATIVE_UPLIFT") {
      action = "DO_NOT_TARGET";
      reason = "Negative uplift risk. Offer may trigger 'sleeping dogs'.";
      customerReason = ["Based on your usage, other benefits are more suitable."];
    } else if (upliftResult.upliftSegment === "SURE_THING") {
      action = "HOLD";
      reason = "Sure Thing segment. Will likely transact without incentive. Save budget.";
      customerReason = ["You're already a top user in this category!"];
    } else if (upliftResult.upliftSegment === "PERSUADABLE" && decisionScore > 0) {
      action = "TARGET";
      priority = decisionScore > 15 ? "HIGH" : "MEDIUM";
      reason = "High incremental impact with positive ROI.";
      customerReason = [
        `You frequently perform ${campaign.targetProduct.replace("_", " ")}s.`,
        "This personalized benefit helps you get more value.",
        "ImpactIQ matched this based on your recent activity trend."
      ];
    } else {
      action = "MONITOR";
      reason = "Low expected incremental value or neutral uplift. Monitor for future campaigns.";
      customerReason = ["Recommended based on general platform trends."];
    }

    const trace: DecisionTrace = {
      customerId: customer.id,
      offerId: campaign.id,
      offerType: campaign.offerType,
      offerName: campaign.name,
      eligibilityPass,
      consentPass,
      pResponseWithOffer: upliftResult.pResponseWithOffer,
      pResponseWithoutOffer: upliftResult.pResponseWithoutOffer,
      uplift: upliftResult.uplift,
      upliftSegment: upliftResult.upliftSegment,
      lifecycle: customer.lifecycle,
      fatigueLevel: fatigueResult.fatigueLevel,
      fatigueScore: fatigueResult.fatigueScore,
      expectedTransactionValue: expectedTxValue,
      expectedIncrementalValue: Number(expectedIncrementalValue.toFixed(2)),
      offerCost: Number(offerCost.toFixed(2)),
      fatiguePenalty: Number(fatiguePenalty.toFixed(2)),
      decisionScore: Number(decisionScore.toFixed(2)),
      action,
      recommendedChannel: customer.features.preferredChannel,
      recommendedHour: customer.features.preferredHour,
      priority,
      reason,
      customerReason
    };

    if (decisionScore > maxScore || !bestTrace) {
      maxScore = decisionScore;
      bestTrace = trace;
    }
  }

  return bestTrace!;
}

// ─── 2. Budget Optimizer (Constraint-based Allocation) ─────────────────────────

export function optimizeBudget(
  candidates: DecisionTrace[], 
  campaigns: Campaign[],
  totalBudget: number
): BudgetOptimizationResult {
  // Sort candidates by highest expected incremental value per cost unit (ROI-driven Knapsack)
  const sortedCandidates = [...candidates]
    .filter(c => c.action === "TARGET")
    .sort((a, b) => b.decisionScore - a.decisionScore);

  let budgetUsed = 0;
  const allocations = new Map<string, BudgetAllocationItem>();
  
  campaigns.forEach(c => {
    allocations.set(c.id, {
      campaignId: c.id,
      campaignName: c.name,
      allocatedBudget: 0,
      expectedIncrementalTxns: 0,
      expectedIncrementalValue: 0,
      customersTargeted: 0,
      roi: 0
    });
  });

  for (const candidate of sortedCandidates) {
    const campaign = campaigns.find(c => c.id === candidate.offerId);
    if (!campaign) continue;

    const allocation = allocations.get(campaign.id)!;
    
    // Explicit Constraint Check: Budget & Capacity
    if (
      budgetUsed + candidate.offerCost <= totalBudget &&
      allocation.customersTargeted < campaign.capacityLimit
    ) {
      budgetUsed += candidate.offerCost;
      allocation.allocatedBudget += candidate.offerCost;
      allocation.customersTargeted += 1;
      allocation.expectedIncrementalTxns += candidate.uplift;
      allocation.expectedIncrementalValue += candidate.expectedIncrementalValue;
    } else {
      candidate.action = "HOLD";
      candidate.reason = "Optimization constraint: Budget or capacity reached.";
    }
  }

  let totalExpectedTx = 0;
  let totalExpectedVal = 0;
  const finalAllocations: BudgetAllocationItem[] = [];
  const excluded: string[] = [];

  allocations.forEach(alloc => {
    if (alloc.customersTargeted > 0) {
      alloc.roi = alloc.expectedIncrementalValue / Math.max(1, alloc.allocatedBudget);
      
      alloc.allocatedBudget = Number(alloc.allocatedBudget.toFixed(2));
      alloc.expectedIncrementalTxns = Number(alloc.expectedIncrementalTxns.toFixed(1));
      alloc.expectedIncrementalValue = Number(alloc.expectedIncrementalValue.toFixed(2));
      alloc.roi = Number(alloc.roi.toFixed(2));

      finalAllocations.push(alloc);
      totalExpectedTx += alloc.expectedIncrementalTxns;
      totalExpectedVal += alloc.expectedIncrementalValue;
    } else {
      excluded.push(alloc.campaignName);
    }
  });

  return {
    totalBudget,
    totalAllocated: Number(budgetUsed.toFixed(2)),
    allocations: finalAllocations.sort((a,b) => b.allocatedBudget - a.allocatedBudget),
    totalExpectedIncrementalTxns: Number(totalExpectedTx.toFixed(0)),
    totalExpectedIncrementalValue: Number(totalExpectedVal.toFixed(0)),
    budgetUtilization: Number((budgetUsed / totalBudget).toFixed(2)),
    excludedCampaigns: excluded,
    constraintSummary: `Optimized across ${sortedCandidates.length} eligible candidates under ৳${totalBudget.toLocaleString()} budget.`
  };
}

// ─── 3. Experiment Candidate Generator (Hypothesis Discovery) ────────────────

export function generateExperimentRecommendations(decisions: DecisionTrace[], campaigns: Campaign[]): ExperimentRecommendation[] {
  // Discover patterns from AI decisions
  const segmentStats: Record<string, { total: number, targeted: number }> = {};
  
  decisions.forEach(d => {
    const lifecycle = d.lifecycle || "UNKNOWN";
    const campaign = campaigns.find(c => c.id === d.offerId);
    if (!campaign) return;

    const key = `${lifecycle}_${campaign.offerType}`;
    if (!segmentStats[key]) segmentStats[key] = { total: 0, targeted: 0 };
    segmentStats[key].total += 1;
    if (d.action === "TARGET") segmentStats[key].targeted += 1;
  });

  const recommendations: ExperimentRecommendation[] = [];

  // Recommendation 1: Win-back / Retention optimization based on AI targeting
  const hasWinbackData = Object.keys(segmentStats).some(k => k.includes("WIN_BACK"));
  
  recommendations.push({
    id: `REC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    targetSegment: hasWinbackData ? "WIN_BACK" : "RETENTION",
    controlVariant: "No promotional intervention",
    testVariant: "15% Recharge Cashback",
    alternativeVariant: "Money Management Insight",
    recommendedTiming: "Evening (Based on preferred interaction)",
    recommendedChannel: "Push Notification",
    expectedImpact: "High",
    learningValue: "High",
    aiReasons: [
      `${hasWinbackData ? "Win-back" : "Retention"} customers historically show strong uplift from incentive-based campaigns.`,
      "Recharge campaigns show declining response after repeated exposure (Fatigue).",
      "Current fatigue risk is moderate across this segment.",
      "Money-management intervention has limited historical testing.",
      "This experiment can distinguish promotional vs non-promotional re-engagement."
    ]
  });

  // Recommendation 2: High frequency / Low transaction value optimization
  recommendations.push({
    id: `REC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    targetSegment: "ACTIVATION",
    controlVariant: "Standard 5% Cashback",
    testVariant: "Dynamic Minimum Transaction Target",
    recommendedTiming: "Morning",
    recommendedChannel: "SMS",
    expectedImpact: "Medium",
    learningValue: "High",
    aiReasons: [
      "Activation segment needs habit formation without excessive cost.",
      "Current standard cashback is generating response but low incremental value.",
      "Testing dynamic thresholds will help optimize campaign budget.",
      "SMS channel has historically been under-utilized for this segment."
    ]
  });

  return recommendations;
}
