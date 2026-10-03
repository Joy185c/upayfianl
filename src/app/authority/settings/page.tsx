"use client";

import { Settings2, ShieldCheck, Database, Sliders } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function AuthoritySettings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-upay-navy tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">Configure ImpactIQ models and system parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders size={20} className="text-upay-blue" /> Model Toggles
            </CardTitle>
            <CardDescription>Enable or disable specific AI intelligence engines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-upay-navy">Uplift Modeling</p>
                <p className="text-xs text-muted-foreground">Segment customers by persuadability.</p>
              </div>
              <Switch checked={true} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-upay-navy">Fatigue Suppression</p>
                <p className="text-xs text-muted-foreground">Prevent over-communication to users.</p>
              </div>
              <Switch checked={true} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-upay-navy">Next Best Offer (NBO)</p>
                <p className="text-xs text-muted-foreground">Dynamic offer routing algorithm.</p>
              </div>
              <Switch checked={true} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database size={20} className="text-upay-blue" /> Data & Privacy
            </CardTitle>
            <CardDescription>Manage how ImpactIQ interacts with customer data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
              <ShieldCheck className="text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-900">Anonymized Inference Active</p>
                <p className="text-xs text-blue-700 mt-1">PII is currently stripped before being processed by the ImpactIQ ML pipeline. This ensures compliance with regional data protection guidelines.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
