import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Upload, ShieldAlert, Cpu, CheckCircle, BarChart2,
  TrendingDown, ArrowRight, Loader2, DollarSign
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

export default function CarbonInvoicePage() {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  const presets = [
    {
      name: "TCS Q1 Environmental Audit",
      fileSize: "2.4 MB",
      scope1: 1450,
      scope2: 840,
      scope3: 3890,
      shadowTax: 2480000,
      badge: "COMPLIANT (B+)"
    },
    {
      name: "Reliance Petrochemical Statement",
      fileSize: "4.8 MB",
      scope1: 18400,
      scope2: 9600,
      scope3: 32100,
      shadowTax: 24040000,
      badge: "NON-COMPLIANT (D)"
    },
    {
      name: "Infosys Green Ledger",
      fileSize: "1.8 MB",
      scope1: 520,
      scope2: 310,
      scope3: 1150,
      shadowTax: 792000,
      badge: "EXEMPLARY (A+)"
    }
  ];

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.name);
    setIsScanning(true);
    setScanResult(null);

    // Simulate Radar Scanning Sweep
    setTimeout(() => {
      setScanResult(preset);
      setIsScanning(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen pb-12 bg-white text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-800">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 pt-24"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-emerald-100 border border-emerald-200 shadow-sm mb-4">
            <FileText className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>

          <h1 className="text-4xl font-extrabold mb-3 tracking-tight text-slate-900">
            Geospatial <span className="text-emerald-600">Audit Scanner</span>
          </h1>

          <p className="text-slate-600 text-lg max-w-2xl mx-auto font-medium">
            Scan and audit corporate carbon invoices, categorizing Scope 1, 2, and 3 emissions under shadow tax guidelines.
          </p>
        </motion.div>

        {/* Audit Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Drag/Drop Upload & Presets */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 border border-emerald-200/60 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 font-mono uppercase tracking-wider pb-2 border-b border-slate-100">
                Submit Statement
              </h3>
              
              {/* Fake Upload Drag and Drop box */}
              <div className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-emerald-50/10 rounded-xl p-8 text-center cursor-pointer transition relative overflow-hidden">
                <Upload className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <span className="text-xs font-bold text-slate-700 block">Drag & drop green audit invoice</span>
                <span className="text-[10px] text-slate-400 block mt-1">Supports PDF, XLSX, PNG up to 10MB</span>

                {/* Animated scanning bar overlay */}
                {isScanning && (
                  <motion.div
                    initial={{ top: 0 }}
                    animate={{ top: "100%" }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-lg shadow-emerald-400/80 pointer-events-none"
                  />
                )}
              </div>

              {/* Preset buttons */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Audit Preset Declarations</span>
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    disabled={isScanning}
                    className="w-full p-3 rounded-xl border border-emerald-200 bg-emerald-100/10 hover:bg-emerald-100/35 transition text-left flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{preset.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{preset.fileSize} • PDF Standard</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Scan results */}
          <div className="lg:col-span-2">
            <Card className="p-6 md:p-8 border border-emerald-200 bg-white shadow-sm h-full flex flex-col justify-center min-h-[350px]">
              
              <AnimatePresence mode="wait">
                {isScanning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center space-y-3"
                  >
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 font-mono uppercase tracking-wider">Rasterizing Invoice Matrices...</h4>
                      <p className="text-xs text-slate-400 mt-1">Extracting CO2, PM2.5, and tax liabilities.</p>
                    </div>
                  </motion.div>
                )}

                {scanResult && !isScanning && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Header values */}
                    <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase font-bold">
                          {scanResult.badge}
                        </span>
                        <h3 className="text-xl font-extrabold text-slate-800 mt-1.5">{scanResult.name}</h3>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-xs font-mono text-slate-500 font-bold">SHADOW TAX INDEX</span>
                        <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-0.5">
                          ₹{(scanResult.shadowTax / 100000).toFixed(2)}L
                        </div>
                      </div>
                    </div>

                    {/* Scope 1/2/3 grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-emerald-50/15 border border-emerald-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Scope 1 (Direct)</span>
                        <div className="text-xl font-bold text-emerald-700 font-mono">{scanResult.scope1.toLocaleString()} tons</div>
                        <span className="text-[9px] text-slate-400 block leading-normal">On-site combustion and fuel emissions.</span>
                      </div>
                      <div className="p-4 bg-emerald-50/15 border border-emerald-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Scope 2 (Indirect)</span>
                        <div className="text-xl font-bold text-emerald-700 font-mono">{scanResult.scope2.toLocaleString()} tons</div>
                        <span className="text-[9px] text-slate-400 block leading-normal">Purchased grid electricity consumption.</span>
                      </div>
                      <div className="p-4 bg-emerald-50/15 border border-emerald-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Scope 3 (Chain)</span>
                        <div className="text-xl font-bold text-emerald-700 font-mono">{scanResult.scope3.toLocaleString()} tons</div>
                        <span className="text-[9px] text-slate-400 block leading-normal">Vendor manufacturing and supply transport.</span>
                      </div>
                    </div>

                    {/* Offset directives */}
                    <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl space-y-2 text-xs">
                      <span className="font-mono font-bold text-emerald-800 uppercase tracking-widest text-[10px] block">Offset Recommendations</span>
                      <ul className="space-y-1.5 text-slate-600 font-semibold list-disc list-inside">
                        <li>Decommission heavy fuel generators to decrease Scope 1 output by 12%.</li>
                        <li>Install solar rooftop setups (offset yields: {Math.round(scanResult.scope2 * 0.4)} tons annually).</li>
                        <li>Audit vendor transport networks to optimize supply routes (mitigates Scope 3).</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {!scanResult && !isScanning && (
                  <div className="text-center text-slate-400 text-xs py-8">
                    Select a preset or upload an environmental statement to run the radar scanner.
                  </div>
                )}
              </AnimatePresence>

            </Card>
          </div>

        </div>

      </div>

      <Footer />
    </div>
  );
}
