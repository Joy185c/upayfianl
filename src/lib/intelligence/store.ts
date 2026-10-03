/**
 * ImpactIQ — Central Intelligence Store
 * Manages the entire ML and Decision pipeline state.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  CustomerProfile,
  Campaign,
  DecisionTrace,
  BudgetOptimizationResult,
  ExperimentResult,
  IntelligenceState
} from './types';
import { generateSyntheticCustomers, getDefaultCampaigns } from './data-generator';
import { calculateNBO, optimizeBudget, generateExperimentRecommendations } from './engine';
import { AudienceDefinition } from '../audience/types';
import { RawCustomer } from '../data/types';
import { extractFeatures } from '../data/feature-engine';

interface IntelligenceActions {
  // Demo Runner
  runIntelligencePipeline: () => Promise<void>;
  resetIntelligence: () => void;
  
  // Data Import
  importCustomerData: (rawCustomers: RawCustomer[], mode: "add" | "update" | "add_update") => Promise<void>;
  _runCorePipeline: (customers: CustomerProfile[], campaigns: Campaign[]) => void;
  
  // Campaigns
  addCampaign: (campaign: Campaign) => void;
  deleteCampaign: (id: string) => void;
  
  // Audience
  saveAudienceDefinition: (def: AudienceDefinition) => void;
  deleteAudienceDefinition: (id: string) => void;
  getAudienceDefinitionsByAction: (action: string) => AudienceDefinition[];

  // Queries for Authority
  getDashboardKPIs: () => IntelligenceState['kpis'];
  getCampaignTraces: (campaignId: string) => DecisionTrace[];
  getCustomerTrace: (customerId: string) => DecisionTrace | undefined;
  getBudgetResult: () => BudgetOptimizationResult | null;
  getSegments: () => Record<string, number>;
  
  // Queries for ImpactIQ (Customer)
  getCustomerNBO: (customerId: string) => DecisionTrace | null;
  getCustomerInsights: (customerId: string) => string[];
}

const INITIAL_STATE: IntelligenceState = {
  customers: [],
  decisions: [],
  experiments: [],
  experimentRecommendations: [],
  budgetResult: null,
  campaigns: [],
  audienceDefinitions: [],
  lastRunAt: null,
  isRunning: false,
  kpis: {
    totalCustomers: 0,
    eligibleCustomers: 0,
    aiRecommended: 0,
    persuadable: 0,
    sureThing: 0,
    lostCause: 0,
    negativeUplift: 0,
    highFatigue: 0,
    mediumFatigue: 0,
    lowFatigue: 0,
    expectedIncrementalTxns: 0,
    expectedIncrementalValue: 0,
    estimatedROI: 0,
    acquisition: 0,
    activation: 0,
    engagement: 0,
    retention: 0,
    win_back: 0
  }
};

export const useIntelligenceStore = create<IntelligenceState & IntelligenceActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      runIntelligencePipeline: async () => {
        set({ isRunning: true });
        await new Promise(r => setTimeout(r, 1500));

        let customers = get().customers;
        if (customers.length === 0) {
          customers = generateSyntheticCustomers(1500);
          set({ customers });
        }

        const campaigns = get().campaigns.length > 0 ? get().campaigns : getDefaultCampaigns();
        
        // If they just started and have 0 campaigns, save the defaults so they persist
        if (get().campaigns.length === 0) {
          set({ campaigns });
        }

        get()._runCorePipeline(customers, campaigns);
      },

      addCampaign: (campaign) => {
        const currentCampaigns = get().campaigns.length > 0 ? get().campaigns : getDefaultCampaigns();
        const updatedCampaigns = [...currentCampaigns, campaign];
        set({ campaigns: updatedCampaigns });
        
        // Auto-run pipeline to include new campaign
        if (get().customers.length > 0) {
          get()._runCorePipeline(get().customers, updatedCampaigns);
        }
      },

      deleteCampaign: (id) => {
        const currentCampaigns = get().campaigns.length > 0 ? get().campaigns : getDefaultCampaigns();
        const updatedCampaigns = currentCampaigns.filter(c => c.id !== id);
        set({ campaigns: updatedCampaigns });
        
        // Re-run pipeline to remove the campaign from budget allocation
        if (get().customers.length > 0) {
          get()._runCorePipeline(get().customers, updatedCampaigns);
        }
      },

      importCustomerData: async (rawCustomers, mode) => {
        set({ isRunning: true });
        await new Promise(r => setTimeout(r, 500));

        const existingCustomers = get().customers;
        let newCustomerList = [...existingCustomers];

        for (const raw of rawCustomers) {
          const profile = extractFeatures(raw);
          const existingIndex = newCustomerList.findIndex(c => c.id === profile.id);
          
          if (existingIndex >= 0 && (mode === "update" || mode === "add_update")) {
            newCustomerList[existingIndex] = profile;
          } else if (existingIndex < 0 && (mode === "add" || mode === "add_update")) {
            newCustomerList.push(profile);
          }
        }

        const campaigns = get().campaigns.length > 0 ? get().campaigns : getDefaultCampaigns();
        get()._runCorePipeline(newCustomerList, campaigns);
      },

      // Internal method to run intelligence on any dataset
      _runCorePipeline: (customers: CustomerProfile[], campaigns: Campaign[]) => {

        const decisions: DecisionTrace[] = [];
        const kpis = { ...INITIAL_STATE.kpis };
        kpis.totalCustomers = customers.length;

        // 2. Evaluate NBO for each customer
        // Instead of randomly assigning a campaign, we evaluate ALL campaigns
        // and let the engine pick the best one for this specific user.
        for (const customer of customers) {
          kpis[customer.lifecycle.toLowerCase() as keyof typeof kpis]++;
          
          // NBO Evaluator ranks all eligible campaigns and returns the best trace
          // which has the highest Expected Incremental Value
          const decision = calculateNBO(customer, campaigns);
          decisions.push(decision);

          if (decision.eligibilityPass) kpis.eligibleCustomers++;
          if (decision.fatigueLevel === "HIGH") kpis.highFatigue++;
          if (decision.fatigueLevel === "MEDIUM") kpis.mediumFatigue++;
          if (decision.fatigueLevel === "LOW") kpis.lowFatigue++;
          
          if (decision.upliftSegment === "PERSUADABLE") kpis.persuadable++;
          if (decision.upliftSegment === "SURE_THING") kpis.sureThing++;
          if (decision.upliftSegment === "LOST_CAUSE") kpis.lostCause++;
          if (decision.upliftSegment === "NEGATIVE_UPLIFT") kpis.negativeUplift++;
        }

        // 3. Global Budget Optimization (Knapsack constraint solver)
        const TOTAL_BUDGET = 500000; 
        const budgetResult = optimizeBudget(decisions, campaigns, TOTAL_BUDGET);

        kpis.aiRecommended = decisions.filter(d => d.action === "TARGET").length;
        kpis.expectedIncrementalTxns = budgetResult.totalExpectedIncrementalTxns;
        kpis.expectedIncrementalValue = budgetResult.totalExpectedIncrementalValue;
        kpis.estimatedROI = budgetResult.totalExpectedIncrementalValue / Math.max(1, budgetResult.totalAllocated);

        // 4. Experiment Intelligence (Deterministic Simulation)
        const experiments: ExperimentResult[] = campaigns.map((c, i) => {
          const alloc = budgetResult.allocations.find(a => a.campaignId === c.id);
          const targetedPop = alloc?.customersTargeted || 0;
          
          // Find the subset of people the model wanted to target
          const targetedDecisions = decisions.filter(d => d.offerId === c.id && d.action === "TARGET");
          
          let treatPop = 0;
          let controlPop = 0;
          let treatConv = 0;
          let controlConv = 0;
          let predLiftSum = 0;

          // Deterministic simulation based on customer ID and predicted probabilities
          targetedDecisions.forEach(d => {
            const hash = parseInt(d.customerId.replace("C", "")) % 10;
            const isTreatment = hash < 8; // 80/20 split

            if (isTreatment) {
              treatPop++;
              predLiftSum += d.uplift;
              const threshold = (hash + 1) / 10;
              if (d.pResponseWithOffer > threshold) treatConv++;
            } else {
              controlPop++;
              predLiftSum += d.uplift; // we predicted this for them
              const threshold = (hash + 1) / 10;
              if (d.pResponseWithoutOffer > threshold) controlConv++;
            }
          });

          const treatRate = (treatPop > 0 && !isNaN(treatConv / treatPop)) ? treatConv / treatPop : 0;
          const controlRate = (controlPop > 0 && !isNaN(controlConv / controlPop)) ? controlConv / controlPop : 0;
          const observedLift = (!isNaN(treatRate - controlRate)) ? treatRate - controlRate : 0;
          const predictedAvgLift = ((treatPop + controlPop) > 0 && !isNaN(predLiftSum / (treatPop + controlPop))) 
            ? predLiftSum / (treatPop + controlPop) 
            : 0;

          return {
            experimentId: `EXP-${c.id}`,
            campaignId: c.id,
            campaignName: c.name,
            treatmentSize: treatPop || 0,
            controlSize: controlPop || 0,
            simulatedTreatmentResponseRate: treatRate || 0,
            simulatedControlResponseRate: controlRate || 0,
            simulatedObservedLift: observedLift || 0,
            predictedLift: predictedAvgLift || 0,
            predictionGap: (predictedAvgLift > 0 && !isNaN(Math.abs(predictedAvgLift - observedLift)/predictedAvgLift)) 
              ? Math.abs(predictedAvgLift - observedLift)/predictedAvgLift 
              : 0,
            incrementalConversions: Math.max(0, treatConv - Math.floor(treatPop * controlRate)),
            incrementalValue: Math.max(0, treatConv - Math.floor(treatPop * controlRate)) * 150,
            campaignCost: alloc?.allocatedBudget || 0,
            roi: alloc?.roi || 0,
            statisticalSignificance: treatPop > 10 ? 0.95 + (i * 0.01) : 0, // mock sig
            isSignificant: treatPop > 10,
            status: "completed"
          };
        });

        // 5. Experiment Recommendations
        const experimentRecommendations = generateExperimentRecommendations(decisions, campaigns);

        // 6. Commit state
        set({
          customers,
          campaigns,
          decisions,
          budgetResult,
          experiments,
          experimentRecommendations,
          kpis,
          lastRunAt: new Date().toISOString(),
          isRunning: false
        });
      },

      resetIntelligence: () => {
        set({ ...INITIAL_STATE });
      },

      saveAudienceDefinition: (def) => {
        const existing = get().audienceDefinitions;
        const index = existing.findIndex(d => d.id === def.id);
        if (index >= 0) {
          const updated = [...existing];
          updated[index] = def;
          set({ audienceDefinitions: updated });
        } else {
          set({ audienceDefinitions: [...existing, def] });
        }
      },

      deleteAudienceDefinition: (id) => {
        set({ audienceDefinitions: get().audienceDefinitions.filter(d => d.id !== id) });
      },

      getAudienceDefinitionsByAction: (action) => {
        return get().audienceDefinitions.filter(d => d.sourceAction === action);
      },

      getDashboardKPIs: () => {
        return get().kpis;
      },

      getCampaignTraces: (campaignId: string) => {
        return get().decisions.filter(d => d.offerId === campaignId);
      },

      getCustomerTrace: (customerId: string) => {
        return get().decisions.find(d => d.customerId === customerId);
      },

      getBudgetResult: () => {
        return get().budgetResult;
      },

      getSegments: () => {
        const k = get().kpis;
        return {
          "Persuadable": k.persuadable,
          "Sure Thing": k.sureThing,
          "Lost Cause": k.lostCause,
          "Negative Uplift": k.negativeUplift
        };
      },

      getCustomerNBO: (customerId: string) => {
        // Return the decision trace if it's a "TARGET" action, meaning we should show it.
        // For demo, if they aren't targeted, we might still want to return a generic insight
        // but let's strictly follow the engine first.
        const decision = get().decisions.find(d => d.customerId === customerId);
        if (decision && decision.action === "TARGET") return decision;
        return null;
      },

      getCustomerInsights: (customerId: string) => {
        const customer = get().customers.find(c => c.id === customerId);
        if (!customer) return [];
        
        const insights = [];
        const f = customer.features;
        
        const serviceMap: Record<string, string> = {
          "merchant_payment": "Merchant payments are",
          "recharge": "Mobile recharge is",
          "bill_payment": "Bill payments are",
          "send_money": "Sending money is",
          "cash_out": "Cash out is"
        };

        if (f.mostUsedService) {
          insights.push(`${serviceMap[f.mostUsedService] || "Certain services are"} your most-used service this month.`);
        }

        if (f.activityTrend > 0.1) {
          insights.push(`Your activity increased by ${Math.round(f.activityTrend * 100)}% compared with last month.`);
        } else if (f.activityTrend < -0.2) {
          insights.push("You've been less active this month compared to the last.");
        }

        if (f.preferredHour) {
          const h = f.preferredHour;
          const time = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
          insights.push(`You usually transact in the ${time}.`);
        }

        return insights;
      }
    }),
    {
      name: 'upay-impactiq-intelligence-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
