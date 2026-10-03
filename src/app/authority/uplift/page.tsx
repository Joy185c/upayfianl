"use client";

import { useEffect, useState } from "react";
import { TrendingUp, BarChart2, Info, Users, AlertTriangle } from "lucide-react";
import { useIntelligenceStore } from "@/lib/intelligence/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthorityUplift() {
  const { kpis, getSegments, lastRunAt, isRunning, decisions, campaigns } = useIntelligenceStore();
  const [mounted, setMounted] = useState(false);

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

  const segments = getSegments();
  const totalAnalyzed = kpis.totalCustomers;

  const getPercentage = (val: number) => totalAnalyzed > 0 ? ((val / totalAnalyzed) * 100).toFixed(1) + "%" : "0%";

  // Calculate NBO Distribution
  const nboCounts: Record<string, number> = {};
  decisions.forEach(d => {
    if (d.action === "TARGET") {
      const camp = campaigns.find(c => c.id === d.offerId);
      const name = camp ? camp.name : "Non-promotional Action";
      nboCounts[name] = (nboCounts[name] || 0) + 1;
    }
  });

  const nboEntries = Object.entries(nboCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-upay-navy tracking-tight">Uplift & NBO Models</h1>
          <p className="text-muted-foreground mt-1">Deep dive into Incremental Modeling and Next Best Action algorithms.</p>
        </div>
        <div className="text-sm font-bold bg-muted px-4 py-2 rounded-lg text-muted-foreground">
          Models evaluated across <span className="text-upay-navy">{totalAnalyzed.toLocaleString()}</span> simulated users
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-upay-blue" /> Uplift Modeling
            </CardTitle>
            <CardDescription>Targeting the "Persuadables"</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-foreground leading-relaxed">
              <p>
                The ImpactIQ Uplift model predicts the <strong>incremental impact</strong> of a marketing action. Instead of predicting if someone will respond, it predicts if they will respond <em>because</em> of the offer.
              </p>
              
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                  <h4 className="font-bold text-emerald-800 text-xs uppercase mb-1">Persuadables</h4>
                  <p className="text-2xl font-black text-emerald-600">{segments["Persuadable"]?.toLocaleString() || 0}</p>
                  <p className="text-[10px] text-emerald-700/80 mt-1">Only buy because of offer. <b>Target these!</b></p>
                </div>
                
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                  <h4 className="font-bold text-slate-600 text-xs uppercase mb-1">Sure Things</h4>
                  <p className="text-2xl font-black text-slate-500">{segments["Sure Thing"]?.toLocaleString() || 0}</p>
                  <p className="text-[10px] text-slate-500/80 mt-1">Will buy regardless. <b>Save budget.</b></p>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                  <h4 className="font-bold text-slate-600 text-xs uppercase mb-1">Lost Causes</h4>
                  <p className="text-2xl font-black text-slate-500">{segments["Lost Cause"]?.toLocaleString() || 0}</p>
                  <p className="text-[10px] text-slate-500/80 mt-1">Won't buy regardless. <b>Save budget.</b></p>
                </div>

                <div className="bg-red-50 border border-red-100 p-3 rounded-lg">
                  <h4 className="font-bold text-red-800 text-xs uppercase mb-1">Sleeping Dogs</h4>
                  <p className="text-2xl font-black text-red-600">{segments["Negative Uplift"]?.toLocaleString() || 0}</p>
                  <p className="text-[10px] text-red-700/80 mt-1">Offer causes churn. <b>Do NOT target!</b></p>
                </div>
              </div>

              <div className="mt-4 bg-upay-blue/5 border border-upay-blue/20 p-4 rounded-lg flex gap-3 items-start">
                <Info className="text-upay-blue flex-shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-upay-navy font-medium">By targeting only the <strong>{getPercentage(segments["Persuadable"] || 0)}</strong> of users classified as Persuadables, the engine ensures maximum incremental ROI while minimizing cannibalization on Sure Things.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="text-upay-yellow" /> Marketing Fatigue Risk
            </CardTitle>
            <CardDescription>Protecting the customer relationship</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-foreground leading-relaxed">
              <p>
                The Fatigue model prevents over-communication by suppressing targets who have received too many offers recently or show declining engagement.
              </p>
              
              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Population Risk Levels</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span className="text-red-600">High Risk (Suppressed)</span>
                      <span>{getPercentage(kpis.highFatigue)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: getPercentage(kpis.highFatigue) }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span className="text-yellow-600">Medium Risk (Monitored)</span>
                      <span>{getPercentage(kpis.mediumFatigue)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: getPercentage(kpis.mediumFatigue) }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span className="text-emerald-600">Low Risk (Targetable)</span>
                      <span>{getPercentage(kpis.lowFatigue)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: getPercentage(kpis.lowFatigue) }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="text-indigo-500" /> Lifecycle Intelligence
            </CardTitle>
            <CardDescription>Right action at the right stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-foreground leading-relaxed">
              <p>
                The ImpactIQ engine predicts the current journey stage of each customer. This determines what type of intervention is required.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">Acquisition</h4>
                    <p className="text-lg font-black text-upay-navy">{kpis.acquisition}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">{getPercentage(kpis.acquisition)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">Activation</h4>
                    <p className="text-lg font-black text-upay-navy">{kpis.activation}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">{getPercentage(kpis.activation)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">Engagement</h4>
                    <p className="text-lg font-black text-upay-navy">{kpis.engagement}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">{getPercentage(kpis.engagement)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">Retention</h4>
                    <p className="text-lg font-black text-upay-navy">{kpis.retention}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">{getPercentage(kpis.retention)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center col-span-2">
                  <div>
                    <h4 className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">Win-back</h4>
                    <p className="text-lg font-black text-upay-navy">{kpis.win_back}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">{getPercentage(kpis.win_back)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="text-emerald-500" /> Next Best Action (NBO)
            </CardTitle>
            <CardDescription>Actions evaluated and assigned by the AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-foreground leading-relaxed">
              <p>
                Rather than sending the same offer to everyone, the engine evaluates all active campaigns for every user and selects the single action that maximizes expected incremental value.
              </p>

              {nboEntries.length === 0 ? (
                <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center mt-4">
                  <p className="text-muted-foreground font-medium">No actions allocated.</p>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {nboEntries.map(([name, count], idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <div className="font-medium text-upay-navy">{name}</div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-lg text-emerald-600">{count}</span>
                        <span className="text-xs text-muted-foreground">users</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Non-targeted users */}
                  <div className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded-lg mt-4">
                    <div className="font-medium text-slate-500">Hold / Suppressed / No Action</div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-lg text-slate-600">
                        {totalAnalyzed - nboEntries.reduce((sum, entry) => sum + entry[1], 0)}
                      </span>
                      <span className="text-xs text-muted-foreground">users</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
