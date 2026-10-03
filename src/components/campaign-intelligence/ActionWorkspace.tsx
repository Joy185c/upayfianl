"use client";

import { useState, useMemo, useEffect } from "react";
import { BrainCircuit, Users, AlertTriangle, Plus, Filter, Save, FileText, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIntelligenceStore } from "@/lib/intelligence/store";
import { ActionType, AudienceDefinition, AudienceEvaluation } from "@/lib/audience/types";
import { evaluateAudience } from "@/lib/audience/evaluator";
import { ConditionBuilder } from "./ConditionBuilder";
import { DecisionTrace } from "@/lib/intelligence/types";

interface ActionWorkspaceProps {
  action: ActionType;
  baseAudience: DecisionTrace[];
  onOpenTrace: (trace: DecisionTrace) => void;
  onCreateCampaign: (evaluation: AudienceEvaluation) => void;
}

export function ActionWorkspace({ action, baseAudience, onOpenTrace, onCreateCampaign }: ActionWorkspaceProps) {
  const { customers, decisions, getAudienceDefinitionsByAction, saveAudienceDefinition } = useIntelligenceStore();
  
  // Try to load existing definition or create empty
  const [definition, setDefinition] = useState<AudienceDefinition>(() => {
    const existing = getAudienceDefinitionsByAction(action);
    if (existing.length > 0) return existing[0];
    return {
      id: crypto.randomUUID(),
      name: `${action} Audience`,
      sourceAction: action,
      ruleGroups: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const [isBuilding, setIsBuilding] = useState(false);

  // Evaluate audience dynamically
  const evaluation = useMemo(() => {
    // If no rules, the audience is just the base AI Action audience
    if (definition.ruleGroups.length === 0) {
      return {
        customerIds: baseAudience.map(t => t.customerId),
        count: baseAudience.length,
        excludedCustomerIds: []
      };
    }

    // Filter base audience using evaluator
    // Note: evaluateAudience takes all customers, but we only want to evaluate the ones
    // in this action OR we evaluate all and intersect. 
    // Wait, the PRD says: "If custom campaign rules select a customer whose AI decision is SUPPRESS... Do not silently target them."
    // For now, let's strictly filter the `baseAudience` matching the Action.
    const relevantCustomers = customers.filter(c => baseAudience.some(t => t.customerId === c.id));
    return evaluateAudience(relevantCustomers, decisions, definition.ruleGroups);
  }, [definition, baseAudience, customers, decisions]);

  const displayTraces = baseAudience.filter(t => evaluation.customerIds.includes(t.customerId)).slice(0, 50);

  const addRuleGroup = () => {
    setDefinition(prev => ({
      ...prev,
      ruleGroups: [
        ...prev.ruleGroups,
        { id: crypto.randomUUID(), logic: "AND", conditions: [] }
      ]
    }));
    setIsBuilding(true);
  };

  const updateRuleGroup = (group: any) => {
    setDefinition(prev => ({
      ...prev,
      ruleGroups: prev.ruleGroups.map(g => g.id === group.id ? group : g)
    }));
  };

  const removeRuleGroup = (id: string) => {
    setDefinition(prev => ({
      ...prev,
      ruleGroups: prev.ruleGroups.filter(g => g.id !== id)
    }));
  };

  const saveAudience = () => {
    saveAudienceDefinition({ ...definition, updatedAt: new Date().toISOString() });
    setIsBuilding(false);
  };

  const handleCopilot = () => {
    setDefinition(prev => ({
      ...prev,
      ruleGroups: [
        {
          id: crypto.randomUUID(),
          logic: "AND",
          conditions: [
            { id: crypto.randomUUID(), field: "lifecycle", operator: "IN", value: ["ACTIVATION", "ENGAGEMENT"] },
            { id: crypto.randomUUID(), field: "fatigueLevel", operator: "EQ", value: "LOW" },
            { id: crypto.randomUUID(), field: "upliftSegment", operator: "IN", value: ["PERSUADABLE"] }
          ]
        }
      ]
    }));
    setIsBuilding(true);
  };

  // KPI calculations
  const highFatigueCount = baseAudience.filter(t => t.fatigueLevel === "HIGH").length;
  const negativeUpliftCount = baseAudience.filter(t => t.upliftSegment === "NEGATIVE_UPLIFT").length;

  const actionColors: Record<ActionType, { bg: string, text: string }> = {
    TARGET: { bg: "bg-green-100", text: "text-green-800" },
    HOLD: { bg: "bg-yellow-100", text: "text-yellow-800" },
    SUPPRESS: { bg: "bg-red-100", text: "text-red-800" },
    MONITOR: { bg: "bg-slate-100", text: "text-slate-800" },
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge className={`${actionColors[action].bg} ${actionColors[action].text} px-3 py-1 text-sm font-black tracking-widest uppercase`}>
              {action}
            </Badge>
            <span className="text-2xl font-black text-upay-navy">
              {evaluation.count.toLocaleString()} <span className="text-muted-foreground text-lg font-medium">Customers</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {action === "TARGET" && "Customers with positive incremental potential. High priority for campaigns."}
            {action === "HOLD" && "Avoid unnecessary incentives. Likely to transact organically or high fatigue."}
            {action === "SUPPRESS" && "Avoid waste. Negative uplift or strict eligibility constraints."}
            {action === "MONITOR" && "Observe before intervention. Low expected impact currently."}
          </p>
        </div>
        
        <div className="flex gap-2">
          {!isBuilding && (
            <Button variant="outline" onClick={() => setIsBuilding(true)} className="border-upay-blue text-upay-blue hover:bg-upay-blue/5">
              <Filter size={16} className="mr-2" /> Define Rules
            </Button>
          )}
          <Button variant="secondary" onClick={handleCopilot} className="bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-200">
            <Wand2 size={16} className="mr-2" /> AI Copilot (Prototype)
          </Button>
          <Button onClick={() => onCreateCampaign(evaluation)} className="bg-upay-navy hover:bg-upay-navy/90 text-white">
            <Plus size={16} className="mr-2" /> Create Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rule Builder Panel */}
        {isBuilding && (
          <div className="lg:col-span-1 space-y-4">
            <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg border">
              <h3 className="font-bold text-upay-navy flex items-center gap-2">
                <BrainCircuit size={16} /> Audience Rules
              </h3>
              <Button size="sm" variant="ghost" onClick={saveAudience} className="h-8 hover:bg-white">
                <Save size={14} className="mr-1" /> Save
              </Button>
            </div>

            {definition.ruleGroups.map((group, idx) => (
              <div key={group.id} className="space-y-2">
                {idx > 0 && <div className="text-center text-xs font-black text-slate-400 my-2">AND</div>}
                <ConditionBuilder 
                  ruleGroup={group} 
                  onChange={updateRuleGroup} 
                  onRemove={() => removeRuleGroup(group.id)} 
                />
              </div>
            ))}

            <Button variant="outline" className="w-full border-dashed" onClick={addRuleGroup}>
              <Plus size={16} className="mr-2" /> Add Rule Group
            </Button>

            {/* AI Insight Panel */}
            <div className="bg-upay-navy text-white p-4 rounded-xl shadow-inner mt-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-upay-blue mb-2 flex items-center gap-2">
                <BrainCircuit size={14} /> AI Insight
              </h4>
              <p className="text-sm leading-relaxed text-slate-300">
                {evaluation.count} customers match your custom rules out of the {baseAudience.length} {action} candidates. 
                {evaluation.count < baseAudience.length && ` (${baseAudience.length - evaluation.count} excluded by your rules).`}
              </p>
              {action === "SUPPRESS" && evaluation.count > 0 && (
                <div className="mt-3 bg-red-500/20 text-red-200 p-2 rounded text-xs border border-red-500/30 flex items-start gap-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <p>Warning: AI recommends suppressing these users. Targeting them may result in negative ROI or increased churn due to fatigue.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customer List Panel */}
        <div className={isBuilding ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-upay-navy flex items-center gap-2">
                <Users size={16} /> Audience Preview
              </h3>
              <Badge variant="secondary">{evaluation.count} Matched</Badge>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-white font-semibold border-b">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Lifecycle</th>
                    <th className="px-4 py-3 text-center">Uplift</th>
                    <th className="px-4 py-3 text-center">Fatigue</th>
                    <th className="px-4 py-3">AI Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayTraces.map((trace) => (
                    <tr 
                      key={trace.customerId} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => onOpenTrace(trace)}
                    >
                      <td className="px-4 py-3 font-bold text-upay-navy group-hover:text-upay-blue">
                        {trace.customerId}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {trace.lifecycle}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-medium">
                        <span className={trace.uplift > 0 ? "text-emerald-600" : "text-red-500"}>
                          {trace.uplift > 0 ? "+" : ""}{(trace.uplift * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={
                          trace.fatigueLevel === "HIGH" ? "border-red-200 text-red-600 bg-red-50" :
                          trace.fatigueLevel === "MEDIUM" ? "border-yellow-200 text-yellow-600 bg-yellow-50" :
                          "border-emerald-200 text-emerald-600 bg-emerald-50"
                        }>
                          {trace.fatigueLevel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-muted-foreground max-w-[200px] block truncate">
                          {trace.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {displayTraces.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        <FileText size={24} className="mx-auto mb-2 opacity-50" />
                        No customers match the current conditions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {evaluation.count > 50 && (
              <div className="p-3 text-center text-xs text-muted-foreground bg-slate-50 border-t">
                Showing top 50 of {evaluation.count.toLocaleString()} matched customers.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
