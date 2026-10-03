"use client";

import { useState } from "react";
import { Plus, X, BrainCircuit, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AUDIENCE_FIELDS, AudienceRuleGroup, AudienceCondition, Operator } from "@/lib/audience/types";

interface ConditionBuilderProps {
  ruleGroup: AudienceRuleGroup;
  onChange: (group: AudienceRuleGroup) => void;
  onRemove: () => void;
}

export function ConditionBuilder({ ruleGroup, onChange, onRemove }: ConditionBuilderProps) {
  const [nlQuery, setNlQuery] = useState("");

  const addCondition = () => {
    const newCondition: AudienceCondition = {
      id: crypto.randomUUID(),
      field: "daysSinceLastTx",
      operator: "GT",
      value: 0
    };
    onChange({
      ...ruleGroup,
      conditions: [...ruleGroup.conditions, newCondition]
    });
  };

  const updateCondition = (id: string, updates: Partial<AudienceCondition>) => {
    onChange({
      ...ruleGroup,
      conditions: ruleGroup.conditions.map(c => c.id === id ? { ...c, ...updates } : c)
    });
  };

  const removeCondition = (id: string) => {
    onChange({
      ...ruleGroup,
      conditions: ruleGroup.conditions.filter(c => c.id !== id)
    });
  };

  const handleNLPSubmit = async () => {
    if (!nlQuery.trim()) return;
    // Basic NLP mock parsing 
    const lower = nlQuery.toLowerCase();
    const newConditions = [...ruleGroup.conditions];
    
    if (lower.includes("inactive") && lower.includes("25")) {
      newConditions.push({ id: crypto.randomUUID(), field: "daysSinceLastTx", operator: "GT", value: 25 });
    } else if (lower.includes("win-back") || lower.includes("winback")) {
      newConditions.push({ id: crypto.randomUUID(), field: "lifecycle", operator: "EQ", value: "WIN-BACK" });
    } else if (lower.includes("fatigue")) {
      newConditions.push({ id: crypto.randomUUID(), field: "fatigueScore", operator: "GT", value: 0.7 });
    } else if (lower.includes("uplift")) {
      newConditions.push({ id: crypto.randomUUID(), field: "uplift", operator: "GT", value: 0.1 });
    } else {
      // Default fallback just to show it does something
      newConditions.push({ id: crypto.randomUUID(), field: "daysSinceLastTx", operator: "GT", value: 30 });
    }

    onChange({
      ...ruleGroup,
      conditions: newConditions
    });
    setNlQuery("");
  };

  return (
    <Card className="border-upay-blue/20 shadow-sm bg-slate-50/50">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white">Rule Group</Badge>
            <select 
              className="text-xs font-bold bg-transparent border-none outline-none cursor-pointer"
              value={ruleGroup.logic}
              onChange={(e) => onChange({ ...ruleGroup, logic: e.target.value as "AND" | "OR" })}
            >
              <option value="AND">Match ALL Conditions (AND)</option>
              <option value="OR">Match ANY Condition (OR)</option>
            </select>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove} className="h-6 px-2 text-muted-foreground hover:text-red-500">
            <X size={14} />
          </Button>
        </div>

        {/* NLP Assistant Bar */}
        <div className="flex gap-2 items-center bg-white p-1 rounded-lg border focus-within:ring-1 focus-within:ring-upay-blue">
          <div className="pl-2 text-upay-blue"><Wand2 size={16} /></div>
          <input 
            type="text" 
            placeholder="Ask AI: e.g. 'Find customers inactive for 25 days'" 
            className="flex-1 text-sm bg-transparent border-none outline-none py-1.5"
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNLPSubmit()}
          />
          <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleNLPSubmit}>
            Auto-fill
          </Button>
        </div>

        <div className="space-y-3 pt-2">
          {ruleGroup.conditions.map((condition, idx) => (
            <div key={condition.id} className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200">
              {idx > 0 && (
                <div className="text-[10px] font-black text-slate-400 uppercase w-full sm:w-auto sm:w-8 text-left sm:text-center shrink-0">
                  {ruleGroup.logic}
                </div>
              )}

              <select 
                className="flex-1 min-w-[120px] w-full sm:w-auto text-xs p-1.5 border rounded bg-slate-50"
                value={condition.field}
                onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
              >
                {AUDIENCE_FIELDS.map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>

              <select 
                className="w-16 shrink-0 text-xs p-1.5 border rounded bg-slate-50"
                value={condition.operator}
                onChange={(e) => updateCondition(condition.id, { operator: e.target.value as Operator })}
              >
                <option value="EQ">=</option>
                <option value="NEQ">!=</option>
                <option value="GT">&gt;</option>
                <option value="GTE">&gt;=</option>
                <option value="LT">&lt;</option>
                <option value="LTE">&lt;=</option>
              </select>

              <input 
                type="text" 
                className="flex-1 min-w-[60px] text-xs p-1.5 border rounded bg-slate-50"
                value={String(condition.value)}
                onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                placeholder="Value"
              />

              <Button variant="ghost" size="sm" onClick={() => removeCondition(condition.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 shrink-0">
                <X size={16} />
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" className="w-full mt-2 border-dashed" onClick={addCondition}>
          <Plus size={14} className="mr-1" /> Add Condition
        </Button>
      </CardContent>
    </Card>
  );
}
