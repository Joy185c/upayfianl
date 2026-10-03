"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Zap, Sparkles, AlertCircle, Info, ChevronRight, TrendingUp, CheckCircle2, Gift, BrainCircuit, Play } from "lucide-react";
import { useWalletStore } from "@/lib/store";
import { useIntelligenceStore } from "@/lib/intelligence/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { Campaign } from "@/lib/intelligence/types";

function ImpactIQContent() {
  const { wallet, benefitClaims, claimBenefit } = useWalletStore();
  const { 
    lastRunAt, 
    isRunning, 
    runIntelligencePipeline, 
    getCustomerNBO, 
    getCustomerInsights,
    campaigns,
    customers 
  } = useIntelligenceStore();
  
  const searchParams = useSearchParams();
  const targetCampaignId = searchParams?.get("campaignId");
  
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Demo fallback state if engine not run
  if (!lastRunAt && !isRunning) {
    return (
      <div className="flex flex-col bg-background min-h-full items-center justify-center p-6 text-center space-y-6">
        <div className="bg-upay-blue/10 p-5 rounded-full">
          <BrainCircuit size={48} className="text-upay-blue" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-upay-navy mb-2">ImpactIQ Offline</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            The intelligence engine hasn't processed data yet. For this hackathon demo, please run the pipeline first.
          </p>
        </div>
        <Button 
          onClick={runIntelligencePipeline}
          className="bg-upay-yellow text-upay-navy hover:bg-upay-yellow/90 font-bold px-8 py-6 rounded-2xl w-full max-w-sm text-base shadow-lg flex items-center justify-center gap-3"
        >
          <Play size={20} fill="currentColor" />
          Run Intelligence Engine
        </Button>
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] space-y-6 text-center">
        <div className="animate-pulse bg-upay-blue w-20 h-20 rounded-full flex items-center justify-center shadow-lg">
          <BrainCircuit size={40} className="text-white animate-spin-slow" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-upay-navy">Personalizing Your Experience...</h3>
          <p className="text-sm text-muted-foreground mt-2 animate-pulse">Analyzing behavior → Calculating NBO → Curating insights...</p>
        </div>
      </div>
    );
  }

  // Dynamically select customer
  const validCustomer = customers.find(c => c.id === wallet.id) || customers[0];
  const customerId = validCustomer?.id;
  
  if (!customerId) {
    return (
      <div className="flex flex-col bg-background min-h-full items-center justify-center p-6 text-center space-y-6">
        <div className="bg-upay-blue/10 p-5 rounded-full">
          <AlertCircle size={48} className="text-upay-blue" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-upay-navy mb-2">No Customers Found</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Please upload a valid JSON dataset in the Admin Panel to see personalized insights.
          </p>
        </div>
      </div>
    );
  }

  // We moved useSearchParams to the top level to fix Rules of Hooks
  const decision = getCustomerNBO(customerId);
  const insights = getCustomerInsights(customerId);

  const handleClaim = async (campaign: Campaign) => {
    setClaimingId(campaign.id);
    try {
      const res = await claimBenefit(campaign.id, campaign.name, campaign.cashbackAmount);
      if (res.success) {
        toast.success(res.message, { duration: 4000 });
        
        // Also mark as converted in Notification Store for analytics
        import("@/lib/notifications/store").then(({ useNotificationStore }) => {
          useNotificationStore.getState().markAsConverted(campaign.id, customerId);
        });
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Failed to claim offer.");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-full">
      {/* Header */}
      <div className="bg-upay-navy text-white px-6 pt-12 pb-8 rounded-b-[2rem] shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-upay-blue rounded-full opacity-20 -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-white p-1 shadow-md border border-white/20 flex items-center justify-center shrink-0">
            <Image
              src="/logo.png"
              alt="ImpactIQ Logo"
              width={40}
              height={40}
              className="object-contain w-full h-full"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">ImpactIQ Benefits</h1>
            <p className="text-xs text-white/80">AI-curated offers & financial insights</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Personal Insights Section */}
        {insights.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-upay-blue" />
              <h2 className="text-xs font-bold text-upay-navy uppercase tracking-wider">Your Personal Insights</h2>
            </div>
            <Card className="border-upay-blue/20 shadow-sm bg-gradient-to-br from-white to-upay-blue/5 rounded-2xl">
              <CardContent className="p-5">
                <ul className="space-y-3.5">
                  {insights.map((insight, idx) => (
                    <li key={idx} className="flex gap-3 items-start text-xs">
                      <div className="mt-0.5 bg-upay-blue/10 p-1 rounded-lg text-upay-blue shrink-0">
                        <TrendingUp size={14} />
                      </div>
                      <p className="text-upay-navy font-semibold leading-relaxed">{insight}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Recommended Benefits Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Gift size={18} className="text-upay-yellow fill-upay-yellow" />
            <h2 className="text-xs font-bold text-upay-navy uppercase tracking-wider">Recommended Offers for You</h2>
          </div>
          
          <div className="space-y-4">
            {(() => {
              const campaignToDisplay = targetCampaignId 
                ? campaigns.find(c => c.id === targetCampaignId) 
                : (decision ? campaigns.find(c => c.id === decision.offerId) : null);
              
              if (!campaignToDisplay) {
                return (
                  <Card className="border-border shadow-sm bg-muted/30 overflow-hidden rounded-2xl">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <CheckCircle2 size={24} className="text-emerald-500" />
                      </div>
                      <h3 className="text-sm font-bold text-upay-navy mb-1">You're all caught up!</h3>
                      <p className="text-xs text-muted-foreground">
                        Our AI has analyzed your profile and determined you're receiving maximum value right now. We'll protect you from offer fatigue and notify you when a highly relevant benefit is available.
                      </p>
                    </CardContent>
                  </Card>
                );
              }
              
              const campaign = campaignToDisplay;
              const isClaimed = benefitClaims.some((c) => c.benefit_id === campaign.id);

              return (
                <Card key={campaign.id} className="border-upay-yellow/40 shadow-md bg-white overflow-hidden relative rounded-2xl">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-upay-yellow"></div>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-upay-yellow/20 text-upay-navy uppercase tracking-wider">
                        {targetCampaignId ? "Exclusive Offer" : "Highest Match"}
                      </span>
                      {decision && decision.offerId === campaign.id && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="text-muted-foreground hover:text-upay-blue transition-colors flex items-center gap-1 text-xs font-semibold">
                              <Info size={14} /> Why this?
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md rounded-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-upay-navy text-base">
                                <Sparkles size={18} className="text-upay-blue" /> Explainable AI Recommendation
                              </DialogTitle>
                              <DialogDescription className="text-xs">
                                ImpactIQ decision engine selected this offer for you based on:
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 mt-3">
                              <div className="bg-slate-50 p-3 rounded-lg border text-xs">
                                <h4 className="font-bold text-upay-navy mb-2 uppercase tracking-widest text-[10px]">Model Explainability (Pipeline)</h4>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div><span className="text-muted-foreground block">Treatment Prob:</span> <span className="font-bold">{(decision.pResponseWithOffer * 100).toFixed(1)}%</span></div>
                                  <div><span className="text-muted-foreground block">Control Prob:</span> <span className="font-bold">{(decision.pResponseWithoutOffer * 100).toFixed(1)}%</span></div>
                                  <div><span className="text-muted-foreground block">Calculated Uplift:</span> <span className="font-bold text-emerald-600">+{(decision.uplift * 100).toFixed(1)}%</span></div>
                                  <div><span className="text-muted-foreground block">Uplift Segment:</span> <span className="font-bold text-upay-navy">{decision.upliftSegment}</span></div>
                                  <div><span className="text-muted-foreground block">Fatigue Level:</span> <span className="font-bold">{decision.fatigueLevel}</span></div>
                                  <div><span className="text-muted-foreground block">Lifecycle Stage:</span> <span className="font-bold">{decision.lifecycle}</span></div>
                                  <div><span className="text-muted-foreground block">Expected Incr. Value:</span> <span className="font-bold text-upay-blue">৳{decision.expectedIncrementalValue.toFixed(2)}</span></div>
                                  <div><span className="text-muted-foreground block">Action Assigned:</span> <span className="font-bold">{decision.action}</span></div>
                                </div>
                              </div>
                              
                              <div className="space-y-2 text-xs">
                                <h4 className="font-bold text-upay-navy uppercase tracking-widest text-[10px]">Top Positive Factors</h4>
                                {decision.customerReason.map((reason, rIdx) => (
                                  <div key={rIdx} className="flex gap-2 items-start">
                                    <div className="mt-0.5 text-emerald-600 shrink-0">
                                      <CheckCircle2 size={12} />
                                    </div>
                                    <p className="text-foreground font-medium">{reason}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-black text-upay-navy mb-1 leading-tight">{campaign.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                      Personalized AI benefit for you. Get ৳{campaign.cashbackAmount} instant cashback on your next {campaign.targetProduct.replace("_", " ")}.
                    </p>
                    
                    {isClaimed ? (
                      <Button disabled className="w-full bg-emerald-100 text-emerald-800 font-extrabold rounded-xl text-xs py-5">
                        <CheckCircle2 size={16} className="mr-1.5" /> Benefit Activated & Claimed
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleClaim(campaign)}
                        disabled={claimingId === campaign.id}
                        className="w-full bg-upay-yellow text-upay-navy hover:bg-upay-yellow/90 font-extrabold rounded-xl group text-xs py-5 shadow-sm"
                      >
                        {claimingId === campaign.id ? "Activating..." : "Claim & Activate Benefit"}{" "}
                        <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </section>

        {/* Claimed History List */}
        {benefitClaims.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <h2 className="text-xs font-bold text-upay-navy uppercase tracking-wider">Your Activated Claims</h2>
            </div>
            <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border/60">
              {benefitClaims.map((claim) => (
                <div key={claim.id} className="p-3.5 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-upay-navy">{claim.title}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(claim.created_at).toLocaleDateString()}</p>
                  </div>
                  {claim.cashback_amount > 0 && (
                    <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      +৳{claim.cashback_amount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

import { Suspense } from "react";

export default function ImpactIQPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-slate-500">Loading personalized offers...</div>}>
      <ImpactIQContent />
    </Suspense>
  );
}
