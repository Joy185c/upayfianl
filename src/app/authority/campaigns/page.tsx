"use client";

import { useState, useEffect } from "react";
import { Zap, Target, BrainCircuit, Users, TrendingUp, AlertTriangle, Filter, Database, Trash2, MousePointerClick, CheckCircle, Download } from "lucide-react";
import { useIntelligenceStore } from "@/lib/intelligence/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DecisionTrace, Campaign, ExperimentRecommendation } from "@/lib/intelligence/types";
import { ActionType, AudienceEvaluation } from "@/lib/audience/types";
import { ActionWorkspace } from "@/components/campaign-intelligence/ActionWorkspace";
import { CampaignBuilderModal } from "@/components/campaign-intelligence/CampaignBuilderModal";
import { GlobalCampaignModal } from "@/components/campaign-intelligence/GlobalCampaignModal";
import { MessageDeliveryTracker } from "@/components/campaign-intelligence/MessageDeliveryTracker";

export default function AuthorityCampaigns() {
  const { campaigns, budgetResult, decisions, experiments, experimentRecommendations, isRunning, lastRunAt, deleteCampaign } = useIntelligenceStore();
  const [mounted, setMounted] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedTrace, setSelectedTrace] = useState<DecisionTrace | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Tabs state
  const [activeTab, setActiveTab] = useState<"OPTIMIZER" | "ACTION" | "EXPERIMENTS" | "DELIVERY">("OPTIMIZER");
  const [selectedAction, setSelectedAction] = useState<ActionType>("SUPPRESS");
  
  // Campaign Builder state
  const [isCampaignBuilderOpen, setIsCampaignBuilderOpen] = useState(false);
  const [campaignAudience, setCampaignAudience] = useState<AudienceEvaluation | null>(null);

  // Global Campaign state
  const [isGlobalCampaignOpen, setIsGlobalCampaignOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!lastRunAt && !isRunning) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-center">
        <p className="text-muted-foreground">ImpactIQ Engine is offline. Run the pipeline from the Overview tab.</p>
      </div>
    );
  }

  // Filter traces based on selected campaign
  let displayTraces = decisions;
  if (selectedCampaign !== "all") {
    displayTraces = decisions.filter(d => d.offerId === selectedCampaign);
  }

  // Take top 50 for performance
  displayTraces = displayTraces.slice(0, 50);

  const formatPercentage = (num: number) => `${(num * 100).toFixed(1)}%`;
  
  const getFatigueBadge = (level: string) => {
    if (level === "HIGH") return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>;
    if (level === "MEDIUM") return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>;
    return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Low</Badge>;
  };

  const getActionBadge = (action: string) => {
    if (action === "TARGET") return <Badge className="bg-green-600 hover:bg-green-700">🎯 TARGET</Badge>;
    if (action === "DO_NOT_TARGET") return <Badge variant="destructive">❌ SUPPRESS</Badge>;
    if (action === "HOLD") return <Badge variant="secondary">⏸ HOLD</Badge>;
    return <Badge variant="outline">MONITOR</Badge>;
  };

  const downloadCSV = () => {
    // Determine which traces to export. If 'all' is selected, export all targeted traces.
    // Otherwise export traces for the selected campaign.
    let exportTraces = decisions;
    if (selectedCampaign !== "all") {
      exportTraces = decisions.filter(d => d.offerId === selectedCampaign);
    }
    
    // Only export TARGET actions for the marketing team
    exportTraces = exportTraces.filter(d => d.action === "TARGET");

    const headers = ["Customer ID", "Lifecycle Stage", "Recommended Campaign", "Expected Response Rate", "Predicted Uplift", "Fatigue Risk"];
    
    const rows = exportTraces.map(trace => {
      const campaign = campaigns.find(c => c.id === trace.offerId);
      return [
        trace.customerId,
        trace.lifecycle,
        campaign ? campaign.name.replace(/,/g, '') : trace.offerId,
        (trace.pResponseWithOffer * 100).toFixed(1) + "%",
        (trace.uplift * 100).toFixed(1) + "%",
        trace.fatigueLevel
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ImpactIQ_Strategy_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-upay-navy tracking-tight">Campaign Intelligence</h1>
          <p className="text-muted-foreground mt-1">AI-driven targeting, uplift measurement, and budget allocation.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl border">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "OPTIMIZER" ? "bg-white text-upay-blue shadow-sm" : "text-muted-foreground hover:text-upay-navy"}`}
            onClick={() => setActiveTab("OPTIMIZER")}
          >
            Active Optimizer
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "ACTION" ? "bg-white text-upay-blue shadow-sm" : "text-muted-foreground hover:text-upay-navy"}`}
            onClick={() => setActiveTab("ACTION")}
          >
            Action Intelligence
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "EXPERIMENTS" ? "bg-white text-upay-blue shadow-sm" : "text-muted-foreground hover:text-upay-navy"}`}
            onClick={() => setActiveTab("EXPERIMENTS")}
          >
            Simulated Experiments
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "DELIVERY" ? "bg-white text-upay-blue shadow-sm" : "text-muted-foreground hover:text-upay-navy"}`}
            onClick={() => setActiveTab("DELIVERY")}
          >
            Delivery Tracking
          </button>
        </div>
      </div>

      {activeTab === "OPTIMIZER" && (
        decisions.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database size={32} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-black text-upay-navy mb-2">No Intelligence Data</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Please upload customer data in the Data Management panel to generate AI decisions.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Campaign List */}
          <div className="xl:col-span-1 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-upay-navy flex items-center gap-2">
              <Target size={18} /> Active Optimizer
            </h3>
            <Button size="sm" onClick={() => setIsGlobalCampaignOpen(true)} className="bg-upay-navy hover:bg-upay-navy/90 text-white h-8 text-xs">
              + New Campaign
            </Button>
          </div>
          
          <Card 
            className={`cursor-pointer transition-all ${selectedCampaign === "all" ? "ring-2 ring-upay-blue border-transparent shadow-md" : "hover:border-upay-blue/50"}`}
            onClick={() => setSelectedCampaign("all")}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <span className="font-bold text-upay-navy">All Campaigns</span>
              <Badge variant="secondary">{decisions.length} Targets</Badge>
            </CardContent>
          </Card>

          {budgetResult?.allocations.map((alloc) => {
            const campaign = campaigns.find(c => c.id === alloc.campaignId);
            if (!campaign) return null;
            const isSelected = selectedCampaign === campaign.id;

            return (
              <Card 
                key={campaign.id} 
                className={`cursor-pointer transition-all ${isSelected ? "ring-2 ring-upay-blue border-transparent shadow-md" : "hover:border-upay-blue/50"}`}
                onClick={() => setSelectedCampaign(campaign.id)}
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-upay-navy leading-tight">{campaign.name}</h4>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCampaign(campaign.id);
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete Campaign"
                      >
                        <Trash2 size={14} />
                      </button>
                      {alloc.customersTargeted > 0 ? (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1"></div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300 mt-1"></div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase">
                        <Users size={14} /> Reached
                      </div>
                      <span className="font-black text-upay-navy">{alloc.customersTargeted.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase">
                        <MousePointerClick size={14} /> Engaged (Est.)
                      </div>
                      <span className="font-black text-upay-navy">
                        {Math.floor(alloc.customersTargeted * 0.42).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 uppercase">
                        <CheckCircle size={14} /> Converted
                      </div>
                      <span className="font-black text-emerald-600">{alloc.expectedIncrementalTxns.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-2 border border-slate-100">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Success Rate</p>
                      <p className="text-sm font-black text-upay-blue">
                        {alloc.customersTargeted > 0 
                          ? ((alloc.expectedIncrementalTxns / alloc.customersTargeted) * 100).toFixed(1) 
                          : "0.0"}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Budget ROI</p>
                      <p className="text-sm font-black text-upay-blue">{alloc.roi.toFixed(2)}x</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Intelligence Targeting Table */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-lg font-bold text-upay-navy flex items-center gap-2">
              <BrainCircuit size={18} /> Decision Trace Log
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground">Showing top {displayTraces.length} candidates</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadCSV}
                className="text-xs border-upay-blue text-upay-blue hover:bg-upay-blue/5 h-8"
              >
                <Download size={14} className="mr-1.5" />
                Export Strategy (CSV)
              </Button>
            </div>
          </div>

          <Card className="border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 font-semibold border-b">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 text-center">P(Offer)</th>
                    <th className="px-4 py-3 text-center">P(No Offer)</th>
                    <th className="px-4 py-3 text-center">Uplift</th>
                    <th className="px-4 py-3 text-center">Fatigue</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayTraces.map((trace) => (
                    <tr 
                      key={`${trace.customerId}-${trace.offerId}`} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedTrace(trace);
                        setIsModalOpen(true);
                      }}
                    >
                      <td className="px-4 py-3 font-medium text-upay-navy group-hover:text-upay-blue">
                        {trace.customerId}
                        <div className="text-[10px] text-muted-foreground font-normal">{trace.lifecycle}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        {formatPercentage(trace.pResponseWithOffer)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                        {formatPercentage(trace.pResponseWithoutOffer)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-black flex items-center justify-center gap-1 ${
                          trace.uplift > 0.1 ? "text-emerald-600" : 
                          trace.uplift < 0 ? "text-red-500" : "text-upay-navy"
                        }`}>
                          {trace.uplift > 0 ? "+" : ""}{formatPercentage(trace.uplift)}
                          {trace.uplift > 0.1 && <TrendingUp size={12} />}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getFatigueBadge(trace.fatigueLevel)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          {getActionBadge(trace.action)}
                          <span className="text-[9px] text-muted-foreground max-w-[120px] truncate" title={trace.reason}>
                            {trace.reason}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {displayTraces.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No targets found for this campaign.
              </div>
            )}
          </Card>
        </div>
      </div>
      )
      )}

      {activeTab === "ACTION" && (
        decisions.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center shadow-sm mt-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database size={32} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-black text-upay-navy mb-2">No Intelligence Data</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Please upload customer data in the Data Management panel to generate AI decisions.
            </p>
          </div>
        ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["TARGET", "HOLD", "SUPPRESS", "MONITOR"] as ActionType[]).map((action) => {
              // Map SUPPRESS to DO_NOT_TARGET for counting
              const targetActionVal = action === "SUPPRESS" ? "DO_NOT_TARGET" : action;
              const count = decisions.filter(d => d.action === targetActionVal).length;
              const isSelected = selectedAction === action;
              
              const actionColors: Record<ActionType, { border: string, bg: string, text: string }> = {
                TARGET: { border: "border-green-500", bg: "bg-green-50", text: "text-green-700" },
                HOLD: { border: "border-yellow-500", bg: "bg-yellow-50", text: "text-yellow-700" },
                SUPPRESS: { border: "border-red-500", bg: "bg-red-50", text: "text-red-700" },
                MONITOR: { border: "border-slate-500", bg: "bg-slate-50", text: "text-slate-700" },
              };

              return (
                <Card 
                  key={action}
                  className={`cursor-pointer transition-all ${isSelected ? `ring-2 ring-upay-navy ${actionColors[action].border} shadow-md` : "hover:border-slate-300"}`}
                  onClick={() => setSelectedAction(action)}
                >
                  <CardContent className="p-4 sm:p-6 text-center">
                    <p className={`text-xs font-black uppercase tracking-widest mb-2 ${isSelected ? actionColors[action].text : "text-muted-foreground"}`}>
                      {action}
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-upay-navy">
                      {count.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase">Customers</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <ActionWorkspace 
            action={selectedAction}
            baseAudience={decisions.filter(d => d.action === (selectedAction === "SUPPRESS" ? "DO_NOT_TARGET" : selectedAction))}
            onOpenTrace={(trace) => {
              setSelectedTrace(trace);
              setIsModalOpen(true);
            }}
            onCreateCampaign={(evaluation) => {
              setCampaignAudience(evaluation);
              setIsCampaignBuilderOpen(true);
            }}
          />
        </div>
        )
      )}

      {activeTab === "EXPERIMENTS" && (
        !experiments || experiments.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center shadow-sm mt-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database size={32} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-black text-upay-navy mb-2">No Simulated Experiments</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Please upload customer data to run the AI engine and generate simulated experiment previews.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-blue-800 text-sm flex items-start gap-3">
              <Database className="shrink-0 mt-0.5" size={18} />
              <div>
                <strong className="block mb-1">Simulation Only — these are modeled expectations, not observed campaign outcomes.</strong>
                This dashboard visualizes expected A/B test results by hashing the treatment and control probabilities predicted by the T-Learner model. It does not reflect real-world tracking.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {experiments.map(exp => (
                <Card key={exp.experimentId} className="border shadow-sm rounded-2xl overflow-hidden">
                  <div className="bg-slate-50 border-b p-4 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{exp.experimentId}</span>
                      <h3 className="text-lg font-black text-upay-navy leading-tight">{exp.campaignName}</h3>
                    </div>
                    <Badge variant="outline" className="bg-white">Simulated Preview</Badge>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Simulated Treatment Response</p>
                        <p className="text-xl font-black text-upay-navy">{(exp.simulatedTreatmentResponseRate * 100).toFixed(1)}%</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{exp.treatmentSize} hashed users</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Simulated Control Response</p>
                        <p className="text-xl font-black text-upay-navy">{(exp.simulatedControlResponseRate * 100).toFixed(1)}%</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{exp.controlSize} hashed users</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Simulated Lift</p>
                        <p className={`text-xl font-black ${exp.simulatedObservedLift > 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {exp.simulatedObservedLift > 0 ? "+" : ""}{(exp.simulatedObservedLift * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Prediction Gap</p>
                        <p className="text-xl font-black text-upay-navy">{(exp.predictionGap * 100).toFixed(1)}%</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Variance from mean prediction</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {experimentRecommendations && experimentRecommendations.length > 0 && (
              <div className="mt-12 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <BrainCircuit size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-upay-navy">AI Experiment Recommendations</h3>
                    <p className="text-sm text-muted-foreground">Based on historical JSON data, lifecycle patterns, and response fatigue.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {experimentRecommendations.map(rec => (
                    <Card key={rec.id} className="border shadow-sm rounded-2xl overflow-hidden border-indigo-100">
                      <div className="bg-indigo-50/50 border-b p-4 flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200 mb-2">{rec.id}</Badge>
                          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Target Segment: <span className="text-upay-navy">{rec.targetSegment}</span></h4>
                        </div>
                      </div>
                      <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Control Variant</span>
                            <span className="font-semibold text-slate-700">{rec.controlVariant}</span>
                          </div>
                          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Test Variant A</span>
                            <span className="font-semibold text-indigo-800">{rec.testVariant}</span>
                          </div>
                        </div>

                        {rec.alternativeVariant && (
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Test Variant B (Alternative)</span>
                            <span className="font-semibold text-blue-800">{rec.alternativeVariant}</span>
                          </div>
                        )}

                        <div className="flex gap-4">
                          <Badge variant="secondary" className="bg-slate-100">Timing: {rec.recommendedTiming}</Badge>
                          <Badge variant="secondary" className="bg-slate-100">Channel: {rec.recommendedChannel}</Badge>
                        </div>

                        <div className="bg-white border rounded-xl p-4 shadow-sm">
                          <h5 className="text-xs font-bold text-upay-navy uppercase tracking-widest mb-3 flex items-center gap-2">
                            <BrainCircuit size={14} className="text-indigo-500" /> Why did AI recommend this?
                          </h5>
                          <ul className="space-y-2">
                            {rec.aiReasons.map((reason, idx) => (
                              <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                <span className="text-indigo-400 font-bold">•</span> {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {activeTab === "DELIVERY" && (
        selectedCampaign === "all" ? (
          <div className="bg-white rounded-2xl border p-12 text-center shadow-sm mt-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap size={32} className="text-upay-blue" />
            </div>
            <h2 className="text-xl font-black text-upay-navy mb-2">Select a Campaign</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Please select a specific campaign from the Active Optimizer tab to view its message delivery tracking and engagement analytics.
            </p>
            <Button onClick={() => setActiveTab("OPTIMIZER")} className="bg-upay-navy text-white rounded-xl">
              Go to Active Optimizer
            </Button>
          </div>
        ) : (
          <div className="mt-6">
            <MessageDeliveryTracker 
              campaignId={selectedCampaign} 
              campaignName={campaigns.find(c => c.id === selectedCampaign)?.name || "Campaign"} 
              audienceSize={decisions.filter(d => d.offerId === selectedCampaign).length || 3950}
            />
          </div>
        )
      )}

      {/* Campaign Builder Modal (From Action Intelligence) */}
      <CampaignBuilderModal 
        isOpen={isCampaignBuilderOpen}
        onClose={() => setIsCampaignBuilderOpen(false)}
        evaluation={campaignAudience}
        sourceAction={selectedAction}
      />

      {/* Global Campaign Modal (From Optimizer) */}
      <GlobalCampaignModal 
        isOpen={isGlobalCampaignOpen}
        onClose={() => setIsGlobalCampaignOpen(false)}
      />

      {/* Trace Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[90vw] sm:max-w-md p-5 sm:p-6 bg-white rounded-3xl border-none shadow-2xl max-h-[90vh] overflow-y-auto">
          {selectedTrace && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="p-3 bg-upay-navy/10 rounded-full text-upay-navy shrink-0">
                  <BrainCircuit size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-upay-navy">Decision Trace</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer: {selectedTrace.customerId}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm">
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Action Selected</p>
                  <div>{getActionBadge(selectedTrace.action)}</div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Offer Evaluated</p>
                  <p className="font-bold text-upay-navy leading-tight">{selectedTrace.offerName}</p>
                </div>
                
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">P(Response | Offer)</p>
                  <p className="font-mono font-bold text-upay-blue text-lg">{formatPercentage(selectedTrace.pResponseWithOffer)}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">P(Response | No Offer)</p>
                  <p className="font-mono font-bold text-slate-500 text-lg">{formatPercentage(selectedTrace.pResponseWithoutOffer)}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Calculated Uplift</p>
                  <p className={`font-mono font-black text-lg flex items-center gap-1 ${selectedTrace.uplift > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {selectedTrace.uplift > 0 ? "+" : ""}{formatPercentage(selectedTrace.uplift)}
                    {selectedTrace.uplift > 0.1 && <TrendingUp size={16} />}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Segment Category</p>
                  <Badge variant="outline" className="font-bold bg-slate-50">{selectedTrace.upliftSegment.replace(/_/g, " ")}</Badge>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest border-b border-slate-200 pb-2 flex justify-between">
                  <span>Value & Cost Math</span>
                  <span>(Ranking Formula)</span>
                </p>
                <div className="flex justify-between text-xs items-center">
                  <span className="text-slate-500 font-medium">Expected Incr. Value:</span>
                  <span className="font-mono font-bold text-emerald-600">৳{selectedTrace.expectedIncrementalValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs items-center">
                  <span className="text-slate-500 font-medium">Probabilistic Cost:</span>
                  <span className="font-mono font-bold text-red-500">- ৳{selectedTrace.offerCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs items-center">
                  <span className="text-slate-500 font-medium">Fatigue Penalty:</span>
                  <span className="font-mono font-bold text-red-500">- ৳{selectedTrace.fatiguePenalty.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm items-center border-t border-slate-200 pt-3 mt-1">
                  <span className="font-black text-upay-navy uppercase tracking-wider text-xs">Final Decision Score:</span>
                  <span className="font-mono font-black text-upay-navy text-base">{selectedTrace.decisionScore.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Decision Reasoning</p>
                <p className="text-sm font-semibold text-upay-navy bg-upay-navy/5 p-3.5 rounded-xl border border-upay-navy/10 leading-relaxed shadow-sm">
                  {selectedTrace.reason}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest border-b border-slate-200 pb-2">AI-Centric Explainability</p>
                
                <div className="space-y-2">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1"><TrendingUp size={12}/> Top Positive Factors</p>
                  <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                    {selectedTrace.customerReason.map((r, i) => <li key={i}>{r}</li>)}
                    {selectedTrace.uplift > 0.05 && <li>High affinity for this campaign category</li>}
                  </ul>
                </div>

                <div className="space-y-2 mt-4">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={12}/> Top Negative Factors</p>
                  <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                    {selectedTrace.fatigueLevel === 'HIGH' && <li>High offer fatigue (too many recent offers)</li>}
                    {selectedTrace.uplift < 0 && <li>Negative estimated uplift (Sleeping Dog risk)</li>}
                    {!selectedTrace.eligibilityPass && <li>Eligibility restriction for current lifecycle</li>}
                    {selectedTrace.action !== 'TARGET' && <li>Low expected incremental value compared to cost</li>}
                    {selectedTrace.action === 'TARGET' && <li className="text-muted-foreground italic list-none -ml-4">None detected</li>}
                  </ul>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
