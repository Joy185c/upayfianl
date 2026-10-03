"use client";

import { useState, useEffect } from "react";
import { 
  Send, MailOpen, MousePointerClick, CheckCircle, Smartphone, AlertCircle, AlertTriangle, Play,
  ChevronRight, RefreshCw, BarChart3, Search, Filter, X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MessageDeliveryTrackerProps {
  campaignId: string;
  campaignName: string;
  audienceSize: number;
}

export function MessageDeliveryTracker({ campaignId, campaignName, audienceSize }: MessageDeliveryTrackerProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Mock data states
  const [metrics, setMetrics] = useState({
    targeted: audienceSize || 3950,
    sent: 0,
    delivered: 0,
    failed: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    transactions: 0
  });

  const [selectedUser, setSelectedUser] = useState<any>(null);

  const mockUsers = [
    { id: "CUST-8492", name: "Rahim Uddin", segment: "High-Uplift Students", status: "Converted", deliveredAt: "10:03 AM", openedAt: "10:17 AM", clickedAt: "10:19 AM", convertedAt: "10:27 AM", txnAt: "10:29 AM", channel: "Push", pResponse: "84.5%", pUplift: "+42.1%", fatigue: "Low" },
    { id: "CUST-9123", name: "Karim Hassan", segment: "High-Uplift Students", status: "Delivered", deliveredAt: "10:04 AM", openedAt: "-", clickedAt: "-", convertedAt: "-", txnAt: "-", channel: "Push", pResponse: "72.1%", pUplift: "+38.4%", fatigue: "Medium" },
    { id: "CUST-3310", name: "Salma Akter", segment: "High-Uplift Students", status: "Failed", deliveredAt: "-", openedAt: "-", clickedAt: "-", convertedAt: "-", txnAt: "-", channel: "Push", pResponse: "91.2%", pUplift: "+48.9%", fatigue: "Low", failReason: "Invalid Device Token" },
    { id: "CUST-5512", name: "Jashim Mia", segment: "Dormant Users", status: "Opened", deliveredAt: "10:05 AM", openedAt: "11:30 AM", clickedAt: "-", convertedAt: "-", txnAt: "-", channel: "SMS", pResponse: "45.0%", pUplift: "+12.1%", fatigue: "High" },
    { id: "CUST-7721", name: "Nusrat Jahan", segment: "High-Uplift Students", status: "Clicked", deliveredAt: "10:03 AM", openedAt: "10:05 AM", clickedAt: "10:06 AM", convertedAt: "-", txnAt: "-", channel: "Push", pResponse: "88.5%", pUplift: "+45.0%", fatigue: "Low" }
  ];

  const handleSimulate = () => {
    setIsSimulating(true);
    setProgress(0);
    setMetrics(prev => ({ ...prev, sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0, converted: 0, transactions: 0 }));

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);
      
      const targeted = metrics.targeted;
      const currentSent = Math.floor((targeted * currentProgress) / 100);
      const currentDelivered = Math.floor(currentSent * 0.965);
      const currentFailed = currentSent - currentDelivered;
      const currentOpened = Math.floor(currentDelivered * 0.718);
      const currentClicked = Math.floor(currentDelivered * 0.369);
      const currentConverted = Math.floor(currentDelivered * 0.173);
      const currentTxns = Math.floor(currentConverted * 0.85);

      setMetrics({
        targeted,
        sent: currentSent,
        delivered: currentDelivered,
        failed: currentFailed,
        opened: currentOpened,
        clicked: currentClicked,
        converted: currentConverted,
        transactions: currentTxns
      });

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 200);
  };

  const deliveryRate = metrics.sent > 0 ? ((metrics.delivered / metrics.sent) * 100).toFixed(1) : "0.0";
  const openRate = metrics.delivered > 0 ? ((metrics.opened / metrics.delivered) * 100).toFixed(1) : "0.0";
  const clickRate = metrics.delivered > 0 ? ((metrics.clicked / metrics.delivered) * 100).toFixed(1) : "0.0";
  const convRate = metrics.delivered > 0 ? ((metrics.converted / metrics.delivered) * 100).toFixed(1) : "0.0";
  const failRate = metrics.sent > 0 ? ((metrics.failed / metrics.sent) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      
      {/* HEADER & MESSAGE STATUS */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-upay-navy mb-1 flex items-center gap-2">
            Message Delivery
            <Badge className="bg-emerald-100 text-emerald-800 border-none">ACTIVE</Badge>
            <Badge className="bg-slate-100 text-slate-800 border-none ml-2">DEMO / SYNTHETIC DELIVERY DATA</Badge>
          </h2>
          <p className="text-sm text-slate-500">Tracking user engagement and delivery impact for {campaignName || "Campaign"}</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Overall Status</div>
            <div className="font-bold text-emerald-600 flex items-center justify-end gap-1"><CheckCircle size={14} /> DELIVERED</div>
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <Button 
            onClick={handleSimulate} 
            disabled={isSimulating}
            className="bg-upay-yellow hover:bg-yellow-500 text-upay-navy font-bold rounded-xl"
          >
            <Play size={16} className="mr-2" /> 
            {isSimulating ? "Simulating..." : "Simulate Campaign Send"}
          </Button>
        </div>
      </div>

      {/* REAL-TIME PROGRESS BAR */}
      {isSimulating && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-blue-800 animate-pulse flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Campaign Sending...</span>
              <span className="text-xs font-bold text-blue-800">{metrics.sent.toLocaleString()} / {metrics.targeted.toLocaleString()} messages sent</span>
            </div>
            <div className="h-3 w-full bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-upay-blue transition-all duration-200" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-blue-100/50 text-sm">
              <div><span className="text-blue-500 font-bold block text-xs">Sent</span><span className="font-black text-blue-900">{metrics.sent.toLocaleString()}</span></div>
              <div><span className="text-emerald-500 font-bold block text-xs">Delivered</span><span className="font-black text-emerald-900">{metrics.delivered.toLocaleString()}</span></div>
              <div><span className="text-red-500 font-bold block text-xs">Failed</span><span className="font-black text-red-900">{metrics.failed.toLocaleString()}</span></div>
              <div><span className="text-slate-500 font-bold block text-xs">Pending</span><span className="font-black text-slate-700">{(metrics.targeted - metrics.sent).toLocaleString()}</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TOP METRICS / ANALYTICS */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Delivery Rate</div>
            <div className="text-2xl font-black text-upay-navy">{deliveryRate}%</div>
            <div className="text-xs text-slate-400 mt-1">Delivered / Sent</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Open Rate</div>
            <div className="text-2xl font-black text-upay-navy">{openRate}%</div>
            <div className="text-xs text-slate-400 mt-1">Opened / Delivered</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Click Rate</div>
            <div className="text-2xl font-black text-upay-navy">{clickRate}%</div>
            <div className="text-xs text-slate-400 mt-1">Clicked / Delivered</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 shadow-sm bg-emerald-50">
          <CardContent className="p-4 text-center">
            <div className="text-[10px] uppercase font-bold text-emerald-700 mb-1">Conversion Rate</div>
            <div className="text-2xl font-black text-emerald-700">{convRate}%</div>
            <div className="text-xs text-emerald-600 mt-1">Converted / Delivered</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 shadow-sm bg-red-50">
          <CardContent className="p-4 text-center">
            <div className="text-[10px] uppercase font-bold text-red-700 mb-1">Failure Rate</div>
            <div className="text-2xl font-black text-red-700">{failRate}%</div>
            <div className="text-xs text-red-600 mt-1">Failed / Sent</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COL: FUNNEL & NOTIFICATION */}
        <div className="xl:col-span-1 space-y-6">
          
          <Card className="border-border shadow-sm">
            <div className="bg-slate-50 p-3 border-b flex items-center justify-between font-black text-upay-navy text-sm">
              Delivery Funnel
            </div>
            <CardContent className="p-5">
              <div className="space-y-1 relative">
                {/* Connecting Line */}
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200"></div>
                
                {[
                  { label: "Targeted", count: metrics.targeted, icon: Users, color: "text-slate-500", bg: "bg-slate-100" },
                  { label: "Sent", count: metrics.sent, icon: Send, color: "text-blue-500", bg: "bg-blue-100" },
                  { label: "Delivered", count: metrics.delivered, icon: Smartphone, color: "text-emerald-500", bg: "bg-emerald-100" },
                  { label: "Opened", count: metrics.opened, icon: MailOpen, color: "text-amber-500", bg: "bg-amber-100" },
                  { label: "Clicked", count: metrics.clicked, icon: MousePointerClick, color: "text-purple-500", bg: "bg-purple-100" },
                  { label: "Converted", count: metrics.converted, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
                  { label: "Transactions", count: metrics.transactions, icon: BarChart3, color: "text-upay-navy", bg: "bg-slate-200" }
                ].map((step, idx) => (
                  <div key={idx} className="relative flex items-center gap-4 py-2 bg-white z-10">
                    <div className={`w-12 h-12 rounded-full ${step.bg} ${step.color} flex items-center justify-center border-4 border-white shrink-0`}>
                      <step.icon size={20} />
                    </div>
                    <div className="flex-1 flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <span className="font-bold text-slate-700 text-sm">{step.label}</span>
                      <span className="font-black text-upay-navy">{step.count.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* NOTIFICATION PREVIEW */}
          <Card className="border-border shadow-sm">
            <div className="bg-slate-50 p-3 border-b flex items-center justify-between font-black text-upay-navy text-sm">
              Message Preview
              <Badge variant="outline" className="text-[10px]">PUSH NOTIFICATION</Badge>
            </div>
            <CardContent className="p-5">
              <div className="bg-[#f0f2f5] p-4 rounded-xl border shadow-inner">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-3 border-b flex items-center gap-2 bg-upay-navy text-white text-xs font-bold">
                    <img src="/upay-logo.svg" className="h-4 w-auto invert" alt="upay" />
                    Upay
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-sm text-slate-800">Recharge & Save</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Complete your recharge and enjoy your eligible campaign benefit.
                    </p>
                    <div className="pt-2 text-[10px] text-slate-400">Valid until: Tomorrow</div>
                  </div>
                  <div className="bg-slate-50 p-3 text-center border-t text-upay-blue text-xs font-bold cursor-pointer hover:bg-slate-100">
                    [ Recharge Now ]
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COL: USER LEVEL TABLE */}
        <div className="xl:col-span-2">
          <Card className="border-border shadow-sm h-full">
            <div className="bg-slate-50 p-4 border-b flex items-center justify-between font-black text-upay-navy">
              User Message Activity
            </div>
            <CardContent className="p-0">
              
              <div className="p-4 border-b flex gap-3 bg-white">
                <div className="relative flex-1">
                  <input type="text" placeholder="Search Customer ID or Name..." className="w-full bg-slate-50 border rounded-lg pl-9 py-2 text-sm outline-none focus:border-upay-blue" />
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <Button variant="outline" className="border-slate-200 text-slate-600"><Filter size={16} className="mr-2" /> Filter</Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Delivered</th>
                      <th className="px-4 py-3">Opened</th>
                      <th className="px-4 py-3">Converted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockUsers.map(user => (
                      <tr key={user.id} onClick={() => setSelectedUser(user)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                        <td className="px-4 py-3">
                          <div className="font-bold text-upay-navy group-hover:text-upay-blue transition-colors">{user.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{user.id}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={
                            user.status === "Converted" ? "bg-emerald-100 text-emerald-800" :
                            user.status === "Failed" ? "bg-red-100 text-red-800" :
                            user.status === "Opened" || user.status === "Clicked" ? "bg-amber-100 text-amber-800" :
                            "bg-blue-100 text-blue-800"
                          }>{user.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{user.deliveredAt}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{user.openedAt}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{user.convertedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

      {/* USER DETAIL DRAWER */}
      {selectedUser && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l z-50 flex flex-col animate-in slide-in-from-right">
          <div className="p-5 bg-upay-navy text-white flex justify-between items-center shrink-0">
            <div>
              <h3 className="font-black text-lg">Customer Journey</h3>
              <p className="text-xs text-white/70">{selectedUser.name} ({selectedUser.id})</p>
            </div>
            <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="bg-slate-50 rounded-xl p-4 border grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Predicted Response</div>
                <div className="font-black text-upay-navy">{selectedUser.pResponse}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Predicted Uplift</div>
                <div className="font-black text-emerald-600">{selectedUser.pUplift}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Fatigue Level</div>
                <div className="font-black text-slate-700">{selectedUser.fatigue}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Channel</div>
                <div className="font-black text-slate-700">{selectedUser.channel}</div>
              </div>
            </div>

            {selectedUser.status === "Failed" && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3">
                <AlertCircle className="text-red-500 shrink-0" />
                <div>
                  <h4 className="text-red-800 font-bold text-sm">Delivery Failed</h4>
                  <p className="text-xs text-red-600 mt-1">{selectedUser.failReason}</p>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">Interaction Timeline</h4>
              <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-slate-200">
                
                <div className="relative">
                  <div className="absolute -left-5 bg-white border-2 border-slate-300 w-3 h-3 rounded-full mt-1.5"></div>
                  <div className="font-bold text-sm text-slate-800">Targeted</div>
                  <div className="text-xs text-slate-500 font-mono">System Assigned</div>
                </div>

                {selectedUser.deliveredAt !== "-" && (
                  <>
                    <div className="relative">
                      <div className="absolute -left-5 bg-white border-2 border-blue-400 w-3 h-3 rounded-full mt-1.5"></div>
                      <div className="font-bold text-sm text-slate-800">Message Sent</div>
                      <div className="text-xs text-slate-500 font-mono">10:02 AM</div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-5 bg-white border-2 border-emerald-400 w-3 h-3 rounded-full mt-1.5"></div>
                      <div className="font-bold text-sm text-slate-800">Delivered</div>
                      <div className="text-xs text-slate-500 font-mono">{selectedUser.deliveredAt}</div>
                    </div>
                  </>
                )}

                {selectedUser.openedAt !== "-" && (
                  <div className="relative">
                    <div className="absolute -left-5 bg-white border-2 border-amber-400 w-3 h-3 rounded-full mt-1.5"></div>
                    <div className="font-bold text-sm text-slate-800">Opened</div>
                    <div className="text-xs text-slate-500 font-mono">{selectedUser.openedAt}</div>
                  </div>
                )}

                {selectedUser.clickedAt !== "-" && (
                  <div className="relative">
                    <div className="absolute -left-5 bg-white border-2 border-purple-400 w-3 h-3 rounded-full mt-1.5"></div>
                    <div className="font-bold text-sm text-slate-800">Clicked CTA</div>
                    <div className="text-xs text-slate-500 font-mono">{selectedUser.clickedAt}</div>
                  </div>
                )}

                {selectedUser.convertedAt !== "-" && (
                  <div className="relative">
                    <div className="absolute -left-5 bg-white border-2 border-emerald-600 w-3 h-3 rounded-full mt-1.5"></div>
                    <div className="font-bold text-sm text-emerald-700">Converted</div>
                    <div className="text-xs text-slate-500 font-mono">{selectedUser.convertedAt}</div>
                  </div>
                )}

                {selectedUser.txnAt !== "-" && (
                  <div className="relative">
                    <div className="absolute -left-5 bg-emerald-100 border-2 border-emerald-600 w-3 h-3 rounded-full mt-1.5"></div>
                    <div className="font-bold text-sm text-upay-navy">Transaction Logged</div>
                    <div className="text-xs text-slate-500 font-mono">{selectedUser.txnAt}</div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
