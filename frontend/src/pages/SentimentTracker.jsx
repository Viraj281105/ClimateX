import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart as PieChartIcon, TrendingUp, Newspaper, BookText, Loader2,
  AlertTriangle, Search, ChevronDown, Activity, Sparkles, Send, MapPin
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend
} from 'recharts';
import Footer from '@/components/Footer';

const API_BASE_URL = 'http://localhost:8000';
const PIE_COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#94a3b8',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 border rounded-xl shadow-lg bg-white border-slate-200">
        <p className="label text-slate-500 font-mono text-xs mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="text-xs font-semibold" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Sparkline = ({ data = [] }) => {
  if (!data || data.length === 0) return <div className="text-xs text-slate-400">no trend</div>;
  return (
    <div style={{ width: 100, height: 24 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function SentimentTracker() {
  const [topic, setTopic] = useState('Air Pollution');
  const [days, setDays] = useState('7');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [executiveSummary, setExecutiveSummary] = useState('');
  const [summaryData, setSummaryData] = useState([]);
  const [trendlineData, setTrendlineData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [sparkData, setSparkData] = useState([]);

  // Autocomplete & emerging topics
  const [topicSuggestions, setTopicSuggestions] = useState([]);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [recommendedTopics, setRecommendedTopics] = useState([]);
  
  // Custom Live Sentiment Tester state
  const [testText, setTestText] = useState("");
  const [testScore, setTestScore] = useState(50); // 0 (Neg) to 100 (Pos)

  // Live opinion feed simulation
  const [feedItems, setFeedItems] = useState([
    { user: "@DelhiGreenCity", text: "Solar subsidy approved for western cluster. Great move!", type: "positive" },
    { user: "@IndoGangeticAQI", text: "Coal plant emission caps delayed again. Highly frustrating.", type: "negative" },
    { user: "@ClimateWatchIN", text: "IMD forecast predicts early monsoon patterns across West India.", type: "neutral" },
  ]);

  const searchTimeout = useRef(null);

  // Dynamic public feedback generation
  useEffect(() => {
    const feeds = [
      { user: "@CleanEnergyMH", text: "Mumbai commercial fleet EV mandates will slash PM2.5 significantly.", type: "positive" },
      { user: "@CoalMineWatch", text: "Jharkhand coal output projections raised for Q3. Concerns spike.", type: "negative" },
      { user: "@WeatherSentinel", text: "Western Ghats soil moisture indexes show normal water stress.", type: "neutral" },
      { user: "@CropBurnAlert", text: "Haryana agricultural fires detected via MODIS satellite feed.", type: "negative" },
      { user: "@EcoSolarHome", text: "New rooftop solar grid net-metering rules enacted locally.", type: "positive" }
    ];

    const interval = setInterval(() => {
      const randomFeed = feeds[Math.floor(Math.random() * feeds.length)];
      setFeedItems(prev => [randomFeed, ...prev.slice(0, 7)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Simple client-side sentiment score predictor
  useEffect(() => {
    if (!testText.trim()) {
      setTestScore(50);
      return;
    }
    const txt = testText.toLowerCase();
    let score = 50;
    
    // Positive tokens
    const pos = ["clean", "solar", "wind", "good", "great", "subsid", "improve", "save", "efficient", "green"];
    // Negative tokens
    const neg = ["coal", "smog", "bad", "fail", "tax", "cost", "pollution", "hazard", "burn", "worse"];

    pos.forEach(w => { if (txt.includes(w)) score += 10; });
    neg.forEach(w => { if (txt.includes(w)) score -= 10; });

    setTestScore(Math.min(100, Math.max(0, score)));
  }, [testText]);

  // Fetch topic list
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/topics`);
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) && data.length && typeof data[0] === 'string'
          ? data
          : Array.isArray(data)
          ? data.map((d) => (d.topic ? d.topic : String(d)))
          : [];
        setTopicSuggestions(list.slice(0, 150));
      } catch (e) {}
    })();
  }, []);

  // Fetch recommended topics
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/topics/recent`);
        if (!res.ok) return;
        const data = await res.json();
        setRecommendedTopics(Array.isArray(data) ? data.slice(0, 8) : []);
      } catch (e) {}
    })();
  }, []);

  const fetchAllData = useCallback(async (topicParam = topic, daysParam = days) => {
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
        throw new Error('Failed to load sentiment datasets.');
      }

      const synthesisData = await synthesisRes.json();
      const summaryFetched = await summaryRes.json();
      const trendlineFetched = await trendlineRes.json();
      const sourceFetched = await sourceRes.json();

      setExecutiveSummary(synthesisData?.executive_summary || synthesisData?.generated_impact_summary || '');
      setSummaryData([
        { name: 'Positive', value: summaryFetched.positive || 0, color: PIE_COLORS.positive },
        { name: 'Negative', value: summaryFetched.negative || 0, color: PIE_COLORS.negative },
        { name: 'Neutral', value: summaryFetched.neutral || 0, color: PIE_COLORS.neutral },
      ]);
      setTrendlineData(Array.isArray(trendlineFetched) ? trendlineFetched : []);
      setSourceData(Array.isArray(sourceFetched) ? sourceFetched : []);

      const spark = (trendlineFetched || []).slice(-12).map((d) => ({
        date: d.date,
        value: (d.positive || 0) - (d.negative || 0),
      }));
      setSparkData(spark);
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [topic, days]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const onTopicInput = (value) => {
    setTopic(value);
    setShowTopicDropdown(true);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      (async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/sentiment/trendline?topic=${encodeURIComponent(value)}&days=7`);
          if (!res.ok) return;
          const data = await res.json();
          const spark = (data || []).slice(-12).map((d) => ({ date: d.date, value: (d.positive || 0) - (d.negative || 0) }));
          setSparkData(spark);
        } catch (e) {}
      })();
    }, 450);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowTopicDropdown(false);
    await fetchAllData(topic, days);
  };

  const pickSuggestion = (t) => {
    setTopic(t);
    setShowTopicDropdown(false);
    fetchAllData(t, days);
  };

  const totalAnalyzed = summaryData.reduce((s, a) => s + (a.value || 0), 0);

  const stateApprovals = [
    { state: "Maharashtra", positive: "74%", trend: "up" },
    { state: "Delhi-NCR", positive: "42%", trend: "down" },
    { state: "Karnataka", positive: "68%", trend: "up" },
    { state: "Haryana", positive: "38%", trend: "down" }
  ];

  return (
    <div className="min-h-screen pb-12 bg-white text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-800">
      
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pt-24">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Climate <span className="text-emerald-600">Sentiment Analyzer</span>
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl font-medium">
            Track real-time public opinion, social commentary, and state-level policy approval across India.
          </p>
        </motion.div>

        {/* Filter Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 mb-8 border border-emerald-200/60 bg-emerald-100/10 shadow-sm relative">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full relative">
                <Input
                  type="text"
                  value={topic}
                  onChange={(e) => onTopicInput(e.target.value)}
                  placeholder="Enter a topic (e.g., Solar Power, EV)"
                  className="w-full bg-white text-slate-800 border-emerald-200 placeholder:text-slate-400 pr-28 rounded-xl"
                />

                {/* Sparkline overlay */}
                <div className="absolute right-4 top-2/4 -translate-y-2/4 hidden sm:block">
                  <Sparkline data={sparkData} />
                </div>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showTopicDropdown && topicSuggestions.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute z-40 left-0 right-0 mt-2 max-h-56 overflow-auto bg-white border border-emerald-200 rounded-xl shadow-lg"
                    >
                      {topicSuggestions
                        .filter((t) => t.toLowerCase().includes((topic || '').toLowerCase()))
                        .slice(0, 8)
                        .map((t) => (
                          <li
                            key={t}
                            onClick={() => pickSuggestion(t)}
                            className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer text-sm font-semibold text-slate-700"
                          >
                            {t}
                          </li>
                        ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-full md:w-48">
                <Select value={days} onValueChange={setDays}>
                  <SelectTrigger className="w-full bg-white text-slate-800 border-emerald-200 rounded-xl">
                    <SelectValue placeholder="Select days" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-slate-800">
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-auto">
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl shadow-sm w-full md:w-auto flex items-center gap-1.5" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Run Analysis</span>
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* Error panel */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="p-4 bg-red-50 border border-red-200 text-red-800 flex items-center mb-8 rounded-xl shadow-sm">
                <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold">Analysis pipeline failed</h3>
                  <p className="text-xs">{error}</p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN BODY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            {/* Executive Summary */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 border border-emerald-200/60 rounded-2xl bg-white shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center text-slate-800 font-mono uppercase tracking-wider pb-2 border-b border-slate-100">
                  <BookText className="w-5 h-5 mr-2 text-emerald-500" />
                  Executive Synthesis
                </h2>

                {isLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-100 rounded-md animate-pulse" />
                    <div className="h-4 bg-slate-100 rounded-md animate-pulse w-5/6" />
                    <div className="h-4 bg-slate-100 rounded-md animate-pulse w-3/4" />
                  </div>
                ) : (
                  <p className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                    {executiveSummary || 'No summary available.'}
                  </p>
                )}
              </Card>
            </motion.div>

            {/* Custom Interactive Live Sentiment Tester */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="p-6 border border-emerald-200/60 rounded-2xl bg-white shadow-sm space-y-4">
                <h2 className="text-lg font-bold flex items-center text-slate-800 font-mono uppercase tracking-wider pb-2 border-b border-slate-100">
                  <Sparkles className="w-5 h-5 mr-2 text-emerald-500 animate-pulse" />
                  Live Sentiment Classifier
                </h2>
                <p className="text-xs text-slate-500 font-medium">Type a simulated public comment or report sentence to instantly gauge its sentiment trajectory.</p>
                
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="E.g. Clean energy corridor investments are yielding good CO2 offsets..."
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    className="flex-1 bg-white border-emerald-200 rounded-xl text-xs"
                  />
                </div>

                {/* Score gauge slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500">
                    <span>NEGATIVE</span>
                    <span className="text-emerald-600">PREDICTED INDEX: {testScore}%</span>
                    <span>POSITIVE</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative border border-emerald-100">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        testScore > 60 ? "bg-emerald-400" : testScore < 40 ? "bg-red-400" : "bg-slate-400"
                      }`}
                      style={{ width: `${testScore}%` }}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Trendline Chart */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6 border border-emerald-200/60 rounded-2xl bg-white shadow-sm">
                <h2 className="text-lg font-bold mb-6 flex items-center text-slate-800 font-mono uppercase tracking-wider pb-2 border-b border-slate-100">
                  <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" />
                  Sentiment Trend Timeline
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendlineData}>
                      <CartesianGrid strokeDasharray="6 6" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="date" stroke="#6B7280" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="positive"
                        name="Positive Feedback"
                        stroke={PIE_COLORS.positive}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="negative"
                        name="Negative Feedback"
                        stroke={PIE_COLORS.negative}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="neutral"
                        name="Neutral Feedback"
                        stroke={PIE_COLORS.neutral}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Live Scrolling Opinion Feed */}
            <Card className="p-6 border border-emerald-200/60 rounded-2xl bg-white shadow-sm h-[320px] flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-800 font-mono uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>Public Opinion Stream</span>
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {feedItems.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/20 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                      <span className="text-slate-700">{item.user}</span>
                      <span className={`px-1.5 py-0.5 rounded border uppercase text-[8px] ${
                        item.type === "positive" 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                          : item.type === "negative" 
                          ? "bg-red-50 border-red-200 text-red-700" 
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">{item.text}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* State Approvals Matrix */}
            <Card className="p-6 border border-emerald-200/60 rounded-2xl bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 font-mono uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>State Approval Ratings</span>
              </h3>
              <div className="space-y-3">
                {stateApprovals.map((sa) => (
                  <div key={sa.state} className="flex justify-between items-center bg-emerald-50/20 border border-emerald-100/65 p-2.5 rounded-xl text-xs font-mono">
                    <span className="font-bold text-slate-700">{sa.state}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-700 font-extrabold">{sa.positive} Positive</span>
                      <span className={`text-[10px] ${sa.trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
                        {sa.trend === "up" ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Sentiment Breakdown Pie */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6 border border-emerald-200/60 rounded-2xl bg-white shadow-sm">
                <h2 className="text-sm font-bold mb-4 flex items-center text-slate-800 font-mono uppercase tracking-wider pb-2 border-b border-slate-100">
                  <PieChartIcon className="w-5 h-5 mr-2 text-emerald-500" />
                  Sentiment Distribution
                </h2>
                <div className="h-56">
                  {summaryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summaryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                        >
                          {summaryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                      No data loaded.
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

          </div>
        </div>

        {/* Recommended Emerging Topics */}
        <div className="mt-8">
          <Card className="p-6 border border-emerald-200/60 rounded-2xl bg-white shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-800 font-mono uppercase tracking-wider mb-4">
              Emerging Buzzwords & Suggestions
            </h3>
            <div className="flex flex-wrap gap-2">
              {recommendedTopics.length === 0 && <div className="text-xs text-slate-400">No suggestions loaded.</div>}
              {recommendedTopics.map((t, idx) => {
                const label = typeof t === 'string' ? t : t.topic || t.name || String(t);
                return (
                  <button
                    key={idx}
                    onClick={() => pickSuggestion(label)}
                    className="px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-xs border border-emerald-200 text-emerald-800 font-semibold transition"
                  >
                    #{label.replace(/\s+/g, '')}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

      </div>

      <Footer />
    </div>
  );
}
