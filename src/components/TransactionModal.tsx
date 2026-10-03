"use client";

import { useState, useEffect } from "react";
import { 
  Send, 
  Smartphone, 
  Store, 
  Receipt, 
  ArrowDownToLine, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  ChevronRight,
  Building2,
  CreditCard
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/lib/store";
import { TransactionType, Transaction } from "@/types/wallet";
import toast from "react-hot-toast";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  onViewReceipt?: (tx: Transaction) => void;
}

const OPERATORS = [
  { id: "gp", name: "Grameenphone", color: "bg-blue-600" },
  { id: "robi", name: "Robi", color: "bg-red-600" },
  { id: "bl", name: "Banglalink", color: "bg-orange-500" },
  { id: "teletalk", name: "Teletalk", color: "bg-emerald-600" },
  { id: "airtel", name: "Airtel", color: "bg-rose-600" },
];

const BILL_CATEGORIES = [
  { id: "electricity", name: "Electricity (DESCO/DPDC)", icon: "⚡" },
  { id: "gas", name: "Gas (Titas/Karnaphuli)", icon: "🔥" },
  { id: "water", name: "Water (WASA)", icon: "💧" },
  { id: "internet", name: "Internet (AmberIT/Link3)", icon: "🌐" },
  { id: "tv", name: "Cable / DTH (Akash)", icon: "📺" },
];

const ADD_MONEY_SOURCES = [
  { id: "city_bank", name: "City Bank Internet Banking", type: "bank", icon: Building2 },
  { id: "brac_bank", name: "BRAC Bank Astha App", type: "bank", icon: Building2 },
  { id: "ebl", name: "EBL Skybanking", type: "bank", icon: Building2 },
  { id: "visa", name: "Visa Debit/Credit Card", type: "card", icon: CreditCard },
  { id: "mastercard", name: "Mastercard", type: "card", icon: CreditCard },
];

export function TransactionModal({ isOpen, onClose, defaultType = "send_money", onViewReceipt }: TransactionModalProps) {
  const { wallet, executeTransaction } = useWalletStore();
  
  const [type, setType] = useState<TransactionType>(defaultType);
  const [step, setStep] = useState<"input" | "confirm" | "success">("input");
  
  // Form fields
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [operator, setOperator] = useState("Grameenphone");
  const [biller, setBiller] = useState("Electricity (DESCO/DPDC)");
  const [addSource, setAddSource] = useState("City Bank Internet Banking");
  const [pin, setPin] = useState("");
  
  // States
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setType(defaultType);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep("input");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecipient("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount("");
      setNote("");
      setPin("");
      setError("");
      setIsSubmitting(false);
      setLastTransaction(null);
    }
  }, [isOpen, defaultType]);

  const numAmount = parseFloat(amount) || 0;
  const isCashOut = type === "cash_out";
  const fee = isCashOut ? Math.round(numAmount * 0.0149 * 100) / 100 : 0;
  const totalDeducted = isCashOut ? numAmount + fee : numAmount;

  const validateInput = () => {
    setError("");
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than ৳0.");
      return false;
    }

    if (type !== "add_money" && totalDeducted > wallet.balance) {
      setError(`Insufficient balance. Required: ৳${totalDeducted.toFixed(2)}, Available: ৳${wallet.balance.toFixed(2)}.`);
      return false;
    }

    if (type === "send_money" || type === "mobile_recharge" || type === "cash_out") {
      const cleanPhone = recipient.replace(/\D/g, "");
      if (cleanPhone.length < 11 && !recipient.trim()) {
        setError("Please enter a valid 11-digit Bangladesh mobile/agent number.");
        return false;
      }
    }

    if (type === "pay_merchant" && !recipient.trim()) {
      setError("Please enter merchant name or merchant ID.");
      return false;
    }

    if (type === "pay_bill" && !recipient.trim()) {
      setError("Please enter your bill account/customer number.");
      return false;
    }

    return true;
  };

  const handleNextToConfirm = () => {
    if (validateInput()) {
      setStep("confirm");
    }
  };

  const handleExecute = async () => {
    if (!pin || pin.length < 4) {
      setError("Please enter your 4-digit PIN.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await executeTransaction({
        type,
        amount: numAmount,
        counterparty: recipient || (type === "add_money" ? addSource : undefined),
        operator: type === "mobile_recharge" ? operator : undefined,
        biller: type === "pay_bill" ? biller : undefined,
        note: note || undefined,
        pin,
      });

      if (result.success && result.transaction) {
        setLastTransaction(result.transaction);
        setStep("success");
        toast.success(result.message, { duration: 4000 });
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHeaderInfo = () => {
    switch (type) {
      case "send_money":
        return { title: "Send Money", icon: Send, bg: "bg-blue-600" };
      case "mobile_recharge":
        return { title: "Mobile Recharge", icon: Smartphone, bg: "bg-emerald-600" };
      case "pay_merchant":
        return { title: "Pay Merchant", icon: Store, bg: "bg-indigo-600" };
      case "pay_bill":
        return { title: "Pay Bill", icon: Receipt, bg: "bg-amber-600" };
      case "cash_out":
        return { title: "Cash Out", icon: ArrowDownToLine, bg: "bg-rose-600" };
      case "add_money":
        return { title: "Add Money", icon: Plus, bg: "bg-teal-600" };
      default:
        return { title: "Transaction", icon: Send, bg: "bg-upay-navy" };
    }
  };

  const headerInfo = getHeaderInfo();
  const HeaderIcon = headerInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[94vw] max-w-md p-0 overflow-hidden border-none rounded-3xl bg-white shadow-2xl max-h-[92vh] flex flex-col">
        {/* Top Header Banner */}
        <div className={`${headerInfo.bg} text-white px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 relative shrink-0`}>
          <button 
            onClick={onClose} 
            className="absolute top-3.5 right-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shrink-0">
              <HeaderIcon size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">{headerInfo.title}</h2>
              <p className="text-[11px] sm:text-xs text-white/80">Available: ৳{wallet.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Flow Type Switcher Tabs */}
          {step === "input" && (
            <div className="flex gap-1.5 overflow-x-auto mt-3.5 pt-2 scrollbar-none border-t border-white/10">
              {[
                { id: "send_money", label: "Send" },
                { id: "mobile_recharge", label: "Recharge" },
                { id: "pay_merchant", label: "Merchant" },
                { id: "pay_bill", label: "Bill" },
                { id: "cash_out", label: "Cash Out" },
                { id: "add_money", label: "Add Money" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setType(t.id as TransactionType);
                    setError("");
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                    type === t.id 
                      ? "bg-upay-yellow text-upay-navy font-bold shadow-md" 
                      : "bg-white/10 text-white/90 hover:bg-white/20"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: INPUT */}
          {step === "input" && (
            <div className="space-y-3.5">
              {type === "send_money" && (
                <div>
                  <label className="text-[11px] font-bold text-upay-navy uppercase tracking-wider block mb-1">
                    Recipient Mobile Number / Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 01712345678 or Rahim"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full px-3.5 py-2.5 sm:py-3 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-upay-blue"
                  />
                </div>
              )}

              {type === "mobile_recharge" && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-upay-navy uppercase tracking-wider block mb-1">
                      Select Operator
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-2.5">
                      {OPERATORS.map((op) => (
                        <button
                          key={op.id}
                          type="button"
                          onClick={() => setOperator(op.name)}
                          className={`p-1.5 rounded-xl border text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 ${
                            operator === op.name 
                              ? "border-upay-blue bg-upay-blue/10 text-upay-blue shadow-sm" 
                              : "border-border bg-white text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${op.color}`}></span>
                          <span className="truncate">{op.name.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-upay-navy uppercase tracking-wider block mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="017xxxxxxxx"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full px-3.5 py-2.5 sm:py-3 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-upay-blue"
                    />
                  </div>
                </>
              )}

              {type === "pay_merchant" && (
                <div>
                  <label className="text-[11px] font-bold text-upay-navy uppercase tracking-wider block mb-1">
                    Merchant Name / Counter ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aarong, Swapno, M-98210"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full px-3.5 py-2.5 sm:py-3 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-upay-blue"
                  />
                </div>
              )}

              {type === "pay_bill" && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-upay-navy uppercase tracking-wider block mb-1">
                      Biller Category
                    </label>
                    <select
                      value={biller}
                      onChange={(e) => setBiller(e.target.value)}
                      className="w-full px-3.5 py-2.5 sm:py-3 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-upay-blue mb-2.5"
                    >
                      {BILL_CATEGORIES.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.icon} {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-upay-navy uppercase tracking-wider block mb-1">
                      Account / Customer Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 109283741"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full px-3.5 py-2.5 sm:py-3 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-upay-blue"
                    />
                  </div>
                </>
              )}

              {type === "cash_out" && (
                <div>
                  <label className="text-[11px] font-bold text-upay-navy uppercase tracking-wider block mb-1">
                    Agent Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="017xxxxxxxx"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full px-3.5 py-2.5 sm:py-3 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-upay-blue"
                  />
                </div>
              )}

              {type === "add_money" && (
                <div>
                  <label className="text-[11px] font-bold text-upay-navy uppercase tracking-wider block mb-1">
                    Select Source
                  </label>
                  <select
                    value={addSource}
                    onChange={(e) => setAddSource(e.target.value)}
                    className="w-full px-3.5 py-2.5 sm:py-3 bg-muted/40 border border-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-upay-blue mb-2.5"
                  >
                    {ADD_MONEY_SOURCES.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="text-[11px] font-bold text-upay-navy uppercase tracking-wider block mb-1">
                  Amount (৳)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-base text-upay-navy">৳</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 sm:py-3 bg-muted/40 border border-border rounded-xl text-lg font-black text-upay-navy focus:outline-none focus:border-upay-blue"
                  />
                </div>

                {/* Quick Amount Pills */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[100, 500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt.toString())}
                      className="py-1 bg-muted hover:bg-upay-yellow/20 rounded-lg text-[11px] font-semibold text-upay-navy transition text-center"
                    >
                      +৳{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note input */}
              {type !== "mobile_recharge" && type !== "add_money" && (
                <div>
                  <label className="text-[11px] font-bold text-upay-navy uppercase tracking-wider block mb-1">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dinner, Gift"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-upay-blue"
                  />
                </div>
              )}

              {/* Fee notice for Cash Out */}
              {isCashOut && numAmount > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] space-y-1">
                  <div className="flex justify-between text-amber-900 font-semibold">
                    <span>Cash Out:</span>
                    <span>৳{numAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Fee (1.49%):</span>
                    <span>৳{fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-950 font-bold border-t border-amber-200/60 pt-1">
                    <span>Total:</span>
                    <span>৳{totalDeducted.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleNextToConfirm}
                className="w-full py-5 rounded-2xl bg-upay-navy text-white hover:bg-upay-navy/90 font-bold text-sm shadow-md mt-2"
              >
                Proceed to Confirm <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          )}

          {/* STEP 2: CONFIRM & PIN */}
          {step === "confirm" && (
            <div className="space-y-3.5">
              <div className="bg-muted/40 p-3.5 rounded-2xl border border-border space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Transaction Summary</p>
                <div className="flex justify-between items-center py-1 border-b border-border/50 text-xs">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-bold text-upay-navy uppercase">{headerInfo.title}</span>
                </div>
                {recipient && (
                  <div className="flex justify-between items-center py-1 border-b border-border/50 text-xs">
                    <span className="text-muted-foreground">Recipient:</span>
                    <span className="font-semibold text-upay-navy truncate max-w-[150px]">{recipient}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1 border-b border-border/50 text-xs">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-upay-navy">৳{numAmount.toFixed(2)}</span>
                </div>
                {isCashOut && (
                  <div className="flex justify-between items-center py-1 border-b border-border/50 text-xs text-amber-700">
                    <span>Fee (1.49%):</span>
                    <span>৳{fee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1.5 text-sm font-black text-upay-navy">
                  <span>{type === "add_money" ? "Total Credit:" : "Total Debit:"}</span>
                  <span className="text-base text-upay-blue">৳{totalDeducted.toFixed(2)}</span>
                </div>
              </div>

              {/* PIN Input */}
              <div>
                <label className="text-[11px] font-bold text-upay-navy uppercase tracking-wider block mb-1 flex items-center justify-between">
                  <span>Enter 4-Digit PIN</span>
                  <span className="text-[9px] text-muted-foreground font-normal">(Default: 1234)</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-muted/40 border border-border rounded-xl text-center font-mono font-bold tracking-widest text-lg focus:outline-none focus:border-upay-blue"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("input")}
                  className="flex-1 rounded-xl font-bold border-border text-xs"
                >
                  Back
                </Button>
                <Button
                  onClick={handleExecute}
                  disabled={isSubmitting}
                  className="flex-[2] py-5 rounded-xl bg-upay-yellow text-upay-navy hover:bg-upay-yellow/90 font-extrabold text-xs sm:text-sm shadow-md"
                >
                  {isSubmitting ? "Processing..." : "Confirm & Pay"}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === "success" && lastTransaction && (
            <div className="text-center py-2 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-upay-navy">Transaction Successful!</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ৳{lastTransaction.amount.toFixed(2)} processed for {lastTransaction.type.replace("_", " ")}.
                </p>
              </div>

              <div className="bg-muted/30 p-3 rounded-2xl border border-border text-left space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Trx ID:</span>
                  <span className="font-mono font-bold text-upay-navy">{lastTransaction.transaction_id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Updated Balance:</span>
                  <span className="font-bold text-emerald-600">
                    ৳{lastTransaction.balance_after.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {onViewReceipt && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onClose();
                      onViewReceipt(lastTransaction);
                    }}
                    className="flex-1 rounded-xl font-bold border-upay-navy text-upay-navy text-xs"
                  >
                    View Receipt
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  className="flex-1 rounded-xl bg-upay-navy text-white hover:bg-upay-navy/90 font-bold text-xs"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
