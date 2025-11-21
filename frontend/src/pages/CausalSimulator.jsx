import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Loader2,
  AlertTriangle,
  Scale,
  BookOpen,
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

const API_BASE_URL = "http://localhost:8000";

export default function CausalSimulator() {
  const [policyText, setPolicyText] = useState("");
  const [pollutant, setPollutant] = useState("Air Pollution (PM/NOx)");
  const [policyYear, setPolicyYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);

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

  return (
    <div
      className="min-h-screen pb-12 text-gray-900"
      style={{ backgroundColor: "#CCF0B9" }}
    >
      <div className="px-4 sm:px-6 lg:px-8">

        {/* -------------------------------------------------------
              HEADER SECTION — HERO BLOCK
        -------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14 pt-24"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-2xl mb-6"
          >
            <Wand2 className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            Causal{" "}
            <span style={{ color: "#13451b" }}>
              Simulator
            </span>
          </h1>

          <p className="text-gray-800 text-lg max-w-3xl mx-auto leading-relaxed">
            Predict the environmental impact of new climate policies using
            AI-powered causal reasoning, historical analogies, and evidence-based
            modeling.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* -------------------------------------------------------
                LEFT PANEL — INPUT FORM
          -------------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
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
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    Provide full text or a detailed summary for highest-accuracy simulation.
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
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2 text-right">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full md:w-auto flex items-center"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    Simulate Impact
                  </Button>
                </div>

              </form>
            </Card>
          </motion.div>

          {/* -------------------------------------------------------
                RIGHT PANEL — HISTORICAL ANALOGIES
          -------------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <Card
              className="p-6 shadow-md rounded-2xl"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <div className="flex items-center mb-4">
                <BookOpen className="w-6 h-6 text-emerald-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Historical Analogies
                </h2>
              </div>

              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-full h-4 bg-gray-200 rounded-md animate-pulse"
                      />
                    ))}
                    <p className="text-xs text-gray-500 text-center">
                      Analyzing historical policy database…
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {results && (
                <motion.ul
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {results.analogies.length > 0 ? (
                    results.analogies.map((a, index) => (
                      <li
                        key={index}
                        className="text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700"
                      >
                        {a.policy_name} ({a.year_enacted})
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No matching historical analogies found.
                    </p>
                  )}
                </motion.ul>
              )}

              {!isLoading && !results && (
                <p className="text-sm text-gray-500 mt-2">
                  Results will appear here after running a simulation.
                </p>
              )}
            </Card>
          </motion.div>
        </div>

        {/* -------------------------------------------------------
              ERROR PANEL
        -------------------------------------------------------- */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-10"
            >
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

        {/* -------------------------------------------------------
              GENERATED IMPACT SUMMARY
        -------------------------------------------------------- */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-10"
            >
              <Card
                className="p-6 md:p-8 shadow-lg rounded-2xl"
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <div className="flex items-center mb-4">
                  <Scale className="w-6 h-6 text-emerald-600 mr-3" />
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Generated Impact Summary
                  </h2>
                </div>

                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {results.generated_impact_summary}
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <Footer />
    </div>
  );
}
