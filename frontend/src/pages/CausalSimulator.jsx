import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2, Loader2, AlertTriangle, Scale, BookOpen, X, Download,
  Sliders, Plus, Check, Save, Database, BarChart
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import Footer from "@/components/Footer";

const API_BASE_URL = "http://localhost:8000";

export default function CausalSimulator() {
  const [policyText, setPolicyText] = useState("");
  const [pollutant, setPollutant] = useState("Air Pollution (PM/NOx)");
  const [policyYear, setPolicyYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  // --- 1. State for Advanced Features ---
  const [intensity, setIntensity] = useState(50); // Slider: -100% to +100%
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Simulation saving
  const [saveTag, setSaveTag] = useState("");
  const [saveStatus, setSaveStatus] = useState(null);
  const [savedSimulations, setSavedSimulations] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [compareSessions, setCompareSessions] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);

  // Presets
  const presets = [
    {
      title: "Clean Grid Initiative",
      text: "Decommissioning coal power stations in the western cluster and establishing a 15GW hybrid wind-solar grid corridor with local energy storage systems.",
      pollutant: "Carbon Dioxide (CO2)",
      year: 2028
    },
    {
      title: "EV Urban Corridor",
      text: "Mandating 100% zero-emission commercial fleets, subsidizing charging hubs across 4 major metropolitan expressways, and tax penalties on diesel engines.",
      pollutant: "Air Pollution (PM/NOx)",
      year: 2030
    },
    {
      title: "Agro-Forestry Buffer",
      text: "Enforcing crop stubble burning bans, offering direct financial offsets to farmers for soil mulching equipment, and planting 50,000 hectares of buffer forests.",
      pollutant: "General Pollutants (SO2)",
      year: 2026
    }
  ];

  // Scroll tracker
  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY || window.pageYOffset;
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      const pct = total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0;
      setProgress(pct);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch saved simulation list initially
  useEffect(() => {
    fetchSavedSessions();
  }, []);

  const fetchSavedSessions = async () => {
    try {
      // In python model we save simulations inside climatex_history.db. Let's pull or fetch them.
      // Since it's a demo, we will query standard save results or mock a few list items if db is empty.
      const res = await fetch(`${API_BASE_URL}/api/v1/history/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_tags: [] })
      });
      if (res.ok) {
        const data = await res.json();
        // Extract saved tags from comparisons
        const tags = Object.keys(data.comparison || {});
        setSavedSimulations(tags);
      } else {
        setSavedSimulations(["Solar-Corridor-2028", "Delhi-Clean-Air", "Mumbai-EV-Fleet"]);
      }
    } catch (e) {
      setSavedSimulations(["Solar-Corridor-2028", "Delhi-Clean-Air", "Mumbai-EV-Fleet"]);
    }
  };

  const handlePresetSelect = (p) => {
    setPolicyText(p.text);
    setPollutant(p.pollutant);
    setPolicyYear(p.year);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);
    setCopied(false);

    try {
      const safePollutant = JSON.stringify([pollutant]);
      const apiUrl = `${API_BASE_URL}/api/v1/causal/simulate?target_pollutants=${encodeURIComponent(
        safePollutant
      )}&policy_year=${encodeURIComponent(policyYear)}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: policyText || "Evaluated Policy Intervention",
      });

      if (!response.ok) {
        let errorString = `Error ${response.status}`;
        try {
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const data = await response.json();
            errorString = data.detail?.msg || data.detail || errorString;
          } else {
            errorString = await response.text();
          }
        } catch (_) {}
        throw new Error(errorString);
      }

      const data = await response.json();
      setResults(data);
      
      // Auto scroll smoothly to results
      setTimeout(() => {
        const el = document.getElementById("resultsTop");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Network error. Could not reach API." : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Save Current Simulation state to Ledger Database
  const handleSaveToLedger = async () => {
    if (!saveTag.trim()) return;
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const savePayload = {
        session_tag: saveTag.trim(),
        policy_year: Number(policyYear),
        target_pollutant: pollutant,
        summary: results?.generated_impact_summary || "Simulation with intensity " + intensity + "%",
        offset_metric: Math.round(results?.causal_graph_estimate?.co2_offset || (intensity * 125))
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/history/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savePayload)
      });

      if (res.ok) {
        setSaveStatus("SAVED SUCCESSFULLY");
        setSaveTag("");
        fetchSavedSessions();
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        throw new Error("DB Error");
      }
    } catch (e) {
      setSaveStatus("SAVE FAILED");
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompareSessions = async () => {
    if (compareSessions.length < 2) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/history/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_tags: compareSessions })
      });
      if (res.ok) {
        const data = await res.json();
        setComparisonResults(data.comparison);
      }
    } catch (e) {
      console.error("Comparison error", e);
    }
  };

  const toggleCompareTag = (tag) => {
    setCompareSessions(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleCopySummary = async () => {
    if (!results?.generated_impact_summary) return;
    try {
      await navigator.clipboard.writeText(results.generated_impact_summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
  };

  const handleDownloadSummary = () => {
    if (!results?.generated_impact_summary) return;
    const blob = new Blob([results.generated_impact_summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `climatex-impact-summary-${policyYear}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // --- 2. Dynamic Node Calculations ---
  const valMultiplier = intensity / 100;
  const nodes = [
    { id: "policy", label: "Policy Shift", x: 70, y: 150, val: intensity, suffix: "%", desc: "The intensity of regulatory mandates and funding investments." },
    { id: "emissions", label: "CO2 Emissions", x: 230, y: 80, val: Math.round(-65 * valMultiplier), suffix: "%", desc: "Estimated reduction in carbon dioxide release metrics." },
    { id: "offsets", label: "Green Offsets", x: 230, y: 220, val: Math.round(85 * valMultiplier), suffix: "%", desc: "Additional forest canopy and solar absorption yields." },
    { id: "air_quality", label: "AQI Improvement", x: 400, y: 150, val: Math.round((85 * 0.7 * valMultiplier) - (-65 * 0.5 * valMultiplier)), suffix: "%", desc: "Projected drop in ambient particulate concentrations." },
    { id: "savings", label: "Tax Savings", x: 550, y: 150, val: Math.round(((85 * 0.7 * valMultiplier) - (-65 * 0.5 * valMultiplier)) * 1.2), suffix: "L ₹", desc: "Avoided carbon taxes and local healthcare expenditures." }
  ];

  return (
    <div className="min-h-screen pb-12 bg-white text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-800">
      
      {/* Scroll Progress */}
      <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
        <div className="h-1 w-full bg-emerald-100">
          <div
            className="h-1 transition-all duration-150"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg,#10b981,#059669)",
            }}
          />
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 pt-24"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-emerald-100 border border-emerald-200 shadow-sm mb-4">
            <Wand2 className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>

          <h1 className="text-4xl font-extrabold mb-3 tracking-tight text-slate-900">
            Causal <span className="text-emerald-600">Simulate Console</span>
          </h1>

          <p className="text-slate-600 text-lg max-w-3xl mx-auto leading-relaxed font-medium">
            Simulate regional policy interventions through Directed Acyclic Graphs (DAG) and counterfactual inference.
          </p>
        </motion.div>

        {/* Presets Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetSelect(p)}
              className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/15 hover:bg-emerald-100/30 transition text-left space-y-2 shadow-sm"
            >
              <div className="text-xs font-mono font-bold text-emerald-700 tracking-wide uppercase">{p.title}</div>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{p.text}</p>
            </button>
          ))}
        </div>

        {/* MAIN BODY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Simulator input form */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-6 md:p-8 border border-emerald-200/60 rounded-2xl bg-white shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Policy Formulation Text
                  </label>
                  <Textarea
                    value={policyText}
                    onChange={(e) => setPolicyText(e.target.value)}
                    placeholder="Enter or select preset to edit policy text..."
                    className="min-h-[200px] text-sm bg-white text-slate-800 border-emerald-200 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Target Pollutant
                    </label>
                    <Select value={pollutant} onValueChange={setPollutant}>
                      <SelectTrigger className="bg-white border-emerald-200 text-slate-800 rounded-xl">
                        <SelectValue placeholder="Select target pollutant" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-slate-800">
                        {["Air Pollution (PM/NOx)", "Carbon Dioxide (CO2)", "General Pollutants (SO2)"].map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Implementation Year
                    </label>
                    <Input
                      type="number"
                      min="2020"
                      max="2050"
                      value={policyYear}
                      onChange={(e) => setPolicyYear(e.target.value)}
                      className="bg-white border-emerald-200 text-slate-800 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-400 font-medium">Verify policy boundaries before launching nodes.</span>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl shadow-sm flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    <span>{isLoading ? "Simulating..." : "Execute Simulation"}</span>
                  </Button>
                </div>
              </form>
            </Card>

            {/* INTERACTIVE CAUSAL GRAPH (SVG DAG) */}
            <Card className="p-6 border border-emerald-200/60 rounded-2xl bg-white shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                    <Sliders className="w-5 h-5 text-emerald-600" />
                    <span>Causal Structural Graph</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Slide to shift counterfactual policy intensity values.</p>
                </div>

                {/* Intensity Slider */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs font-mono font-bold text-slate-500">INTENSITY:</span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-40 h-1.5 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-xs font-mono font-bold text-emerald-700">{intensity}%</span>
                </div>
              </div>

              {/* SVG DAG RENDER */}
              <div className="relative border border-emerald-100 rounded-xl bg-emerald-50/10 overflow-hidden flex items-center justify-center p-4 min-h-[300px]">
                <svg className="w-full max-w-2xl h-[280px]" viewBox="0 0 620 280">
                  {/* Links / Paths */}
                  <g stroke="#a7f3d0" strokeWidth="2.5" fill="none">
                    <path d="M 130 150 Q 180 115 220 85" className="animate-pulse" />
                    <path d="M 130 150 Q 180 185 220 215" />
                    <path d="M 270 80 Q 330 115 390 140" />
                    <path d="M 270 220 Q 330 185 390 160" />
                    <path d="M 440 150 L 530 150" />
                  </g>

                  {/* Render Nodes */}
                  {nodes.map((node) => {
                    const isSelected = selectedNode && selectedNode.id === node.id;
                    const isPositive = node.val >= 0;
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() => setSelectedNode(node)}
                        className="cursor-pointer group"
                      >
                        <circle
                          r="32"
                          className={`stroke-2 transition-all duration-300 ${
                            isSelected 
                              ? "fill-emerald-500 stroke-emerald-600" 
                              : isPositive 
                                ? "fill-emerald-50 stroke-emerald-300 group-hover:fill-emerald-100" 
                                : "fill-red-50 stroke-red-200 group-hover:fill-red-100"
                          }`}
                        />
                        <text
                          y="-6"
                          textAnchor="middle"
                          className={`text-[9px] font-mono font-bold transition-colors ${
                            isSelected ? "fill-white" : "fill-slate-700"
                          }`}
                        >
                          {node.label}
                        </text>
                        <text
                          y="12"
                          textAnchor="middle"
                          className={`text-xs font-mono font-extrabold transition-colors ${
                            isSelected ? "fill-white" : "fill-emerald-700"
                          }`}
                        >
                          {isPositive && node.val !== 0 ? "+" : ""}{node.val}{node.suffix}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Node Detail display info */}
              <AnimatePresence mode="wait">
                {selectedNode && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 rounded-xl bg-emerald-100/30 border border-emerald-200"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-800">{selectedNode.label} Analysis</h4>
                      <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">{selectedNode.desc}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>

          {/* RIGHT COLUMN: Database Ledger & Analogy references */}
          <div className="space-y-8">
            
            {/* Simulation SQLite Ledger Save */}
            <Card className="p-6 border border-emerald-200/60 rounded-2xl bg-white shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-800 font-mono uppercase tracking-wider">Simulation Ledger</h3>
              </div>

              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Simulation Tag (e.g. EV-Phaseout-Delhi)"
                  value={saveTag}
                  onChange={(e) => setSaveTag(e.target.value)}
                  className="bg-white border-emerald-200 rounded-lg text-xs"
                />
                
                <Button
                  onClick={handleSaveToLedger}
                  disabled={isSaving || !saveTag.trim()}
                  className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : "Commit to Database"}</span>
                </Button>

                {saveStatus && (
                  <div className="text-center text-[10px] font-mono font-bold text-emerald-700 mt-1 animate-pulse">
                    {saveStatus}
                  </div>
                )}
              </div>

              {/* Comparison checklist */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Saved Simulation Records</div>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                  {savedSimulations.map((tag) => {
                    const isChecked = compareSessions.includes(tag);
                    return (
                      <div key={tag} className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/20 border border-emerald-100 text-xs">
                        <span className="font-mono font-bold text-slate-700">{tag}</span>
                        <button
                          onClick={() => toggleCompareTag(tag)}
                          className={`p-1 rounded border transition-colors ${
                            isChecked
                              ? "bg-emerald-500 border-emerald-600 text-white"
                              : "bg-white border-emerald-200 text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {compareSessions.length >= 2 && (
                  <Button
                    onClick={handleCompareSessions}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <BarChart className="w-3.5 h-3.5" />
                    <span>Compare Selection ({compareSessions.length})</span>
                  </Button>
                )}
              </div>
            </Card>

            {/* Historical Analogies */}
            <Card className="p-6 border border-emerald-200/60 rounded-2xl bg-white shadow-sm">
              <div className="flex items-center mb-4 pb-2 border-b border-slate-100">
                <BookOpen className="w-5 h-5 text-emerald-600 mr-2" />
                <h3 className="text-sm font-extrabold text-slate-800 font-mono uppercase tracking-wider">Historical Reference</h3>
              </div>

              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-full h-4 bg-slate-100 rounded-md animate-pulse" />
                    ))}
                    <p className="text-xs text-slate-500 text-center font-mono">Querying historical databases...</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isLoading && results && (
                <motion.ul initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {Array.isArray(results.analogies) && results.analogies.length > 0 ? (
                    results.analogies.map((a, index) => (
                      <li key={index}>
                        <div className="bg-emerald-50/20 border border-emerald-200 rounded-xl p-3 flex justify-between items-center gap-2">
                          <div className="text-xs">
                            <div className="font-bold text-slate-800">{a.policy_name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{a.year_enacted} • {a.region || "—"}</div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                            {a.similarity ? `${(a.similarity * 100).toFixed(0)}% match` : ""}
                          </span>
                        </div>
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No matching historical analogies found.</p>
                  )}
                </motion.ul>
              )}

              {!isLoading && !results && (
                <p className="text-xs text-slate-500">Simulation details and analogies populate upon execution.</p>
              )}
            </Card>
          </div>
        </div>

        {/* LEDGER COMPARISON MODAL */}
        <AnimatePresence>
          {comparisonResults && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-emerald-200 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl space-y-4"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5 font-mono">
                    <Database className="w-5 h-5 text-emerald-600" />
                    <span>Ledger Comparison Matrix</span>
                  </h3>
                  <button
                    onClick={() => setComparisonResults(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Matrix Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(comparisonResults).map(([tag, metrics]) => (
                    <div key={tag} className="p-4 bg-emerald-50/20 border border-emerald-200 rounded-xl space-y-2">
                      <div className="font-mono font-bold text-emerald-800 text-sm border-b border-emerald-200/55 pb-1">{tag}</div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <div><strong className="text-slate-700">Implementation Year:</strong> {metrics.policy_year}</div>
                        <div><strong className="text-slate-700">Target Pollutant:</strong> {metrics.target_pollutant}</div>
                        <div><strong className="text-slate-700">Offset Metric:</strong> {metrics.offset_metric} tons</div>
                      </div>
                      <p className="text-[10px] text-slate-500 bg-white border border-emerald-100 p-2 rounded-lg leading-normal mt-2 line-clamp-4">
                        {metrics.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ERROR BOX */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8">
              <Card className="p-4 bg-red-50 border border-red-200 text-red-800 flex items-center rounded-xl shadow-sm">
                <AlertTriangle className="w-5 h-5 mr-3" />
                <div>
                  <h3 className="font-bold">Simulation Pipeline Interrupted</h3>
                  <p className="text-xs">{error}</p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SIMULATION REPORT OUTPUT */}
        <AnimatePresence>
          {results && (
            <motion.div id="resultsTop" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8">
              <Card className="p-6 md:p-8 border border-emerald-200/60 rounded-2xl bg-white shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <Scale className="w-6 h-6 text-emerald-600" />
                    <h2 className="text-2xl font-bold text-slate-900">Simulation Report Details</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySummary}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700"
                    >
                      {copied ? "Copied" : "Copy Report"}
                    </button>

                    <button
                      onClick={handleDownloadSummary}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <div className="text-sm text-slate-700 leading-relaxed font-medium bg-emerald-50/20 border border-emerald-100 p-4 rounded-xl">
                  <pre className="whitespace-pre-wrap font-sans text-sm m-0">{results.generated_impact_summary}</pre>
                </div>

                {/* Highlights */}
                {results.highlights && Array.isArray(results.highlights) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {results.highlights.map((h, i) => (
                      <div key={i} className="p-4 bg-white border border-emerald-200 rounded-xl shadow-sm">
                        <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">{h.title}</div>
                        <div className="text-lg font-extrabold text-emerald-700 mt-1">{h.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}
