import { useState, useEffect } from 'react';
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
import Footer from '@/components/Footer';

// Icon mapping to link API string to component
const iconMap = {
  Lightbulb,
  Target,
  Users,
  TrendingUp,
  Zap,
  Award,
};

const PolicyLabPage = () => {
  // State for the main policy list
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null); // For basic info
  const [detailData, setDetailData] = useState(null); // For LLM data
  const [isModalLoading, setIsModalLoading] = useState(false);

  // 1. Initial Load: Fetch the list of policies
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/v1/policies/');
        if (!response.ok) {
          throw new Error('Failed to load policies.');
        }
        const data = await response.json();
        setPolicies(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  // 2. "Read More" Click: Open modal and fetch details
  const handleReadMore = async (policy) => {
    setSelectedPolicy(policy); // Store the basic policy data
    setIsModalOpen(true);
    setIsModalLoading(true);
    setDetailData(null); // Clear old data

    try {
      const response = await fetch(
        `/api/v1/policies/detail?policy_id=${policy.id}`
      );
      if (!response.ok) {
        throw new Error('Failed to load policy details.');
      }
      const data = await response.json();
      setDetailData(data);
    } catch (err) {
      // Handle error in modal
      setDetailData({ error: err.message });
    } finally {
      setIsModalLoading(false);
    }
  };

  // --- Helper Functions from Mockup (Preserved) ---
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
  // --- End Helper Functions ---

  // --- Render Functions for Page State ---
  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
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
  // --- End Render Functions ---

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header (Preserved) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold mb-4">
            AI Policy <span className="text-gradient-emerald">Recommendations</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Data-driven climate policy recommendations powered by artificial
            intelligence, causal inference, and public sentiment analysis.
          </p>
        </motion.div>

        {/* Policy Cards Grid (Now dynamic) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {policies.map((policy, index) => {
            const Icon = iconMap[policy.icon] || Lightbulb; // Fallback icon
            return (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="glass-card-hover p-6 h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{policy.title}</h3>
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

                  {/* Description (from expert_brief) */}
                  <p className="text-muted-foreground text-sm mb-6 flex-1">
                    {policy.expert_brief}
                  </p>

                  {/* Metrics */}
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

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                    <span className="text-sm text-muted-foreground">
                      Timeframe: {policy.timeframe}
                    </span>
                    <Button
                      className="btn-primary" // Use the primary button class
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

        {/* Info Card (Preserved) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <Card className="glass-card p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 gradient-animated opacity-10" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4">
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

      {/* "Read More" Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="glass-card max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gradient-emerald">
              {selectedPolicy?.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedPolicy?.expert_brief}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
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
                    {/* Map the 3-section response */}
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

      <Footer />
    </div>
  );
};

export default PolicyLabPage;