"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  Play,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Zap,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  FlaskConical,
  Award,
  Layers,
  Send,
  HelpCircle,
  FileText,
  Clock,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  VoiceAgentState,
  ExecutionTimelineStep,
  GeneratedVoiceCampaign,
  VoiceConversationTurn,
} from "@/lib/voice/types";
import { VoiceAgentOrchestrator } from "@/lib/voice/orchestrator";
import { SpeechService } from "@/lib/voice/speech-recognition";
import { useIntelligenceStore } from "@/lib/intelligence/store";

export default function VoiceAgentPage() {
  const orchestratorRef = useRef<VoiceAgentOrchestrator | null>(null);
  const speechServiceRef = useRef<SpeechService | null>(null);

  // Agent State
  const [agentState, setAgentState] = useState<VoiceAgentState>("IDLE");
  const [transcript, setTranscript] = useState<string>("");
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState<boolean>(true);
  const [activeCampaign, setActiveCampaign] = useState<GeneratedVoiceCampaign | null>(null);

  // Execution Timeline
  const [timelineSteps, setTimelineSteps] = useState<ExecutionTimelineStep[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Conversation Log
  const [turns, setTurns] = useState<VoiceConversationTurn[]>([
    {
      id: "turn-welcome",
      sender: "agent",
      text: "Good afternoon. I am your autonomous Growth & Campaign Operations Agent. I can analyze customer segments, calculate causal uplift, optimize budgets, and orchestrate campaigns through natural voice commands. How can I help you today?",
      timestamp: "Just now",
      opportunityBriefs: [
        {
          id: "opp-eid",
          title: "🌙 Eid Salami Remittance Wave",
          priority: "HIGH",
          audience: "31,650 High-Uplift Users",
          reason: "Festive P2P intent at 79%; average fatigue is only 14%.",
          estimatedImpact: "+18,400 Transfers (৳14.85L GMV)",
          suggestedAction: "Launch 10% Salami Cashback at 8:00 PM via Push.",
        },
        {
          id: "opp-adm",
          title: "🎓 University Admission Intake",
          priority: "HIGH",
          audience: "24,800 Incoming Undergraduates",
          reason: "Tuition deadlines closing this week; activation uplift is +54%.",
          estimatedImpact: "+12,600 Education Payments",
          suggestedAction: "Deploy 10% Tuition Cashback + Deadline Reminders.",
        },
      ],
    },
  ]);

  const [textInput, setTextInput] = useState<string>("");
  const [audioWaveHeight, setAudioWaveHeight] = useState<number[]>([20, 45, 60, 35, 75, 40, 65, 30, 50, 25]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Synchronize with existing intelligence store if needed
  const { addCampaign } = useIntelligenceStore();

  useEffect(() => {
    orchestratorRef.current = new VoiceAgentOrchestrator();
    speechServiceRef.current = new SpeechService();

    return () => {
      speechServiceRef.current?.cancelSpeech();
      speechServiceRef.current?.stopListening();
    };
  }, []);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, timelineSteps]);

  // Animated Waveform effect when LISTENING or SPEAKING
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (agentState === "LISTENING" || agentState === "SPEAKING") {
      interval = setInterval(() => {
        setAudioWaveHeight(
          Array.from({ length: 12 }, () => Math.floor(Math.random() * 55) + 15)
        );
      }, 120);
    } else {
      setAudioWaveHeight([15, 20, 25, 20, 30, 25, 20, 15, 20, 25, 20, 15]);
    }
    return () => clearInterval(interval);
  }, [agentState]);

  // Start Voice Listening
  const handleToggleListening = () => {
    if (agentState === "LISTENING") {
      speechServiceRef.current?.stopListening();
      setAgentState("IDLE");
      return;
    }

    setTranscript("");
    setAgentState("LISTENING");

    speechServiceRef.current?.startListening(
      (currentText, isFinal) => {
        setTranscript(currentText);
        if (isFinal && currentText.trim()) {
          handleExecuteVoiceCommand(currentText);
        }
      },
      (error) => {
        console.warn("Speech recognition warning:", error);
        setAgentState("IDLE");
      },
      (isListening) => {
        if (!isListening) {
          setAgentState((prev) => (prev === "LISTENING" ? "IDLE" : prev));
        }
      }
    );
  };

  // Main Command Execution Pipeline
  const handleExecuteVoiceCommand = async (commandText: string) => {
    if (!commandText.trim()) return;

    speechServiceRef.current?.stopListening();
    setAgentState("PROCESSING");

    const userTurn: VoiceConversationTurn = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: commandText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setTurns((prev) => [...prev, userTurn]);
    setTranscript("");
    setTextInput("");
    setIsExecuting(true);

    // Initial timeline state
    setTimelineSteps([
      { id: "1", label: "Understanding natural voice request", status: "running" },
      { id: "2", label: "Querying customer transactional data", status: "pending" },
      { id: "3", label: "Identifying lifecycle segments", status: "pending" },
      { id: "4", label: "Predicting next transactional behavior", status: "pending" },
      { id: "5", label: "Calculating response probability", status: "pending" },
      { id: "6", label: "Calculating T-Learner incremental uplift", status: "pending" },
      { id: "7", label: "Evaluating category fatigue & contact frequency", status: "pending" },
      { id: "8", label: "Enforcing Organic Transaction Protection", status: "pending" },
      { id: "9", label: "Optimizing budget allocation via Knapsack LP", status: "pending" },
      { id: "10", label: "Configuring 80/20 Randomized Controlled Trial", status: "pending" },
      { id: "11", label: "Campaign prepared and ready for authority review", status: "pending" },
    ]);

    // Progressive animation of timeline steps
    await new Promise((r) => setTimeout(r, 400));
    setTimelineSteps((prev) => prev.map((s, i) => (i < 4 ? { ...s, status: "completed" } : s)));
    setAgentState("EXECUTING");

    await new Promise((r) => setTimeout(r, 600));
    setTimelineSteps((prev) => prev.map((s, i) => (i < 8 ? { ...s, status: "completed" } : s)));

    await new Promise((r) => setTimeout(r, 600));
    setTimelineSteps((prev) => prev.map((s) => ({ ...s, status: "completed" })));

    // Process turn via Orchestrator
    const result = await orchestratorRef.current?.processUserVoiceInput(commandText);

    if (result) {
      setTurns((prev) => [...prev, result.agentTurn]);
      if (result.campaignDraft) {
        setActiveCampaign(result.campaignDraft);
      }

      setAgentState("SPEAKING");

      // Speak response if voice audio is enabled
      if (isSpeakingEnabled) {
        speechServiceRef.current?.speak(
          result.agentTurn.text,
          () => setAgentState("COMPLETED"),
          () => setAgentState("SPEAKING")
        );
      } else {
        setAgentState("COMPLETED");
      }
    } else {
      setAgentState("IDLE");
    }

    setIsExecuting(false);
  };

  // Launch Confirmation Action
  const handleConfirmLaunch = () => {
    if (!activeCampaign) return;
    const launched = {
      ...activeCampaign,
      approvalStatus: "APPROVED_LAUNCHED" as const,
      isLaunched: true,
      launchedAt: new Date().toLocaleTimeString(),
    };

    setActiveCampaign(launched);

    // Sync with main app campaign store
    addCampaign({
      id: launched.id,
      name: launched.name,
      offerType: "send_money_benefit",
      cashbackAmount: 25,
      minTransaction: 200,
      budgetTotal: launched.budgetBDT,
      budgetUsed: 0,
      capacityLimit: launched.audienceCount,
      channel: "push",
      targetProduct: "Send Money",
      duration: 14,
      isActive: true,
    });

    const confirmTurn: VoiceConversationTurn = {
      id: `agent-${Date.now()}`,
      sender: "agent",
      text: `Authority approval confirmed. Campaign "${launched.name}" is now LIVE! Target audience of ${launched.audienceCount.toLocaleString()} users scheduled for ${launched.timing}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isLaunchConfirmation: true,
      campaignPreview: launched,
    };

    setTurns((prev) => [...prev, confirmTurn]);
    if (isSpeakingEnabled) {
      speechServiceRef.current?.speak(confirmTurn.text);
    }
    
    // Create notifications for the launched campaign
    const syntheticTargetIds = Array.from({ length: Math.min(launched.audienceCount, 500) }, (_, i) => `C${Math.floor(Math.random() * 10000)}`);
    import("@/lib/notifications/store").then(({ useNotificationStore }) => {
      useNotificationStore.getState().createNotificationsForCampaign(
        launched.id,
        launched.name,
        syntheticTargetIds,
        {
          title: launched.name,
          body: launched.offerDescription || `Complete your transaction to receive your reward!`,
          ctaText: "View Offer",
          ctaUrl: `/customer/impactiq?campaignId=${launched.id}`
        }
      );
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ── BREADCRUMB & PRODUCT POSITIONING HERO ───────────────────────── */}
      <div className="bg-gradient-to-r from-upay-navy via-[#0A264A] to-upay-blue rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-upay-yellow/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-upay-yellow tracking-wider uppercase">
              <span>Authority Dashboard</span>
              <span>›</span>
              <span>Growth Intelligence</span>
              <span>›</span>
              <span className="text-white">Voice AI Campaign Agent</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-upay-yellow/20 border border-upay-yellow/40 flex items-center justify-center text-upay-yellow shadow-inner">
                <Mic size={22} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Voice AI Campaign Agent
              </h1>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2.5 py-0.5 font-bold uppercase tracking-wider">
                Full-Duplex Voice Active
              </Badge>
            </div>

            <p className="text-white/80 text-sm max-w-2xl leading-relaxed">
              <strong className="text-white font-semibold">Speak your growth goal.</strong> ImpactIQ analyzes customer data, isolates causal uplift, checks fatigue, optimizes budget, and generates campaigns autonomously.
            </p>
          </div>

          {/* Voice Controls Pill */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
            <button
              onClick={() => setIsSpeakingEnabled(!isSpeakingEnabled)}
              className={cn(
                "p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all",
                isSpeakingEnabled ? "bg-upay-yellow text-upay-navy" : "bg-white/10 text-white"
              )}
            >
              {isSpeakingEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{isSpeakingEnabled ? "Voice Speech ON" : "Muted"}</span>
            </button>
            <div className="text-[11px] text-white/70 px-2 font-mono">
              English • Bangla • Banglish
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN VOICE INTERFACE CONSOLE ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center Console: Large Microphone & Waveform (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-3xl border border-slate-200 shadow-md bg-white p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden">
            {/* Background Radial Glow */}
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-700 pointer-events-none",
                agentState === "LISTENING"
                  ? "bg-gradient-to-b from-blue-500/10 via-transparent to-transparent opacity-100"
                  : agentState === "SPEAKING"
                  ? "bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent opacity-100"
                  : "opacity-0"
              )}
            />

            {/* Status Pill */}
            <div className="mb-6">
              <Badge
                className={cn(
                  "text-xs px-3.5 py-1 font-bold tracking-wider uppercase rounded-full shadow-xs",
                  agentState === "LISTENING"
                    ? "bg-blue-600 text-white animate-pulse"
                    : agentState === "PROCESSING" || agentState === "EXECUTING"
                    ? "bg-amber-500 text-white animate-bounce"
                    : agentState === "SPEAKING"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                )}
              >
                {agentState === "LISTENING" && "🎙️ Listening to Voice Command..."}
                {agentState === "PROCESSING" && "🧠 Parsing Intent & Context..."}
                {agentState === "EXECUTING" && "⚡ Running Causal ML & Knapsack..."}
                {agentState === "SPEAKING" && "🔊 Speaking Recommendation..."}
                {agentState === "COMPLETED" && "✅ Ready for Review"}
                {agentState === "IDLE" && "Ready • Tap to Speak"}
              </Badge>
            </div>

            {/* Central Animated Microphone Button */}
            <div className="relative my-4 flex items-center justify-center">
              {/* Outer Pulsing Waves */}
              {agentState === "LISTENING" && (
                <>
                  <div className="absolute w-44 h-44 rounded-full border-2 border-blue-400/40 animate-ping" />
                  <div className="absolute w-56 h-56 rounded-full border border-blue-300/20 animate-pulse" />
                </>
              )}

              {agentState === "SPEAKING" && (
                <div className="absolute w-48 h-48 rounded-full border-2 border-emerald-400/40 animate-ping" />
              )}

              <button
                onClick={handleToggleListening}
                className={cn(
                  "w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-300 relative z-10",
                  agentState === "LISTENING"
                    ? "bg-gradient-to-br from-red-500 to-rose-600 ring-8 ring-rose-200 scale-105"
                    : agentState === "SPEAKING"
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 ring-8 ring-emerald-100"
                    : agentState === "PROCESSING" || agentState === "EXECUTING"
                    ? "bg-gradient-to-br from-amber-500 to-orange-600 ring-8 ring-amber-100"
                    : "bg-gradient-to-br from-upay-navy to-upay-blue hover:scale-105 ring-8 ring-blue-50"
                )}
              >
                {agentState === "LISTENING" ? (
                  <MicOff size={42} className="animate-pulse" />
                ) : (
                  <Mic size={42} />
                )}
                <span className="text-[10px] font-black uppercase tracking-wider mt-1.5 opacity-90">
                  {agentState === "LISTENING" ? "Stop" : "Speak"}
                </span>
              </button>
            </div>

            {/* Audio Waveform Bars */}
            <div className="flex items-center justify-center gap-1.5 h-14 my-3">
              {audioWaveHeight.map((h, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 rounded-full transition-all duration-150",
                    agentState === "LISTENING"
                      ? "bg-blue-600"
                      : agentState === "SPEAKING"
                      ? "bg-emerald-500"
                      : "bg-slate-200"
                  )}
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>

            {/* Live Transcript / Prompt Preview */}
            <div className="w-full max-w-lg min-h-[50px] bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-800 flex items-center justify-center">
              {transcript ? (
                <p className="font-semibold italic text-upay-blue animate-pulse">
                  "{transcript}"
                </p>
              ) : agentState === "LISTENING" ? (
                <span className="text-slate-400">Listening... Speak your campaign command</span>
              ) : (
                <span className="text-slate-400 text-xs">
                  Say: "Create an Eid campaign with a budget of ten lakh taka" or use quick commands below.
                </span>
              )}
            </div>

            {/* Fallback Text Input */}
            <div className="w-full max-w-lg mt-4 flex items-center gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExecuteVoiceCommand(textInput)}
                placeholder="Or type voice command (e.g. 'Create an Eid campaign with 10 lakh budget')..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-upay-blue"
              />
              <Button
                size="sm"
                onClick={() => handleExecuteVoiceCommand(textInput)}
                className="bg-upay-navy hover:bg-upay-blue text-white font-bold px-4 py-2.5 rounded-xl text-xs"
              >
                <Send size={14} />
              </Button>
            </div>
          </Card>

          {/* Natural Voice Command Chips (English & Banglish) */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <HelpCircle size={14} /> Voice Command Library (Click or Speak):
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Create Eid Campaign (৳10L)", text: "Create an Eid campaign with a budget of ten lakh taka." },
                { label: "Create University Admission", text: "Create a university admission campaign." },
                { label: "Banglish: Eid er Campaign", text: "Eid er jonno ekta campaign create koro 10 lakh budget er." },
                { label: "Why Target These Customers?", text: "Why did you target these customers?" },
                { label: "Exclude Organic Transactors", text: "Which customers should not receive cashback?" },
                { label: "What If: ৳20L Budget", text: "What happens if I increase the budget to twenty lakh?" },
                { label: "Create 80/20 A/B Test", text: "Create an A/B test." },
                { label: "Analyze Last Campaign", text: "Analyze the last Eid campaign." },
                { label: "Scan Growth Opportunity", text: "Find our biggest growth opportunity." },
                { label: "Confirm Launch", text: "Launch the campaign." },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExecuteVoiceCommand(chip.text)}
                  className="bg-white hover:bg-upay-blue hover:text-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 shadow-xs transition-all text-left"
                >
                  "{chip.label}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Console: Live AI Activity & Campaign Approval Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Execution Timeline Card */}
          <Card className="rounded-3xl border border-slate-200 shadow-md bg-white p-5">
            <CardHeader className="p-0 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Zap size={15} className="text-upay-yellow" /> AI Execution Pipeline
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-400">
                  {isExecuting ? "Executing 11-checkpoint causal sequence..." : "Ready for next instruction"}
                </CardDescription>
              </div>
              {isExecuting && (
                <RefreshCw size={14} className="animate-spin text-upay-blue" />
              )}
            </CardHeader>

            <CardContent className="p-0 pt-3">
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {timelineSteps.length > 0 ? (
                  timelineSteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-2 text-xs">
                      {step.status === "completed" ? (
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      ) : step.status === "running" ? (
                        <RefreshCw size={14} className="text-upay-blue animate-spin shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span
                        className={cn(
                          step.status === "completed"
                            ? "text-slate-700 font-medium"
                            : step.status === "running"
                            ? "text-upay-blue font-bold"
                            : "text-slate-400"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 italic text-center py-6">
                    Speak a command like "Create an Eid campaign" to view autonomous pipeline checkpoints.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Generated Campaign Card with Human-In-The-Loop Approval (Section 9) */}
          {activeCampaign && (
            <Card className="rounded-3xl border-2 border-upay-blue shadow-lg bg-white overflow-hidden animate-in fade-in-50 duration-300">
              <div className="bg-gradient-to-r from-upay-navy to-upay-blue p-4 text-white flex items-center justify-between">
                <div>
                  <Badge className="bg-upay-yellow text-upay-navy text-[10px] font-black uppercase mb-1">
                    {activeCampaign.approvalStatus === "APPROVED_LAUNCHED" ? "🟢 CAMPAIGN ACTIVE & LIVE" : "🟡 PENDING APPROVAL"}
                  </Badge>
                  <h3 className="text-sm font-black">{activeCampaign.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/60 uppercase font-bold">Targeted Users</div>
                  <div className="text-base font-black text-emerald-300">
                    {activeCampaign.audienceCount.toLocaleString()}
                  </div>
                </div>
              </div>

              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Budget Allocated</span>
                    <span className="font-black text-upay-blue text-sm">
                      ৳{(activeCampaign.budgetBDT / 100000).toFixed(1)} Lakh
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Net Causal Lift</span>
                    <span className="font-black text-emerald-600 text-sm">
                      +{(activeCampaign.expectedUplift * 100).toFixed(0)}% Uplift
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Incremental Txns</span>
                    <span className="font-extrabold text-slate-800">
                      +{activeCampaign.expectedIncrementalTransactions.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Incremental GMV</span>
                    <span className="font-extrabold text-slate-800">
                      ৳{(activeCampaign.expectedIncrementalValueBDT / 100000).toFixed(1)}L
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="text-slate-600">
                    <strong>Offer:</strong> {activeCampaign.offerDescription}
                  </div>
                  <div className="text-slate-600">
                    <strong>Delivery Window:</strong> {activeCampaign.channel} at {activeCampaign.timing}
                  </div>
                  <div className="text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    🛡️ <strong>Organic Protection:</strong> {activeCampaign.organicProtectedCount.toLocaleString()} high-propensity users excluded from cashback to prevent deadweight loss.
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    <strong>Experiment:</strong> {activeCampaign.experimentPlan.type} ({activeCampaign.experimentPlan.treatmentSize.toLocaleString()} Treatment / {activeCampaign.experimentPlan.controlSize.toLocaleString()} Holdout)
                  </div>
                </div>

                {/* Human-in-the-loop Action Buttons */}
                <div className="pt-2 border-t border-slate-100">
                  {activeCampaign.approvalStatus !== "APPROVED_LAUNCHED" ? (
                    <div className="space-y-2">
                      <Button
                        onClick={handleConfirmLaunch}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-5 rounded-xl shadow-md flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} /> Approve & Launch Campaign
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExecuteVoiceCommand("What happens if I increase the budget to twenty lakh?")}
                          className="flex-1 text-[11px] rounded-xl font-bold"
                        >
                          Simulate ৳20L Budget
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveCampaign(null)}
                          className="text-[11px] text-red-500 hover:bg-red-50 rounded-xl"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs font-bold text-center">
                      ✓ Campaign is officially active. First batch dispatches at {activeCampaign.timing}.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── CONVERSATION HISTORY & TRANSCRIPT LOG ───────────────────────── */}
      <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-upay-blue" />
            <CardTitle className="text-sm font-extrabold text-upay-navy">
              Voice Agent Conversation & Audit Log
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs font-semibold text-slate-500">
            {turns.length} Dialog Turns Recorded
          </Badge>
        </CardHeader>

        <CardContent className="p-6 space-y-4 max-h-[420px] overflow-y-auto">
          {turns.map((turn) => (
            <div
              key={turn.id}
              className={cn(
                "flex flex-col space-y-1.5",
                turn.sender === "user" ? "items-end" : "items-start"
              )}
            >
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold px-1">
                <span>{turn.sender === "user" ? "Growth Officer (Voice)" : "ImpactIQ Agent"}</span>
                <span>•</span>
                <span>{turn.timestamp}</span>
              </div>

              <div
                className={cn(
                  "p-4 rounded-2xl text-xs sm:text-sm max-w-2xl leading-relaxed shadow-xs",
                  turn.sender === "user"
                    ? "bg-upay-blue text-white rounded-tr-xs"
                    : "bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-xs"
                )}
              >
                <p>{turn.text}</p>

                {/* Explainability Breakdown Card */}
                {turn.explanationDetails && (
                  <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-upay-navy uppercase text-[10px] tracking-wider">
                      Causal Attribution & Lift Details:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">P(With Offer)</div>
                        <div className="font-black text-slate-800">{turn.explanationDetails.responseProb}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">P(No Offer)</div>
                        <div className="font-black text-slate-800">{turn.explanationDetails.organicBaseline}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Net Uplift</div>
                        <div className="font-black text-emerald-600">{turn.explanationDetails.uplift}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Fatigue</div>
                        <div className="font-black text-slate-800">{turn.explanationDetails.fatigue}</div>
                      </div>
                    </div>
                    <p className="text-slate-600 text-xs italic">
                      {turn.explanationDetails.rationale}
                    </p>
                  </div>
                )}

                {/* Opportunity Briefs List */}
                {turn.opportunityBriefs && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-xs">
                    <div className="font-bold text-upay-navy uppercase text-[10px] tracking-wider">
                      Proactive Campaign Briefs Detected:
                    </div>
                    {turn.opportunityBriefs.map((opp) => (
                      <div key={opp.id} className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-black text-upay-navy flex items-center gap-1.5">
                            <span>{opp.title}</span>
                            <Badge className="bg-emerald-100 text-emerald-800 text-[9px]">{opp.priority}</Badge>
                          </div>
                          <div className="text-slate-500 text-xs mt-0.5">{opp.reason}</div>
                          <div className="text-emerald-700 font-semibold text-[11px] mt-0.5">{opp.estimatedImpact}</div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleExecuteVoiceCommand(`Create the ${opp.id.includes("eid") ? "Eid" : "University Admission"} campaign with ten lakh budget`)}
                          className="bg-upay-blue text-white text-xs font-bold rounded-xl shrink-0"
                        >
                          Execute Brief <ArrowRight size={13} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>
    </div>
  );
}
