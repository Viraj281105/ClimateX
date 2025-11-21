import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  Target,
  Users,
  TrendingUp,
  Zap,
  Award,
  Loader2,
  AlertTriangle,
  BookOpen,
  Cog,
  Clock,
  Filter,
  LineChart,
  ListChecks,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Footer from "@/components/Footer";

const API_BASE_URL = "http://localhost:8000";

const iconMap = {
  Lightbulb,
  Target,
  Users,
  TrendingUp,
  Zap,
  Award,
};

const pollutantOptions = [
  { value: "Air Pollution (PM/NOx)", label: "Air Pollution (PM/NOx)" },
  { value: "Carbon Dioxide (CO2)", label: "Carbon Dioxide (CO2)" },
  { value: "General Pollutants (SO2)", label: "General Pollutants (SO2)" },
];

// Score → Color
const getScoreColor = (value) => {
  if (value >= 80) return "text-emerald-600";
  if (value >= 60) return "text-cyan-600";
  return "text-amber-600";
};

// Category → Color
const getCategoryColor = (category) => {
  const map = {
    Environment: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Transport: "bg-cyan-100 text-cyan-800 border-cyan-200",
    Industry: "bg-amber-100 text-amber-800 border-amber-200",
    Energy: "bg-blue-100 text-blue-800 border-blue-200",
    Education: "bg-purple-100 text-purple-800 border-purple-200",
    Water: "bg-teal-100 text-teal-800 border-teal-200",
  };
  return map[category] || "bg-gray-100 text-gray-800 border-gray-200";
};

export default function PolicyLabPage() {
  const [pollutant, setPollutant] = useState(
    pollutantOptions[0].value
  );

  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Policies
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/api/v1/policies/?pollutant=${encodeURIComponent(
            pollutant
          )}`
        );

        if (!response.ok)
          throw new Error("Failed to load policy recommendations.");

        const data = await response.json();
        setPolicies(data.recommendations);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicies();
  }, [pollutant]);

  const handleReadMore = async (policy) => {
    setSelectedPolicy(policy);
    setModalOpen(true);
    setDetailLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/policies/detail?policy_id=${policy.id}`
      );

      if (!res.ok) throw new Error("Failed to load policy details.");

      const data = await res.json();
      setDetailData(data);
    } catch (e) {
      setDetailData({ error: e.message });
    } finally {
      setDetailLoading(false);
    }
  };

  // PRE-LOAD STATES
  if (isLoading && policies.length === 0)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#CCF0B9" }}
      >
        <Loader2 className="w-12 h-12 text-[#13451b] animate-spin" />
      </div>
    );

  if (error)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#CCF0B9" }}
      >
        <Card className="p-8 bg-red-100 border-red-300 text-red-700 flex items-center space-x-4">
          <AlertTriangle className="w-6 h-6" />
          <p>{error}</p>
        </Card>
      </div>
    );

  return (
    <div
      className="min-h-screen pb-12"
      style={{ backgroundColor: "#CCF0B9" }}
    >
      <div className="px-4 sm:px-6 lg:px-8 pt-24">

        {/* -----------------------------------------------------
           HEADER — Premium Executive Dashboard Style
        ------------------------------------------------------ */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
            AI-Driven Climate{" "}
            <span style={{ color: "#13451b" }}>Policy Lab</span>
          </h1>
          <p className="text-lg text-gray-800 max-w-3xl mx-auto leading-relaxed">
            A decision-support workspace powered by causal reasoning,
            predictive modelling, and nationwide sentiment signals.
          </p>
        </motion.div>

        {/* -----------------------------------------------------
           FILTER BAR — Elevated Compact Panel  
        ------------------------------------------------------ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-3xl mx-auto mb-10"
        >
          <Card className="p-5 shadow-md" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="flex items-center space-x-3 mb-3">
              <Filter className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-semibold text-gray-800">
                Refine Results
              </h2>
            </div>

            <Select value={pollutant} onValueChange={setPollutant}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                <SelectValue placeholder="Choose pollutant" />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900">
                {pollutantOptions.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </motion.div>

        {/* -----------------------------------------------------
           MAIN GRID: Policies + Sidebar Insights
        ------------------------------------------------------ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ----------------- LEFT + CENTER COLUMN: CARDS ----------------- */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 relative">

            {isLoading && (
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            )}

            {policies.map((p, idx) => {
              const Icon = iconMap[p.icon] || Lightbulb;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card
                    className="p-6 rounded-xl shadow-sm border"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md">
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      <Badge
                        className={`border text-xs px-2 py-1 ${getCategoryColor(
                          p.category
                        )}`}
                      >
                        {p.category}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {p.policy_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-6 line-clamp-4">
                      {p.expert_brief}
                    </p>

                    {/* Scores */}
                    <div className="space-y-4 mb-6">
                      {[
                        ["Impact Score", p.impact_score],
                        ["Feasibility", p.feasibility],
                        ["Public Acceptance", p.acceptance],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{label}</span>
                            <span className={`font-semibold ${getScoreColor(value)}`}>
                              {value}%
                            </span>
                          </div>
                          <Progress value={value} className="h-2" />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-gray-600 text-sm">
                        Timeframe: {p.timeframe}
                      </span>
                      <Button size="sm" onClick={() => handleReadMore(p)}>
                        Read More
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* ----------------------- RIGHT SIDEBAR ----------------------- */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="p-6 shadow-md" style={{ backgroundColor: "#FFFFFF" }}>
              <div className="flex items-center mb-4">
                <LineChart className="w-6 h-6 text-emerald-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">
                  System Insights
                </h3>
              </div>

              <ul className="text-gray-700 text-sm space-y-3">
                <li className="flex items-start">
                  <ListChecks className="w-4 h-4 text-emerald-600 mr-2 mt-1" />
                  Recommendations adapt dynamically based on pollutant type.
                </li>
                <li className="flex items-start">
                  <ListChecks className="w-4 h-4 text-cyan-600 mr-2 mt-1" />
                  Scores combine causal impact + feasibility + sentiment.
                </li>
                <li className="flex items-start">
                  <ListChecks className="w-4 h-4 text-amber-600 mr-2 mt-1" />
                  All policy models are benchmarked using historical data.
                </li>
              </ul>
            </Card>
          </motion.div>
        </div>

        {/* -----------------------------------------------------
           FOOTER
        ------------------------------------------------------ */}
        <div className="mt-16">
          <Footer />
        </div>
      </div>

      {/* -----------------------------------------------------
         MODAL
      ------------------------------------------------------ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-2xl shadow-xl"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <DialogHeader>
            <DialogTitle
              className="text-2xl font-bold"
              style={{ color: "#13451b" }}
            >
              {selectedPolicy?.policy_name}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedPolicy?.expert_brief}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[70vh] overflow-y-auto pr-2 space-y-6">
            <AnimatePresence>
              {detailLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10"
                >
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-gray-600 mt-3">Loading insights...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {detailData && !detailLoading && (
              <>
                {detailData.error && (
                  <div className="p-4 bg-red-100 text-red-800 border border-red-300 rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3" />
                    {detailData.error}
                  </div>
                )}

                {!detailData.error && (
                  <>
                    <Section
                      icon={<BookOpen className="w-5 h-5 text-emerald-600" />}
                      title="Long-Term Impact Analysis"
                      text={detailData.long_impact_analysis}
                    />
                    <Section
                      icon={<Cog className="w-5 h-5 text-emerald-600" />}
                      title="Primary Mechanism"
                      text={detailData.primary_mechanism}
                    />
                    <Section
                      icon={<Clock className="w-5 h-5 text-emerald-600" />}
                      title="Estimated Timeframe"
                      text={detailData.estimated_timeframe}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ icon, title, text }) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center text-lg font-semibold text-emerald-700">
        {icon}
        <span className="ml-2">{title}</span>
      </h4>
      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
        {text}
      </p>
    </div>
  );
}
