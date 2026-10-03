"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Send, 
  Smartphone, 
  Store, 
  Receipt, 
  Plus, 
  ArrowDownToLine, 
  Bell, 
  Zap, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWalletStore } from "@/lib/store";
import { TransactionModal } from "@/components/TransactionModal";
import { NotificationDrawer } from "@/components/NotificationDrawer";
import { ReceiptModal } from "@/components/ReceiptModal";
import { Transaction, TransactionType } from "@/types/wallet";

export default function CustomerHome() {
  const router = useRouter();
  const { wallet, hasUnreadNotifications, benefitClaims } = useWalletStore();

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedTxType, setSelectedTxType] = useState<TransactionType>("send_money");
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  const handleOpenQuickService = (type: TransactionType) => {
    setSelectedTxType(type);
    setIsTxModalOpen(true);
  };

  const quickActions = [
    { id: "send_money" as TransactionType, name: "Send Money", icon: Send },
    { id: "mobile_recharge" as TransactionType, name: "Recharge", icon: Smartphone },
    { id: "pay_merchant" as TransactionType, name: "Pay Merchant", icon: Store },
    { id: "pay_bill" as TransactionType, name: "Pay Bill", icon: Receipt },
    { id: "cash_out" as TransactionType, name: "Cash Out", icon: ArrowDownToLine },
    { id: "add_money" as TransactionType, name: "Add Money", icon: Plus },
  ];

  return (
    <div className="flex flex-col bg-background min-h-full">
      {/* Top Header */}
      <div className="bg-upay-navy text-white px-4 sm:px-6 pt-8 sm:pt-10 pb-5 sm:pb-6 rounded-b-[2rem] shadow-md relative z-10">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white p-1 shadow-md border border-white/20 flex items-center justify-center shrink-0">
              <Image
                src="/logo.png"
                alt="ImpactIQ Logo"
                width={40}
                height={40}
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <p className="text-white/80 text-[11px] sm:text-xs font-medium mb-0.5">Good evening, 👋</p>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{wallet.display_name}</h1>
            </div>
          </div>

          <button 
            onClick={() => setIsNotifDrawerOpen(true)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/10 flex items-center justify-center relative hover:bg-white/20 transition-all border border-white/10 shadow-sm shrink-0"
          >
            <Bell size={18} className="text-white" />
            {hasUnreadNotifications && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-upay-yellow rounded-full border-2 border-upay-navy shadow-sm animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 text-upay-navy shadow-xl relative overflow-hidden border border-white/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-upay-yellow/15 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-muted-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wider">Available Balance</p>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={11} /> Active
            </span>
          </div>
          
          <div className="flex justify-between items-end mt-1 gap-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight truncate">
              <span className="text-lg sm:text-xl font-bold mr-0.5">৳</span>
              {wallet.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h2>
            <Button 
              size="sm" 
              onClick={() => handleOpenQuickService("add_money")}
              className="rounded-full bg-upay-yellow text-upay-navy hover:bg-upay-yellow/90 font-black text-xs px-3 sm:px-4 shadow-md transition-transform shrink-0 h-9"
            >
              <Plus size={15} className="mr-0.5 stroke-[3]" /> Add Money
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Services */}
      <div className="px-4 sm:px-6 pt-5 pb-2">
        <h3 className="text-[11px] font-extrabold text-upay-navy mb-3 uppercase tracking-wider">Quick Services</h3>
        <div className="grid grid-cols-4 gap-y-4 sm:gap-y-5 gap-x-1.5 sm:gap-x-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div 
                key={action.id} 
                onClick={() => handleOpenQuickService(action.id)}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-sm border border-border flex items-center justify-center mb-1.5 group-hover:bg-upay-yellow/20 group-hover:border-upay-yellow transition-all">
                  <Icon size={20} className="text-upay-blue group-hover:text-upay-navy transition-colors" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-center text-upay-navy/90 leading-tight">
                  {action.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ImpactIQ Benefits Feature Section */}
      <div className="px-4 sm:px-6 py-5">
        <div className="flex items-center gap-1.5 mb-3">
          <div className="bg-upay-navy p-1.5 rounded-lg shadow-sm">
            <Zap size={15} className="text-upay-yellow fill-upay-yellow" />
          </div>
          <h3 className="text-[11px] font-extrabold text-upay-navy uppercase tracking-wider">ImpactIQ Benefits</h3>
        </div>
        
        <Card className="bg-gradient-to-br from-upay-yellow/20 via-white to-white border-upay-yellow/40 shadow-md overflow-hidden relative rounded-2xl">
          <CardContent className="p-4 sm:p-5 relative">
            <div className="absolute right-0 bottom-0 w-28 h-28 bg-upay-yellow/30 rounded-full blur-2xl -mr-6 -mb-6"></div>
            <div className="flex justify-between items-start mb-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-upay-yellow text-upay-navy uppercase tracking-wider shadow-sm">
                Recommended for you
              </span>
              {benefitClaims.some(c => c.benefit_id === "offer-recharge-20") && (
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Claimed
                </span>
              )}
            </div>
            <h4 className="text-base sm:text-lg font-black text-upay-navy leading-tight mb-1">
              Recharge ৳100 & Get ৳20 Cashback
            </h4>
            <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
              AI Insight: You usually recharge near month-end. Claim now for 20% instant bonus!
            </p>
            <Button 
              size="sm" 
              onClick={() => router.push("/customer/impactiq")}
              className="w-full bg-upay-navy text-white hover:bg-upay-navy/90 rounded-xl font-bold group shadow-sm text-xs py-4"
            >
              View Benefit <ArrowRight size={15} className="ml-1.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modals & Drawers */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        defaultType={selectedTxType}
        onViewReceipt={(tx) => setReceiptTx(tx)}
      />

      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
      />

      <ReceiptModal
        transaction={receiptTx}
        isOpen={Boolean(receiptTx)}
        onClose={() => setReceiptTx(null)}
      />
    </div>
  );
}
