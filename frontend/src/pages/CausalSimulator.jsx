import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Loader2, AlertTriangle, Scale, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Footer from '@/components/Footer'; // <-- 1. IMPORT FOOTER

// ... (API_BASE_URL and other logic remains the same) ...
const API_BASE_URL = 'http://localhost:8000';

export default function CausalSimulator() {
  const [policyText, setPolicyText] = useState('');
  const [pollutant, setPollutant] = useState('Air Pollution (PM/NOx)');
  const [policyYear, setPolicyYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  // ... (handleSubmit function remains the same) ...
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const apiUrl = `${API_BASE_URL}/api/v1/causal/simulate?target_pollutants=${encodeURIComponent(
        pollutant
      )}&policy_year=${encodeURIComponent(policyYear)}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: policyText,
      });

      if (!response.ok) {
        let errorString = `Error ${response.status}: ${response.statusText}`; 
        
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorString = errorData.detail[0]?.msg || JSON.stringify(errorData.detail);
          } else {
            errorString = await response.text();
          }
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        
        throw new Error(errorString);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
          setError('Network error. Could not connect to the API. (Did you forget to enable CORS on the backend?)');
      } else {
          setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pollutantOptions = [
    { value: 'Air Pollution (PM/NOx)', label: 'Air Pollution (PM/NOx)' },
    { value: 'Carbon Dioxide (CO2)', label: 'Carbon Dioxide (CO2)' },
    { value: 'General Pollutants (SO2)', label: 'General Pollutants (SO2)' },
  ];

  return (
    <div
      className="min-h-screen pb-12 text-gray-900"
      // UPDATED: Main page background
      style={{ backgroundColor: '#CCF0B9' }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header (Already correct) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 pt-24"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-2xl mb-6">
            <Wand2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Causal{' '}
            {/* FIXED: Span color for visibility */}
            <span style={{ color: '#13451b' }}>
              Simulator
            </span>
          </h1>
          <p className="text-gray-800 text-lg max-w-3xl mx-auto">
            Test the potential impact of a new climate policy. Our AI will
            analyze its text and predict its causal effect on pollution levels,
            benchmarked against historical data.
          </p>
        </motion.div>

        {/* Main Content: Form + Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card
              className="p-6 md:p-8"
              // Card background: #FFFFFF
              style={{ backgroundColor: '#FFFFFF' }}
            >
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Policy Text Input */}
                  <div>
                    <label
                      htmlFor="policyText"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Policy Text
                    </label>
                    <Textarea
                      id="policyText"
                      value={policyText}
                      onChange={(e) => setPolicyText(e.target.value)}
                      placeholder="Paste or describe your policy here..."
                      // Forcing light-theme appearance
                      className="min-h-[250px] text-base bg-white text-gray-900 border-gray-200 placeholder:text-gray-400"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Enter the full text or a detailed summary of the policy
                      you want to analyze.
                    </p>
                  </div>

                  {/* Pollutant and Year Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="pollutant"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Target Pollutant
                      </label>
                      <Select
                        value={pollutant}
                        onValueChange={setPollutant}
                      >
                        <SelectTrigger
                          id="pollutant"
                          // Forcing light-theme appearance
                          className="w-full bg-white text-gray-900 border-gray-200"
                        >
                          <SelectValue placeholder="Select a pollutant" />
                        </SelectTrigger>
                        <SelectContent
                          // Forcing light-theme appearance
                          className="bg-white text-gray-900"
                        >
                          {pollutantOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label
                        htmlFor="policyYear"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Implementation Year
                      </label>
                      <Input
                        id="policyYear"
                        type="number"
                        value={policyYear}
                        onChange={(e) => setPolicyYear(e.target.value)}
                        placeholder="e.g., 2025"
                        min="2020"
                        max="2050"
                        // Forcing light-theme appearance
                        className="bg-white text-gray-900 border-gray-200 placeholder:text-gray-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button (Unchanged) */}
                  <div className="pt-4 text-right">
                    <Button
                      type="submit"
                      className="btn-primary w-full md:w-auto"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                      )}
                      Simulate Impact
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </motion.div>

          {/* Right Column: Analogies / Results Panel (Already correct) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1 space-y-8"
          >
            <Card className="p-6" style={{ backgroundColor: '#FFFFFF' }}>
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
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-4 bg-gray-200 rounded-md animate-pulse"
                      />
                    ))}
                    <p className="text-sm text-center text-gray-500">
                      Searching database...
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
                    results.analogies.map((analogy, index) => (
                      <li
                        key={index}
                        className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700"
                      >
                        {analogy.policy_name} ({analogy.year_enacted})
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No direct historical analogies were found.
                    </p>
                  )}
                </motion.ul>
              )}
              {!isLoading && !results && (
                <p className="text-sm text-gray-500">
                  Similar policies from our database will appear here after
                  you run a simulation.
                </p>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Bottom Section: Main Results (Already correct) */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <Card className="p-4 bg-red-100 border border-red-300 text-red-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Simulation Failed</h3>
                  <p className="text-sm">{error}</p>
                </div>
              </Card>
            </motion.div>
          )}

          {results && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <Card
                className="p-6 md:p-8"
                style={{ backgroundColor: '#FFFFFF' }}
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
      
      {/* --- 2. ADD FOOTER --- */}
      {/* Removed the wrapper div. The Footer component's internal 'mt-20' will now add the spacing. */}
      <Footer />

    </div>
  );
}