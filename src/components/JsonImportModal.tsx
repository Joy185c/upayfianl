"use client";

import { useState } from "react";
import { 
  FileJson, 
  Upload, 
  Download, 
  Trash2, 
  X, 
  AlertCircle, 
  ArrowRight
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/lib/store";
import toast from "react-hot-toast";

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_JSON_DATA = [
  {
    type: "send_money",
    amount: 500,
    counterparty: "Rahim",
    note: "Rent contribution",
    status: "success",
    created_at: "2026-10-01T18:30:00Z"
  },
  {
    type: "mobile_recharge",
    amount: 100,
    operator: "Grameenphone",
    counterparty: "01711223344",
    status: "success",
    created_at: "2026-10-01T14:15:00Z"
  },
  {
    type: "pay_merchant",
    amount: 1250,
    counterparty: "Aarong Store",
    note: "Shopping",
    status: "success",
    created_at: "2026-09-30T19:45:00Z"
  },
  {
    type: "pay_bill",
    amount: 840,
    biller: "DESCO Electricity",
    counterparty: "Meter #902184",
    status: "success",
    created_at: "2026-09-29T11:00:00Z"
  },
  {
    type: "add_money",
    amount: 3000,
    counterparty: "BRAC Bank",
    status: "success",
    created_at: "2026-09-28T09:30:00Z"
  }
];

export function JsonImportModal({ isOpen, onClose }: JsonImportModalProps) {
  const { importJsonTransactions, clearImportedTransactions, transactions } = useWalletStore();

  const [step, setStep] = useState<"input" | "preview">("input");
  const [jsonText, setJsonText] = useState("");
  const [applyToBalance, setApplyToBalance] = useState(true);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);
  const [parseError, setParseError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const importedCount = transactions.filter(t => t.is_imported).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      validateAndPreview(content);
    };
    reader.readAsText(file);
  };

  const validateAndPreview = (rawJson: string) => {
    setParseError("");
    setValidationErrors([]);
    try {
      if (!rawJson.trim()) {
        setParseError("Please paste or upload JSON data.");
        return false;
      }

      const parsed = JSON.parse(rawJson);
      if (!Array.isArray(parsed)) {
        setParseError("JSON must be an array of transaction objects (e.g. [{ ... }]).");
        return false;
      }

      setParsedData(parsed);
      setStep("preview");
      return true;
    } catch (err: unknown) {
      console.error(err);
      setParseError(`JSON syntax error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  const handleDownloadSample = () => {
    const jsonString = JSON.stringify(SAMPLE_JSON_DATA, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "upay_sample_transactions.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Sample JSON downloaded!");
  };

  const handleImport = async () => {
    setIsProcessing(true);
    try {
      const result = await importJsonTransactions(parsedData, applyToBalance);
      
      setValidationErrors(result.errors);
      
      if (result.successCount > 0) {
        toast.success(`Successfully imported ${result.successCount} transactions!`);
        onClose();
        setStep("input");
        setJsonText("");
      } else if (result.errors.length > 0) {
        toast.error("Failed to import. Check row errors.");
      } else if (result.skippedCount > 0) {
        toast.error(`All ${result.skippedCount} entries were skipped as duplicates.`);
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Import failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearImported = async () => {
    if (confirm("Are you sure you want to clear all imported demo transactions?")) {
      const res = await clearImportedTransactions();
      toast.success(`Cleared ${res.clearedCount} imported transactions.`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[94vw] max-w-md p-0 overflow-hidden border-none rounded-3xl bg-white shadow-2xl max-h-[92vh] flex flex-col">
        {/* Banner */}
        <div className="bg-upay-navy text-white px-4 sm:px-6 pt-5 pb-5 relative flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-upay-yellow text-upay-navy rounded-2xl shadow-md shrink-0">
              <FileJson size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Import JSON Transactions</h2>
              <p className="text-[11px] text-white/70">Load bulk transaction data for demo</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
          {step === "input" && (
            <div className="space-y-3.5">
              <div className="flex justify-between items-center gap-2">
                <label className="text-[11px] font-bold text-upay-navy uppercase tracking-wider">
                  Paste JSON Array or Upload File
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSample}
                  className="text-[11px] text-upay-blue border-upay-blue/30 hover:bg-upay-blue/10 h-7 px-2 flex items-center gap-1 shrink-0"
                >
                  <Download size={13} /> Sample JSON
                </Button>
              </div>

              {parseError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              <textarea
                rows={5}
                placeholder={`[\n  {\n    "type": "send_money",\n    "amount": 500,\n    "counterparty": "Rahim",\n    "note": "Rent",\n    "status": "success",\n    "created_at": "2026-10-01T18:30:00Z"\n  }\n]`}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full p-3 font-mono text-[11px] bg-muted/30 border border-border rounded-xl focus:outline-none focus:border-upay-blue"
              />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-xl text-xs font-semibold text-upay-navy border border-border transition w-full sm:w-auto justify-center">
                  <Upload size={14} /> Upload .json File
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-upay-navy cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToBalance}
                    onChange={(e) => setApplyToBalance(e.target.checked)}
                    className="w-4 h-4 rounded text-upay-blue focus:ring-upay-blue"
                  />
                  Apply to Wallet Balance
                </label>
              </div>

              {importedCount > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-amber-900">
                    Imported: <strong>{importedCount} entries</strong>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearImported}
                    className="text-xs text-red-600 hover:bg-red-100/50 flex items-center gap-1 h-auto p-1 font-bold"
                  >
                    <Trash2 size={13} /> Clear Imported
                  </Button>
                </div>
              )}

              <Button
                onClick={() => validateAndPreview(jsonText)}
                className="w-full py-4 rounded-2xl bg-upay-navy text-white hover:bg-upay-navy/90 font-bold text-xs sm:text-sm"
              >
                Preview Data <ArrowRight size={15} className="ml-1" />
              </Button>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-upay-navy uppercase tracking-wider">
                  Preview ({parsedData.length} Rows)
                </span>
                <span className="text-muted-foreground">
                  Balance update: <strong>{applyToBalance ? "Enabled" : "Disabled"}</strong>
                </span>
              </div>

              {validationErrors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs space-y-1 max-h-28 overflow-y-auto">
                  <p className="font-bold">Validation Errors:</p>
                  {validationErrors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}

              <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-border text-xs">
                {parsedData.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center bg-white hover:bg-muted/30">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-upay-navy uppercase text-[11px]">{item.type || "unknown"}</p>
                      <p className="text-muted-foreground text-[10px] truncate">
                        {item.counterparty || item.operator || item.biller || "N/A"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-upay-navy">৳{Number(item.amount || 0).toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Now"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setStep("input")}
                  className="flex-1 rounded-xl font-bold border-border text-xs"
                >
                  Back to Edit
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="flex-[2] py-4 rounded-xl bg-upay-yellow text-upay-navy hover:bg-upay-yellow/90 font-extrabold text-xs shadow-md"
                >
                  {isProcessing ? "Importing..." : `Import ${parsedData.length} Rows`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
