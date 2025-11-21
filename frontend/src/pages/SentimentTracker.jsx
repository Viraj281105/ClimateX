import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart as PieChartIcon,
  TrendingUp,
  Newspaper,
  BookText,
  Loader2,
  AlertTriangle,
  Search,
  ChevronDown,
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

// === Constants - keep exact color scheme from your app ===
const API_BASE_URL = 'http://localhost:8000';
const PAGE_BG = '#CCF0B9';
const CARD_BG = '#FFFFFF';
const TEXT_DARK = '#13451b'; // used for accents
const PIE_COLORS = {
  positive: 'hsl(var(--emerald))',
  negative: 'hsl(var(--destructive))',
  neutral: 'hsl(var(--muted-foreground))',
};

// === Custom lightweight tooltip (light themed) ===
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 border rounded-md shadow-lg"
        style={{ backgroundColor: CARD_BG, borderColor: '#DDDDDD' }}
      >
        <p className="label text-gray-500">{label}</p>
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

// === Small Sparkline component used next to topic input ===
const Sparkline = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-gray-500">no data</div>;
  }
  // use a tiny line chart
  return (
    <div style={{ width: 120, height: 28 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function SentimentTracker() {
  // Form state
  const [topic, setTopic] = useState('Air Pollution');
  const [days, setDays] = useState('7');

  // Data + UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [executiveSummary, setExecutiveSummary] = useState('');
  const [summaryData, setSummaryData] = useState([]);
  const [trendlineData, setTrendlineData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [sparkData, setSparkData] = useState([]);

  // Topics & suggestions
  const [topicSuggestions, setTopicSuggestions] = useState([]);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [recommendedTopics, setRecommendedTopics] = useState([]);

  const searchTimeout = useRef(null);

  // Fetch topic suggestions (semantic topics) on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/topics`);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        // Expecting data to be an array of topics or objects
        // Normalize to strings
        const list =
          Array.isArray(data) && data.length && typeof data[0] === 'string'
            ? data
            : Array.isArray(data)
            ? data.map((d) => (d.topic ? d.topic : String(d)))
            : [];
        setTopicSuggestions(list.slice(0, 200)); // cap
      } catch (e) {
        // not critical
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch recommended emerging topics (recent discovered topics) — shows clickable recommendations
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/topics/recent`);
        if (!res.ok) return;
        const data = await res.json();
        // Normalize
        const list = Array.isArray(data) ? data.slice(0, 8) : [];
        setRecommendedTopics(list);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Main data fetch function
  const fetchAllData = useCallback(
    async (topicParam = topic, daysParam = days) => {
      setIsLoading(true);
      setError(null);

      const baseUrl = `${API_BASE_URL}/api/v1/sentiment`;
      const params = `?topic=${encodeURIComponent(topicParam)}&days=${encodeURIComponent(daysParam)}`;

      try {
        const [synthesisRes, summaryRes, trendlineRes, sourceRes] = await Promise.all([
          fetch(`${baseUrl}/synthesis${params}`),
          fetch(`${baseUrl}/summary${params}`),
          fetch(`${baseUrl}/trendline${params}`),
          fetch(`${baseUrl}/source_distribution${params}`),
        ]);

        if (!synthesisRes.ok || !summaryRes.ok || !trendlineRes.ok || !sourceRes.ok) {
          // attempt to parse any body for a friendlier message
          let message = 'One or more data components failed to load.';
          try {
            const errJson = await synthesisRes.json();
            if (errJson && errJson.detail) message = String(errJson.detail);
          } catch (_) {}
          throw new Error(message);
        }

        const synthesisData = await synthesisRes.json();
        const summaryFetched = await summaryRes.json();
        const trendlineFetched = await trendlineRes.json();
        const sourceFetched = await sourceRes.json();

        // Executive summary text
        setExecutiveSummary(synthesisData?.executive_summary || synthesisData?.generated_impact_summary || '');

        // Pie summary
        setSummaryData([
          { name: 'Positive', value: summaryFetched.positive || 0, color: PIE_COLORS.positive },
          { name: 'Negative', value: summaryFetched.negative || 0, color: PIE_COLORS.negative },
          { name: 'Neutral', value: summaryFetched.neutral || 0, color: PIE_COLORS.neutral },
        ]);

        // Trendline data (ensure consistent date ordering)
        setTrendlineData(Array.isArray(trendlineFetched) ? trendlineFetched : []);

        // Source distribution: expect [{source, topic, positive, negative, neutral}, ...]
        setSourceData(Array.isArray(sourceFetched) ? sourceFetched : []);

        // Spark: derive small recent metric from trendline (sum of positives per last 10 points)
        const spark = (trendlineFetched || [])
          .slice(-12)
          .map((d) => ({
            date: d.date,
            value: (d.positive || 0) - (d.negative || 0), // net positivity
          }));
        setSparkData(spark);
      } catch (err) {
        setError(err.message || 'Unknown error');
        setExecutiveSummary('');
        setSummaryData([]);
        setTrendlineData([]);
        setSourceData([]);
        setSparkData([]);
      } finally {
        setIsLoading(false);
      }
    },
    [topic, days]
  );

  // initial load
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced topic autocomplete / suggestions toggling
  const onTopicInput = (value) => {
    setTopic(value);
    setShowTopicDropdown(true);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      // optional: fetch topic-specific quick sparkline to show beside field
      (async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/sentiment/trendline?topic=${encodeURIComponent(value)}&days=7`);
          if (!res.ok) return;
          const data = await res.json();
          const spark = (data || [])
            .slice(-12)
            .map((d) => ({ date: d.date, value: (d.positive || 0) - (d.negative || 0) }));
          setSparkData(spark);
        } catch (e) {
          // ignore
        }
      })();
    }, 450);
  };

  // handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowTopicDropdown(false);
    await fetchAllData(topic, days);
  };

  // helper: choose a suggestion
  const pickSuggestion = (t) => {
    setTopic(t);
    setShowTopicDropdown(false);
    fetchAllData(t, days);
  };

  // small UI helpers
  const totalAnalyzed = summaryData.reduce((s, a) => s + (a.value || 0), 0);

  return (
    <div className="min-h-screen pb-12 text-gray-900" style={{ backgroundColor: PAGE_BG }}>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pt-24">
          <h1 className="text-4xl font-bold mb-4">
            Public Sentiment{' '}
            <span className="text-gradient-emerald" style={{ color: TEXT_DARK }}>
              Tracker
            </span>
          </h1>
          <p className="text-gray-800 text-lg max-w-3xl">
            Analyze real-time public sentiment on climate topics. Enter a topic and select a timeframe to see the full analysis.
          </p>
        </motion.div>

        {/* Filter Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 mb-8" style={{ backgroundColor: CARD_BG }}>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 relative">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  value={topic}
                  onChange={(e) => onTopicInput(e.target.value)}
                  placeholder="Enter a topic (e.g., Solar Power, EV)"
                  className="w-full bg-white text-gray-900 border-gray-200 placeholder:text-gray-400 pr-28"
                  aria-label="Topic"
                />

                {/* sparkline next to input (right) */}
                <div className="absolute right-36 top-2/4 -translate-y-2/4">
                  <Sparkline data={sparkData} />
                </div>

                {/* topic dropdown */}
                <AnimatePresence>
                  {showTopicDropdown && topicSuggestions.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute z-40 left-0 right-0 mt-2 max-h-56 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg"
                    >
                      {topicSuggestions
                        .filter((t) => t.toLowerCase().includes((topic || '').toLowerCase()))
                        .slice(0, 12)
                        .map((t) => (
                          <li
                            key={t}
                            onClick={() => pickSuggestion(t)}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                          >
                            {t}
                          </li>
                        ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              <div style={{ minWidth: 180 }}>
                <Select value={days} onValueChange={setDays}>
                  <SelectTrigger id="days" className="w-full bg-white text-gray-900 border-gray-200">
                    <SelectValue placeholder="Select days" />
                    <span className="ml-2"><ChevronDown /></span>
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-auto">
                <Button type="submit" className="btn-primary w-full md:w-auto" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  Run Analysis
                </Button>
              </div>

              {/* context window - shows quick info */}
              <div className="absolute right-0 bottom-0 transform translate-y-full mt-3 bg-white border border-gray-200 rounded-md p-3 text-xs w-64 shadow">
                <div className="font-medium text-sm text-gray-800 mb-1">Context</div>
                <div className="text-gray-600">Topic: <span className="font-medium">{topic}</span></div>
                <div className="text-gray-600">Time Window: <span className="font-medium">Last {days} days</span></div>
                <div className="text-gray-600">Sources: <span className="font-medium">Reddit, NewsAPI</span></div>
                <div className="text-gray-600">Total analyzed: <span className="font-medium">{totalAnalyzed}</span></div>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="p-6 bg-red-100 border border-red-300 text-red-800 flex items-center mb-8">
                <AlertTriangle className="w-6 h-6 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Analysis Failed</h3>
                  <p className="text-sm">{error}</p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Executive Summary */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 h-full" style={{ backgroundColor: CARD_BG }}>
                <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900">
                  <BookText className="w-5 h-5 mr-2 text-emerald-600" />
                  Executive Summary
                </h2>

                {isLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded-md animate-pulse w-5/6" />
                    <div className="h-4 bg-gray-200 rounded-md animate-pulse w-3/4" />
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{executiveSummary || 'No summary available.'}</p>
                )}
              </Card>
            </motion.div>

            {/* Trendline */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6" style={{ backgroundColor: CARD_BG }}>
                <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-900">
                  <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
                  Sentiment Trend
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendlineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis dataKey="date" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: '#333' }} />
                      <AnimatePresence>
                        <Line
                          key="positive-line"
                          type="monotone"
                          dataKey="positive"
                          name="Positive"
                          stroke={PIE_COLORS.positive}
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={true}
                        />
                        <Line
                          key="negative-line"
                          type="monotone"
                          dataKey="negative"
                          name="Negative"
                          stroke={PIE_COLORS.negative}
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={true}
                        />
                        <Line
                          key="neutral-line"
                          type="monotone"
                          dataKey="neutral"
                          name="Neutral"
                          stroke={PIE_COLORS.neutral}
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={true}
                        />
                      </AnimatePresence>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-8">
            {/* Sentiment Breakdown */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6" style={{ backgroundColor: CARD_BG }}>
                <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900">
                  <PieChartIcon className="w-5 h-5 mr-2 text-emerald-600" />
                  Sentiment Breakdown
                </h2>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summaryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {summaryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: '#333' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            {/* Source Distribution */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="p-6" style={{ backgroundColor: CARD_BG }}>
                <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-900">
                  <Newspaper className="w-5 h-5 mr-2 text-emerald-600" />
                  Source Distribution
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis type="number" stroke="#6B7280" />
                      <YAxis dataKey="source" type="category" stroke="#6B7280" width={120} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: '#333' }} />
                      <Bar dataKey="positive" name="Positive" stackId="a" fill={PIE_COLORS.positive} />
                      <Bar dataKey="neutral" name="Neutral" stackId="a" fill={PIE_COLORS.neutral} />
                      <Bar dataKey="negative" name="Negative" stackId="a" fill={PIE_COLORS.negative} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Bottom: Recommended Emerging Topics panel */}
        <div className="mt-8">
          <Card className="p-6" style={{ backgroundColor: CARD_BG }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: TEXT_DARK }}>
              Recommended Emerging Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {recommendedTopics.length === 0 && <div className="text-sm text-gray-500">No recommendations yet.</div>}
              {recommendedTopics.map((t, idx) => {
                const label = typeof t === 'string' ? t : t.topic || t.name || String(t);
                return (
                  <button
                    key={idx}
                    onClick={() => pickSuggestion(label)}
                    className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-sm border border-gray-100"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Footer wrapper */}
      <div style={{ backgroundColor: PAGE_BG }}>
        <Footer />
      </div>

      {/* Full-screen overlay loader for strong network operations */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 60,
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(3px)',
            }}
          >
            <div className="rounded-lg bg-white p-6 shadow-lg flex items-center gap-4">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <div>
                <div className="font-medium text-gray-900">Loading analysis</div>
                <div className="text-sm text-gray-500">Fetching latest sentiment and trend data...</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
