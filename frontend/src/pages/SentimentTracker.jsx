import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart as PieChartIcon,
  TrendingUp,
  Newspaper,
  BookText,
  Loader2,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import Footer from '@/components/Footer';

// Colors for the pie chart
const PIE_COLORS = {
  positive: 'hsl(var(--emerald))',
  negative: 'hsl(var(--destructive))',
  neutral: 'hsl(var(--muted-foreground))',
};

// --- FIX 1: Updated Tooltip to show all payload items ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 border-none rounded-md" style={{ backgroundColor: '#13451b' }}>
        <p className="label text-muted-foreground">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="intro" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
// --- End of Fix 1 ---

export default function SentimentTracker() {
  const [topic, setTopic] = useState('Air Pollution');
  const [days, setDays] = useState('7');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [summaryData, setSummaryData] = useState([]); // FIX 2
  const [trendlineData, setTrendlineData] = useState([]);
  const [sourceData, setSourceData] = useState([]);

  const handleFetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const baseUrl = '/api/v1/sentiment';
    const params = `?topic=${encodeURIComponent(topic)}&days=${encodeURIComponent(days)}`;

    try {
      const [synthesisRes, summaryRes, trendlineRes, sourceRes] = await Promise.all([
        fetch(`${baseUrl}/synthesis${params}`),
        fetch(`${baseUrl}/summary${params}`),
        fetch(`${baseUrl}/trendline${params}`),
        fetch(`${baseUrl}/source_distribution${params}`),
      ]);

      if (!synthesisRes.ok || !summaryRes.ok || !trendlineRes.ok || !sourceRes.ok) {
        throw new Error('One or more data components failed to load.');
      }

      const synthesisData = await synthesisRes.json();
      const summaryData = await summaryRes.json();
      const trendlineData = await trendlineRes.json();
      const sourceData_obj = await sourceRes.json();

      setExecutiveSummary(synthesisData.executive_summary);

      setSummaryData([
        {
          name: 'Positive',
          value: summaryData.positive,
          color: PIE_COLORS.positive,
        },
        {
          name: 'Negative',
          value: summaryData.negative,
          color: PIE_COLORS.negative,
        },
        {
          name: 'Neutral',
          value: summaryData.neutral,
          color: PIE_COLORS.neutral,
        },
      ]);

      setTrendlineData(trendlineData);
      setSourceData(sourceData_obj);
    } catch (err) {
      setError(err.message);
      setExecutiveSummary('');
      setSummaryData([]);
      setTrendlineData([]);
      setSourceData([]);
    } finally {
      setIsLoading(false);
    }
  }, [topic, days]);

  useEffect(() => {
    handleFetchData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleFetchData();
  };

  return (
    <div className="min-h-screen pb-12 text-gray-900" style={{ backgroundColor: '#57af50' }}>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pt-24">
          <h1 className="text-4xl font-bold mb-4">
            Public Sentiment{' '}
            <span className="text-gradient-emerald" style={{ color: '#13451b' }}>
              Tracker
            </span>
          </h1>
          <p className="text-gray-800 text-lg max-w-3xl">
            Analyze real-time public sentiment on climate topics. Enter a topic and select a timeframe to see the full analysis.
          </p>
        </motion.div>

        {/* Filter Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 mb-8" style={{ backgroundColor: '#13451b' }}>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
              <Input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic (e.g., Solar Power, EV)"
                className="flex-1"
              />
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Select days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Run Analysis
              </Button>
            </form>
          </Card>
        </motion.div>

        {/* Error State */}
        {error && (
          <Card className="p-6 bg-red-900/50 border border-red-700 text-red-100 flex items-center mb-8">
            <AlertTriangle className="w-6 h-6 mr-4 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg">Analysis Failed</h3>
              <p className="text-sm">{error}</p>
            </div>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Executive Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 h-full" style={{ backgroundColor: '#13451b' }}>
                <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                  <BookText className="w-5 h-5 mr-2 text-emerald-400" />
                  Executive Summary
                </h2>
                {isLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-white/10 rounded-md animate-pulse" />
                    <div className="h-4 bg-white/10 rounded-md animate-pulse w-5/6" />
                    <div className="h-4 bg-white/10 rounded-md animate-pulse w-3/4" />
                  </div>
                ) : (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {executiveSummary || 'No summary available.'}
                  </p>
                )}
              </Card>
            </motion.div>

            {/* Sentiment Trendline */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6" style={{ backgroundColor: '#13451b' }}>
                <h2 className="text-xl font-semibold mb-6 flex items-center text-white">
                  <TrendingUp className="w-5 h-5 mr-2 text-emerald-400" />
                  Sentiment Trend
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendlineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="positive"
                        name="Positive"
                        stroke={PIE_COLORS.positive}
                        activeDot={{ r: 6, fill: 'currentColor' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="negative"
                        name="Negative"
                        stroke={PIE_COLORS.negative}
                        activeDot={{ r: 6, fill: 'currentColor' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="neutral"
                        name="Neutral"
                        stroke={PIE_COLORS.neutral}
                        activeDot={{ r: 6, fill: 'currentColor' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-8">
            {/* Sentiment Breakdown */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6" style={{ backgroundColor: '#13451b' }}>
                <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                  <PieChartIcon className="w-5 h-5 mr-2 text-emerald-400" />
                  Sentiment Breakdown
                </h2>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={summaryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                        {summaryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            {/* Source Distribution */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="p-6" style={{ backgroundColor: '#13451b' }}>
                <h2 className="text-xl font-semibold mb-6 flex items-center text-white">
                  <Newspaper className="w-5 h-5 mr-2 text-emerald-400" />
                  Source Distribution
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis
                        dataKey="source"
                        type="category"
                        stroke="hsl(var(--muted-foreground))"
                        width={80}
                      />
                      <Tooltip />
                      <Bar dataKey="count" name="Articles" fill="hsl(var(--emerald))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      <div style={{ backgroundColor: '#13451b' }}>
        <Footer />
      </div>
    </div>
  );
}
