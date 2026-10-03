"use client";

import { useState } from "react";
import { Zap, Target, Users, CheckCircle2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Campaign, OfferType } from "@/lib/intelligence/types";
import { useIntelligenceStore } from "@/lib/intelligence/store";

interface GlobalCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalCampaignModal({ isOpen, onClose }: GlobalCampaignModalProps) {
  const { kpis, runIntelligencePipeline } = useIntelligenceStore();

  const [campaignName, setCampaignName] = useState("");
  const [offerType, setOfferType] = useState<OfferType>("recharge_cashback");
  const [targetType, setTargetType] = useState<"ALL" | "AI_OPTIMIZED" | "CUSTOM">("AI_OPTIMIZED");
  const [budget, setBudget] = useState(50000);
  const [cashback, setCashback] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Custom filters
  const [filterLifecycle, setFilterLifecycle] = useState("ALL");
  const [filterService, setFilterService] = useState("ALL");

  const expectedReach = Math.floor(budget / cashback);

  const handleCreate = async () => {
    setIsSaving(true);
    
    const newCampaign: Campaign = {
      id: `CAM${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      name: campaignName || "Untitled Campaign",
      offerType,
      cashbackAmount: cashback,
      minTransaction: 100, // default
      budgetTotal: budget,
      budgetUsed: 0,
      capacityLimit: expectedReach,
      channel: "push",
      targetProduct: offerType === "merchant_cashback" ? "merchant_payment" : "mobile_recharge",
      duration: 7,
      isActive: true,
    };
    
    useIntelligenceStore.getState().addCampaign(newCampaign);
    
    // Create notifications for the targeted users
    // For demo purposes, we will target synthetic IDs based on the expected reach
    const syntheticTargetIds = Array.from({ length: Math.min(expectedReach, 500) }, (_, i) => `C${Math.floor(Math.random() * 10000)}`);
    
    import("@/lib/notifications/store").then(({ useNotificationStore }) => {
      useNotificationStore.getState().createNotificationsForCampaign(
        newCampaign.id,
        newCampaign.name,
        syntheticTargetIds,
        {
          title: newCampaign.name,
          body: `Complete a ${newCampaign.targetProduct.replace('_', ' ')} of ৳${newCampaign.minTransaction} or more to get ৳${newCampaign.cashbackAmount} cashback!`,
          ctaText: "Claim Offer",
          ctaUrl: `/customer/impactiq`
        }
      );
    });
    
    await new Promise(r => setTimeout(r, 1000));
    setIsSuccess(true);
    setIsSaving(false);

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-2xl p-0 bg-white rounded-3xl border-none shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-upay-navy text-white p-6 pb-8 rounded-b-[40px] relative">
          <h2 className="text-2xl font-black mb-1">Launch New Campaign</h2>
          <p className="text-slate-300 text-sm">Design a highly targeted campaign and deploy to ImpactIQ Engine.</p>
        </div>

        <div className="p-6 -mt-6 relative z-10 space-y-6">
          {isSuccess ? (
            <div className="bg-emerald-50 text-emerald-800 p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 border border-emerald-100">
              <CheckCircle2 size={48} className="text-emerald-500" />
              <h3 className="text-xl font-black">Campaign Created!</h3>
              <p className="text-sm">The campaign has been added to the Active Optimizer for next run.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Eid Special Cash Out" 
                    className="w-full p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-upay-blue outline-none text-sm font-medium"
                    value={campaignName}
                    onChange={e => setCampaignName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Targeting Strategy</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${targetType === "ALL" ? "border-upay-blue bg-upay-blue/5 ring-1 ring-upay-blue" : "hover:bg-slate-50"}`}>
                      <input 
                        type="radio" 
                        name="targetType" 
                        value="ALL" 
                        checked={targetType === "ALL"} 
                        onChange={() => setTargetType("ALL")}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2 font-bold text-sm text-upay-navy mb-1">
                        <Users size={16} className={targetType === "ALL" ? "text-upay-blue" : "text-slate-400"}/> 
                        All Customers
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight">Broadcast to everyone. High cost, broad reach.</p>
                    </label>

                    <label className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${targetType === "AI_OPTIMIZED" ? "border-upay-blue bg-upay-blue/5 ring-1 ring-upay-blue" : "hover:bg-slate-50"}`}>
                      <input 
                        type="radio" 
                        name="targetType" 
                        value="AI_OPTIMIZED" 
                        checked={targetType === "AI_OPTIMIZED"} 
                        onChange={() => setTargetType("AI_OPTIMIZED")}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2 font-bold text-sm text-upay-navy mb-1">
                        <Target size={16} className={targetType === "AI_OPTIMIZED" ? "text-upay-blue" : "text-slate-400"}/> 
                        AI Optimized
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight">Let ImpactIQ Engine select highly persuadable users automatically.</p>
                    </label>

                    <label className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${targetType === "CUSTOM" ? "border-upay-blue bg-upay-blue/5 ring-1 ring-upay-blue" : "hover:bg-slate-50"}`}>
                      <input 
                        type="radio" 
                        name="targetType" 
                        value="CUSTOM" 
                        checked={targetType === "CUSTOM"} 
                        onChange={() => setTargetType("CUSTOM")}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2 font-bold text-sm text-upay-navy mb-1">
                        <Filter size={16} className={targetType === "CUSTOM" ? "text-upay-blue" : "text-slate-400"}/> 
                        Custom Segment
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight">Manually select specific user segments & lifecycle groups.</p>
                    </label>
                  </div>
                </div>

                {/* Custom Filters section - only shows if CUSTOM is selected */}
                {targetType === "CUSTOM" && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-upay-navy uppercase tracking-widest border-b pb-2">Define Target Audience</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lifecycle Stage</label>
                        <select 
                          className="w-full p-2 bg-white border rounded-lg focus:ring-1 focus:ring-upay-blue outline-none text-xs font-medium"
                          value={filterLifecycle}
                          onChange={e => setFilterLifecycle(e.target.value)}
                        >
                          <option value="ALL">Any Lifecycle</option>
                          <option value="ACQUISITION">Acquisition (&lt; 30 days)</option>
                          <option value="ENGAGEMENT">Engagement (Active)</option>
                          <option value="RETENTION">Retention (At Risk)</option>
                          <option value="WIN_BACK">Win-back (Dormant)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preferred Service</label>
                        <select 
                          className="w-full p-2 bg-white border rounded-lg focus:ring-1 focus:ring-upay-blue outline-none text-xs font-medium"
                          value={filterService}
                          onChange={e => setFilterService(e.target.value)}
                        >
                          <option value="ALL">Any Service</option>
                          <option value="recharge">Mobile Recharge</option>
                          <option value="merchant_payment">Merchant Payment</option>
                          <option value="send_money">Send Money</option>
                          <option value="cash_out">Cash Out</option>
                          <option value="bill_payment">Bill Payment</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Offer Strategy</label>
                    <select 
                      className="w-full p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-upay-blue outline-none text-sm font-medium"
                      value={offerType}
                      onChange={e => setOfferType(e.target.value as OfferType)}
                    >
                      <option value="recharge_cashback">Mobile Recharge</option>
                      <option value="merchant_cashback">Merchant Payment</option>
                      <option value="winback_benefit">Win-back Offer</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Cost (৳)</label>
                    <input 
                      type="number" 
                      className="w-full p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-upay-blue outline-none text-sm font-medium"
                      value={cashback}
                      onChange={e => setCashback(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Allocated Budget (৳)</label>
                  <input 
                    type="number" 
                    className="w-full p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-upay-blue outline-none text-sm font-medium"
                    value={budget}
                    onChange={e => setBudget(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Insights */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-bold text-slate-600">
                  <Zap size={16} className="text-upay-yellow" /> Maximum Capacity:
                </div>
                <div className="font-black text-upay-navy">{expectedReach.toLocaleString()} Customers</div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleCreate} 
                  disabled={isSaving}
                  className="w-full bg-upay-navy hover:bg-upay-navy/90 text-white h-12 text-lg font-bold rounded-xl"
                >
                  {isSaving ? "Creating..." : "Create Global Campaign"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
