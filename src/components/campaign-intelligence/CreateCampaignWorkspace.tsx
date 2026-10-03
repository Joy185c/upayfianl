"use client";

import { useState } from "react";
import { 
  Zap, Target, AlertTriangle, CheckCircle2, Calendar, Clock, 
  Settings, CreditCard, Users, ShieldAlert, FlaskConical, ChevronRight, PieChart, Sparkles, BrainCircuit, Filter, Plus, FileText, Send, ArrowRight, Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useIntelligenceStore } from "@/lib/intelligence/store";
import toast from "react-hot-toast";

interface CreateCampaignWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCampaignWorkspace({ isOpen, onClose }: CreateCampaignWorkspaceProps) {
  const { customers } = useIntelligenceStore();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [aiAudienceResult, setAiAudienceResult] = useState<any>(null);
  
  // Step 1 - Objective
  const [objective, setObjective] = useState("acquisition");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [seasonalContext, setSeasonalContext] = useState("eid");
  
  // Step 2 - Audience
  const [audiencePrompt, setAudiencePrompt] = useState("");
  
  // Step 3 - Offer
  const [offerType, setOfferType] = useState("recharge");
  const [incentiveType, setIncentiveType] = useState("cashback");
  const [incentiveValue, setIncentiveValue] = useState(50);
  const [minTransaction, setMinTransaction] = useState(100);
  const [maxReward, setMaxReward] = useState(50);
  const [channel, setChannel] = useState("push");
  const [message, setMessage] = useState("Get {offer_value} cashback on your next {campaign_name} recharge!");
  
  // Step 4 - Budget
  const [budget, setBudget] = useState(500000);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Step 5 - Analysis
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Step 6 - Status
  const [campaignStatus, setCampaignStatus] = useState<"DRAFT" | "READY" | "SAVED">("DRAFT");
  const [isSaving, setIsSaving] = useState(false);
  const [showLaunchConfirm, setShowLaunchConfirm] = useState(false);

  const handleDiscoverAudience = () => {
    setIsCopilotThinking(true);
    setTimeout(() => {
      setAiAudienceResult({
        size: 31650,
        response: 84.5,
        uplift: 42.1,
        fatigue: 18,
        nextBehavior: "Mobile Recharge",
        expectedValue: 1250000
      });
      setIsCopilotThinking(false);
    }, 1500);
  };

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalysisResult({
        audience: 31650,
        offer: "৳50 Cashback",
        channel: "Push Notification",
        timing: "7:30 PM",
        response: 84.5,
        uplift: 42.1,
        incTransactions: 13324,
        incValue: 1250000,
        cost: 666200
      });
      setIsAnalyzing(false);
      setCurrentStep(6);
      setCampaignStatus("READY");
    }, 2000);
  };

  const handleSaveDraft = () => {
    setIsSaving(true);
    setTimeout(() => {
      setCampaignStatus("SAVED");
      setIsSaving(false);
    }, 1000);
  };

  const handleActivate = () => {
    toast.success("Campaign Activated Successfully");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-6xl p-0 bg-slate-50 rounded-3xl border-none shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-upay-navy text-white p-6 shrink-0 relative z-10 shadow-md flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
              <Sparkles className="text-upay-yellow" /> Create New Campaign
            </h2>
            <p className="text-slate-300 text-sm">Build an AI-powered campaign with audience intelligence, uplift prediction, fatigue protection and controlled execution.</p>
          </div>
          {/* Progress Steps */}
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === step ? 'bg-upay-yellow text-upay-navy' : currentStep > step ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white/50'}`}>
                  {currentStep > step ? <CheckCircle2 size={16} /> : step}
                </div>
                {step < 6 && <div className={`w-4 h-0.5 ${currentStep > step ? 'bg-emerald-500' : 'bg-white/20'}`}></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 flex gap-6">
          
          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            
            {/* STEP 1 */}
            {currentStep === 1 && (
              <Card className="border-slate-200 shadow-sm animate-in fade-in">
                <div className="bg-slate-100/50 p-4 border-b flex items-center gap-2 font-black text-upay-navy text-lg">
                  1. Campaign Objective
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Campaign Name</label>
                      <input type="text" className="w-full p-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-upay-blue text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Eid Salami Booster" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Objective</label>
                      <select className="w-full p-3 bg-white border rounded-xl outline-none text-sm" value={objective} onChange={e => setObjective(e.target.value)}>
                        <option value="acquisition">Acquisition</option>
                        <option value="activation">Activation</option>
                        <option value="retention">Retention</option>
                        <option value="winback">Win-back</option>
                        <option value="recharge_growth">Recharge Growth</option>
                        <option value="merchant_growth">Merchant Payment Growth</option>
                        <option value="bill_growth">Bill Payment Growth</option>
                        <option value="send_money_growth">Send Money Growth</option>
                        <option value="seasonal">Seasonal Campaign</option>
                        <option value="custom">Custom Objective</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Seasonal Context</label>
                      <select className="w-full p-3 bg-white border rounded-xl outline-none text-sm" value={seasonalContext} onChange={e => setSeasonalContext(e.target.value)}>
                        <option value="admission">University Admission</option>
                        <option value="eid">Eid / Salami</option>
                        <option value="ramadan">Ramadan</option>
                        <option value="pohela_boishakh">Pohela Boishakh</option>
                        <option value="salary">Salary / Month-End</option>
                        <option value="shopping">Shopping Season</option>
                        <option value="exam">Exam Season</option>
                        <option value="custom">Custom Event</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Campaign Description</label>
                      <textarea className="w-full p-3 bg-white border rounded-xl outline-none text-sm h-24" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the goal of this campaign..." />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={() => setCurrentStep(2)} className="bg-upay-navy text-white rounded-xl">Next: AI Audience <ChevronRight size={16} className="ml-1" /></Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <Card className="border-slate-200 shadow-sm animate-in fade-in">
                <div className="bg-slate-100/50 p-4 border-b flex items-center gap-2 font-black text-upay-navy text-lg">
                  2. AI Audience
                </div>
                <CardContent className="p-6 space-y-6">
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <label className="text-xs font-bold text-blue-800 uppercase block mb-2 flex items-center gap-2">
                      <BrainCircuit size={16} /> Ask AI to discover the audience
                    </label>
                    <div className="flex gap-2">
                      <input type="text" className="flex-1 p-3 bg-white border border-blue-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-upay-blue" value={audiencePrompt} onChange={e => setAudiencePrompt(e.target.value)} placeholder="e.g. Find students who are likely to accept an offer but have low recent offer exposure." />
                      <Button onClick={handleDiscoverAudience} disabled={isCopilotThinking} className="bg-upay-blue text-white rounded-xl font-bold whitespace-nowrap">
                        {isCopilotThinking ? "Analyzing..." : "Discover Audience"} <Sparkles size={16} className="ml-2" />
                      </Button>
                    </div>
                  </div>

                  {aiAudienceResult && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                      <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest border-b pb-2">AI Recommended Audience</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border shadow-sm">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Audience Size</div>
                          <div className="text-2xl font-black text-upay-navy">{aiAudienceResult.size.toLocaleString()}</div>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
                          <div className="text-[10px] uppercase font-bold text-emerald-700">High Response</div>
                          <div className="text-2xl font-black text-emerald-900">{aiAudienceResult.response}%</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                          <div className="text-[10px] uppercase font-bold text-blue-700">High Uplift</div>
                          <div className="text-2xl font-black text-blue-900">+{aiAudienceResult.uplift}%</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 shadow-sm">
                          <div className="text-[10px] uppercase font-bold text-purple-700">Low Fatigue</div>
                          <div className="text-2xl font-black text-purple-900">{aiAudienceResult.fatigue}%</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="border-upay-blue text-upay-blue rounded-xl font-bold">View Audience</Button>
                        <Button variant="outline" className="border-slate-300 text-slate-700 rounded-xl font-bold"><Filter size={16} className="mr-2" /> Adjust Filters</Button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4 border-t">
                    <Button onClick={() => setCurrentStep(1)} variant="ghost" className="text-slate-500">Back</Button>
                    <Button onClick={() => setCurrentStep(3)} disabled={!aiAudienceResult} className="bg-upay-navy text-white rounded-xl">Next: Offer & Channel <ChevronRight size={16} className="ml-1" /></Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <Card className="border-slate-200 shadow-sm animate-in fade-in">
                <div className="bg-slate-100/50 p-4 border-b flex items-center gap-2 font-black text-upay-navy text-lg">
                  3. Offer & Channel
                </div>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Offer Type</label>
                      <select className="w-full p-3 bg-white border rounded-xl outline-none text-sm" value={offerType} onChange={e => setOfferType(e.target.value)}>
                        <option value="recharge">Recharge</option>
                        <option value="merchant">Merchant Payment</option>
                        <option value="bill">Bill Payment</option>
                        <option value="send_money">Send Money</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Incentive Type</label>
                      <select className="w-full p-3 bg-white border rounded-xl outline-none text-sm" value={incentiveType} onChange={e => setIncentiveType(e.target.value)}>
                        <option value="cashback">Cashback (%)</option>
                        <option value="discount">Flat Discount</option>
                        <option value="bonus">Bonus Balance</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Incentive Value</label>
                      <input type="number" className="w-full p-3 bg-white border rounded-xl outline-none text-sm" value={incentiveValue} onChange={e => setIncentiveValue(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Max Reward</label>
                      <input type="number" className="w-full p-3 bg-white border rounded-xl outline-none text-sm" value={maxReward} onChange={e => setMaxReward(Number(e.target.value))} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Channel</label>
                      <select className="w-full p-3 bg-white border rounded-xl outline-none text-sm" value={channel} onChange={e => setChannel(e.target.value)}>
                        <option value="push">Push Notification</option>
                        <option value="sms">SMS</option>
                        <option value="inapp">In-App</option>
                        <option value="email">Email</option>
                        <option value="multi">Multi-channel</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Notification Message</label>
                      <textarea className="w-full p-3 bg-white border rounded-xl outline-none text-sm h-24 font-mono" value={message} onChange={e => setMessage(e.target.value)} />
                      <div className="text-[10px] text-slate-500 mt-1">Variables: {`{customer_name}, {offer_value}, {expiry_date}, {campaign_name}`}</div>
                    </div>
                  </div>
                  <div className="flex justify-between pt-4 border-t">
                    <Button onClick={() => setCurrentStep(2)} variant="ghost" className="text-slate-500">Back</Button>
                    <Button onClick={() => setCurrentStep(4)} className="bg-upay-navy text-white rounded-xl">Next: Budget & Schedule <ChevronRight size={16} className="ml-1" /></Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 4 */}
            {currentStep === 4 && (
              <Card className="border-slate-200 shadow-sm animate-in fade-in">
                <div className="bg-slate-100/50 p-4 border-b flex items-center gap-2 font-black text-upay-navy text-lg">
                  4. Budget & Schedule
                </div>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-blue-900 flex items-center gap-2"><Sparkles size={16} /> Optimize budget with AI</div>
                        <div className="text-xs text-blue-700">Calculate exact budget needed to capture available uplift.</div>
                      </div>
                      <Button className="bg-upay-blue text-white rounded-xl text-xs font-bold">Optimize</Button>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Campaign Budget (৳)</label>
                      <input type="number" className="w-full p-3 bg-white border rounded-xl outline-none text-sm font-bold text-upay-navy" value={budget} onChange={e => setBudget(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Maximum Campaign Cost (৳)</label>
                      <input type="number" className="w-full p-3 bg-white border rounded-xl outline-none text-sm font-bold text-slate-500" value={budget * 1.1} readOnly />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Start Date</label>
                      <input type="date" className="w-full p-3 bg-white border rounded-xl outline-none text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">End Date</label>
                      <input type="date" className="w-full p-3 bg-white border rounded-xl outline-none text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                  </div>

                  {/* Simulator */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 mt-4">
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><FlaskConical size={16} className="text-upay-blue" /> What-if Simulator</h4>
                    <div className="flex gap-2 mb-3">
                      <Button variant="outline" className="text-xs bg-white rounded-full">What happens if I increase the budget?</Button>
                      <Button variant="outline" className="text-xs bg-white rounded-full">What happens if I reduce the audience?</Button>
                    </div>
                    <div className="text-[10px] font-bold text-upay-blue uppercase tracking-widest">SIMULATION / WHAT-IF</div>
                  </div>

                  <div className="flex justify-between pt-4 border-t">
                    <Button onClick={() => setCurrentStep(3)} variant="ghost" className="text-slate-500">Back</Button>
                    <Button onClick={() => setCurrentStep(5)} className="bg-upay-navy text-white rounded-xl">Next: AI Analysis <ChevronRight size={16} className="ml-1" /></Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 5 */}
            {currentStep === 5 && (
              <Card className="border-slate-200 shadow-sm animate-in fade-in">
                <div className="bg-slate-100/50 p-4 border-b flex items-center gap-2 font-black text-upay-navy text-lg">
                  5. AI Analysis
                </div>
                <CardContent className="p-6">
                  {!analysisResult && !isAnalyzing && (
                    <div className="text-center py-12">
                      <BrainCircuit size={48} className="text-upay-blue mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-bold text-slate-700 mb-2">Run Final Pre-Flight Analysis</h3>
                      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">ImpactIQ will run Customer Eligibility → Lifecycle Intelligence → Uplift Modeling → Expected Value before this campaign can be approved.</p>
                      <Button onClick={handleRunAnalysis} className="bg-upay-blue text-white rounded-xl font-bold px-8 py-6 text-lg"><Sparkles size={20} className="mr-2" /> Run AI Analysis</Button>
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="text-center py-12">
                      <div className="animate-spin w-12 h-12 border-4 border-upay-blue border-t-transparent rounded-full mx-auto mb-4"></div>
                      <h3 className="text-lg font-bold text-slate-700">Analyzing Campaign Strategy...</h3>
                      <p className="text-sm text-slate-500">Calculating true causal incrementality</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* STEP 6 */}
            {currentStep === 6 && analysisResult && (
              <Card className="border-emerald-200 shadow-md animate-in fade-in bg-white overflow-hidden">
                <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-emerald-900 text-lg">
                    6. Review & Approval
                  </div>
                  <Badge className={campaignStatus === "SAVED" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}>
                    {campaignStatus === "SAVED" ? "READY FOR REVIEW" : "DRAFT"}
                  </Badge>
                </div>
                <CardContent className="p-0">
                  {campaignStatus === "SAVED" ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} />
                      </div>
                      <h2 className="text-2xl font-black text-upay-navy mb-2">Campaign Draft Created</h2>
                      <div className="text-slate-500 mb-8 space-y-1">
                        <p><strong>Campaign ID:</strong> CMP-{Math.floor(Math.random() * 10000)}</p>
                        <p><strong>Name:</strong> {name}</p>
                        <p><strong>Status:</strong> READY FOR REVIEW</p>
                      </div>
                      <div className="flex justify-center gap-4">
                        <Button variant="outline" className="rounded-xl border-slate-300 font-bold">View Campaign</Button>
                        <Button variant="outline" className="rounded-xl border-slate-300 font-bold">Edit</Button>
                        <Button onClick={onClose} className="bg-upay-navy text-white rounded-xl font-bold">Go to Campaigns</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 space-y-6">
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">AI RECOMMENDATION</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Audience</div>
                            <div className="text-xl font-black text-upay-navy">{analysisResult.audience.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-emerald-600 uppercase">Est. Uplift</div>
                            <div className="text-xl font-black text-emerald-700">+{analysisResult.uplift}%</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-blue-600 uppercase">Expected Value</div>
                            <div className="text-xl font-black text-blue-700">৳{analysisResult.incValue.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Est. Cost</div>
                            <div className="text-xl font-black text-slate-700">৳{analysisResult.cost.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border text-sm text-slate-700">
                          <strong className="text-upay-navy">WHY THIS CAMPAIGN?</strong>
                          <p className="mt-1">High-uplift student customers show strong predicted recharge behavior, while recent offer exposure remains low. The AI therefore recommends a targeted intervention instead of a broad cashback campaign.</p>
                        </div>
                      </div>

                      {showLaunchConfirm ? (
                        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl animate-in zoom-in-95">
                          <div className="flex items-start gap-4">
                            <ShieldAlert className="text-red-600 shrink-0 w-8 h-8" />
                            <div>
                              <h4 className="font-black text-red-900 text-lg mb-2">Explicit Confirmation Required</h4>
                              <p className="text-red-800 text-sm mb-4">You are about to activate this campaign for <strong>{analysisResult.audience.toLocaleString()} customers</strong> with an estimated cost of <strong>৳{analysisResult.cost.toLocaleString()}</strong>. This action will trigger customer notifications.</p>
                              <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setShowLaunchConfirm(false)} className="bg-white border-red-200 text-red-700 hover:bg-red-50 font-bold rounded-xl">Cancel</Button>
                                <Button onClick={handleActivate} className="bg-red-600 text-white hover:bg-red-700 font-bold rounded-xl shadow-md">Confirm & Activate</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                          <Button onClick={() => setCurrentStep(5)} variant="ghost" className="text-slate-500">Back to Analysis</Button>
                          <div className="flex gap-3">
                            <Button variant="outline" className="border-slate-300 rounded-xl font-bold">Edit Campaign</Button>
                            <Button onClick={handleSaveDraft} disabled={isSaving} className="bg-slate-800 text-white rounded-xl font-bold">
                              {isSaving ? "Saving..." : "Save Draft"}
                            </Button>
                            <Button onClick={() => setShowLaunchConfirm(true)} className="bg-upay-blue text-white rounded-xl font-bold shadow-md">Submit for Approval</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>

          {/* AI Assistant Sidebar Panel */}
          <div className="w-80 shrink-0 flex flex-col gap-4">
            <Card className="border-upay-blue/20 shadow-sm flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
              <div className="bg-upay-blue text-white p-3 font-bold text-sm flex items-center gap-2">
                <Bot size={16} /> AI Campaign Assistant
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm">
                <div className="bg-white border p-3 rounded-xl rounded-tl-none shadow-sm text-slate-700">
                  Hi! I'm your AI Campaign Assistant. Need help targeting the right audience or optimizing your budget?
                </div>
                {/* Example user prompts to click */}
                <div className="space-y-2 mt-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Try asking:</div>
                  <button onClick={() => setAudiencePrompt("Find students who are likely to accept an offer.")} className="block w-full text-left text-xs bg-white border border-slate-200 p-2 rounded-lg text-slate-600 hover:border-upay-blue hover:text-upay-blue transition-colors">"Find students who are likely to accept an offer."</button>
                  <button onClick={() => setAudiencePrompt("Optimize this campaign for a 5 lakh budget.")} className="block w-full text-left text-xs bg-white border border-slate-200 p-2 rounded-lg text-slate-600 hover:border-upay-blue hover:text-upay-blue transition-colors">"Optimize this campaign for a 5 lakh budget."</button>
                  <button onClick={() => setAudiencePrompt("Why are you recommending this audience?")} className="block w-full text-left text-xs bg-white border border-slate-200 p-2 rounded-lg text-slate-600 hover:border-upay-blue hover:text-upay-blue transition-colors">"Why are you recommending this audience?"</button>
                </div>
              </div>
              <div className="p-3 bg-white border-t">
                <div className="relative">
                  <input type="text" placeholder="Ask AI Assistant..." className="w-full bg-slate-50 border rounded-xl py-2 pl-3 pr-10 text-xs outline-none focus:ring-1 focus:ring-upay-blue" />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-upay-blue"><Send size={14} /></button>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
