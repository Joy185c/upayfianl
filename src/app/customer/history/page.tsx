"use client";

import { useState } from "react";
import { 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  FileJson, 
  Calendar, 
  X
} from "lucide-react";
import { useWalletStore } from "@/lib/store";
import { Transaction } from "@/types/wallet";
import { ReceiptModal } from "@/components/ReceiptModal";
import { JsonImportModal } from "@/components/JsonImportModal";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const { transactions } = useWalletStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  // Filter transactions
  const filteredTxs = transactions.filter((tx) => {
    if (selectedType !== "all" && tx.type !== selectedType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCounterparty = (tx.counterparty || "").toLowerCase().includes(q);
      const matchId = (tx.transaction_id || "").toLowerCase().includes(q);
      const matchNote = (tx.note || "").toLowerCase().includes(q);
      const matchAmount = tx.amount.toString().includes(q);
      return matchCounterparty || matchId || matchNote || matchAmount;
    }
    return true;
  });

  // Group by date
  const groupTransactionsByDate = (items: Transaction[]) => {
    const groups: { label: string; items: Transaction[] }[] = [
      { label: "Today", items: [] },
      { label: "Yesterday", items: [] },
      { label: "Earlier", items: [] },
    ];

    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    items.forEach((tx) => {
      const txDateStr = new Date(tx.created_at).toDateString();
      if (txDateStr === todayStr) {
        groups[0].items.push(tx);
      } else if (txDateStr === yesterdayStr) {
        groups[1].items.push(tx);
      } else {
        groups[2].items.push(tx);
      }
    });

    return groups.filter((g) => g.items.length > 0);
  };

  const groupedTxs = groupTransactionsByDate(filteredTxs);

  const filterTabs = [
    { id: "all", label: "All" },
    { id: "send_money", label: "Send" },
    { id: "mobile_recharge", label: "Recharge" },
    { id: "pay_merchant", label: "Merchant" },
    { id: "pay_bill", label: "Bill" },
    { id: "cash_out", label: "Cash Out" },
    { id: "add_money", label: "Add Money" },
  ];

  return (
    <div className="flex flex-col bg-background min-h-full">
      {/* Header */}
      <div className="bg-upay-navy text-white px-4 sm:px-6 pt-8 sm:pt-10 pb-5 sm:pb-6 rounded-b-[2rem] shadow-md relative">
        <div className="flex justify-between items-center gap-2 mb-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="bg-white/10 p-2 sm:p-2.5 rounded-xl backdrop-blur-sm shrink-0">
              <History size={22} className="text-upay-yellow" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">History</h1>
              <p className="text-[11px] sm:text-xs text-white/80">Real transaction log & receipts</p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setIsJsonModalOpen(true)}
            className="rounded-full bg-upay-yellow text-upay-navy hover:bg-upay-yellow/90 font-extrabold text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 flex items-center gap-1 shadow-md shrink-0"
          >
            <FileJson size={14} /> <span className="hidden xs:inline">Import</span> JSON
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mt-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            placeholder="Search by name, Trx ID, or amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-full py-2 pl-9 pr-8 text-xs text-white placeholder:text-white/50 focus:outline-none focus:bg-white/20 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto mt-3.5 pt-1 pb-1 scrollbar-none border-t border-white/10">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedType === tab.id
                  ? "bg-upay-yellow text-upay-navy font-bold shadow-sm"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      <div className="px-3.5 sm:px-5 py-4 sm:py-6 space-y-5">
        {groupedTxs.length > 0 ? (
          groupedTxs.map((group) => (
            <div key={group.label} className="space-y-2.5">
              <div className="flex items-center gap-1.5 px-1">
                <Calendar size={13} className="text-upay-blue" />
                <h3 className="text-[11px] font-bold text-upay-navy uppercase tracking-wider">
                  {group.label}
                </h3>
              </div>

              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden divide-y divide-border/60">
                {group.items.map((tx) => {
                  const isDebit = [
                    "send_money",
                    "mobile_recharge",
                    "pay_merchant",
                    "pay_bill",
                    "cash_out",
                  ].includes(tx.type);

                  return (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="p-3 sm:p-4 flex justify-between items-center gap-2 hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div
                          className={`p-2 sm:p-2.5 rounded-full shrink-0 transition-transform group-hover:scale-105 ${
                            isDebit ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                          }`}
                        >
                          {isDebit ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-upay-navy text-xs sm:text-sm flex items-center gap-1 truncate">
                            <span className="truncate">{tx.counterparty || tx.type.replace("_", " ")}</span>
                            {tx.is_imported && (
                              <span className="text-[8px] sm:text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full shrink-0">
                                Demo
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">
                            {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {tx.transaction_id}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`font-extrabold text-xs sm:text-sm ${isDebit ? "text-upay-navy" : "text-emerald-600"}`}>
                          {isDebit ? "-" : "+"}৳{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">
                          {tx.type.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 sm:py-16 px-4 bg-white rounded-2xl border border-dashed border-border shadow-sm">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <History size={24} />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-upay-navy mb-1">No Transactions Found</h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-4">
              {searchQuery || selectedType !== "all"
                ? "No entries match your search query or category filter."
                : "Your transaction history is empty. Perform a transaction or import sample JSON data."}
            </p>
            <Button
              size="sm"
              onClick={() => setIsJsonModalOpen(true)}
              className="bg-upay-navy text-white hover:bg-upay-navy/90 font-bold rounded-xl text-xs px-4 py-2"
            >
              <FileJson size={14} className="mr-1.5" /> Import Sample JSON
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ReceiptModal
        transaction={selectedTx}
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
      />

      <JsonImportModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
      />
    </div>
  );
}
