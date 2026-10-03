"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Target, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BrainCircuit,
  Play,
  ArrowRight
} from "lucide-react";
import { useIntelligenceStore } from "@/lib/intelligence/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ['#0555A4', '#16A34A', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AuthorityOverview() {
  const { kpis, isRunning, lastRunAt, runIntelligencePipeline } = useIntelligenceStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!lastRunAt && !isRunning) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] max-w-md mx-auto text-center space-y-6">
        <div className="bg-upay-blue/10 p-6 rounded-full">
          <BrainCircuit size={48} className="text-upay-blue" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-upay-navy mb-2">ImpactIQ Engine Offline</h2>
          <p className="text-muted-foreground text-sm">
            The intelligence pipeline has not been executed yet. Run the demo to generate synthetic data, extract features, and execute the ML models.
          </p>
        </div>
        <Button 
          onClick={runIntelligencePipeline}
          className="bg-upay-yellow text-upay-navy hover:bg-upay-yellow/90 font-bold px-8 py-6 rounded-2xl w-full text-lg shadow-lg flex items-center gap-3"
        >
          <Play size={24} fill="currentColor" />
          Run Intelligence Pipeline
        </Button>
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-6 text-center">
        <div className="animate-pulse bg-upay-blue w-20 h-20 rounded-full flex items-center justify-center shadow-lg">
          <BrainCircuit size={40} className="text-white animate-spin-slow" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-upay-navy">Running ImpactIQ Pipeline...</h3>
          <p className="text-sm text-muted-foreground mt-2 animate-pulse">Generating data → Extracting features → Predicting uplift → Optimizing budget...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Customers",
      value: kpis.totalCustomers.toLocaleString(),
      change: "Analyzed",
      isPositive: true,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: "AI Recommended Targets",
      value: kpis.aiRecommended.toLocaleString(),
      change: `${((kpis.aiRecommended / Math.max(1, kpis.eligibleCustomers)) * 100).toFixed(1)}% of eligible`,
      isPositive: true,
      icon: Target,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      title: "High Uplift (Persuadable)",
      value: kpis.persuadable.toLocaleString(),
      change: "Priority Targets",
      isPositive: true,
      icon: TrendingUp,
      color: "text-upay-yellow",
      bg: "bg-yellow-50",
    },
    {
      title: "High Fatigue Risk",
      value: kpis.highFatigue.toLocaleString(),
      change: "Suppressed",
      isPositive: true, // Decrease in fatigue is good
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-50",
    },
  ];

  const lifecycleData = [
    { name: "Acquisition", value: kpis.acquisition },
    { name: "Activation", value: kpis.activation },
    { name: "Engagement", value: kpis.engagement },
    { name: "Retention", value: kpis.retention },
    { name: "Win-back", value: kpis.win_back },
  ];

  const fatigueData = [
    { name: "Low Risk", value: kpis.lowFatigue },
    { name: "Medium Risk", value: kpis.mediumFatigue },
    { name: "High Risk", value: kpis.highFatigue },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-upay-navy tracking-tight">Intelligence Overview</h1>
          <p className="text-muted-foreground mt-1">Platform-wide insights driven by ImpactIQ models.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={runIntelligencePipeline}
            className="rounded-full border-upay-blue/20 text-upay-navy font-semibold"
          >
            Rerun Pipeline
          </Button>
          <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
            <Activity size={16} /> Models Active
          </div>
        </div>
      </div>

      {/* AI Pipeline Visualization */}
      <Card className="border border-upay-blue/20 shadow-sm bg-gradient-to-r from-slate-900 to-upay-navy text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-upay-yellow uppercase tracking-widest text-xs flex items-center gap-2">
              <BrainCircuit size={16} /> Intelligence Pipeline
            </h3>
            <span className="text-xs text-slate-400 italic">Dynamic feature and decision recalculation</span>
          </div>
          
          <div className="text-center font-bold text-xs uppercase tracking-widest text-emerald-400 mb-6 border-b border-white/10 pb-4">
            "Who will change behavior BECAUSE of the offer?"
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono font-bold">
            <div className="bg-white/10 px-3 py-1.5 rounded">CUSTOMER DATA</div>
            <ArrowRight size={14} className="text-upay-blue" />
            <div className="bg-white/10 px-3 py-1.5 rounded">FEATURE ENGINEERING</div>
            <ArrowRight size={14} className="text-upay-blue" />
            <div className="bg-white/10 px-3 py-1.5 rounded text-emerald-300 border border-emerald-500/30">RESPONSE MODEL</div>
            <ArrowRight size={14} className="text-upay-blue" />
            <div className="bg-white/10 px-3 py-1.5 rounded text-red-300 border border-red-500/30">COUNTERFACTUAL CONTROL MODEL</div>
            <ArrowRight size={14} className="text-upay-blue" />
            <div className="bg-upay-blue/40 px-3 py-1.5 rounded text-white border border-upay-blue">UPLIFT</div>
            <ArrowRight size={14} className="text-upay-blue" />
            <div className="bg-white/10 px-3 py-1.5 rounded">EXPECTED INCREMENTAL VALUE</div>
            <ArrowRight size={14} className="text-upay-blue" />
            <div className="bg-white/10 px-3 py-1.5 rounded">FATIGUE + LIFECYCLE</div>
            <ArrowRight size={14} className="text-upay-blue" />
            <div className="bg-upay-yellow text-upay-navy px-3 py-1.5 rounded shadow-sm">NEXT-BEST-OFFER</div>
            <ArrowRight size={14} className="text-upay-blue" />
            <div className="bg-white/10 px-3 py-1.5 rounded">ACTION</div>
            <ArrowRight size={14} className="text-upay-blue" />
            <div className="bg-white/10 px-3 py-1.5 rounded">CAMPAIGN</div>
            <ArrowRight size={14} className="text-upay-blue" />
            <div className="bg-white/10 px-3 py-1.5 rounded">SIMULATED EXPERIMENT</div>
            <ArrowRight size={14} className="text-upay-blue" />
            <div className="bg-white/10 px-3 py-1.5 rounded text-slate-400">FEEDBACK</div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="border-none shadow-md overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl ${stat.bg}`}>
                    <Icon size={24} className={stat.color} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium text-muted-foreground`}>
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-4xl font-black text-upay-navy">{stat.value}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expected Incremental Value */}
        <Card className="col-span-1 lg:col-span-3 border-none shadow-md bg-gradient-to-r from-upay-navy to-upay-blue text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 w-96 h-96 bg-upay-yellow/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-white/80 font-medium uppercase tracking-wider text-sm mb-2">Predicted Incremental Value (30 Days)</p>
              <h2 className="text-5xl font-black flex items-center gap-2">
                <span className="text-3xl text-upay-yellow">৳</span>
                {kpis.expectedIncrementalValue.toLocaleString('en-IN')}
              </h2>
              <div className="mt-4 flex gap-4 text-sm font-medium">
                <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="text-white/70 block text-[10px] uppercase">ROI</span>
                  <span className="text-upay-yellow font-bold">{kpis.estimatedROI.toFixed(2)}x</span>
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="text-white/70 block text-[10px] uppercase">Incr. Txns</span>
                  <span className="text-white font-bold">{kpis.expectedIncrementalTxns.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="max-w-md bg-black/20 p-5 rounded-2xl backdrop-blur-sm border border-white/10">
              <h4 className="font-bold text-upay-yellow mb-2 flex items-center gap-2">
                <BrainCircuit size={18} /> How is this calculated?
              </h4>
              <p className="text-white/80 text-sm leading-relaxed">
                This is the estimated additional revenue generated by routing offers only to <strong>Persuadable</strong> customers (Uplift &gt; 0) and avoiding <strong>Sure Things</strong> and <strong>Fatigued</strong> customers, optimally allocated across available budgets.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lifecycle Chart */}
        <Card className="col-span-1 lg:col-span-2 border-none shadow-md">
          <CardHeader>
            <CardTitle>Customer Lifecycle Distribution</CardTitle>
            <CardDescription>AI-segmented customer stages across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lifecycleData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                  <RechartsTooltip 
                    cursor={{fill: '#F1F5F9'}} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} 
                  />
                  <Bar dataKey="value" fill="var(--color-upay-blue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fatigue Chart */}
        <Card className="col-span-1 border-none shadow-md">
          <CardHeader>
            <CardTitle>Fatigue Levels</CardTitle>
            <CardDescription>Marketing saturation risk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fatigueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={105}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {fatigueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
                <span className="text-3xl font-black text-upay-navy">{kpis.totalCustomers}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">Users</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {fatigueData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs font-semibold text-upay-navy">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
