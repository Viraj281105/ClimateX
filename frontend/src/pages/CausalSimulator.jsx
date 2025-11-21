// src/pages/CausalSimulator.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Loader2,
  AlertTriangle,
  Scale,
  BookOpen,
  X,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Footer from "@/components/Footer";

/*
  Enhancements applied while preserving existing functionality:
  - Thin scroll progress bar
  - Micro-fade animations for sections
  - Slightly improved form spacing and button states
  - Historical Analogies polished as pill list + empty state
  - Generated Impact Summary presented as downloadable report + copy
  - Accessibility improvements (sr-only, aria)
  - Kept exact color scheme: background #CCF0B9, cards #FFFFFF, accent #13451b
*/

const API_BASE_URL = "http://localhost:8000";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay },
});

export default function CausalSimulator() {
  const [policyText, setPolicyText] = useState("");
  const [pollutant, setPollutant] = useState("Air Pollution (PM/NOx)");
  const [policyYear, setPolicyYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        body: policyText,
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
      // scroll to results smoothly
      setTimeout(() => {
        const el = document.getElementById("resultsTop");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Network error. Could not reach API."
          : err.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const pollutantOptions = [
    "Air Pollution (PM/NOx)",
    "Carbon Dioxide (CO2)",
    "General Pollutants (SO2)",
  ];

  const handleCopySummary = async () => {
    if (!results?.generated_impact_summary) return;
    try {
      await navigator.clipboard.writeText(results.generated_impact_summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      // ignore copy failures
    }
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

  return (
    <div
      className="min-h-screen pb-12 text-gray-900"
      style={{ backgroundColor: "#CCF0B9" }}
    >
      {/* Thin top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="h-1 w-full bg-black/10">
          <div
            className="h-1 transition-all duration-150"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg,#10b981,#06b6d4)",
            }}
          />
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        {/* HERO (simple header, upgraded) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 pt-24"
        >
          <div
            className="inline-flex items-center justify-center w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-2xl mb-6"
            aria-hidden
          >
            <Wand2 className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl font-bold mb-3 tracking-tight">
            Causal <span style={{ color: "#13451b" }}>Simulator</span>
          </h1>

          <p className="text-gray-800 text-lg max-w-3xl mx-auto leading-relaxed">
            Predict the environmental impact of new climate policies using
            AI-powered causal reasoning, historical analogies, and evidence-backed
            modeling.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT: FORM */}
          <motion.div
            {...fadeUp(0.05)}
            className="lg:col-span-2"
          >
            <Card
              className="p-6 md:p-8 shadow-md rounded-2xl"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Policy Text */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Policy Text
                  </label>

                  <Textarea
                    value={policyText}
                    onChange={(e) => setPolicyText(e.target.value)}
                    placeholder="Paste or describe the climate policy you want to evaluate..."
                    className="min-h-[250px] text-base bg-white text-gray-900 border-gray-200 placeholder:text-gray-400"
                    aria-label="Policy text to evaluate"
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    Provide full text or a detailed summary for the most accurate simulation.
                  </p>
                </div>

                {/* Pollutant + Year Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Target Pollutant
                    </label>
                    <Select value={pollutant} onValueChange={setPollutant}>
                      <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                        <SelectValue placeholder="Select pollutant" />
                      </SelectTrigger>

                      <SelectContent className="bg-white text-gray-900">
                        {pollutantOptions.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Implementation Year
                    </label>

                    <Input
                      type="number"
                      className="bg-white border-gray-200 text-gray-900"
                      min="2020"
                      max="2050"
                      value={policyYear}
                      onChange={(e) => setPolicyYear(e.target.value)}
                      aria-label="Policy implementation year"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-2 text-right">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full md:w-auto flex items-center gap-2"
                    aria-disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    <span>{isLoading ? "Simulating…" : "Simulate Impact"}</span>
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>

          {/* RIGHT: Historical Analogies */}
          <motion.div {...fadeUp(0.08)} className="space-y-6">
            <Card className="p-6 shadow-md rounded-2xl" style={{ backgroundColor: "#FFFFFF" }}>
              <div className="flex items-center mb-4">
                <BookOpen className="w-6 h-6 text-emerald-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Historical Analogies</h2>
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
                      <div key={i} className="w-full h-4 bg-gray-200 rounded-md animate-pulse" />
                    ))}
                    <p className="text-xs text-gray-500 text-center">Analyzing historical policy database…</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isLoading && results && (
                <motion.ul initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {Array.isArray(results.analogies) && results.analogies.length > 0 ? (
                    results.analogies.map((a, index) => (
                      <li key={index}>
                        <div className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="text-sm text-gray-700">
                            <div className="font-semibold">{a.policy_name}</div>
                            <div className="text-xs text-gray-500">{a.year_enacted} • {a.region || "—"}</div>
                          </div>

                          <div className="text-xs text-gray-500">{a.similarity ? `${(a.similarity * 100).toFixed(0)}% match` : ""}</div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No matching historical analogies found.</p>
                  )}
                </motion.ul>
              )}

              {!isLoading && !results && (
                <p className="text-sm text-gray-500 mt-2">Results will appear here after running a simulation.</p>
              )}
            </Card>

            {/* Quick reference card */}
            <Card className="p-4 rounded-2xl shadow-sm" style={{ backgroundColor: "#FFFFFF" }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">What the simulator returns</div>
                  <div className="text-xs text-gray-600 mt-1">Counterfactual estimates, uncertainty range, and relevant past policies — all explained in plain language.</div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ERROR PANEL */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8">
              <Card className="p-4 bg-red-100 border border-red-300 text-red-800 flex items-center rounded-xl shadow-sm">
                <AlertTriangle className="w-5 h-5 mr-3" />
                <div>
                  <h3 className="font-semibold">Simulation Failed</h3>
                  <p className="text-sm">{error}</p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GENERATED IMPACT SUMMARY */}
        <AnimatePresence>
          {results && (
            <motion.div id="resultsTop" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8">
              <Card className="p-6 md:p-8 shadow-lg rounded-2xl" style={{ backgroundColor: "#FFFFFF" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Scale className="w-6 h-6 text-emerald-600" />
                    <h2 className="text-2xl font-semibold text-gray-900">Generated Impact Summary</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySummary}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50"
                      aria-label="Copy summary"
                    >
                      <X className="w-4 h-4" style={{ opacity: 0.9 }} />
                      {copied ? "Copied" : "Copy"}
                    </button>

                    <button
                      onClick={handleDownloadSummary}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50"
                      aria-label="Download summary"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>

                <div className="prose max-w-none text-gray-700 leading-relaxed">
                  {/* Present as pre-wrapped text but with nicer spacing */}
                  <pre className="whitespace-pre-wrap font-sans text-sm m-0">{results.generated_impact_summary}</pre>
                </div>

                {/* Basic structured highlights if available */}
                {results.highlights && Array.isArray(results.highlights) && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {results.highlights.map((h, i) => (
                      <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-md">
                        <div className="text-sm text-gray-600">{h.title}</div>
                        <div className="text-lg font-semibold text-gray-900 mt-1">{h.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Optional uncertainty visualization (simple textual for now) */}
                {results.uncertainty && (
                  <div className="mt-6">
                    <div className="text-sm text-gray-600">Uncertainty</div>
                    <div className="text-sm text-gray-700 mt-1">{results.uncertainty}</div>
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
