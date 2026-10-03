"use client";

import { useEffect, useState } from "react";
import { Users, Filter, ChevronDown, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIntelligenceStore } from "@/lib/intelligence/store";
import { CustomerProfile } from "@/lib/intelligence/types";
import { CampaignBuilderModal } from "@/components/campaign-intelligence/CampaignBuilderModal";

export default function AuthoritySegments() {
  const { customers, isRunning, lastRunAt } = useIntelligenceStore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"size" | "spend" | "response">("size");
  const [selectedSegment, setSelectedSegment] = useState<{name: string; users: CustomerProfile[]; count: number} | null>(null);

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

  // Aggregate segments from the synthetic customer list
  const segmentMap = new Map<string, { count: number, totalSpent: number, users: CustomerProfile[] }>();

  customers.forEach(c => {
    // We group by the broad 'lifecycle' for simplicity, or the specific 'segment'
    // Let's use the behavioral segment
    const seg = c.segment.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
    
    if (!segmentMap.has(seg)) {
      segmentMap.set(seg, { count: 0, totalSpent: 0, users: [] });
    }
    const data = segmentMap.get(seg)!;
    data.count++;
    data.totalSpent += c.features.totalTxValue30d;
    data.users.push(c);
  });

  const segments = Array.from(segmentMap.entries()).map(([name, data]) => {
    // Calculate Mode for Channel
    const channelCounts: Record<string, number> = {};
    const serviceCounts: Record<string, number> = {};
    let totalResponseRate = 0;

    data.users.forEach(u => {
      const ch = u.features.preferredChannel || "Push";
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;
      
      const svc = u.features.mostUsedService || "Recharge";
      serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;

      totalResponseRate += u.features.campaignResponseRate || 0;
    });

    const topChannel = Object.keys(channelCounts).sort((a,b) => channelCounts[b] - channelCounts[a])[0] || "Push";
    const topService = Object.keys(serviceCounts).sort((a,b) => serviceCounts[b] - serviceCounts[a])[0] || "Recharge";
    const avgResponse = data.count > 0 ? (totalResponseRate / data.count) : 0;

    return {
      name,
      count: data.count,
      avgSpent: data.count > 0 ? Math.round(data.totalSpent / data.count) : 0,
      topChannel: topChannel.toUpperCase(),
      topService: topService.replace("_", " ").toUpperCase(),
      avgResponse: (avgResponse * 100).toFixed(1) + "%",
      avgResponseNum: avgResponse,
      users: data.users
    };
  })
  .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  .sort((a, b) => {
    if (sortBy === "size") return b.count - a.count;
    if (sortBy === "spend") return b.avgSpent - a.avgSpent;
    if (sortBy === "response") return b.avgResponseNum - a.avgResponseNum;
    return 0;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-upay-navy tracking-tight">Customer Segments</h1>
          <p className="text-muted-foreground mt-1">Manage AI-driven customer clusters and audiences.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-upay-navy/20">
            <Download size={16} /> Export
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search segments..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-upay-blue"
          />
        </div>
        <div className="relative">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none bg-white border border-border rounded-lg py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-upay-blue font-medium text-slate-700 cursor-pointer h-full"
          >
            <option value="size">Sort by Size</option>
            <option value="spend">Sort by Avg Spend</option>
            <option value="response">Sort by Response Rate</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {segments.map((segment) => (
          <Card 
            key={segment.name} 
            className="hover:border-upay-blue transition-colors cursor-pointer border-border shadow-sm group"
            onClick={() => setSelectedSegment(segment)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-upay-blue/10 text-upay-blue rounded-lg">
                    <Users size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-upay-navy">{segment.name}</h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider bg-upay-blue/10 text-upay-blue`}>
                  Auto-Clustered
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Population</p>
                  <p className="text-2xl font-black text-upay-navy">{segment.count.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Avg 30d Spend</p>
                  <p className="text-2xl font-black text-emerald-600">৳{segment.avgSpent.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100">
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Segment Insights</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Top Service</span>
                    <span className="block text-xs font-bold text-upay-navy mt-1 truncate">{segment.topService}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Best Channel</span>
                    <span className="block text-xs font-bold text-upay-navy mt-1">{segment.topChannel}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Response</span>
                    <span className="block text-xs font-bold text-indigo-600 mt-1">{segment.avgResponse}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedSegment && (
        <CampaignBuilderModal 
          isOpen={!!selectedSegment} 
          onClose={() => setSelectedSegment(null)} 
          sourceAction={selectedSegment.name as any} 
          evaluation={{
            customerIds: selectedSegment.users.map(u => u.id),
            excludedCustomerIds: [],
            count: selectedSegment.count
          }}
        />
      )}
    </div>
  );
}
