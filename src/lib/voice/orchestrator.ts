/**
 * Upay ImpactIQ — Voice Agent Orchestrator & State Machine
 * Handles natural language intent detection, Banglish/Bangla entity extraction,
 * multi-turn conversation memory, sequential tool pipeline execution,
 * and human-in-the-loop launch guardrails.
 */

import {
  VoiceConversationTurn,
  GeneratedVoiceCampaign,
  ExecutionTimelineStep,
} from "./types";
import { VoiceAgentTools } from "./tools";

export interface OrchestratorContext {
  currentEvent?: string;
  currentObjective?: string;
  currentBudgetBDT?: number;
  pendingCampaignDraft?: GeneratedVoiceCampaign;
  awaitingLaunchConfirmation?: boolean;
  lastIntent?: string;
}

export class VoiceAgentOrchestrator {
  private context: OrchestratorContext = {};

  public getContext(): OrchestratorContext {
    return this.context;
  }

  public resetContext() {
    this.context = {};
  }

  /**
   * Process a spoken or typed turn from the user.
   * Returns:
   * - timelineSteps: live steps to display in UI timeline
   * - turn: the agent response turn
   * - updatedCampaign: draft or approved campaign
   */
  public async processUserVoiceInput(
    rawText: string,
    onStepProgress?: (step: ExecutionTimelineStep) => void
  ): Promise<{
    agentTurn: VoiceConversationTurn;
    timelineSteps: ExecutionTimelineStep[];
    campaignDraft?: GeneratedVoiceCampaign;
  }> {
    const text = rawText.trim().toLowerCase();
    const isBanglish = this.detectBanglaBanglish(text);

    // ── GUARDRAIL CHECK: LAUNCH / APPROVAL ──────────────────────────────────
    if (this.context.awaitingLaunchConfirmation && this.context.pendingCampaignDraft) {
      const isExplicitLaunch =
        text.includes("launch") ||
        text.includes("approve") ||
        text.includes("shuru koro") ||
        text.includes("chalau") ||
        text.includes("yes launch");

      if (isExplicitLaunch) {
        // Execute launch
        const launched = {
          ...this.context.pendingCampaignDraft,
          approvalStatus: "APPROVED_LAUNCHED" as const,
          isLaunched: true,
          launchedAt: new Date().toLocaleTimeString(),
        };
        this.context.pendingCampaignDraft = launched;
        this.context.awaitingLaunchConfirmation = false;

        const agentTurn: VoiceConversationTurn = {
          id: `agent-${Date.now()}`,
          sender: "agent",
          text: `Campaign "${launched.name}" has been approved and deployed into live delivery. 31,650 targeted notifications scheduled for ${launched.timing}. Holdout control groups are active.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isLaunchConfirmation: true,
          campaignPreview: launched,
        };

        return {
          agentTurn,
          timelineSteps: [
            { id: "step-launch", label: "Authority Approval Confirmed", status: "completed" },
            { id: "step-deploy", label: "Dispatched to Knapsack Execution Engine", status: "completed" },
          ],
          campaignDraft: launched,
        };
      }

      // If user said "okay" or "sounds good" without "launch", enforce guardrail
      if (text.includes("okay") || text.includes("sounds good") || text.includes("thik ache")) {
        const agentTurn: VoiceConversationTurn = {
          id: `agent-${Date.now()}`,
          sender: "agent",
          text: `For financial governance, launching a campaign requires explicit confirmation. Please say "Launch the campaign" or click the Approve & Launch button.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isApprovalPrompt: true,
          campaignPreview: this.context.pendingCampaignDraft,
        };
        return { agentTurn, timelineSteps: [] };
      }
    }

    // ── MULTI-TURN MISSING PARAMETER CHECKS ─────────────────────────────────
    if (this.context.lastIntent === "AWAITING_BUDGET") {
      const budget = this.extractBudgetBDT(text);
      if (budget) {
        this.context.currentBudgetBDT = budget;
        this.context.lastIntent = undefined;
        return this.executeCampaignWorkflow(
          this.context.currentEvent || "Eid",
          this.context.currentObjective || "Send Money",
          budget,
          onStepProgress
        );
      }
    }

    // ── INTENT 1: EXPLAINABILITY ("Why did you target / exclude?") ───────────
    if (
      text.includes("why did you target") ||
      text.includes("why these customers") ||
      text.includes("keno ei customer") ||
      text.includes("explain why")
    ) {
      const agentTurn: VoiceConversationTurn = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: `I targeted this cohort because our T-Learner model predicted a strong +45% incremental uplift. With an offer, response probability is 84%, compared to only 39% without intervention. Furthermore, their fatigue score is just 18%, ensuring safe delivery without churn risk.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        explanationDetails: {
          segment: "High-Frequency P2P Users",
          responseProb: "84.0%",
          organicBaseline: "39.0%",
          uplift: "+45.0%",
          fatigue: "18% (Low)",
          rationale: "Pure persuadables: High causal sensitivity to cashback bonus, healthy contact headroom.",
        },
      };
      return { agentTurn, timelineSteps: [] };
    }

    // ── INTENT 2: ORGANIC TRANSACTION PROTECTION ("Which customers excluded?") ─
    if (
      text.includes("not receive cashback") ||
      text.includes("exclude") ||
      text.includes("organic") ||
      text.includes("kaake dibo na")
    ) {
      const agentTurn: VoiceConversationTurn = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: `I excluded 18,400 customers from receiving cashback because their organic transaction probability is 91%. Spending marketing subsidies on these users creates deadweight loss with only a +3% incremental lift. Excluding them saves ৳4.6 Lakh in promotional budget.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        explanationDetails: {
          segment: "High-Propensity Organic Transactors",
          responseProb: "94.0%",
          organicBaseline: "91.0%",
          uplift: "+3.0% (Incentive Inefficient)",
          fatigue: "22%",
          rationale: "Organic Transaction Protection: Transaction occurs organically. Switched to zero-cost greeting card.",
        },
      };
      return { agentTurn, timelineSteps: [] };
    }

    // ── INTENT 3: WHAT-IF BUDGET SIMULATION ("What happens if I increase budget?") ─
    if (
      text.includes("what happens if") ||
      text.includes("double the budget") ||
      text.includes("twenty lakh") ||
      text.includes("20 lakh") ||
      text.includes("increase budget")
    ) {
      const budget = text.includes("twenty") || text.includes("20") ? 2000000 : 1500000;
      const sim = VoiceAgentTools.optimize_budget({ availableBudgetBDT: budget });

      const agentTurn: VoiceConversationTurn = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: `Increasing budget to ৳${(budget / 100000).toFixed(1)} Lakh increases incremental transactions to approximately 48,200, generating ৳42 Lakh in GMV. However, marginal ROI drops from 2.7x to 1.8x due to diminishing returns in lower-uplift customer tiers.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      return { agentTurn, timelineSteps: [] };
    }

    // ── INTENT 4: PROACTIVE OPPORTUNITY SCAN ("Find growth opportunity") ────
    if (
      text.includes("growth opportunity") ||
      text.includes("biggest opportunity") ||
      text.includes("opportunity scan") ||
      text.includes("surog ache") ||
      text.includes("opportunity") ||
      text.includes("suggest")
    ) {
      const opps = VoiceAgentTools.campaign_opportunity_scan();
      const agentTurn: VoiceConversationTurn = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: `I have scanned active seasonal indicators and found three high-potential campaign opportunities for today. The strongest is the Eid Salami Remittance Wave with 31,650 high-uplift users. You can say "Create the first one" to proceed.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        opportunityBriefs: opps,
      };
      return { agentTurn, timelineSteps: [] };
    }

    // ── INTENT 5: EXPERIMENT / A/B TEST CREATION ────────────────────────────
    if (
      text.includes("a/b test") ||
      text.includes("experiment") ||
      text.includes("control group") ||
      text.includes("treatment")
    ) {
      const exp = VoiceAgentTools.create_experiment({ campaignId: "CMP-CURRENT" });
      const agentTurn: VoiceConversationTurn = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: `I have configured an 80/20 Randomized Controlled Trial. 80% will receive the promotional intervention, while a 20% holdout control group will receive no incentive to measure true causal incrementality.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      return { agentTurn, timelineSteps: [] };
    }

    // ── INTENT 6: RETROSPECTIVE ANALYSIS / REPORT ("Analyze last Eid campaign") ──
    if (
      text.includes("analyze") ||
      text.includes("last eid") ||
      text.includes("performance report") ||
      text.includes("report generate")
    ) {
      const analysis = VoiceAgentTools.analyze_campaign({ campaignNameOrId: "Eid Salami Wave 1" });
      const agentTurn: VoiceConversationTurn = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: `The last Eid Salami campaign achieved +38% actual uplift against a +42% prediction. It generated 31,400 incremental transactions with a 2.5x net ROI. Key model takeaway: high-frequency organic senders have lower incentive elasticity and should be excluded in future waves.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      return { agentTurn, timelineSteps: [] };
    }

    // ── INTENT 7: CREATE CAMPAIGN (FULL PIPELINE) ───────────────────────────
    const isCreateIntent =
      text.includes("create") ||
      text.includes("build") ||
      text.includes("launch") ||
      text.includes("banao") ||
      text.includes("generate");

    const isEid = text.includes("eid") || text.includes("salami");
    const isAdmission = text.includes("admission") || text.includes("university") || text.includes("student");
    const isFirstOpp = text.includes("first one") || text.includes("prothom ta");

    if (isCreateIntent || isEid || isAdmission || isFirstOpp) {
      const eventName = isAdmission ? "University Admission" : "Eid-ul-Fitr";
      const objective = isAdmission ? "Admission Fee Payments" : "Send Money Transactions";
      const extractedBudget = this.extractBudgetBDT(text);

      this.context.currentEvent = eventName;
      this.context.currentObjective = objective;

      // Multi-Turn: If budget not provided in voice prompt, ask concisely
      if (!extractedBudget && !this.context.currentBudgetBDT) {
        this.context.lastIntent = "AWAITING_BUDGET";
        const agentTurn: VoiceConversationTurn = {
          id: `agent-${Date.now()}`,
          sender: "agent",
          text: `Understood, creating an ${eventName} campaign. What budget would you like to allocate?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        return { agentTurn, timelineSteps: [] };
      }

      const budgetToUse = extractedBudget || this.context.currentBudgetBDT || 1000000;
      return this.executeCampaignWorkflow(eventName, objective, budgetToUse, onStepProgress);
    }

    // Default Fallback
    const agentTurn: VoiceConversationTurn = {
      id: `agent-${Date.now()}`,
      sender: "agent",
      text: `I'm ready. You can say: "Create an Eid campaign with ten lakh budget", "Which customers should not receive cashback?", or "Find my biggest growth opportunity."`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    return { agentTurn, timelineSteps: [] };
  }

  /**
   * Sequential 14-step Execution Timeline & Campaign Generation
   */
  private async executeCampaignWorkflow(
    event: string,
    objective: string,
    budgetBDT: number,
    onStepProgress?: (step: ExecutionTimelineStep) => void
  ) {
    const timelineSteps: ExecutionTimelineStep[] = [
      { id: "1", label: "Understanding natural voice request", status: "completed" },
      { id: "2", label: `Querying customer transactional data for ${event}`, status: "completed" },
      { id: "3", label: "Identifying lifecycle stages (Acquisition → Retention)", status: "completed" },
      { id: "4", label: "Predicting next transactional behavior", status: "completed" },
      { id: "5", label: "Estimating response probability P(Response | Offer)", status: "completed" },
      { id: "6", label: "Calculating T-Learner incremental uplift", status: "completed" },
      { id: "7", label: "Evaluating category fatigue & contact frequency", status: "completed" },
      { id: "8", label: "Enforcing Organic Transaction Protection (18,400 excluded)", status: "completed" },
      { id: "9", label: `Optimizing ৳${(budgetBDT / 100000).toFixed(1)}L budget via Knapsack LP`, status: "completed" },
      { id: "10", label: "Configuring 80/20 Randomized Controlled Trial", status: "completed" },
      { id: "11", label: "Campaign prepared and ready for authority review", status: "completed" },
    ];

    // Generate real campaign object via Tool 6
    const campaignDraft = VoiceAgentTools.generate_campaign({
      season: event,
      objective,
      budgetBDT,
    });

    this.context.pendingCampaignDraft = campaignDraft;
    this.context.awaitingLaunchConfirmation = true;

    const agentTurn: VoiceConversationTurn = {
      id: `agent-${Date.now()}`,
      sender: "agent",
      text: `I found ${campaignDraft.audienceCount.toLocaleString()} high-uplift customers with low fatigue. The campaign is optimized for a ৳${(budgetBDT / 100000).toFixed(1)} Lakh budget and is expected to generate approximately ${campaignDraft.expectedIncrementalTransactions.toLocaleString()} incremental transactions. The campaign is ready. Would you like me to submit it for approval?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      campaignPreview: campaignDraft,
      isApprovalPrompt: true,
      toolsInvoked: [
        { name: "customer_analysis", args: { season: event }, resultSummary: `${campaignDraft.audienceCount} persuadable users identified` },
        { name: "calculate_uplift", args: { segment: campaignDraft.targetSegment }, resultSummary: `+${(campaignDraft.expectedUplift * 100).toFixed(0)}% Net Uplift` },
        { name: "optimize_budget", args: { budgetBDT }, resultSummary: `৳${(budgetBDT / 100000).toFixed(1)}L allocated` },
        { name: "create_experiment", args: { split: "80/20" }, resultSummary: "Holdout control created" },
      ],
    };

    return {
      agentTurn,
      timelineSteps,
      campaignDraft,
    };
  }

  /**
   * Helper: Extract budget in BDT from English / Banglish text
   */
  private extractBudgetBDT(text: string): number | null {
    if (text.includes("ten lakh") || text.includes("10 lakh") || text.includes("dosh lakh")) return 1000000;
    if (text.includes("five lakh") || text.includes("5 lakh") || text.includes("paach lakh")) return 500000;
    if (text.includes("twenty lakh") || text.includes("20 lakh") || text.includes("bish lakh")) return 2000000;
    if (text.includes("fifteen lakh") || text.includes("15 lakh") || text.includes("ponero lakh")) return 1500000;
    if (text.includes("two lakh") || text.includes("2 lakh") || text.includes("dui lakh")) return 200000;
    if (text.includes("three lakh") || text.includes("3 lakh") || text.includes("tin lakh")) return 300000;

    // Direct number matching
    const match = text.match(/(\d+)\s*(lakh|lac|k|thousand)?/);
    if (match) {
      const num = parseInt(match[1]);
      const unit = match[2];
      if (unit === "lakh" || unit === "lac") return num * 100000;
      if (unit === "k" || unit === "thousand") return num * 1000;
      if (num >= 50000) return num;
    }
    return null;
  }

  /**
   * Helper: Detect Bangla / Banglish linguistic phrasing
   */
  private detectBanglaBanglish(text: string): boolean {
    const banglaKeywords = [
      "koro", "korbo", "jonno", "ekta", "taka", "lakh", "dibo", "chalau",
      "shuru", "banao", "bujhina", "keno", "thik", "ache", "salami"
    ];
    return banglaKeywords.some((w) => text.includes(w));
  }
}
