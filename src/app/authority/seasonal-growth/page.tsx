"use client";

import { useState, useMemo } from "react";
import {
  Sparkles,
  Target,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  CalendarDays,
  SlidersHorizontal,
  Bot,
  FlaskConical,
  GitBranch,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Zap,
  DollarSign,
  Plus,
  Info,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  BookOpen,
  PieChart as PieIcon,
  ChevronDown,
  Layers,
  Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";
import {
  SEASONAL_TEMPLATES,
  DEMO_EVALUATION_DATA,
  SEASONAL_CALENDAR_ITEMS,
  CAMPAIGN_LEARNING_REPORTS,
  CANDIDATE_ACTIONS
} from "@/lib/seasonal/data";
import {
  SeasonalEventTemplate,
  CustomerSeasonalEvaluation,
  CopilotMessage,
  ChannelType
} from "@/lib/seasonal/types";
import { optimizeSeasonalBudget, processCopilotQuery } from "@/lib/seasonal/engine";
import { CreateCampaignWorkspace } from "@/components/campaign-intelligence/CreateCampaignWorkspace";

export default function SeasonalGrowthStudio() {
  // Scenario Selection (Hackathon Demo Mode)
  const [selectedScenario, setSelectedScenario] = useState<string>("university_admission");
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    "EVENTS" | "NEXT_BEST_ACTION" | "BUDGET_SIMULATOR" | "CALENDAR" | "EXPERIMENTS" | "DECISION_TRACE"
  >("NEXT_BEST_ACTION");

  // Create Campaign Modal State
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);

  // Selected customer for modal or trace inspection
  const currentScenarioCustomers = useMemo(() => {
    return DEMO_EVALUATION_DATA[selectedScenario] || DEMO_EVALUATION_DATA.university_admission;
  }, [selectedScenario]);

  const [inspectedCustomer, setInspectedCustomer] = useState<CustomerSeasonalEvaluation>(
    currentScenarioCustomers[0]
  );
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);

  // What-If Budget Simulator State
  const [budgetSliderBDT, setBudgetSliderBDT] = useState<number>(1000000); // ৳10L
  const [capEidCampaign, setCapEidCampaign] = useState<boolean>(false);
  const [eidCapValueBDT, setEidCapValueBDT] = useState<number>(300000); // ৳3L cap

  // Custom Event Creation Modal State
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [eventList, setEventList] = useState<SeasonalEventTemplate[]>(SEASONAL_TEMPLATES);
  const [newEventName, setNewEventName] = useState("");
  const [newEventObjective, setNewEventObjective] = useState("");
  const [newEventBudget, setNewEventBudget] = useState("250000");
  const [newEventProduct, setNewEventProduct] = useState("Merchant QR");
  const [newEventStartDate, setNewEventStartDate] = useState("2026-11-01");
  const [newEventEndDate, setNewEventEndDate] = useState("2026-11-30");

  // AI Copilot State
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    {
      id: "copilot-welcome",
      sender: "copilot",
      timestamp: "Just now",
      text: "👋 Welcome to Ask ImpactIQ — your Autonomous Campaign Co-Pilot. I can generate complete causal seasonal campaign plans, audit offer fatigue, or explain why specific customers were excluded from incentives. What would you like to build?",
    },
  ]);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  // Knapsack Budget Calculation
  const budgetResult = useMemo(() => {
    const caps: Record<string, number> = {};
    if (capEidCampaign) {
      caps["eid_send_money"] = eidCapValueBDT;
    }
    return optimizeSeasonalBudget(budgetSliderBDT, caps);
  }, [budgetSliderBDT, capEidCampaign, eidCapValueBDT]);

  // Handle Copilot prompt submission
  const handleSendCopilotQuery = (queryText?: string) => {
    const textToSend = queryText || copilotQuery;
    if (!textToSend.trim()) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: textToSend,
    };

    setCopilotMessages((prev) => [...prev, userMsg]);
    setCopilotQuery("");
    setIsCopilotThinking(true);

    setTimeout(() => {
      const response = processCopilotQuery(textToSend, budgetSliderBDT);
      setCopilotMessages((prev) => [...prev, response]);
      setIsCopilotThinking(false);
    }, 600);
  };

  // Handle adding custom event
  const handleCreateCustomEvent = () => {
    if (!newEventName.trim()) return;
    const customTemplate: SeasonalEventTemplate = {
      id: "custom",
      name: newEventName,
      icon: "⚡",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      description: newEventObjective || "Custom business campaign created by Growth Authority.",
      startDate: newEventStartDate,
      endDate: newEventEndDate,
      businessObjective: newEventObjective || "Accelerate quarterly transactional velocity.",
      targetProduct: newEventProduct,
      availableBudgetBDT: Number(newEventBudget) || 200000,
      maxCampaignCapacity: 10000,
      eligibleCustomerSegments: ["Active Users", "Target Persuadables"],
      preferredChannels: ["Push Notification", "In-App Banner"],
      candidateOffers: [
        CANDIDATE_ACTIONS.cashback_merchant,
        CANDIDATE_ACTIONS.cashback_recharge,
        CANDIDATE_ACTIONS.no_promotional_action,
      ],
      possibleBehaviors: [
        { name: "QR Retail Checkout", relevanceRate: 0.78 },
        { name: "App Open & Recharge", relevanceRate: 0.65 },
      ],
      isCustom: true,
    };

    setEventList((prev) => [customTemplate, ...prev]);
    setIsCreateEventModalOpen(false);
    setNewEventName("");
    setNewEventObjective("");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── BREADCRUMB & PRODUCT POSITIONING HERO ───────────────────────── */}
      <div className="bg-gradient-to-r from-upay-navy via-[#0A2E5C] to-upay-blue rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-upay-yellow/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-upay-yellow tracking-wider uppercase">
              <span>Authority Dashboard</span>
              <span>›</span>
              <span>Growth Intelligence</span>
              <span>›</span>
              <span className="text-white">Seasonal Growth Studio</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-upay-yellow/20 border border-upay-yellow/40 flex items-center justify-center text-upay-yellow shadow-inner">
                <Sparkles size={22} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Seasonal Growth Studio
              </h1>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2.5 py-0.5 font-bold uppercase tracking-wider">
                Adaptive AI Engine Active
              </Badge>
            </div>

            <p className="text-white/80 text-sm max-w-3xl leading-relaxed">
              <strong className="text-white font-semibold">ImpactIQ</strong> — The AI engine that turns seasonal campaigns into incremental growth.
              <span className="block text-xs text-white/60 mt-0.5">
                Right Customer. Right Offer. Right Time. Right Budget. Measurable Incremental Impact.
              </span>
            </p>
          </div>

          {/* Create Campaign CTA */}
          <div className="shrink-0 flex flex-col gap-3">
            <Button
              onClick={() => setIsCreateCampaignOpen(true)}
              className="bg-[#0b284e] hover:bg-[#113a70] text-white border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.2)] font-bold text-sm rounded-xl py-5 px-6 transition-all w-full flex items-center justify-center gap-2 group"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> Create Campaign
            </Button>
          </div>
        </div>

        {/* ── CORE PRODUCT STORY STRIP ──────────────────────────────────── */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-black/20 rounded-xl p-3.5 border border-white/5 flex items-start gap-3">
            <div className="text-red-400 font-bold shrink-0 uppercase tracking-wider mt-0.5">
              Traditional Campaign:
            </div>
            <div className="text-white/70">
              <span className="text-white font-semibold">"Who might respond?"</span> — Spray-and-pray uniform cashbacks subsidizing customers who would have transacted anyway (Sure Things).
            </div>
          </div>
          <div className="bg-emerald-950/40 rounded-xl p-3.5 border border-emerald-500/20 flex items-start gap-3">
            <div className="text-emerald-400 font-bold shrink-0 uppercase tracking-wider mt-0.5">
              Upay ImpactIQ:
            </div>
            <div className="text-white/90">
              <span className="text-emerald-300 font-semibold">"Who will respond because of us?"</span> — Causal T-Learner isolates true net incrementality, suppresses fatigued users, and protects organic transactions.
            </div>
          </div>
        </div>
      </div>

      {/* ── HACKATHON DEMO MODE SCENARIO SWITCHER (SECTION 21) ─────────── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-upay-blue/10 flex items-center justify-center text-upay-blue font-bold">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hackathon Evaluation Scenario
            </div>
            <div className="text-sm font-extrabold text-upay-navy">
              Select Seasonal Context to Load Live Decision Pipeline:
            </div>
          </div>
        </div>

        {/* Scenario Pill Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "university_admission", label: "🎓 University Admission", sub: "Education & Student Uplift" },
            { id: "eid_ul_fitr", label: "🌙 Eid Salami (P2P)", sub: "Remittance & Salami" },
            { id: "salary_month_end", label: "💼 Salary Month-End", sub: "Utility Bill Settlement" },
            { id: "shopping_season", label: "🛒 Shopping & Flash Wave", sub: "Merchant QR Payments" },
          ].map((scen) => {
            const isSelected = selectedScenario === scen.id;
            return (
              <button
                key={scen.id}
                onClick={() => {
                  setSelectedScenario(scen.id);
                  const custs = DEMO_EVALUATION_DATA[scen.id] || DEMO_EVALUATION_DATA.university_admission;
                  setInspectedCustomer(custs[0]);
                }}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left flex flex-col border",
                  isSelected
                    ? "bg-upay-navy text-white border-upay-navy shadow-md ring-2 ring-upay-yellow/60"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                )}
              >
                <span>{scen.label}</span>
                <span className={cn("text-[10px] font-normal", isSelected ? "text-upay-yellow" : "text-slate-400")}>
                  {scen.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 12 ENTERPRISE AUTHORITY KPIS (SECTION 18) ──────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Customers</div>
          <div className="text-xl font-black text-upay-navy">150,000</div>
          <div className="text-[10px] text-slate-400">Total verified base</div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Campaigns</div>
          <div className="text-xl font-black text-upay-blue">6 Live</div>
          <div className="text-[10px] text-emerald-600 font-semibold">Running 24/7</div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Seasonal Events</div>
          <div className="text-xl font-black text-purple-600">4 Active</div>
          <div className="text-[10px] text-purple-500">October window</div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">AI Targeted Customers</div>
          <div className="text-xl font-black text-emerald-600">41,200</div>
          <div className="text-[10px] text-emerald-700 font-semibold">Persuadables only</div>
        </div>

        {/* KPI 5 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Incremental Txns</div>
          <div className="text-xl font-black text-upay-navy">+31,400</div>
          <div className="text-[10px] text-emerald-600 font-semibold">True causal lift</div>
        </div>

        {/* KPI 6 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Incremental Value</div>
          <div className="text-xl font-black text-emerald-600">৳28.35L</div>
          <div className="text-[10px] text-slate-400">Net incremental GMV</div>
        </div>

        {/* KPI 7 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Campaign Spend</div>
          <div className="text-xl font-black text-slate-800">৳10.0L</div>
          <div className="text-[10px] text-slate-400">Ceiling allocation</div>
        </div>

        {/* KPI 8 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cost / Inc. Txn</div>
          <div className="text-xl font-black text-amber-600">৳31.85</div>
          <div className="text-[10px] text-emerald-600 font-semibold">-42% vs blast push</div>
        </div>

        {/* KPI 9 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average Uplift</div>
          <div className="text-xl font-black text-upay-blue">+41.4%</div>
          <div className="text-[10px] text-slate-400">Over counterfactual</div>
        </div>

        {/* KPI 10 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">High Fatigue Suppressed</div>
          <div className="text-xl font-black text-red-600">18,420</div>
          <div className="text-[10px] text-red-500 font-semibold">Churn protected</div>
        </div>

        {/* KPI 11: KEY REQUIREMENT — ORGANIC TRANSACTIONS PROTECTED */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border-2 border-emerald-300 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider">
              Organic Protected
            </span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-800">82,450</div>
          <div className="text-[10px] text-emerald-700 leading-tight">
            Subsidies saved on organic transactors
          </div>
        </div>

        {/* KPI 12 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Experiments</div>
          <div className="text-xl font-black text-indigo-600">4 RCTs</div>
          <div className="text-[10px] text-indigo-500 font-semibold">80/20 Control splits</div>
        </div>
      </div>

      {/* ── MAIN STUDIO WORKSPACE NAVIGATION TABS ───────────────────────── */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-1">
          {[
            { id: "NEXT_BEST_ACTION", label: "🎯 Next-Best-Action & Uplift", icon: Target },
            { id: "EVENTS", label: "🎪 Event Library & Context", icon: Layers },
            { id: "BUDGET_SIMULATOR", label: "⚖️ Knapsack Budget Optimizer", icon: SlidersHorizontal },
            { id: "CALENDAR", label: "📅 AI Campaign Calendar & 'Why Now?'", icon: CalendarDays },
            { id: "EXPERIMENTS", label: "🔬 Experiment & Learning Reports", icon: FlaskConical },
            { id: "DECISION_TRACE", label: "🔍 7-Stage Decision Trace", icon: GitBranch },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap",
                  isActive
                    ? "border-upay-blue text-upay-blue font-extrabold bg-blue-50/50"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <Button
          onClick={() => setIsCreateEventModalOpen(true)}
          className="bg-upay-yellow text-upay-navy hover:bg-upay-yellow/90 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <Plus size={15} /> Create Custom Event
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: NEXT-BEST-ACTION & CAUSAL UPLIFT ENGINE (SECTIONS 3-10)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "NEXT_BEST_ACTION" && (
        <div className="space-y-6">
          {/* Organic Protection Highlight Alert */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={18} />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                <span>Organic Transaction Protection Engine Active</span>
                <Badge className="bg-emerald-200 text-emerald-800 text-[10px]">Zero Deadweight Loss</Badge>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                ImpactIQ actively calculates both <strong className="font-semibold">Response with Offer</strong> and <strong className="font-semibold">Counterfactual Response without Offer</strong>. Customers with high organic transaction probability are flagged, suppressed from receiving marketing subsidies, and routed to non-promotional alerts or zero action.
              </p>
            </div>
          </div>

          {/* Customer Evaluation Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-upay-navy">
                  Active Customer Decisions: {selectedScenario === "university_admission" ? "🎓 University Admission Cohort" : "🌙 Eid Salami Cohort"}
                </h3>
                <p className="text-xs text-slate-500">
                  Individual evaluations showing predicted behaviors, uplift, fatigue levels, and candidate action assignments.
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-semibold text-slate-600 bg-white">
                3 Detailed Archetypes Evaluated
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentScenarioCustomers.map((cust) => {
                const isTarget = cust.decisionPriority.includes("HIGH PRIORITY");
                const isSuppressed = cust.decisionPriority.includes("SUPPRESS");
                const isOrganic = cust.isOrganicProtected;

                return (
                  <Card
                    key={cust.customerId}
                    className={cn(
                      "rounded-2xl border transition-all hover:shadow-md cursor-pointer flex flex-col justify-between",
                      inspectedCustomer.customerId === cust.customerId
                        ? "border-upay-blue ring-2 ring-upay-blue/20 bg-blue-50/20"
                        : "border-slate-200 bg-white"
                    )}
                    onClick={() => {
                      setInspectedCustomer(cust);
                      setIsTraceModalOpen(true);
                    }}
                  >
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-upay-navy text-sm shadow-sm">
                            {cust.name.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-sm font-extrabold text-upay-navy">
                              {cust.name}
                            </CardTitle>
                            <CardDescription className="text-[11px] text-slate-500">
                              ID: {cust.customerId} • Lifecycle: {cust.lifecycleStage}
                            </CardDescription>
                          </div>
                        </div>

                        {/* Priority Badge */}
                        {isOrganic ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                            🛡️ ORGANIC PROTECTED
                          </Badge>
                        ) : isTarget ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-[10px] font-bold">
                            🎯 TARGET PERSUADABLE
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px] font-bold">
                            ❌ SUPPRESS (FATIGUED)
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                      {/* Prediction & Uplift Comparison */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 space-y-2">
                        <div className="text-[11px] font-bold text-slate-600 flex justify-between">
                          <span>Primary Predicted Behavior:</span>
                          <span className="text-upay-blue font-extrabold">{cust.primaryPredictedBehavior}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-200 text-center">
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase">P(With Offer)</div>
                            <div className="text-xs font-bold text-slate-800">
                              {(cust.pResponseWithOffer * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase">P(No Offer)</div>
                            <div className="text-xs font-bold text-slate-800">
                              {(cust.pResponseWithoutOffer * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase">Net Uplift</div>
                            <div className={cn(
                              "text-xs font-extrabold",
                              cust.uplift > 0.1 ? "text-emerald-600" : cust.uplift < 0 ? "text-red-500" : "text-amber-500"
                            )}>
                              {cust.uplift > 0 ? `+${(cust.uplift * 100).toFixed(0)}%` : `${(cust.uplift * 100).toFixed(0)}%`}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Organic Protection or Fatigue Warning Banner */}
                      {isOrganic && (
                        <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200 text-[11px] text-emerald-900 leading-snug font-medium">
                          <strong>⚠️ Decision:</strong> "Do not spend cashback on this customer." Customer transacts organically.
                        </div>
                      )}

                      {isSuppressed && (
                        <div className="bg-red-50 rounded-xl p-2.5 border border-red-200 text-[11px] text-red-900 leading-snug font-medium">
                          <strong>⚠️ Fatigue Alert:</strong> High category saturation ({cust.fatigueMetrics.sameCategoryOfferCount} offers recently). Negative uplift detected.
                        </div>
                      )}

                      {/* Recommended Action Pill */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400">Assigned Action:</div>
                          <div className="font-extrabold text-upay-navy text-xs truncate max-w-[180px]">
                            {cust.recommendedAction.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Channel / Time:</div>
                          <div className="font-semibold text-slate-700 text-xs">
                            {cust.recommendedChannel} • {cust.recommendedTiming}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs font-bold rounded-xl border-slate-200 hover:bg-upay-blue hover:text-white transition-all flex items-center justify-center gap-1.5 mt-2"
                      >
                        Inspect 7-Stage Decision Trace <ArrowRight size={14} />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Deep-Dive Card for Currently Inspected Customer */}
          <Card className="rounded-2xl border border-upay-blue/30 shadow-md bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-upay-navy to-[#0F3563] p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-upay-yellow text-upay-navy flex items-center justify-center font-black text-xl shadow-md">
                  {inspectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black">{inspectedCustomer.name}</h4>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                      {inspectedCustomer.customerId}
                    </span>
                  </div>
                  <p className="text-xs text-white/70">
                    Lifecycle: <span className="text-upay-yellow font-bold">{inspectedCustomer.lifecycleStage}</span> • Seasonal Relevance: <span className="font-semibold">{(inspectedCustomer.seasonalRelevanceScore * 100).toFixed(0)}%</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-[10px] text-white/60 uppercase">Expected Incremental Value</div>
                  <div className="text-lg font-black text-emerald-300">
                    ৳{inspectedCustomer.expectedIncrementalValueBDT.toLocaleString()}
                  </div>
                </div>
                <Button
                  onClick={() => setIsTraceModalOpen(true)}
                  className="bg-upay-yellow text-upay-navy hover:bg-upay-yellow/90 font-bold text-xs rounded-xl shadow-md ml-3"
                >
                  View Mathematical Trace
                </Button>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Causal Rationale Bullet points */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  AI Decision Rationale & Causal Justification:
                </h5>
                <ul className="space-y-1.5">
                  {inspectedCustomer.decisionReasoning.map((reason, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Behavioral Intent Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Predicted Seasonal Behaviors:
                  </h5>
                  <div className="space-y-2">
                    {inspectedCustomer.predictedBehaviors.map((b, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{b.behavior}</span>
                          <span className="text-upay-blue">{(b.probability * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              i === 0 ? "bg-upay-blue" : "bg-slate-300"
                            )}
                            style={{ width: `${b.probability * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fatigue Breakdown */}
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Category Fatigue & Contact Frequency:
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400">Recharge Fatigue</div>
                      <div className="text-sm font-extrabold text-slate-800">
                        {(inspectedCustomer.fatigueMetrics.categoryFatigue.recharge * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400">Merchant QR Fatigue</div>
                      <div className="text-sm font-extrabold text-slate-800">
                        {(inspectedCustomer.fatigueMetrics.categoryFatigue.merchant * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400">Send Money Fatigue</div>
                      <div className="text-sm font-extrabold text-slate-800">
                        {(inspectedCustomer.fatigueMetrics.categoryFatigue.sendMoney * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400">Recent 7d Touches</div>
                      <div className="text-sm font-extrabold text-slate-800">
                        {inspectedCustomer.fatigueMetrics.offersReceived7d} contacts
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: EVENT LIBRARY & CONTEXTUAL ENGINE (SECTIONS 1 & 2)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "EVENTS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-upay-navy">Seasonal Event Library</h3>
              <p className="text-xs text-slate-500">
                Pre-calibrated and custom seasonal contexts. Not hard-coded rules; each event drives contextual behavior predictions.
              </p>
            </div>
            <Button
              onClick={() => setIsCreateEventModalOpen(true)}
              className="bg-upay-blue text-white hover:bg-upay-blue/90 font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus size={15} /> Create Custom Event
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventList.map((evt) => (
              <Card key={evt.id} className="rounded-2xl border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{evt.icon}</span>
                      <div>
                        <CardTitle className="text-sm font-extrabold text-upay-navy leading-snug">
                          {evt.name}
                        </CardTitle>
                        <CardDescription className="text-[11px] text-slate-400">
                          {evt.startDate} to {evt.endDate}
                        </CardDescription>
                      </div>
                    </div>
                    {evt.isCustom && (
                      <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px]">
                        Custom
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {evt.description}
                  </p>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Product:</span>
                      <span className="font-semibold text-slate-700">{evt.targetProduct}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Available Budget:</span>
                      <span className="font-extrabold text-emerald-600">৳{(evt.availableBudgetBDT / 100000).toFixed(1)} Lakh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Capacity:</span>
                      <span className="font-semibold text-slate-700">{evt.maxCampaignCapacity.toLocaleString()} users</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Predicted Context Behaviors:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {evt.possibleBehaviors.slice(0, 3).map((bh, i) => (
                        <span key={i} className="text-[10px] bg-blue-50 text-upay-blue border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                          {bh.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {evt.candidateOffers.length} Candidate Actions
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedScenario(evt.id === "eid_ul_fitr" ? "eid_ul_fitr" : "university_admission");
                        setActiveTab("NEXT_BEST_ACTION");
                      }}
                      className="text-xs text-upay-blue font-bold hover:bg-blue-50 p-0 h-auto"
                    >
                      Inspect Cohort ›
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: KNAPSACK BUDGET OPTIMIZER & WHAT-IF SIMULATOR (SECTIONS 11 & 12)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "BUDGET_SIMULATOR" && (
        <div className="space-y-6">
          <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <h3 className="text-base font-extrabold text-upay-navy">
                  Multi-Constraint Knapsack Budget Simulator
                </h3>
                <p className="text-xs text-slate-500">
                  Simulate marketing budget changes, capacity constraints, and diminishing marginal returns in real time.
                </p>
              </div>

              {/* Summary Pill */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Total Budget Ceiling</div>
                  <div className="text-xl font-black text-upay-blue">
                    ৳{(budgetSliderBDT / 100000).toFixed(1)} Lakh
                  </div>
                </div>
                <div className="text-right pl-3 border-l border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Optimized Gross GMV</div>
                  <div className="text-xl font-black text-emerald-600">
                    ৳{(budgetResult.expectedIncrementalValueBDT / 100000).toFixed(1)} Lakh
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Slider & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Adjust Total Marketing Budget:
                    </label>
                    <span className="text-sm font-black text-upay-navy bg-slate-100 px-3 py-1 rounded-lg">
                      ৳{(budgetSliderBDT / 100000).toFixed(1)} Lakh (৳{budgetSliderBDT.toLocaleString()})
                    </span>
                  </div>
                  <input
                    type="range"
                    min={500000}
                    max={2000000}
                    step={100000}
                    value={budgetSliderBDT}
                    onChange={(e) => setBudgetSliderBDT(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-upay-blue"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                    <span>৳5.0L (Conservative)</span>
                    <span>৳10.0L (Baseline)</span>
                    <span>৳15.0L (Growth)</span>
                    <span>৳20.0L (Aggressive)</span>
                  </div>
                </div>

                {/* What-If Constraint: Cap Eid Campaign */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Enforce Custom Constraint: Cap Eid Campaign
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Simulate marketing policy capping Eid spend at ৳3.0 Lakh
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={capEidCampaign}
                      onChange={(e) => setCapEidCampaign(e.target.checked)}
                      className="w-4 h-4 accent-upay-blue rounded cursor-pointer"
                    />
                  </div>

                  {capEidCampaign && (
                    <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      ⚡ <strong>Re-allocation:</strong> Excess funds automatically redistributed toward University Admission and Merchant QR campaigns according to marginal ROI elasticity.
                    </div>
                  )}
                </div>

                {/* Diminishing Returns Warning */}
                {budgetResult.diminishingReturnWarning && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-extrabold">Diminishing Return Warning:</strong>
                      <p className="mt-0.5 leading-relaxed">{budgetResult.diminishingReturnWarning}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Knapsack Output Visualization */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Recommended Campaign Allocations (Non-Linear Knapsack):
                </h4>

                <div className="space-y-3">
                  {budgetResult.allocations.map((alloc) => (
                    <div key={alloc.campaignId} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-upay-navy flex items-center gap-1.5">
                          <span>{alloc.icon}</span> {alloc.campaignName}
                          {alloc.isCapped && (
                            <Badge className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0">Capped</Badge>
                          )}
                        </span>
                        <span className="font-black text-upay-blue">
                          ৳{(alloc.budgetAllocatedBDT / 100000).toFixed(2)} Lakh
                        </span>
                      </div>

                      {/* Allocation Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-upay-blue rounded-full transition-all duration-300"
                          style={{
                            width: `${(alloc.budgetAllocatedBDT / budgetResult.totalBudgetBDT) * 100}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Target: {alloc.targetCount.toLocaleString()} users</span>
                        <span>Inc. Txns: +{alloc.expectedIncrementalTxns.toLocaleString()}</span>
                        <span className="font-semibold text-emerald-600">ROI: {alloc.marginalROI}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: AI CAMPAIGN CALENDAR & "WHY NOW?" (SECTIONS 13 & 14)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "CALENDAR" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-upay-navy">Visual AI Campaign Calendar (Q4 2026)</h3>
            <p className="text-xs text-slate-500">
              Continuous adaptive schedule showing AI confidence, expected incremental return, and dynamically computed "Why Now?" intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SEASONAL_CALENDAR_ITEMS.map((item) => (
              <Card key={item.id} className="rounded-2xl border border-slate-200 hover:shadow-md transition-all overflow-hidden bg-white">
                <CardHeader className="p-5 pb-3 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <CardTitle className="text-sm font-extrabold text-upay-navy">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                          {item.dateRange}
                        </CardDescription>
                      </div>
                    </div>

                    <Badge
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        item.status === "ACTIVE" ? "bg-emerald-500 text-white" :
                        item.status === "AI OPTIMIZED" ? "bg-upay-blue text-white" :
                        item.status === "SCHEDULED" ? "bg-slate-700 text-white" : "bg-purple-600 text-white"
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Metric Bar */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-150 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Target Audience</div>
                      <div className="font-extrabold text-slate-800 truncate">{item.targetAudience}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Budget</div>
                      <div className="font-extrabold text-upay-blue">৳{(item.budgetBDT / 100000).toFixed(1)}L</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Expected EIV</div>
                      <div className="font-extrabold text-emerald-600">৳{(item.expectedIncrementalValueBDT / 100000).toFixed(1)}L</div>
                    </div>
                  </div>

                  {/* "WHY NOW?" Section (Section 14) */}
                  <div>
                    <div className="text-[11px] font-extrabold text-upay-navy uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Info size={14} className="text-upay-blue" /> "WHY NOW?" INTELLIGENCE
                    </div>
                    <div className="space-y-1.5">
                      {item.whyNowChecks.map((check, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          {check.passed ? (
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                          )}
                          <div className="text-slate-700 leading-snug">
                            <span className="font-semibold">{check.label}:</span>{" "}
                            <span className="text-slate-500">{check.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: EXPERIMENT INTELLIGENCE & LEARNING REPORTS (SECTIONS 15 & 16)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "EXPERIMENTS" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-upay-navy">
              Experiment Intelligence & Continuous Learning Reports
            </h3>
            <p className="text-xs text-slate-500">
              Randomized Controlled Trials (RCTs) verifying causal incrementality and feeding empirical post-campaign learnings back into model priors.
            </p>
          </div>

          <div className="space-y-6">
            {CAMPAIGN_LEARNING_REPORTS.map((rep) => (
              <Card key={rep.id} className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                <div className="bg-slate-50 p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-800 text-[10px] font-bold">
                        A/B EXPERIMENT RETROSPECTIVE
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono">{rep.dateConducted}</span>
                    </div>
                    <h4 className="text-base font-black text-upay-navy mt-1">
                      {rep.campaignName} ({rep.eventName})
                    </h4>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Statistical Confidence</div>
                      <div className="font-extrabold text-emerald-600">{(rep.statisticalConfidence * 100).toFixed(0)}% (p &lt; 0.01)</div>
                    </div>
                    <div className="pl-4 border-l border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase">Actual Incremental ROI</div>
                      <div className="font-black text-upay-blue text-sm">{rep.netIncrementalROI}x</div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Split & Lift Comparison Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Treatment Cohort</div>
                      <div className="text-sm font-black text-slate-800">{rep.treatmentAudience.toLocaleString()} users</div>
                      <div className="text-[10px] text-slate-400">Received Offer</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Control Cohort</div>
                      <div className="text-sm font-black text-slate-800">{rep.controlAudience.toLocaleString()} users</div>
                      <div className="text-[10px] text-slate-400">Holdout (No Offer)</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Predicted vs Actual Uplift</div>
                      <div className="text-sm font-black text-emerald-600">
                        +{(rep.predictedUplift * 100).toFixed(0)}% → +{(rep.actualUplift * 100).toFixed(0)}%
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold">Gap: {rep.predictionGapPoints} p.p.</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Incremental Txns Generated</div>
                      <div className="text-sm font-black text-upay-navy">+{rep.incrementalTransactions.toLocaleString()}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">Value: ৳{(rep.incrementalValueBDT / 100000).toFixed(1)}L</div>
                    </div>
                  </div>

                  {/* Empirical Learning Callout (Section 16) */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 space-y-2">
                    <div className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen size={16} className="text-amber-700" /> Key Model Learning & Empirical Insight
                    </div>
                    <p className="text-xs text-amber-950 leading-relaxed font-medium">
                      "{rep.aiKeyLearning}"
                    </p>
                  </div>

                  {/* Feedback to models */}
                  <div>
                    <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                      Continuous Learning Feedback Applied:
                    </h5>
                    <div className="space-y-1">
                      {rep.feedbackToModels.map((fb, idx) => (
                        <div key={idx} className="text-xs text-slate-700 flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          <span>{fb}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 6: 7-STAGE DECISION TRACE PIPELINE (SECTION 19)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "DECISION_TRACE" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-upay-navy">
                7-Stage Transparent Decision Trace
              </h3>
              <p className="text-xs text-slate-500">
                Full mathematical explainability from raw transactional logs to final intervention. Inspecting customer: <strong className="text-upay-blue">{inspectedCustomer.name} ({inspectedCustomer.customerId})</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentScenarioCustomers.map((c) => (
                <Button
                  key={c.customerId}
                  size="sm"
                  variant={inspectedCustomer.customerId === c.customerId ? "default" : "outline"}
                  onClick={() => setInspectedCustomer(c)}
                  className="text-xs font-bold rounded-xl"
                >
                  {c.name.split(" ")[0]}
                </Button>
              ))}
            </div>
          </div>

          {/* Vertical Pipeline Cards */}
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-200 before:z-0">
            {/* Stage 1: Raw Data */}
            <div className="relative z-10 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm ml-12">
              <div className="absolute -left-12 top-5 w-8 h-8 rounded-full bg-upay-navy text-white flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div className="text-xs font-extrabold text-upay-navy uppercase tracking-wider mb-1">
                Raw Transactional Telemetry
              </div>
              <p className="text-xs text-slate-500 mb-3">Ingested from core Upay ledger and app session logs.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-50 rounded-lg">txCount30d: {inspectedCustomer.traceStages.rawData.txCount30d}</div>
                <div className="p-2.5 bg-slate-50 rounded-lg">avgSpendBDT: ৳{inspectedCustomer.traceStages.rawData.avgSpendBDT}</div>
                <div className="p-2.5 bg-slate-50 rounded-lg">lastService: {inspectedCustomer.traceStages.rawData.lastServiceUsed}</div>
                <div className="p-2.5 bg-slate-50 rounded-lg">daysSinceLastTx: {inspectedCustomer.traceStages.rawData.daysSinceLastTx}d</div>
              </div>
            </div>

            {/* Stage 2: Feature Vector */}
            <div className="relative z-10 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm ml-12">
              <div className="absolute -left-12 top-5 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-1">
                Engineered Feature Vector
              </div>
              <p className="text-xs text-slate-500 mb-3">RFM clustering, fatigue decay factor, and service affinity scores.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-blue-50/50 rounded-lg text-blue-900">{inspectedCustomer.traceStages.featureVector.rfmScore}</div>
                <div className="p-2.5 bg-blue-50/50 rounded-lg text-blue-900">{inspectedCustomer.traceStages.featureVector.categorySaturation}</div>
                <div className="p-2.5 bg-blue-50/50 rounded-lg text-blue-900">{inspectedCustomer.traceStages.featureVector.contactFrequency}</div>
                <div className="p-2.5 bg-blue-50/50 rounded-lg text-blue-900">{inspectedCustomer.traceStages.featureVector.priceSensitivity}</div>
              </div>
            </div>

            {/* Stage 3: ML Model Inference */}
            <div className="relative z-10 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm ml-12">
              <div className="absolute -left-12 top-5 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div className="text-xs font-extrabold text-purple-600 uppercase tracking-wider mb-1">
                Causal ML Model Inference (T-Learner)
              </div>
              <p className="text-xs text-slate-500 mb-3">Dual-model architecture estimating treatment and control outcomes.</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-purple-50/50 rounded-lg text-purple-900">Model: {inspectedCustomer.traceStages.modelInference.modelName}</div>
                <div className="p-2.5 bg-purple-50/50 rounded-lg text-purple-900">Accuracy: {inspectedCustomer.traceStages.modelInference.intentModelAccuracy}</div>
              </div>
            </div>

            {/* Stage 4: Counterfactual / Uplift Analysis */}
            <div className="relative z-10 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm ml-12">
              <div className="absolute -left-12 top-5 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                4
              </div>
              <div className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider mb-1">
                Counterfactual Uplift & Organic Separation
              </div>
              <p className="text-xs text-slate-500 mb-3">Isolating true net lift: P(Treatment) - P(Control).</p>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-900 font-semibold">{inspectedCustomer.traceStages.counterfactualAnalysis.treatmentResponseRate}</div>
                <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-900 font-semibold">{inspectedCustomer.traceStages.counterfactualAnalysis.controlBaselineRate}</div>
                <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-950 font-bold">{inspectedCustomer.traceStages.counterfactualAnalysis.netCausalLift}</div>
              </div>
            </div>

            {/* Stage 5: Fatigue Assessment */}
            <div className="relative z-10 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm ml-12">
              <div className="absolute -left-12 top-5 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                5
              </div>
              <div className="text-xs font-extrabold text-amber-600 uppercase tracking-wider mb-1">
                Fatigue & Churn Risk Penalty
              </div>
              <p className="text-xs text-slate-500 mb-3">Exponential decay function evaluating contact saturation.</p>
              <div className="p-2.5 bg-amber-50 rounded-lg text-xs font-mono text-amber-900">
                Penalty: {inspectedCustomer.traceStages.fatigueAssessment.penaltyFactor} • Recommendation: {inspectedCustomer.traceStages.fatigueAssessment.fatigueRecommendation}
              </div>
            </div>

            {/* Stage 6: Value Optimization */}
            <div className="relative z-10 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm ml-12">
              <div className="absolute -left-12 top-5 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                6
              </div>
              <div className="text-xs font-extrabold text-teal-600 uppercase tracking-wider mb-1">
                Expected Incremental Value (EIV)
              </div>
              <p className="text-xs text-slate-500 mb-3">EIV = Tau * ExpSpend - UnitCost * P(Resp) - FatiguePenalty.</p>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-teal-50 rounded-lg">Gross: ৳{inspectedCustomer.traceStages.valueOptimization.expectedGrossIncrementalBDT}</div>
                <div className="p-2.5 bg-teal-50 rounded-lg">Cost: ৳{inspectedCustomer.traceStages.valueOptimization.incentiveCostBDT}</div>
                <div className="p-2.5 bg-teal-100 rounded-lg font-bold text-teal-900">Net EIV: ৳{inspectedCustomer.traceStages.valueOptimization.netEIVBDT}</div>
              </div>
            </div>

            {/* Stage 7: Final Action */}
            <div className="relative z-10 bg-gradient-to-r from-upay-navy to-upay-blue text-white rounded-2xl p-5 shadow-md ml-12">
              <div className="absolute -left-12 top-5 w-8 h-8 rounded-full bg-upay-yellow text-upay-navy flex items-center justify-center font-black text-xs">
                7
              </div>
              <div className="text-xs font-black text-upay-yellow uppercase tracking-wider mb-1">
                Final Autonomous Action Output
              </div>
              <p className="text-sm font-extrabold text-white mt-1">
                {inspectedCustomer.traceStages.finalAction.explanation}
              </p>
              <div className="text-xs text-white/70 mt-1">
                Action Code: <span className="font-mono text-upay-yellow">{inspectedCustomer.traceStages.finalAction.actionCode}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          HACKATHON KILLER FEATURE: ASK IMPACTIQ — AI CAMPAIGN COPILOT (SEC 17)
      ══════════════════════════════════════════════════════════════════════ */}
      <Card className="rounded-3xl border border-slate-200 shadow-xl overflow-hidden bg-white">
        <div className="bg-gradient-to-r from-upay-navy via-[#0A264A] to-upay-blue p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-upay-yellow/20 border border-upay-yellow/30 flex items-center justify-center text-upay-yellow shadow-inner">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="text-base font-black">Ask ImpactIQ — Campaign Intelligence Co-Pilot</h3>
              <p className="text-xs text-white/70">
                Natural language to end-to-end causal campaign orchestration with RAG context.
              </p>
            </div>
          </div>

          <Badge className="bg-upay-yellow text-upay-navy text-xs font-black px-2.5 py-1">
            LLaMA-3 Inference
          </Badge>
        </div>

        <CardContent className="p-6 space-y-4">
          {/* Quick Query Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Try asking:
            </span>
            {[
              "Create an Eid campaign for 10 lakh taka.",
              "Which customers should NOT receive cashback?",
              "Create a university admission campaign.",
              "Explain why C1042 was excluded from cashback.",
            ].map((promptText, i) => (
              <button
                key={i}
                onClick={() => handleSendCopilotQuery(promptText)}
                className="text-xs bg-slate-100 hover:bg-upay-blue hover:text-white text-slate-700 font-semibold px-3 py-1.5 rounded-full transition-all border border-slate-200"
              >
                "{promptText}"
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="max-h-[380px] overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-200">
            {copilotMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col space-y-2",
                  msg.sender === "user" ? "items-end" : "items-start"
                )}
              >
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                  <span>{msg.sender === "user" ? "Growth Officer" : "ImpactIQ Co-Pilot"}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={cn(
                    "p-4 rounded-2xl text-xs sm:text-sm max-w-2xl leading-relaxed shadow-xs",
                    msg.sender === "user"
                      ? "bg-upay-blue text-white rounded-tr-xs"
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                  )}
                >
                  <p>{msg.text}</p>

                  {/* Structured Campaign Plan Card */}
                  {msg.structuredPlan && (
                    <div className="mt-3 pt-3 border-t border-slate-150 space-y-2.5 text-xs text-slate-700">
                      <div className="font-black text-upay-navy text-sm">
                        {msg.structuredPlan.campaignName}
                      </div>
                      <div className="text-slate-600 italic">
                        <strong>Objective:</strong> {msg.structuredPlan.objective}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Predicted Uplift</span>
                          <span className="font-extrabold text-emerald-600">{msg.structuredPlan.expectedUplift}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Incremental Value</span>
                          <span className="font-extrabold text-upay-blue">{msg.structuredPlan.expectedIncrementalValue}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Optimal Budget</span>
                          <span className="font-bold text-slate-800">{msg.structuredPlan.budgetAllocationBDT}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Optimal Delivery Time</span>
                          <span className="font-bold text-slate-800">{msg.structuredPlan.timing}</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div><strong>Target Segments:</strong> {msg.structuredPlan.recommendedSegments.join(", ")}</div>
                        <div><strong>Candidate Actions:</strong> {msg.structuredPlan.candidateOffers.join(" • ")}</div>
                        <div className="text-emerald-700 font-medium"><strong>Organic Protection:</strong> {msg.structuredPlan.organicProtectionSummary}</div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveTab("NEXT_BEST_ACTION");
                          setSelectedScenario("eid_ul_fitr");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs mt-2"
                      >
                        ⚡ Apply Strategy to Live Decision Engine
                      </Button>
                    </div>
                  )}

                  {/* Excluded Customers Summary Card */}
                  {msg.excludedCustomersSummary && (
                    <div className="mt-3 pt-3 border-t border-slate-150 space-y-3 text-xs text-slate-700">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Total Excluded</div>
                          <div className="text-sm font-black text-slate-800">{msg.excludedCustomersSummary.totalExcluded.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Organic Protected</div>
                          <div className="text-sm font-black text-emerald-600">{msg.excludedCustomersSummary.organicProtected.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Fatigue Suppressed</div>
                          <div className="text-sm font-black text-red-500">{msg.excludedCustomersSummary.highFatigue.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Budget Subsidy Saved</div>
                          <div className="text-sm font-black text-upay-blue">৳{(msg.excludedCustomersSummary.estimatedSavingsBDT / 100000).toFixed(1)}L</div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-600">Sample Excluded Customers:</div>
                        {msg.excludedCustomersSummary.sampleExcluded.map((ex) => (
                          <div key={ex.id} className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-start justify-between gap-3 text-xs">
                            <div>
                              <strong className="text-upay-navy">{ex.name} ({ex.id}):</strong>{" "}
                              <span className="text-slate-600">{ex.reason}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                              Organic: {ex.organicProb}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isCopilotThinking && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                <RefreshCw size={14} className="animate-spin text-upay-blue" />
                <span>ImpactIQ analyzing behavioral intents and fatigue penalties...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={copilotQuery}
              onChange={(e) => setCopilotQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendCopilotQuery()}
              placeholder="Ask anything (e.g. 'Create an Eid campaign for 10 lakh taka' or 'Which users to exclude?')"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-upay-blue"
            />
            <Button
              onClick={() => handleSendCopilotQuery()}
              className="bg-upay-blue hover:bg-upay-blue/90 text-white font-bold px-5 py-3 rounded-xl shadow-md flex items-center gap-2 text-xs"
            >
              <Send size={15} /> Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── MODAL: CREATE CUSTOM EVENT (SECTION 1) ─────────────────────── */}
      <Dialog open={isCreateEventModalOpen} onOpenChange={setIsCreateEventModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-upay-navy flex items-center gap-2">
              <Plus size={18} className="text-upay-blue" /> Create Custom Seasonal Event
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Define a new business seasonal context. The engine will dynamically predict behaviors and candidate actions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-extrabold text-slate-700 block mb-1">Event Name</label>
              <input
                type="text"
                placeholder="e.g., FIFA World Cup Fever or Black Friday Weekend"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="font-extrabold text-slate-700 block mb-1">Business Objective</label>
              <input
                type="text"
                placeholder="e.g., Drive evening merchant QR dining transactions"
                value={newEventObjective}
                onChange={(e) => setNewEventObjective(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={newEventStartDate}
                  onChange={(e) => setNewEventStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">End Date</label>
                <input
                  type="date"
                  value={newEventEndDate}
                  onChange={(e) => setNewEventEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Target Product</label>
                <select
                  value={newEventProduct}
                  onChange={(e) => setNewEventProduct(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="Merchant QR">Merchant QR</option>
                  <option value="Send Money">Send Money (P2P)</option>
                  <option value="Bill Payment">Bill Payment</option>
                  <option value="Recharge">Mobile Recharge</option>
                </select>
              </div>
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Available Budget (BDT)</label>
                <input
                  type="number"
                  value={newEventBudget}
                  onChange={(e) => setNewEventBudget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateEventModalOpen(false)}
              className="text-xs font-bold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomEvent}
              className="bg-upay-blue text-white hover:bg-upay-blue/90 text-xs font-bold rounded-xl"
            >
              Save & Launch Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: 7-STAGE DECISION TRACE POPUP ───────────────────────── */}
      <Dialog open={isTraceModalOpen} onOpenChange={setIsTraceModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-6 bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-upay-navy flex items-center gap-2">
              <GitBranch size={18} className="text-upay-blue" />
              Decision Trace: {inspectedCustomer.name} ({inspectedCustomer.customerId})
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Audit trail showing features, uplift formulation, and counterfactual reasoning.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Quadrant & Organic Protection Status */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Uplift Quadrant</div>
                <div className="text-sm font-black text-upay-navy">{inspectedCustomer.upliftSegment}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Organic Status</div>
                <div className={cn("text-sm font-black", inspectedCustomer.isOrganicProtected ? "text-emerald-700" : "text-slate-700")}>
                  {inspectedCustomer.isOrganicProtected ? "🛡️ PROTECTED" : "UNPROTECTED"}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Net Uplift</div>
                <div className="text-sm font-black text-emerald-600">
                  {inspectedCustomer.uplift > 0 ? `+${(inspectedCustomer.uplift * 100).toFixed(1)}%` : `${(inspectedCustomer.uplift * 100).toFixed(1)}%`}
                </div>
              </div>
            </div>

            {/* Stages */}
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <div className="font-extrabold text-upay-navy mb-1">1. Model Inference</div>
                <div className="text-slate-600">{inspectedCustomer.traceStages.modelInference.modelName} — Accuracy: {inspectedCustomer.traceStages.modelInference.intentModelAccuracy}</div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <div className="font-extrabold text-emerald-700 mb-1">2. Counterfactual Causal Lift</div>
                <div className="text-slate-600">
                  Treatment Rate: <strong>{inspectedCustomer.traceStages.counterfactualAnalysis.treatmentResponseRate}</strong> vs Baseline Control: <strong>{inspectedCustomer.traceStages.counterfactualAnalysis.controlBaselineRate}</strong>
                </div>
                <div className="text-slate-800 font-bold mt-1">{inspectedCustomer.traceStages.counterfactualAnalysis.netCausalLift}</div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <div className="font-extrabold text-amber-700 mb-1">3. Anti-Fatigue Assessment</div>
                <div className="text-slate-600">
                  Decay penalty: {inspectedCustomer.traceStages.fatigueAssessment.penaltyFactor} — {inspectedCustomer.traceStages.fatigueAssessment.fatigueRecommendation}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <div className="font-extrabold text-upay-blue mb-1">4. Optimization Decision</div>
                <div className="text-slate-800 font-semibold">{inspectedCustomer.traceStages.finalAction.explanation}</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsTraceModalOpen(false)}
              className="bg-upay-blue text-white text-xs font-bold rounded-xl"
            >
              Close Trace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CreateCampaignWorkspace isOpen={isCreateCampaignOpen} onClose={() => setIsCreateCampaignOpen(false)} />
    </div>
  );
}
