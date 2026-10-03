"use client";

import { BrainCircuit, Database, GitBranch, Target, Zap, ArrowRight, Activity, Cpu, Users, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function HowAIWorksPage() {
  const steps = [
    {
      icon: Database,
      title: "Step 1: Feature Engineering",
      color: "text-blue-500",
      bgColor: "bg-blue-100",
      description: "Raw transaction data (recharges, merchant payments, activity gaps) is ingested and transformed into powerful customer profiles.",
      details: "Calculates Recency, Frequency, Monetary value (RFM), and assigns a baseline segment."
    },
    {
      icon: Users,
      title: "Step 2: Unsupervised Segmentation (Clustering)",
      color: "text-indigo-500",
      bgColor: "bg-indigo-100",
      description: "Customers are automatically grouped into natural clusters based on behavior patterns without human rules.",
      details: "Finds hidden patterns like 'High Value but Dormant' or 'Low Value but Highly Active'."
    },
    {
      icon: GitBranch,
      title: "Step 3: T-Learner Uplift Modeling",
      color: "text-emerald-500",
      bgColor: "bg-emerald-100",
      description: "Pre-calibrated T-Learner-style two-model uplift scoring engine predicts probability. P(Response | Offer) minus P(Response | No Offer) = True Uplift.",
      details: "Separates the 'Sure Things' (who will transact anyway) from the 'Persuadables'."
    },
    {
      icon: Activity,
      title: "Step 4: Campaign Fatigue Management",
      color: "text-orange-500",
      bgColor: "bg-orange-100",
      description: "Analyzes how many offers a user has received recently and applies a dynamic penalty to prevent brand annoyance.",
      details: "High fatigue reduces the Uplift score dramatically, shifting action to 'HOLD'."
    },
    {
      icon: Target,
      title: "Step 5: NBO & Knapsack Optimization",
      color: "text-upay-blue",
      bgColor: "bg-upay-blue/10",
      description: "The AI looks at all available campaigns and allocates the budget to maximize total Expected Incremental Value (EIV).",
      details: "Selects the absolute best campaign for every user until the global budget is strictly exhausted."
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-upay-navy tracking-tight flex items-center gap-2">
          <Cpu className="text-upay-blue" size={28} /> AI Engine Explainability
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">
          A step-by-step transparent view into how ImpactIQ transforms raw data into intelligent campaign decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Step by Step Flow */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-4">The Decision Pipeline</h3>
          
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative pl-8">
                  <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full ${step.bgColor} flex items-center justify-center border-4 border-slate-50 shadow-sm`}>
                    <Icon size={14} className={step.color} />
                  </div>
                  
                  <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <h4 className="font-bold text-upay-navy text-lg">{step.title}</h4>
                      <p className="text-sm font-medium text-slate-600 mt-2">
                        {step.description}
                      </p>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                          <BrainCircuit size={12} className={step.color} /> 
                          {step.details}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Graph/Visualizations */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-upay-navy to-[#0a1e3f] text-white border-none shadow-xl overflow-hidden relative">
            <div className="absolute right-0 top-0 w-64 h-64 bg-upay-blue/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <CardContent className="p-8 relative z-10">
              <h3 className="font-black text-2xl mb-2 flex items-center gap-2">
                <Target className="text-upay-yellow" /> The Uplift Equation
              </h3>
              <p className="text-white/70 text-sm font-medium mb-8">How we identify who actually needs an offer.</p>

              <div className="space-y-4 font-mono text-sm">
                <div className="bg-white/10 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                  <span>P(Response | <span className="text-emerald-400">Treatment</span>)</span>
                  <span className="font-bold text-lg">75%</span>
                </div>
                <div className="text-center text-white/50 font-black text-xl">-</div>
                <div className="bg-white/10 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                  <span>P(Response | <span className="text-red-400">Control</span>)</span>
                  <span className="font-bold text-lg">65%</span>
                </div>
                <div className="text-center text-white/50 font-black text-xl">=</div>
                <div className="bg-upay-blue/30 p-4 rounded-xl border border-upay-blue flex justify-between items-center ring-2 ring-upay-blue ring-offset-2 ring-offset-[#0a1e3f]">
                  <span className="font-bold text-upay-yellow">True Uplift (Incrementality)</span>
                  <span className="font-black text-2xl text-upay-yellow">10%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <CardContent className="p-6">
              <h3 className="font-bold text-upay-navy mb-4">Customer Quadrants (Action Matrix)</h3>
              <div className="grid grid-cols-2 gap-2 h-48">
                <div className="bg-emerald-50 rounded-lg p-3 flex flex-col justify-between border border-emerald-100">
                  <span className="text-xs font-bold text-emerald-700 uppercase">Persuadables</span>
                  <span className="text-[10px] text-emerald-600 font-medium">High Uplift. Needs offer to act. <br/><b>(TARGET)</b></span>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 flex flex-col justify-between border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase">Sure Things</span>
                  <span className="text-[10px] text-slate-500 font-medium">Will buy anyway. Don't waste budget. <br/><b>(DO NOT TARGET)</b></span>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 flex flex-col justify-between border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase">Lost Causes</span>
                  <span className="text-[10px] text-slate-500 font-medium">Won't buy even with offer. <br/><b>(DO NOT TARGET)</b></span>
                </div>
                <div className="bg-red-50 rounded-lg p-3 flex flex-col justify-between border border-red-100">
                  <span className="text-xs font-bold text-red-700 uppercase">Sleeping Dogs</span>
                  <span className="text-[10px] text-red-600 font-medium">Offer will annoy them (Negative Uplift). <br/><b>(SUPPRESS)</b></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Model Transparency Section */}
      <div className="mt-8">
        <Card className="bg-slate-900 text-slate-200 border-none">
          <CardContent className="p-6">
            <h3 className="font-bold text-white mb-2 uppercase tracking-widest text-xs">Model Transparency</h3>
            <p className="text-sm font-mono mb-4 text-slate-400">
              Current Prototype: "Pre-calibrated T-Learner-style two-model uplift scoring."
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono mb-4">
              <div className="bg-slate-800 p-3 rounded">
                <span className="text-emerald-400 block mb-1">Treatment model:</span>
                P(Response | Offer)
              </div>
              <div className="bg-slate-800 p-3 rounded">
                <span className="text-red-400 block mb-1">Control model:</span>
                P(Response | No Offer)
              </div>
              <div className="bg-slate-800 p-3 rounded border border-upay-blue">
                <span className="text-upay-blue block mb-1">Uplift:</span>
                Treatment probability - Control probability
              </div>
            </div>
            <p className="text-xs text-slate-500 italic">
              Production Evolution: Historical randomized treatment/control data → model training → validation → calibrated uplift predictions.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="mt-12 space-y-6">
        <div>
          <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-4">AI Transparency</h3>
          <h2 className="text-2xl font-black text-upay-navy flex items-center gap-2">
            <HelpCircle className="text-upay-blue" size={24} /> Frequently Asked Questions
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-none shadow-sm hover:shadow-md transition-all group">
            <CardContent className="p-6">
              <h4 className="font-bold text-lg text-upay-navy group-hover:text-upay-blue transition-colors">
                Q: How do you decide who gets the campaign? (Right Action)
              </h4>
              <p className="text-sm text-slate-600 mt-2 font-medium">
                A: We look at the <span className="font-bold text-emerald-600">Customer Quadrants</span>. We exclusively target the <span className="font-bold">"Persuadables"</span>—customers who only convert if given an offer. We do not waste budget on "Sure Things" (who will transact anyway).
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-all group">
            <CardContent className="p-6">
              <h4 className="font-bold text-lg text-upay-navy group-hover:text-upay-blue transition-colors">
                Q: How does the Uplift Measurement work? (Advanced Idea)
              </h4>
              <p className="text-sm text-slate-600 mt-2 font-medium">
                A: We use a <span className="font-bold text-emerald-600">T-Learner Model</span>. It calculates the probability of response with an offer <code>P(Treatment)</code> and subtracts the probability of response without the offer <code>P(Control)</code>. The difference is the <span className="font-bold">True Uplift</span>.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-all group">
            <CardContent className="p-6">
              <h4 className="font-bold text-lg text-upay-navy group-hover:text-upay-blue transition-colors">
                Q: Are you spamming customers? How do you prevent annoyance?
              </h4>
              <p className="text-sm text-slate-600 mt-2 font-medium">
                A: We built a <span className="font-bold text-orange-500">Fatigue Model</span> (Step 4). If a user receives too many offers (high fatigue), their predicted response rate drops heavily, causing the AI to flag them as a "Sleeping Dog" and <span className="font-bold text-red-500">SUPPRESS</span> the communication.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-all group">
            <CardContent className="p-6">
              <h4 className="font-bold text-lg text-upay-navy group-hover:text-upay-blue transition-colors">
                Q: How do you optimize a limited budget? (Next Best Offer)
              </h4>
              <p className="text-sm text-slate-600 mt-2 font-medium">
                A: We use a <span className="font-bold text-upay-blue">Knapsack Algorithm</span> (Step 5). It ranks all customers across all eligible campaigns by their Expected Incremental Value (EIV). It allocates the budget greedily to the highest ROI targets until the global budget is exhausted.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
