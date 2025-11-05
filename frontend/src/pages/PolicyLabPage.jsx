import { useState, useEffect } from 'react'; // 'useEffect' is now used
import { motion, AnimatePresence } from 'framer-motion';
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
  Filter, // Added filter icon
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Footer from '@/components/Footer';

// --- NEW: Define your backend API's base URL ---
const API_BASE_URL = 'http://localhost:8000';

// Icon mapping (Unchanged)
const iconMap = {
  Lightbulb,
  Target,
  Users,
  TrendingUp,
  Zap,
  Award,
};

// --- NEW --- Pollutant options from your backend
const pollutantOptions = [
  { value: 'Air Pollution (PM/NOx)', label: 'Air Pollution (PM/NOx)' },
  { value: 'Carbon Dioxide (CO2)', label: 'Carbon Dioxide (CO2)' },
  { value: 'General Pollutants (SO2)', label: 'General Pollutants (SO2)' },
];

const PolicyLabPage = () => {
  // --- NEW --- State for the filter
  const [pollutant, setPollutant] = useState(pollutantOptions[0].value);
  
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  // --- UPDATED --- This hook now re-runs when 'pollutant' changes
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setIsLoading(true);
        // --- UPDATED --- The selected pollutant is now in the URL
        const apiUrl = `${API_BASE_URL}/api/v1/policies/?pollutant=${encodeURIComponent(pollutant)}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error('Failed to load policies. Is the backend running?');
        }
        const data = await response.json();
        setPolicies(data.recommendations); 

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicies();
  }, [pollutant]); // Re-fetch when 'pollutant' changes

  // (All other functions remain the same)
  const handleReadMore = async (policy) => {
    setSelectedPolicy(policy);
    setIsModalOpen(true);
    setIsModalLoading(true);
    setDetailData(null);
    try {
      // --- UPDATED: Prepend API_BASE_URL ---
      const response = await fetch(
        `${API_BASE_URL}/api/v1/policies/detail?policy_id=${policy.id}`
      );
      if (!response.ok) {
        throw new Error('Failed to load policy details.');
      }
      const data = await response.json();
      setDetailData(data);
    } catch (err) {
      setDetailData({ error: err.message });
    } finally {
      setIsModalLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-cyan-400';
    return 'text-amber-400';
  };

  const getCategoryColor = (category) => {
    const colors = {
      Environment: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      Transport: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      Industry: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      Energy: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      Education: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      Water: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    };
    return colors[category] || 'bg-white/10 text-white border-white/30';
  };
  
  // (Render functions for loading/error are unchanged)
  if (isLoading && policies.length === 0) { // Only show full-page loader on first load
    return (
      <div
        className="min-h-screen pt-24 pb-12 flex items-center justify-center"
        style={{ backgroundColor: '#57af50' }}
      >
        <Loader2 className="w-12 h-12 text-[#13451b] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen pt-24 pb-12 flex items-center justify-center"
        style={{ backgroundColor: '#57af50' }}
      >
        <Card className="p-8 bg-red-900/50 border border-red-700 text-red-100 flex items-center">
          <AlertTriangle className="w-8 h-8 mr-4" />
          <div>
            <h2 className="text-xl font-bold">Failed to Load</h2>
            <p>{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-12"
      style={{ backgroundColor: '#57af50' }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center pt-24 text-gray-900" // Reduced mb-12 to mb-8
        >
          <h1 className="text-4xl font-bold mb-4">
            AI Policy{' '}
            <span
              className="text-gradient-emerald"
              style={{ color: '#13451b' }}
            >
              Recommendations
            </span>
          </h1>
          <p className="text-gray-800 text-lg max-w-3xl mx-auto">
            Data-driven climate policy recommendations powered by artificial
            intelligence, causal inference, and public sentiment analysis.
          </p>
        </motion.div>

        {/* --- NEW FILTER DROPDOWN --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 max-w-md mx-auto"
        >
          <Card
            className="p-4"
            style={{ backgroundColor: '#13451b' }}
          >
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-emerald-400" />
              <label className="text-sm font-medium text-emerald-400">
                Filter by Target Pollutant
              </label>
            </div>
            <Select value={pollutant} onValueChange={setPollutant}>
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select a pollutant" />
              </SelectTrigger>
              <SelectContent>
                {pollutantOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </motion.div>
        {/* --- END OF FILTER --- */}


        {/* Policy Cards Grid */}
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* --- NEW --- Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          )}
          
          {policies.map((policy, index) => {
            const Icon = iconMap[policy.icon] || Lightbulb;
            return (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card
                  className="p-6 h-full flex flex-col"
                  style={{ backgroundColor: '#13451b' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-white">
                          {policy.policy_name}
                        </h3>
                        <Badge
                          className={`text-xs border ${getCategoryColor(
                            policy.category
                          )}`}
                        >
                          {policy.category}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm mb-6 flex-1">
                    {policy.expert_brief}
                  </p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                          Impact Score
                        </span>
                        <span
                          className={`font-semibold ${getScoreColor(
                            policy.impact_score
                          )}`}
                        >
                          {policy.impact_score}%
                        </span>
                      </div>
                      <Progress value={policy.impact_score} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                          Feasibility
                        </span>
                        <span
                          className={`font-semibold ${getScoreColor(
                            policy.feasibility
                          )}`}
                        >
                          {policy.feasibility}%
                        </span>
                      </div>
                      <Progress value={policy.feasibility} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                          Public Acceptance
                        </span>
                        <span
                          className={`font-semibold ${getScoreColor(
                            policy.acceptance
                          )}`}
                        >
                          {policy.acceptance}%
                        </span>
                      </div>
                      <Progress value={policy.acceptance} className="h-2" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                    <span className="text-sm text-muted-foreground">
                      Timeframe: {policy.timeframe}
                    </span>
                    <Button
                      className="btn-primary"
                      size="sm"
                      onClick={() => handleReadMore(policy)}
                    >
                      Read More
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <Card
            className="p-8 text-center relative overflow-hidden"
            style={{ backgroundColor: '#13451b' }}
          >
            <div className="absolute inset-0 gradient-animated opacity-10" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4 text-white">
                How Our{' '}
                <span className="text-gradient-emerald">
                  AI Policy Engine
                </span>{' '}
                Works
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
                Our AI analyzes real-time climate data, historical trends,
                causal relationships, and public sentiment to generate
                evidence-based policy recommendations. Each policy is scored on
                impact, feasibility, and public acceptance to help
                policymakers make informed decisions.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2">
                  Causal Inference
                </Badge>
                <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-4 py-2">
                  Predictive Modeling
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-4 py-2">
                  Sentiment Analysis
                </Badge>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* "Read More" Modal (with scroll fix) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-w-2xl"
          style={{
            backgroundColor: '#13451b',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl text-gradient-emerald">
              {selectedPolicy?.policy_name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedPolicy?.expert_brief}
            </DialogDescription>
          </DialogHeader>

          {/* --- SCROLL FIX --- */}
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            <AnimatePresence>
              {isModalLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-60"
                >
                  <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                  <p className="text-muted-foreground mt-4">
                    Generating detailed analysis...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {detailData && !isModalLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {detailData.error ? (
                  <div className="p-4 bg-red-900/50 border border-red-700 text-red-100 rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3" />
                    <p>{detailData.error}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <h3 className="flex items-center text-lg font-semibold text-emerald-400">
                        <BookOpen className="w-5 h-5 mr-2" />
                        Long-Term Impact Analysis
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                        {detailData.long_impact_analysis}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="flex items-center text-lg font-semibold text-emerald-400">
                        <Cog className="w-5 h-5 mr-2" />
                        Primary Mechanism
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                        {detailData.primary_mechanism}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="flex items-center text-lg font-semibold text-emerald-400">
                        <Clock className="w-5 h-5 mr-2" />
                        Estimated Timeframe
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                        {detailData.estimated_timeframe}
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <div style={{ backgroundColor: '#13451b' }}>
        <Footer />
      </div>
    </div>
  );
};

export default PolicyLabPage;