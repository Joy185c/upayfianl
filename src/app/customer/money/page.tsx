"use client";

import { useState } from "react";
import { Wallet, TrendingUp, PieChart as PieChartIcon, Send, Smartphone, Store, Receipt, Plus, ArrowDownToLine } from "lucide-react";
import { useWalletStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionModal } from "@/components/TransactionModal";
import { TransactionType } from "@/types/wallet";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

const COLORS = ['#0555A4', '#16A34A', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function MoneyPage() {
  const { wallet, transactions } = useWalletStore();

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedTxType, setSelectedTxType] = useState<TransactionType>("send_money");

  const handleOpenQuickService = (type: TransactionType) => {
    setSelectedTxType(type);
    setIsTxModalOpen(true);
  };

  // Calculate real 30-day totals & category breakdown from store transactions
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentTxs = transactions.filter((tx) => new Date(tx.created_at) >= thirtyDaysAgo);

  const totalsByType: Record<string, number> = {
    merchant: 0,
    recharge: 0,
    bills: 0,
    send_money: 0,
    cash_out: 0,
  };

  let totalSpent30d = 0;

  recentTxs.forEach((tx) => {
    if (["send_money", "mobile_recharge", "pay_merchant", "pay_bill", "cash_out"].includes(tx.type)) {
      totalSpent30d += tx.total_amount;
      if (tx.type === "pay_merchant") totalsByType.merchant += tx.total_amount;
      if (tx.type === "mobile_recharge") totalsByType.recharge += tx.total_amount;
      if (tx.type === "pay_bill") totalsByType.bills += tx.total_amount;
      if (tx.type === "send_money") totalsByType.send_money += tx.total_amount;
      if (tx.type === "cash_out") totalsByType.cash_out += tx.total_amount;
    }
  });

  const categoryData = [
    { name: "Merchant", value: totalsByType.merchant },
    { name: "Recharge", value: totalsByType.recharge },
    { name: "Bills", value: totalsByType.bills },
    { name: "Send Money", value: totalsByType.send_money },
    { name: "Cash Out", value: totalsByType.cash_out },
  ].filter((c) => c.value > 0);

  const quickActions = [
    { id: "send_money" as TransactionType, name: "Send", icon: Send },
    { id: "mobile_recharge" as TransactionType, name: "Recharge", icon: Smartphone },
    { id: "pay_merchant" as TransactionType, name: "Merchant", icon: Store },
    { id: "pay_bill" as TransactionType, name: "Bills", icon: Receipt },
    { id: "cash_out" as TransactionType, name: "Cash Out", icon: ArrowDownToLine },
    { id: "add_money" as TransactionType, name: "Add Money", icon: Plus },
  ];

  return (
    <div className="flex flex-col bg-background min-h-full">
      {/* Header */}
      <div className="bg-upay-navy text-white px-6 pt-12 pb-8 rounded-b-[2rem] shadow-md relative">
        <div className="flex items-center gap-3 mb-2 relative z-10">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
            <Wallet size={24} className="text-upay-yellow" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Money & Wallet</h1>
            <p className="text-xs text-white/80">Financial overview and spending breakdown</p>
          </div>
        </div>

        {/* Total Balance & Spent Cards */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-white rounded-2xl p-4 text-upay-navy shadow-lg">
            <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Current Balance</p>
            <h2 className="text-xl font-black mt-1">
              ৳{wallet.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h2>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white backdrop-blur-sm">
            <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider">Spent (30 Days)</p>
            <h2 className="text-xl font-black mt-1 text-upay-yellow">
              ৳{totalSpent30d.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="px-5 py-6 space-y-6">
        {/* Quick Actions Bar */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs font-extrabold text-upay-navy uppercase tracking-wider">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="grid grid-cols-6 gap-1">
              {quickActions.map((qa) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={qa.id}
                    onClick={() => handleOpenQuickService(qa.id)}
                    className="flex flex-col items-center p-2 rounded-xl hover:bg-muted transition"
                  >
                    <div className="p-2 rounded-lg bg-upay-navy/5 text-upay-navy mb-1">
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-upay-navy">{qa.name}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Spending Breakdown Pie Chart */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-upay-navy flex items-center gap-2">
              <PieChartIcon size={18} className="text-upay-blue" />
              Spending Breakdown (Real-time)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="h-[200px] w-full relative mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black text-upay-navy">{recentTxs.length}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Trxns</span>
                </div>
              </div>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-muted-foreground text-xs bg-muted/20 rounded-xl border border-dashed border-border mt-2">
                No recent spending data. Execute a transaction to see breakdown.
              </div>
            )}

            {categoryData.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/60">
                {categoryData.map((entry: any, index: number) => (
                  <div key={entry.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="font-semibold text-upay-navy">{entry.name}</span>
                    </div>
                    <span className="font-bold text-upay-navy">৳{entry.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Trend Card */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Account Activity</p>
              <h4 className="text-base font-extrabold text-upay-navy">
                {recentTxs.length > 0 ? `${recentTxs.length} Active Transactions` : "Healthy Account Status"}
              </h4>
            </div>
          </CardContent>
        </Card>
      </div>

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        defaultType={selectedTxType}
      />
    </div>
  );
}
