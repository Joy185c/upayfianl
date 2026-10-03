"use client";

import { useState } from "react";
import { 
  Zap, Target, AlertTriangle, CheckCircle2, Calendar, Clock, 
  Settings, CreditCard, Users, ShieldAlert, FlaskConical, ChevronRight, PieChart, Sparkles, BrainCircuit, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ActionType, AudienceEvaluation } from "@/lib/audience/types";
import { Campaign, OfferType } from "@/lib/intelligence/types";
import { useIntelligenceStore } from "@/lib/intelligence/store";
import { analyzeCampaignPreflight, CampaignPreflightConfig, CampaignPreflightResult } from "@/lib/intelligence/preflight";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface CampaignBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: AudienceEvaluation | null;
  sourceAction: ActionType;
}

export function CampaignBuilderModal({ isOpen, onClose, evaluation, sourceAction }: CampaignBuilderModalProps) {
  const { customers, runIntelligencePipeline } = useIntelligenceStore();

  // 1. CAMPAIGN BASICS
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("acquisition");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");

  // 2. SCHEDULE
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  // 3. TARGET SERVICE
  const [service, setService] = useState("recharge");
  const [operator, setOperator] = useState("");

  // 4. OFFER CONFIGURATION
  const [rewardType, setRewardType] = useState("cashback");
  const [rewardValue, setRewardValue] = useState(20);
  const [maxReward, setMaxReward] = useState(50);
  const [minTransaction, setMinTransaction] = useState(100);

  // 5. AUDIENCE
  const [audienceType, setAudienceType] = useState<"AI" | "CUSTOM">("AI");

  // 6. BUDGET & LIMITS
  const [totalBudget, setTotalBudget] = useState(100000);
  const [maxRewardPerCust, setMaxRewardPerCust] = useState(50);
  const [maxRedemptions, setMaxRedemptions] = useState(2000);
  const [usesPerCustDay, setUsesPerCustDay] = useState(1);

  // 7. FATIGUE PROTECTION
  const [excludeHighFatigue, setExcludeHighFatigue] = useState(true);
  const [cooldownDays, setCooldownDays] = useState(7);

  // 8. EXPERIMENT
  const [enableExperiment, setEnableExperiment] = useState(false);
  const [treatmentPct, setTreatmentPct] = useState(80);

  // STATE
  const [isSaving, setIsSaving] = useState(false);
  const [preflightResult, setPreflightResult] = useState<CampaignPreflightResult | null>(null);
  const [configData, setConfigData] = useState<CampaignPreflightConfig | null>(null);

  // SIMULATION STATE
  const [simulatedResult, setSimulatedResult] = useState<CampaignPreflightResult | null>(null);
  const [simulatedConfig, setSimulatedConfig] = useState<CampaignPreflightConfig | null>(null);
  const [activeSimulationReason, setActiveSimulationReason] = useState<string | null>(null);

  if (!evaluation) return null;

  const handleAnalyze = async () => {
    // Validate Dates
    if (startDate && endDate) {
      const start = new Date(`${startDate}T${startTime || '00:00'}`);
      const end = new Date(`${endDate}T${endTime || '00:00'}`);
      if (end <= start) {
        alert("End date/time must be after start date/time.");
        return;
      }
    }

    setIsSaving(true);
    
    // Slight delay for effect
    await new Promise(r => setTimeout(r, 1000));
    
    const config: CampaignPreflightConfig = {
      name, objective, description, status,
      startDate, startTime, endDate, endTime,
      service, operator,
      rewardType, rewardValue, maxReward, minTransaction,
      audienceType,
      totalBudget, maxRedemptions, usesPerCustDay,
      excludeHighFatigue, cooldownDays,
      enableExperiment, treatmentPct
    };

    const targetAudience = customers.filter(c => evaluation.customerIds.includes(c.id));
    const result = analyzeCampaignPreflight(config, targetAudience);
    
    setConfigData(config);
    setPreflightResult(result);
    setIsSaving(false);
  };

  const handleSimulate = (recommendation: any) => {
    if (!configData || !recommendation.targetField) return;
    
    // Create temporary scenario config
    const scenarioConfig = { ...configData };
    
    // Apply deterministic recommendation values
    if (recommendation.category === "FATIGUE") {
      scenarioConfig.excludeHighFatigue = true;
    } else if (recommendation.category === "FREQUENCY") {
      scenarioConfig.cooldownDays = 7;
    } else if (recommendation.category === "AUDIENCE") {
      scenarioConfig.audienceType = "AI";
    } else {
      alert("This recommendation requires manual review. Click 'Edit & Re-analyze' to change it manually.");
      return;
    }

    const targetAudience = customers.filter(c => evaluation.customerIds.includes(c.id));
    const result = analyzeCampaignPreflight(scenarioConfig, targetAudience);
    
    setSimulatedConfig(scenarioConfig);
    setSimulatedResult(result);
    setActiveSimulationReason(recommendation.title);
  };

  const applySimulation = () => {
    if (!simulatedConfig || !simulatedResult) return;
    // Replace current config with simulated
    setConfigData(simulatedConfig);
    setPreflightResult(simulatedResult);
    
    // Update raw form state to match new config
    setExcludeHighFatigue(simulatedConfig.excludeHighFatigue);
    setCooldownDays(simulatedConfig.cooldownDays);
    setAudienceType(simulatedConfig.audienceType);
    
    // Clear simulation
    setSimulatedResult(null);
    setSimulatedConfig(null);
    setActiveSimulationReason(null);
  };

  const discardSimulation = () => {
    setSimulatedResult(null);
    setSimulatedConfig(null);
    setActiveSimulationReason(null);
  };

  const InputLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{children}</label>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-5xl p-0 bg-slate-50 rounded-3xl border-none shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-upay-navy text-white p-6 shrink-0 relative z-10 shadow-md flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
              <Zap className="text-upay-yellow" /> Campaign Strategy Builder
            </h2>
            <p className="text-slate-300 text-sm">Configure MFS campaign parameters for the {sourceAction} audience segment.</p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 text-right">
            <p className="text-[10px] font-bold text-upay-yellow uppercase tracking-widest">Base Audience</p>
            <p className="text-xl font-black">{evaluation.count.toLocaleString()} <span className="text-sm font-normal opacity-80">Users</span></p>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          
          {simulatedResult ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-black text-upay-navy mb-1 flex items-center gap-2">
                    <FlaskConical className="text-upay-blue" /> ImpactIQ What-if Simulator
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Comparing current configuration with simulated improvements.
                  </p>
                </div>
                <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                  SIMULATION ONLY
                </div>
              </div>

              {/* Top Row: Current vs Simulated */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                
                {/* Arrow in middle */}
                <div className="hidden md:flex absolute inset-y-0 left-1/2 -translate-x-1/2 items-center justify-center z-10 pointer-events-none">
                  <div className="bg-slate-100 p-2 rounded-full border border-slate-200 shadow-sm text-slate-400">
                    <ChevronRight size={20} />
                  </div>
                </div>

                {/* CURRENT */}
                <Card className="border-slate-200 bg-slate-50 relative overflow-hidden opacity-90">
                  <div className="absolute top-0 inset-x-0 h-1 bg-slate-300"></div>
                  <CardContent className="p-5">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Current Campaign</div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">AI Score</div>
                        <div className="text-3xl font-black text-slate-700">{preflightResult!.campaignScore}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Audience</div>
                        <div className="text-xl font-bold text-slate-700">{preflightResult!.audienceSize.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Uplift</div>
                        <div className="text-xl font-bold text-slate-700">+{preflightResult!.estimatedUplift.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">EIV</div>
                        <div className="text-xl font-bold text-slate-700">৳{preflightResult!.expectedIncrementalValue.toLocaleString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* SIMULATED */}
                <Card className="border-upay-blue bg-blue-50/50 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-upay-blue"></div>
                  <div className="absolute top-3 right-3 text-[10px] font-bold text-upay-blue bg-blue-100 px-2 py-0.5 rounded">SIMULATED</div>
                  <CardContent className="p-5">
                    <div className="text-xs font-bold text-upay-navy uppercase tracking-widest mb-4">Simulated Campaign</div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-blue-500">AI Score</div>
                        <div className="text-3xl font-black text-upay-blue flex items-center gap-2">
                          {simulatedResult.campaignScore}
                          {simulatedResult.campaignScore > preflightResult!.campaignScore && <span className="text-xs text-emerald-600 bg-emerald-100 px-1 py-0.5 rounded-sm">+{simulatedResult.campaignScore - preflightResult!.campaignScore}</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-blue-500">Audience</div>
                        <div className="text-xl font-bold text-upay-navy flex items-center gap-1">
                          {simulatedResult.audienceSize.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-blue-500">Uplift</div>
                        <div className="text-xl font-bold text-upay-navy flex items-center gap-1">
                          +{simulatedResult.estimatedUplift.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-blue-500">EIV</div>
                        <div className="text-xl font-bold text-upay-navy flex items-center gap-1">
                          ৳{simulatedResult.expectedIncrementalValue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Details & Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <Card className="border-emerald-200 bg-emerald-50/30">
                  <CardContent className="p-5 space-y-3">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-2 border-b border-emerald-100 pb-2">What Changed?</h4>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-emerald-900 text-sm">{activeSimulationReason}</div>
                        <div className="text-xs text-emerald-700 mt-1">
                          This model-based scenario estimate reflects applying the recommended improvement.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardContent className="p-5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b pb-2">Impact Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">AI Score</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">{preflightResult!.campaignScore}</span>
                          <ChevronRight size={14} className="text-slate-300" />
                          <span className="font-bold text-upay-navy">{simulatedResult.campaignScore}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Audience</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">{preflightResult!.audienceSize}</span>
                          <ChevronRight size={14} className="text-slate-300" />
                          <span className="font-bold text-upay-navy">{simulatedResult.audienceSize}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Fatigue Risk</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">{preflightResult!.fatigueRisk.toFixed(0)}</span>
                          <ChevronRight size={14} className="text-slate-300" />
                          <span className="font-bold text-upay-navy">{simulatedResult.fatigueRisk.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center pt-4 text-xs text-slate-400 italic">
                SIMULATION ONLY. Model-based scenario estimate. Not an observed campaign outcome.
              </div>
            </div>
          ) : preflightResult ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-upay-navy mb-1">ImpactIQ Pre-Launch Analysis</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FlaskConical size={14} className="text-upay-blue" />
                    Model-based estimate. This is not a guarantee of actual campaign performance.
                  </p>
                </div>
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px] shadow-lg">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">AI Campaign Score</div>
                  <div className="text-4xl font-black text-upay-yellow">{preflightResult.campaignScore}<span className="text-xl text-slate-500">/100</span></div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardContent className="p-4">
                    <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Est. Incremental Value</div>
                    <div className="text-2xl font-black text-emerald-900">৳{preflightResult.expectedIncrementalValue.toLocaleString()}</div>
                    <div className="text-xs text-emerald-600 mt-1">Expected vs Control</div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">Est. Uplift</div>
                    <div className="text-2xl font-black text-blue-900">+{preflightResult.estimatedUplift.toFixed(1)}%</div>
                    <div className="text-xs text-blue-600 mt-1">Incremental response</div>
                  </CardContent>
                </Card>
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-4">
                    <div className="text-[10px] font-bold text-purple-700 uppercase tracking-widest mb-1">P(Response | Offer)</div>
                    <div className="text-2xl font-black text-purple-900">{(preflightResult.predictedTreatmentResponse * 100).toFixed(1)}%</div>
                    <div className="text-xs text-purple-600 mt-1">Predicted Treatment</div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 bg-slate-50">
                  <CardContent className="p-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">P(Response | No Offer)</div>
                    <div className="text-2xl font-black text-slate-700">{(preflightResult.predictedControlResponse * 100).toFixed(1)}%</div>
                    <div className="text-xs text-slate-500 mt-1">Predicted Control</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Explanation Column */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Score Breakdown */}
                  <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-100/50 p-3 border-b font-black text-upay-navy text-sm uppercase tracking-widest flex items-center gap-2">
                      <PieChart size={16} /> Score Breakdown
                    </div>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                        <div className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-slate-800">Audience Quality</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {preflightResult.audienceQuality.toFixed(0)}% of the eligible audience is classified as Persuadable.
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-upay-navy">{preflightResult.audienceQuality.toFixed(0)}/100</span>
                              <Badge variant="outline" className="ml-2 bg-slate-100">35% Weight</Badge>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${preflightResult.audienceQuality}%` }}></div></div>
                        </div>

                        <div className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-slate-800">Budget Efficiency</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Projected ROI based on ৳{preflightResult.expectedIncrementalValue.toLocaleString()} expected value vs estimated reward cost.
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-upay-navy">{preflightResult.budgetEfficiency.toFixed(0)}/100</span>
                              <Badge variant="outline" className="ml-2 bg-slate-100">30% Weight</Badge>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${preflightResult.budgetEfficiency}%` }}></div></div>
                        </div>

                        <div className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-slate-800">Offer Fit</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Analyzed using historical affinity for {configData?.service || "the target"} service.
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-upay-navy">{preflightResult.offerFit.toFixed(0)}/100</span>
                              <Badge variant="outline" className="ml-2 bg-slate-100">25% Weight</Badge>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${preflightResult.offerFit}%` }}></div></div>
                        </div>

                        <div className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-slate-800">Fatigue Risk</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {preflightResult.fatigueRisk < 30 ? "Audience is well-rested and highly receptive." : "Audience shows signs of offer saturation."}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-red-600">{preflightResult.fatigueRisk.toFixed(0)}/100</span>
                              <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">-10% Penalty</Badge>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${preflightResult.fatigueRisk}%` }}></div></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Decision Trace */}
                  <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-100/50 p-3 border-b font-black text-upay-navy text-sm uppercase tracking-widest flex items-center gap-2">
                      <BrainCircuit size={16} /> How ImpactIQ Reached This Score
                    </div>
                    <CardContent className="p-5">
                      <div className="relative pl-6 space-y-5 before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-slate-200">
                        <div className="relative">
                          <div className="absolute -left-[29px] bg-white border-2 border-slate-300 w-4 h-4 rounded-full mt-1"></div>
                          <div className="font-bold text-sm text-slate-800">1. Campaign Configuration & Target Audience</div>
                          <div className="text-xs text-muted-foreground">Received {preflightResult.audienceSize.toLocaleString()} users from Action Workspace.</div>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[29px] bg-white border-2 border-slate-300 w-4 h-4 rounded-full mt-1"></div>
                          <div className="font-bold text-sm text-slate-800">2. Eligibility & Fatigue Filtering</div>
                          <div className="text-xs text-muted-foreground">Excluded {preflightResult.excludedCustomerCount.toLocaleString()} users due to fatigue/consent rules.</div>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[29px] bg-white border-2 border-slate-300 w-4 h-4 rounded-full mt-1"></div>
                          <div className="font-bold text-sm text-slate-800">3. Treatment vs Control Uplift Calculation</div>
                          <div className="text-xs text-muted-foreground">Ran uplift models to find P(Response) generating +{preflightResult.estimatedUplift.toFixed(1)}% estimated uplift.</div>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[29px] bg-white border-2 border-upay-blue w-4 h-4 rounded-full mt-1"></div>
                          <div className="font-bold text-sm text-slate-800">4. AI Campaign Score Generation</div>
                          <div className="text-xs text-muted-foreground">Aggregated Incremental Value, Audience Quality, and Offer Fit into final {preflightResult.campaignScore}/100 score.</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Insights & Recommendations */}
                  <div className="grid grid-cols-2 gap-4">
                    {preflightResult.positiveFactors.length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-1"><CheckCircle2 size={14} /> Why this may work</h4>
                        <ul className="list-disc pl-4 text-sm text-emerald-700 space-y-1">
                          {preflightResult.positiveFactors.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                    )}
                    
                    {preflightResult.riskFactors.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-yellow-800 uppercase tracking-widest mb-2 flex items-center gap-1"><AlertTriangle size={14} /> Potential Risks</h4>
                        <ul className="list-disc pl-4 text-sm text-yellow-700 space-y-1">
                          {preflightResult.riskFactors.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {preflightResult.recommendations.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-1"><Zap size={14} /> ImpactIQ Recommendations</h4>
                      <div className="space-y-3 mt-3">
                        {preflightResult.recommendations.map((r, i) => (
                          <div key={i} className="text-sm bg-white p-4 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-bold text-blue-900 text-base">{r.title}</div>
                              <Badge variant="outline" className={r.priority === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200 text-[10px]' : 'bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px]'}>{r.priority} PRIORITY</Badge>
                            </div>
                            <div className="text-slate-600 mb-3 leading-relaxed text-xs">
                              <span className="font-bold text-slate-700">Why this matters: </span>{r.reason}
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Suggested Action</div>
                              <div className="text-upay-navy font-bold text-xs">{r.suggestedAction}</div>
                              <div className="text-[10px] text-slate-500 mt-1">Affected component: <span className="font-bold">{r.affectedMetric}</span></div>
                            </div>
                            <div className="flex justify-end">
                              <Button 
                                onClick={() => handleSimulate(r)}
                                variant="outline" 
                                className="text-xs h-8 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 shadow-sm"
                              >
                                Simulate Improvement
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Sidebar - Summaries */}
                <div className="space-y-6">
                  {/* Customer Intelligence Summary */}
                  <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-100/50 p-3 border-b font-black text-upay-navy text-sm uppercase tracking-widest flex items-center gap-2">
                      <Users size={16} /> Audience Intelligence
                    </div>
                    <CardContent className="p-4 space-y-3 text-sm">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-slate-500 font-medium">Selected Audience</span>
                        <span className="font-black text-slate-800">{preflightResult.audienceSize.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-slate-500 font-medium">Eligible Customers</span>
                        <span className="font-black text-emerald-700">{preflightResult.eligibleCustomerCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-slate-500 font-medium">Excluded (Rules/Fatigue)</span>
                        <span className="font-black text-red-600">{preflightResult.excludedCustomerCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-slate-500 font-medium">Persuadable Segment</span>
                        <span className="font-black text-upay-blue">~{preflightResult.audienceQuality.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Avg Fatigue Score</span>
                        <span className="font-black text-slate-800">{preflightResult.fatigueRisk.toFixed(1)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Campaign Config Summary */}
                  <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-100/50 p-3 border-b font-black text-upay-navy text-sm uppercase tracking-widest flex items-center gap-2">
                      <Settings size={16} /> Configuration
                    </div>
                    <CardContent className="p-4 space-y-3 text-sm bg-slate-50">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Campaign Name</span>
                        <span className="font-medium text-slate-800">{configData?.name || "Untitled"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Target Service</span>
                          <span className="font-medium text-slate-800 capitalize">{configData?.service}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Objective</span>
                          <span className="font-medium text-slate-800 capitalize">{configData?.objective}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Reward</span>
                          <span className="font-medium text-slate-800 capitalize">{configData?.rewardValue} ({configData?.rewardType})</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Budget</span>
                          <span className="font-medium text-slate-800">৳{configData?.totalBudget.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN - CONFIGURATION */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* 1. CAMPAIGN BASICS */}
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-100/50 p-3 border-b flex items-center gap-2 font-black text-upay-navy">
                  <Settings size={16} /> 1. Campaign Basics
                </div>
                <CardContent className="p-5 grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <InputLabel>Campaign Name *</InputLabel>
                    <input type="text" className="w-full p-2.5 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-upay-blue text-sm" placeholder="e.g. Ramzan Target Recharge" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div>
                    <InputLabel>Objective</InputLabel>
                    <select className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm" value={objective} onChange={e => setObjective(e.target.value)}>
                      <option value="acquisition">Customer Acquisition</option>
                      <option value="activation">Customer Activation</option>
                      <option value="engagement">Increase Engagement</option>
                      <option value="retention">Customer Retention</option>
                      <option value="winback">Win-back Dormant</option>
                      <option value="cross_sell">Cross-sell / Up-sell</option>
                    </select>
                  </div>
                  <div>
                    <InputLabel>Status</InputLabel>
                    <select className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm" value={status} onChange={e => setStatus(e.target.value)}>
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <InputLabel>Description (Optional)</InputLabel>
                    <textarea className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm resize-none h-20" placeholder="Internal notes about this campaign..." value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {/* 2 & 3. SCHEDULE & SERVICE */}
              <div className="grid grid-cols-2 gap-6">
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-100/50 p-3 border-b flex items-center gap-2 font-black text-upay-navy">
                    <Calendar size={16} /> 2. Schedule
                  </div>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <InputLabel>Start Date</InputLabel>
                        <input type="date" className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                      </div>
                      <div>
                        <InputLabel>Start Time</InputLabel>
                        <input type="time" className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm" value={startTime} onChange={e => setStartTime(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <InputLabel>End Date</InputLabel>
                        <input type="date" className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                      </div>
                      <div>
                        <InputLabel>End Time</InputLabel>
                        <input type="time" className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm" value={endTime} onChange={e => setEndTime(e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-100/50 p-3 border-b flex items-center gap-2 font-black text-upay-navy">
                    <Target size={16} /> 3. Target Service
                  </div>
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <InputLabel>Service Category</InputLabel>
                      <select className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm" value={service} onChange={e => setService(e.target.value)}>
                        <option value="recharge">Mobile Recharge</option>
                        <option value="merchant">Merchant Payment</option>
                        <option value="bill">Bill Payment</option>
                        <option value="send_money">Send Money</option>
                        <option value="add_money">Add Money</option>
                        <option value="cash_out">Cash Out</option>
                      </select>
                    </div>
                    <div>
                      <InputLabel>Operator/Biller (Optional)</InputLabel>
                      <input type="text" className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm" placeholder="e.g. Grameenphone, DESCO" value={operator} onChange={e => setOperator(e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 4. OFFER CONFIGURATION */}
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-100/50 p-3 border-b flex items-center gap-2 font-black text-upay-navy">
                  <CreditCard size={16} /> 4. Offer Configuration
                </div>
                <CardContent className="p-5 grid grid-cols-2 gap-4">
                  <div>
                    <InputLabel>Reward Type</InputLabel>
                    <select className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm" value={rewardType} onChange={e => setRewardType(e.target.value)}>
                      <option value="cashback">Cashback (%)</option>
                      <option value="discount">Discount (Fixed ৳)</option>
                      <option value="bonus">Bonus Balance</option>
                      <option value="coupon">Coupon Code</option>
                    </select>
                  </div>
                  <div>
                    <InputLabel>Reward Value</InputLabel>
                    <input type="number" className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm" value={rewardValue} onChange={e => setRewardValue(Number(e.target.value))} />
                  </div>
                  <div>
                    <InputLabel>Max Reward (৳)</InputLabel>
                    <input type="number" className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm" value={maxReward} onChange={e => setMaxReward(Number(e.target.value))} />
                  </div>
                  <div>
                    <InputLabel>Min Transaction (৳)</InputLabel>
                    <input type="number" className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm" value={minTransaction} onChange={e => setMinTransaction(Number(e.target.value))} />
                  </div>
                </CardContent>
              </Card>

              {/* 5. AUDIENCE */}
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-100/50 p-3 border-b flex items-center justify-between font-black text-upay-navy">
                  <span className="flex items-center gap-2"><Users size={16} /> 5. Target Audience</span>
                  <div className="flex bg-white rounded-lg p-1 border">
                    <button className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${audienceType === "AI" ? "bg-upay-blue text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`} onClick={() => setAudienceType("AI")}>AI RECOMMENDED</button>
                    <button className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${audienceType === "CUSTOM" ? "bg-upay-blue text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`} onClick={() => setAudienceType("CUSTOM")}>CUSTOM</button>
                  </div>
                </div>
                <CardContent className="p-5">
                  {audienceType === "AI" ? (
                    <div className="space-y-3 border border-purple-200 bg-purple-50 p-4 rounded-xl">
                      <div className="flex gap-2 mb-2 items-center text-purple-800 font-bold text-sm">
                        <BrainCircuit size={16} /> Intelligent Targeting Active
                      </div>
                      <p className="text-xs text-purple-700 leading-relaxed mb-3">
                        Using ImpactIQ logic to target users with high Expected Incremental Value (EIV) and positive Uplift.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-white text-purple-700 border-purple-200">Segment: PERSUADABLE</Badge>
                        <Badge variant="outline" className="bg-white text-purple-700 border-purple-200">Fatigue: LOW/MEDIUM</Badge>
                        <Badge variant="outline" className="bg-white text-purple-700 border-purple-200">Eligibility: TRUE</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 border border-slate-200 bg-slate-50 p-4 rounded-xl text-center">
                      <Filter className="mx-auto text-slate-400 mb-2" size={24} />
                      <p className="text-sm font-bold text-slate-700">Inheriting Workspace Audience</p>
                      <p className="text-xs text-muted-foreground">Using the custom rule groups built in the Action Workspace.</p>
                      <div className="mt-2 text-upay-blue font-black">{evaluation.count.toLocaleString()} Matches</div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* RIGHT COLUMN - LIMITS, FATIGUE & EXPERIMENTS */}
            <div className="space-y-6">
              
              {/* 6. BUDGET & LIMITS */}
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-100/50 p-3 border-b flex items-center gap-2 font-black text-upay-navy">
                  <PieChart size={16} /> 6. Budget & Limits
                </div>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <InputLabel>Total Campaign Budget (৳)</InputLabel>
                    <input type="number" className="w-full p-2.5 bg-white border rounded-xl outline-none font-black text-upay-blue" value={totalBudget} onChange={e => setTotalBudget(Number(e.target.value))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <InputLabel>Max Redemptions</InputLabel>
                      <input type="number" className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm" value={maxRedemptions} onChange={e => setMaxRedemptions(Number(e.target.value))} />
                    </div>
                    <div>
                      <InputLabel>Uses / Cust / Day</InputLabel>
                      <input type="number" className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm" value={usesPerCustDay} onChange={e => setUsesPerCustDay(Number(e.target.value))} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 7. FATIGUE PROTECTION */}
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-100/50 p-3 border-b flex items-center gap-2 font-black text-upay-navy">
                  <ShieldAlert size={16} /> 7. Fatigue Protection
                </div>
                <CardContent className="p-5 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer p-3 border border-emerald-200 bg-emerald-50 rounded-xl">
                    <input type="checkbox" className="mt-1" checked={excludeHighFatigue} onChange={e => setExcludeHighFatigue(e.target.checked)} />
                    <div>
                      <div className="text-sm font-bold text-emerald-800 leading-none mb-1">Exclude High-Fatigue</div>
                      <div className="text-xs text-emerald-700 leading-tight">Prevents targeting customers identified by the ML engine as over-exposed to offers.</div>
                    </div>
                  </label>
                  <div>
                    <InputLabel>Campaign Cooldown (Days)</InputLabel>
                    <input type="number" className="w-full p-2.5 bg-white border rounded-xl outline-none text-sm" value={cooldownDays} onChange={e => setCooldownDays(Number(e.target.value))} />
                  </div>
                </CardContent>
              </Card>

              {/* 8. EXPERIMENT */}
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-100/50 p-3 border-b flex items-center justify-between font-black text-upay-navy">
                  <span className="flex items-center gap-2"><FlaskConical size={16} /> 8. A/B Experiment</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={enableExperiment} onChange={e => setEnableExperiment(e.target.checked)} />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-upay-blue"></div>
                  </label>
                </div>
                {enableExperiment ? (
                  <CardContent className="p-5 space-y-4 bg-upay-blue/5">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 mb-2 font-bold w-full justify-center">SIMULATION ONLY</Badge>
                    <div>
                      <InputLabel>Treatment Split (%)</InputLabel>
                      <div className="flex items-center gap-4">
                        <input type="range" min="10" max="90" step="10" className="w-full" value={treatmentPct} onChange={e => setTreatmentPct(Number(e.target.value))} />
                        <span className="font-bold text-upay-blue w-12 text-right">{treatmentPct}%</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1 font-medium">
                        <span>Control: {100 - treatmentPct}%</span>
                        <span>(Simulated Cohort)</span>
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  <div className="p-5 text-center text-sm text-slate-500">
                    Experiment tracking is disabled. Enable to run a simulated A/B test on this campaign.
                  </div>
                )}
              </Card>
            </div>
          </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white p-5 border-t shrink-0 flex justify-between items-center z-10 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.1)]">
          {simulatedResult ? (
            <>
              <Button variant="ghost" onClick={discardSimulation} className="font-bold text-slate-500 hover:text-slate-800">
                Discard Scenario
              </Button>
              <Button 
                onClick={applySimulation} 
                className="bg-upay-blue hover:bg-blue-700 text-white h-12 px-8 text-lg font-black rounded-xl shadow-lg flex items-center gap-2"
              >
                Apply Improvement <CheckCircle2 size={20} />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={preflightResult ? () => setPreflightResult(null) : onClose} className="font-bold text-slate-500 hover:text-slate-800">
                {preflightResult ? "Back to Editor" : "Cancel"}
              </Button>
              
              <div className="flex items-center gap-3">
                {preflightResult ? (
                  <Button 
                    onClick={() => {
                      const newCampaignId = `CAM${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
                      const newCampaign = {
                        id: newCampaignId,
                        name: configData?.name || "Untitled",
                        offerType: configData?.rewardType as any || "recharge_cashback",
                        cashbackAmount: configData?.rewardValue || 0,
                        minTransaction: configData?.minTransaction || 0,
                        budgetTotal: configData?.totalBudget || 0,
                        budgetUsed: 0,
                        capacityLimit: preflightResult.audienceSize,
                        channel: "push",
                        targetProduct: configData?.service || "recharge",
                        duration: 7,
                        isActive: true
                      };
                      useIntelligenceStore.getState().addCampaign(newCampaign as any);
                      
                      // Notify Targeted users
                      const targetedIds = evaluation.customerIds.slice(0, Math.min(preflightResult.audienceSize, 500));
                      import("@/lib/notifications/store").then(({ useNotificationStore }) => {
                        useNotificationStore.getState().createNotificationsForCampaign(
                          newCampaign.id,
                          newCampaign.name,
                          targetedIds,
                          {
                            title: newCampaign.name,
                            body: `Complete a ${newCampaign.targetProduct.replace('_', ' ')} of ৳${newCampaign.minTransaction} or more to get your reward!`,
                            ctaText: "Claim Offer",
                            ctaUrl: `/customer/impactiq`
                          }
                        );
                      });

                      alert("Pre-Launch Analysis Approved. Campaign created and notifications dispatched.");
                      onClose();
                    }} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-8 text-lg font-black rounded-xl shadow-lg flex items-center gap-2"
                  >
                    Approve & Schedule <CheckCircle2 size={20} />
                  </Button>
                ) : (
                  <>
                    <div className="text-right hidden sm:block mr-4">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Est. ImpactIQ Analysis</div>
                      <div className="text-sm font-medium text-slate-600">Pre-launch Intelligence Pipeline</div>
                    </div>
                    
                    <Button 
                      onClick={handleAnalyze} 
                      disabled={isSaving || !name}
                      className="bg-[linear-gradient(110deg,#00194C,45%,#003399,55%,#00194C)] bg-[length:200%_100%] hover:opacity-90 text-white h-12 px-8 text-lg font-black rounded-xl border border-upay-blue/30 shadow-lg flex items-center gap-2"
                    >
                      {isSaving ? "Analyzing..." : "Analyze with ImpactIQ"} <ChevronRight size={20} />
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
