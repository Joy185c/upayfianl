"use client";

import { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, AlertTriangle, FileJson, Database, RefreshCw, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIntelligenceStore } from "@/lib/intelligence/store";
import { CustomerDataset, ImportValidationResult } from "@/lib/data/types";

export default function DataManagement() {
  const { importCustomerData, resetIntelligence, isRunning, kpis } = useIntelligenceStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<ImportValidationResult | null>(null);
  const [parsedData, setParsedData] = useState<CustomerDataset | null>(null);
  
  const [importMode, setImportMode] = useState<"add" | "update" | "add_update">("add_update");
  const [importStatus, setImportStatus] = useState<"idle" | "importing" | "success">("idle");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (selectedFile.type !== "application/json" && !selectedFile.name.endsWith('.json')) {
      alert("Please upload a valid JSON file.");
      return;
    }
    setFile(selectedFile);
    setValidation(null);
    setParsedData(null);
    setImportStatus("idle");
  };

  const validateJson = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string) as CustomerDataset;
        
        // Basic schema validation
        const errors: string[] = [];
        if (!json.datasetVersion) errors.push("Missing datasetVersion");
        if (!json.customers || !Array.isArray(json.customers)) {
          errors.push("Missing or invalid customers array");
        }

        let newC = 0;
        let existingC = 0;
        let txCount = 0;
        let campCount = 0;

        if (json.customers) {
          json.customers.forEach(c => {
            if (!c.customerId) errors.push(`A customer record is missing customerId`);
            // We just mock the split for demo (e.g. assume all are new for UI)
            newC++; 
            txCount += (c.transactions?.length || 0);
            campCount += (c.campaignHistory?.length || 0);
          });
        }

        setParsedData(json);
        setValidation({
          isValid: errors.length === 0,
          totalCustomers: json.customers?.length || 0,
          newCustomers: newC,
          existingCustomers: existingC,
          totalTransactions: txCount,
          totalCampaignEvents: campCount,
          errors
        });

      } catch (err: any) {
        setValidation({
          isValid: false,
          totalCustomers: 0,
          newCustomers: 0,
          existingCustomers: 0,
          totalTransactions: 0,
          totalCampaignEvents: 0,
          errors: ["Invalid JSON format: " + err.message]
        });
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!parsedData || !parsedData.customers) return;
    setImportStatus("importing");
    
    await importCustomerData(parsedData.customers, importMode);
    
    setImportStatus("success");
    setFile(null);
  };

  const confirmClearData = () => {
    if (confirm("Are you sure you want to clear all customer data and intelligence history? This action cannot be undone.")) {
      resetIntelligence();
      alert("All data cleared successfully.");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-upay-navy tracking-tight">Data Management</h1>
          <p className="text-muted-foreground mt-1">Import external JSON customer datasets and synchronize intelligence.</p>
        </div>
        
        <Button onClick={confirmClearData} variant="destructive" className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none shadow-none font-bold">
          <Database size={16} className="mr-2" /> Clear All Data
        </Button>
      </div>

      {importStatus === "success" ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 size={64} className="mx-auto text-emerald-500" />
            <h2 className="text-2xl font-black text-emerald-800">IMPORT COMPLETE</h2>
            <div className="flex justify-center gap-4 text-emerald-700 font-medium">
              <span className="flex items-center gap-1"><CheckCircle2 size={16}/> {validation?.totalCustomers} Customers Processed</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={16}/> {validation?.totalTransactions} Transactions processed</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={16}/> Intelligence Recalculated</span>
            </div>
            <p className="text-sm text-emerald-600">The canonical customer store has been updated. New Total: {kpis.totalCustomers}</p>
            <div className="pt-4 flex justify-center gap-4">
              <Button onClick={() => setImportStatus("idle")} variant="outline" className="border-emerald-300 text-emerald-700">Import Another File</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-upay-navy flex items-center gap-2">
              <Database size={18} /> Customer Data Import
            </h3>
            
            <div 
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                dragActive ? "border-upay-blue bg-upay-blue/5" : "border-slate-300 hover:border-slate-400 bg-white"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <UploadCloud size={48} className="mx-auto text-slate-400 mb-4" />
              <h4 className="text-lg font-bold text-upay-navy mb-1">Drag & Drop JSON file here</h4>
              <p className="text-sm text-muted-foreground mb-4">Supported format: .JSON</p>
              
              <div className="flex items-center gap-4 justify-center">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-xs font-bold text-slate-400 uppercase">OR</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json"
                onChange={handleFileChange}
              />
              <Button 
                className="mt-4 bg-white text-upay-navy border-2 border-slate-200 hover:border-upay-navy"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
            </div>

            {file && !validation && (
              <Card className="border-upay-blue/20 bg-blue-50/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileJson size={24} className="text-upay-blue" />
                    <div>
                      <p className="font-bold text-upay-navy">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button onClick={validateJson} className="bg-upay-blue hover:bg-upay-blue/90 text-white">
                    Validate Data
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Validation & Preview Section */}
          <div className="space-y-6">
            {validation && (
              <>
                <h3 className="text-lg font-bold text-upay-navy flex items-center gap-2">
                  <RefreshCw size={18} className={importStatus === "importing" ? "animate-spin" : ""} /> Import Preview
                </h3>
                
                {!validation.isValid ? (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-2 text-red-600 font-bold text-lg border-b border-red-200 pb-2">
                        <FileWarning size={20} /> Validation Failed
                      </div>
                      <ul className="space-y-2">
                        {validation.errors.map((err, i) => (
                          <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            {err}
                          </li>
                        ))}
                      </ul>
                      <Button onClick={() => setFile(null)} variant="destructive" className="w-full">Cancel Import</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={16} /> JSON Validated
                      </span>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ready to Import</span>
                    </div>
                    
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-lg border text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Customers</p>
                          <p className="text-2xl font-black text-upay-navy">{validation.totalCustomers}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transactions</p>
                          <p className="text-2xl font-black text-upay-blue">{validation.totalTransactions}</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Import Mode</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50">
                            <input 
                              type="radio" 
                              name="mode" 
                              value="add_update" 
                              checked={importMode === "add_update"} 
                              onChange={() => setImportMode("add_update")}
                              className="w-4 h-4 text-upay-blue"
                            />
                            <div>
                              <p className="font-bold text-sm text-upay-navy">Add + Update (Recommended)</p>
                              <p className="text-xs text-muted-foreground">Add new customers and update existing matching IDs.</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      <Button 
                        onClick={confirmImport}
                        disabled={importStatus === "importing"}
                        className="w-full bg-upay-navy hover:bg-upay-navy/90 text-white h-12 text-base font-bold"
                      >
                        {importStatus === "importing" ? "Importing & Recalculating AI..." : "Confirm Import"}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
