import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, Target, Users, TrendingUp, Zap, Award, Loader2, AlertTriangle,
  BookOpen, Cog, Clock, Filter, LineChart, ListChecks, Play, Pause, SkipForward, Radio
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import Footer from "@/components/Footer";

const API_BASE_URL = "http://localhost:8000";
const iconMap = { Lightbulb, Target, Users, TrendingUp, Zap, Award };

const getScoreColor = (value) => {
  if (value >= 80) return "text-emerald-600";
  if (value >= 60) return "text-cyan-600";
  return "text-amber-600";
};

const getCategoryColor = (category) => {
  const map = {
    Environment: "bg-emerald-50 border-emerald-200 text-emerald-800",
    Transport: "bg-emerald-50 border-emerald-200 text-emerald-800",
    Industry: "bg-emerald-50 border-emerald-200 text-emerald-800",
    Energy: "bg-emerald-50 border-emerald-200 text-emerald-800",
  };
  return map[category] || "bg-slate-50 border-slate-200 text-slate-700";
};

export default function PolicyLabPage() {
  const [pollutant, setPollutant] = useState("Air Pollution (PM/NOx)");
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- 1. State for Agentic Debate Timeline ---
  const [agenticTimeline, setAgenticTimeline] = useState([]);
  const [isAgenticSimulating, setIsAgenticSimulating] = useState(false);
  const [simulatedPolicyId, setSimulatedPolicyId] = useState(null);
  const [activeYearIndex, setActiveYearIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch policies
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/v1/policies/?pollutant=${encodeURIComponent(pollutant)}`);
        if (!response.ok) throw new Error("Failed to load policy recommendations.");
        const data = await response.json();
        setPolicies(data.recommendations);
        
        // Auto select first policy to simulate agentic debate
        if (data.recommendations?.length > 0) {
          handleTriggerAgenticSimulate(data.recommendations[0]);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPolicies();
  }, [pollutant]);

  // Autoplay handler for timeline
  useEffect(() => {
    let timer;
    if (isPlaying && agenticTimeline.length > 0) {
      timer = setInterval(() => {
        setActiveYearIndex((prev) => {
          if (prev >= agenticTimeline.length - 1) {
            setIsPlaying(false);
            return 0; // loop back
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, agenticTimeline]);

  const handleReadMore = async (policy) => {
    setSelectedPolicy(policy);
    setModalOpen(true);
    setDetailLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/policies/detail?policy_id=${policy.id}`);
      if (!res.ok) throw new Error("Failed to load policy details.");
      const data = await res.json();
      setDetailData(data);
    } catch (e) {
      setDetailData({ error: e.message });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleTriggerAgenticSimulate = async (policy) => {
    setIsAgenticSimulating(true);
    setSimulatedPolicyId(policy.id);
    setActiveYearIndex(0);
    setIsPlaying(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/agentic/simulate?policy_id=${policy.id}`);
      if (res.ok) {
        const data = await res.json();
        setAgenticTimeline(data.compliance_trajectory || []);
      }
    } catch (e) {
      console.error("Agentic simulation failure", e);
    } finally {
      setIsAgenticSimulating(false);
    }
  };

  if (isLoading && policies.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="p-8 bg-red-50 border border-red-200 text-red-700 flex items-center space-x-4">
          <AlertTriangle className="w-6 h-6" />
          <p>{error}</p>
        </Card>
      </div>
    );

  const activeStep = agenticTimeline[activeYearIndex] || null;

  return (
    <div className="min-h-screen pb-12 bg-white text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-800">
      
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 pt-24"
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
            AI-Driven Climate <span className="text-emerald-600">Policy Lab</span>
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto font-medium">
            Simulate 5-year agentic stakeholder debates, check feasibility scores, and model compliance trajectories.
          </p>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-3xl mx-auto mb-10"
        >
          <Card className="p-5 border border-emerald-200/60 bg-emerald-100/10 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <Filter className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800 font-mono uppercase tracking-wider">
                Refine Pollutant Directives
              </h2>
            </div>

            <Select value={pollutant} onValueChange={setPollutant}>
              <SelectTrigger className="bg-white border-emerald-200 text-slate-800 rounded-xl">
                <SelectValue placeholder="Choose pollutant" />
              </SelectTrigger>
              <SelectContent className="bg-white text-slate-800">
                {["Air Pollution (PM/NOx)", "Carbon Dioxide (CO2)", "General Pollutants (SO2)"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </motion.div>

        {/* INTERACTIVE 5-YEAR AGENTIC TIMELINE PLAYBACK PANEL */}
        <Card className="p-6 md:p-8 border border-emerald-200/60 bg-white shadow-sm mb-10 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span>5-Year Agentic Debate Simulator</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">Model stakeholder compliance delays, objections, and final compliance curves.</p>
            </div>

            {/* Playback Controls */}
            {agenticTimeline.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveYearIndex((prev) => (prev >= agenticTimeline.length - 1 ? 0 : prev + 1));
                  }}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {isAgenticSimulating ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
              <span className="text-xs font-mono">Simulating agentic compliance timelines...</span>
            </div>
          ) : activeStep ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Stepper Steps (Years) */}
              <div className="space-y-3">
                {agenticTimeline.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsPlaying(false);
                      setActiveYearIndex(idx);
                    }}
                    className={`w-full p-3 rounded-xl border text-left font-mono transition-all duration-300 ${
                      activeYearIndex === idx
                        ? "bg-emerald-500 border-emerald-600 text-white shadow-sm shadow-emerald-500/10 scale-[1.02]"
                        : "bg-emerald-100/15 border-emerald-200/50 hover:bg-emerald-50 text-slate-700"
                    }`}
                  >
                    <div className="text-[10px] font-bold opacity-75">TIMELINE MARKER</div>
                    <div className="text-sm font-extrabold mt-1">Year {step.year}</div>
                  </button>
                ))}
              </div>

              {/* Debate Remarks Card */}
              <div className="lg:col-span-2 space-y-4">
                <div className="p-4 bg-emerald-50/20 border border-emerald-200/50 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-600">
                    <span>STAKEHOLDER REMARKS (YEAR {activeStep.year})</span>
                    <span className="text-emerald-700">COMPLIANCE INDEX: {activeStep.compliance_pct}%</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-emerald-100">
                    <div 
                      className="h-full bg-emerald-400 transition-all duration-500" 
                      style={{ width: `${activeStep.compliance_pct}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-white border border-emerald-100 p-3 rounded-lg mt-3">
                    {activeStep.compliance_narrative_log}
                  </p>
                </div>

                {/* Stakeholder cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { lobby: "Industry Support", val: Math.round(activeStep.compliance_pct * 0.9) },
                    { lobby: "Urban Citizen Trust", val: Math.round(activeStep.compliance_pct * 1.1) },
                    { lobby: "Farmer Compliance", val: Math.round(activeStep.compliance_pct * 0.8) }
                  ].map((lobby, i) => (
                    <div key={i} className="p-3 bg-white border border-emerald-200 rounded-xl shadow-sm space-y-1.5">
                      <div className="text-[10px] font-mono text-slate-500 font-bold uppercase">{lobby.lobby}</div>
                      <div className="text-base font-extrabold text-emerald-700 font-mono">{Math.min(100, lobby.val)}%</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center text-xs text-slate-400 py-6">Select a policy below to launch compliance timelines.</div>
          )}
        </Card>

        {/* MAIN BODY GRID: POLICIES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Policy Recommendations */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            )}

            {policies.map((p, idx) => {
              const Icon = iconMap[p.icon] || Lightbulb;
              const isSimulatingThis = simulatedPolicyId === p.id;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="p-6 rounded-2xl shadow-sm border border-emerald-200 bg-white flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-sm">
                        <Icon className="w-5 h-5 text-emerald-600" />
                      </div>

                      <Badge className={`border text-xs px-2 py-0.5 rounded-lg ${getCategoryColor(p.category)}`}>
                        {p.category}
                      </Badge>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-800 mb-2 leading-snug">
                      {p.policy_name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-normal mb-6 line-clamp-3 font-semibold">
                      {p.expert_brief}
                    </p>

                    {/* Progress details */}
                    <div className="space-y-3.5 mb-6 mt-auto">
                      {[
                        ["Impact Score", p.impact_score],
                        ["Feasibility Index", p.feasibility],
                        ["Public Acceptance", p.acceptance],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1 font-mono font-bold">
                            <span className="text-slate-500">{label}</span>
                            <span className={getScoreColor(value)}>{value}%</span>
                          </div>
                          <Progress value={value} className="h-1.5 bg-slate-100" />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-2">
                      <span className="text-slate-500 text-xs font-mono">
                        Timeframe: {p.timeframe}
                      </span>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => handleTriggerAgenticSimulate(p)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-bold ${
                            isSimulatingThis
                              ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                              : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                          }`}
                        >
                          Simulate Debate
                        </Button>
                        <Button size="sm" onClick={() => handleReadMore(p)} className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">
                          Read More
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Right Sidebar Insights */}
          <div className="space-y-6">
            <Card className="p-6 border border-emerald-200/60 rounded-2xl bg-white shadow-sm">
              <div className="flex items-center mb-4 pb-2 border-b border-slate-100">
                <LineChart className="w-5 h-5 text-emerald-500 mr-2" />
                <h3 className="text-sm font-extrabold text-slate-800 font-mono uppercase tracking-wider">
                  Lab Intelligence
                </h3>
              </div>

              <ul className="text-slate-600 text-xs space-y-3.5 font-medium leading-relaxed">
                <li className="flex items-start">
                  <ListChecks className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Agentic Debate curves dynamically adjust based on government policy mandates.</span>
                </li>
                <li className="flex items-start">
                  <ListChecks className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Objections by regulatory bodies like Coal Ministries and farm guilds are simulated.</span>
                </li>
                <li className="flex items-start">
                  <ListChecks className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Feasibility indices weigh economic expenditures vs local AQI/offset rewards.</span>
                </li>
              </ul>
            </Card>
          </div>

        </div>

      </div>

      {/* MODAL POLICY READ MORE */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl border border-emerald-200 rounded-2xl bg-white p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {selectedPolicy?.policy_name}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs mt-1">
              {selectedPolicy?.expert_brief}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
            <AnimatePresence>
              {detailLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-slate-500"
                >
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                  <span className="text-xs font-mono">Retrieving detailed impact summaries...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {detailData && !detailLoading && (
              <div className="space-y-6">
                {detailData.error ? (
                  <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl flex items-center text-xs">
                    <AlertTriangle className="w-5 h-5 mr-3" />
                    {detailData.error}
                  </div>
                ) : (
                  <>
                    <Section
                      icon={<BookOpen className="w-4 h-4 text-emerald-600" />}
                      title="Long-Term Impact Analysis"
                      text={detailData.long_impact_analysis}
                    />
                    <Section
                      icon={<Cog className="w-4 h-4 text-emerald-600" />}
                      title="Primary Mechanism"
                      text={detailData.primary_mechanism}
                    />
                    <Section
                      icon={<Clock className="w-4 h-4 text-emerald-600" />}
                      title="Estimated Timeframe"
                      text={detailData.estimated_timeframe}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

function Section({ icon, title, text }) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center text-sm font-bold text-emerald-700 font-mono">
        {icon}
        <span className="ml-2 uppercase tracking-wide">{title}</span>
      </h4>
      <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-semibold">
        {text}
      </p>
    </div>
  );
}
