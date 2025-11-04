import { motion } from 'framer-motion';
import { Lightbulb, Target, Users, TrendingUp, Zap, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Footer from '@/components/Footer';

const PolicyLabPage = () => {
  const policies = [
    {
      id: 1,
      title: 'Urban Green Cover Expansion',
      description: 'Increase urban forest cover by 25% through strategic plantation drives and rooftop gardens.',
      impactScore: 85,
      feasibility: 92,
      acceptance: 78,
      category: 'Environment',
      timeframe: '18 months',
      icon: Lightbulb,
    },
    {
      id: 2,
      title: 'Electric Vehicle Adoption Program',
      description: 'Incentivize EV adoption with subsidies, charging infrastructure, and tax benefits.',
      impactScore: 78,
      feasibility: 85,
      acceptance: 88,
      category: 'Transport',
      timeframe: '24 months',
      icon: Zap,
    },
    {
      id: 3,
      title: 'Industrial Emission Standards',
      description: 'Implement stricter emission norms for industries with real-time monitoring systems.',
      impactScore: 92,
      feasibility: 68,
      acceptance: 65,
      category: 'Industry',
      timeframe: '36 months',
      icon: Target,
    },
    {
      id: 4,
      title: 'Renewable Energy Grid Integration',
      description: 'Expand solar and wind energy infrastructure to achieve 40% renewable energy mix.',
      impactScore: 88,
      feasibility: 75,
      acceptance: 82,
      category: 'Energy',
      timeframe: '48 months',
      icon: TrendingUp,
    },
    {
      id: 5,
      title: 'Climate Education Initiative',
      description: 'Integrate climate awareness programs in schools and conduct public workshops.',
      impactScore: 70,
      feasibility: 95,
      acceptance: 90,
      category: 'Education',
      timeframe: '12 months',
      icon: Users,
    },
    {
      id: 6,
      title: 'Smart Water Management System',
      description: 'Deploy IoT-based water conservation and rainwater harvesting systems citywide.',
      impactScore: 82,
      feasibility: 80,
      acceptance: 85,
      category: 'Water',
      timeframe: '30 months',
      icon: Award,
    },
  ];

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

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold mb-4">
            AI Policy <span className="text-gradient-emerald">Recommendations</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Data-driven climate policy recommendations powered by artificial intelligence, causal inference, and public sentiment analysis.
          </p>
        </motion.div>

        {/* Policy Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {policies.map((policy, index) => {
            const Icon = policy.icon;
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
                        <Badge className={`text-xs border ${getCategoryColor(policy.category)}`}>
                          {policy.category}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm mb-6 flex-1">
                    {policy.description}
                  </p>

                  {/* Metrics */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Impact Score</span>
                        <span className={`font-semibold ${getScoreColor(policy.impactScore)}`}>
                          {policy.impactScore}%
                        </span>
                      </div>
                      <Progress value={policy.impactScore} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Feasibility</span>
                        <span className={`font-semibold ${getScoreColor(policy.feasibility)}`}>
                          {policy.feasibility}%
                        </span>
                      </div>
                      <Progress value={policy.feasibility} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Public Acceptance</span>
                        <span className={`font-semibold ${getScoreColor(policy.acceptance)}`}>
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
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg"
                      size="sm"
                    >
                      Simulate Policy
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
          <Card className="glass-card p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 gradient-animated opacity-10" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4">
                How Our <span className="text-gradient-emerald">AI Policy Engine</span> Works
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
                Our AI analyzes real-time climate data, historical trends, causal relationships, and public sentiment to generate evidence-based policy recommendations. Each policy is scored on impact, feasibility, and public acceptance to help policymakers make informed decisions.
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

      <Footer />
    </div>
  );
};

export default PolicyLabPage;