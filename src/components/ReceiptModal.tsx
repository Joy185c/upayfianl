"use client";

import { CheckCircle2, X, Share2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/types/wallet";
import toast from "react-hot-toast";

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptModal({ transaction, isOpen, onClose }: ReceiptModalProps) {
  if (!transaction) return null;

  const isDebit = ["send_money", "mobile_recharge", "pay_merchant", "pay_bill", "cash_out"].includes(transaction.type);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`Upay BD Receipt\nTrx ID: ${transaction.transaction_id}\nAmount: ৳${transaction.amount}\nType: ${transaction.type}`);
      toast.success("Receipt details copied to clipboard!");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[94vw] max-w-md p-0 overflow-hidden border-none rounded-3xl bg-white shadow-2xl max-h-[92vh] flex flex-col">
        {/* Receipt Header */}
        <div className="bg-upay-navy text-white p-5 relative text-center shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X size={16} />
          </button>
          
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-upay-yellow text-upay-navy rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
            <CheckCircle2 size={28} />
          </div>
          
          <h2 className="text-lg font-black uppercase tracking-wider">Transaction Receipt</h2>
          <p className="text-[11px] text-white/70 font-mono">ID: {transaction.transaction_id}</p>
        </div>

        {/* Receipt Body */}
        <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1 text-xs">
          <div className="text-center py-2 bg-muted/30 rounded-2xl border border-border">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Amount</p>
            <h3 className={`text-2xl sm:text-3xl font-black mt-0.5 ${isDebit ? 'text-upay-navy' : 'text-emerald-600'}`}>
              {isDebit ? '-' : '+'}৳{transaction.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase rounded-full mt-1">
              {transaction.status}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-muted-foreground font-medium">Service Type:</span>
              <span className="font-bold text-upay-navy uppercase">{transaction.type.replace("_", " ")}</span>
            </div>
            
            {transaction.counterparty && (
              <div className="flex justify-between py-1.5 border-b border-border/60 gap-2">
                <span className="text-muted-foreground font-medium shrink-0">Details:</span>
                <span className="font-bold text-upay-navy truncate text-right">{transaction.counterparty}</span>
              </div>
            )}

            {transaction.operator && (
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground font-medium">Operator:</span>
                <span className="font-bold text-upay-navy">{transaction.operator}</span>
              </div>
            )}

            {transaction.biller && (
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground font-medium">Biller:</span>
                <span className="font-bold text-upay-navy">{transaction.biller}</span>
              </div>
            )}

            {transaction.fee > 0 && (
              <div className="flex justify-between py-1.5 border-b border-border/60 text-amber-700">
                <span className="font-medium">Fee:</span>
                <span className="font-bold">৳{transaction.fee.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-muted-foreground font-medium">Date & Time:</span>
              <span className="font-semibold text-upay-navy text-[11px]">{formatDate(transaction.created_at)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-muted-foreground font-medium">Balance After:</span>
              <span className="font-extrabold text-upay-navy">
                ৳{transaction.balance_after.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {transaction.is_imported && (
              <div className="p-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-[10px] font-medium flex items-center gap-1.5 mt-2">
                <ShieldCheck size={14} /> Imported Demo Transaction
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex-1 rounded-xl font-bold border-border text-upay-navy flex items-center justify-center gap-1 text-xs"
            >
              <Share2 size={14} /> Share
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 rounded-xl bg-upay-navy text-white hover:bg-upay-navy/90 font-bold text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
