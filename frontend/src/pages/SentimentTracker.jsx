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

// --- NEW: Define your backend API's base URL ---
const API_BASE_URL = 'http://localhost:8000';

// Colors for the pie chart (These are fine, as they are chart colors)
const PIE_COLORS = {
  positive: 'hsl(var(--emerald))',
  negative: 'hsl(var(--destructive))',
  neutral: 'hsl(var(--muted-foreground))',
};

// --- FIX 1: Updated Tooltip to be light-themed ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div 
        className="p-3 border rounded-md shadow-lg" 
        // 3. TOOLTIP: Updated to white background
        style={{ backgroundColor: '#FFFFFF', borderColor: '#DDDDDD' }}
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
// --- End of Fix 1 ---

export default function SentimentTracker() {
  const [topic, setTopic] = useState('Air Pollution');
  const [days, setDays] = useState('7');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [summaryData, setSummaryData] = useState([]);
  const [trendlineData, setTrendlineData] = useState([]);
  const [sourceData, setSourceData] = useState([]);

  // ... (handleFetchData and useEffect remain the same) ...
  const handleFetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const baseUrl = `${API_BASE_URL}/api/v1/sentiment`;
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
      const summaryDataFetched = await summaryRes.json();
      const trendlineData = await trendlineRes.json();
      const sourceDataObj = await sourceRes.json();

      setExecutiveSummary(synthesisData.executive_summary);

      setSummaryData([
        { name: 'Positive', value: summaryDataFetched.positive, color: PIE_COLORS.positive },
        { name: 'Negative', value: summaryDataFetched.negative, color: PIE_COLORS.negative },
        { name: 'Neutral', value: summaryDataFetched.neutral, color: PIE_COLORS.neutral },
      ]);

      setTrendlineData(trendlineData);
      setSourceData(sourceDataObj);
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
  }, [handleFetchData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleFetchData();
  };

  return (
    // 1. PAGE BACKGROUND: Set to #CCF0B9
    <div className="min-h-screen pb-12 text-gray-900" style={{ backgroundColor: '#CCF0B9' }}>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header (Already correct) */}
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
          {/* 2. CARD BACKGROUND: Set to #FFFFFF */}
          <Card className="p-6 mb-8" style={{ backgroundColor: '#FFFFFF' }}>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
              <Input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic (e.g., Solar Power, EV)"
                // 3. INPUT: Light theme
                className="flex-1 bg-white text-gray-900 border-gray-200 placeholder:text-gray-400"
              />

              <Select value={days} onValueChange={setDays}>
                <SelectTrigger 
                  // 3. INPUT: Light theme
                  className="w-full md:w-[180px] bg-white text-gray-900 border-gray-200"
                >
                  <SelectValue placeholder="Select days" />
                </SelectTrigger>
                <SelectContent 
                  // 3. INPUT: Light theme
                  className="bg-white text-gray-900"
                >
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
          // 3. ERROR: Light theme
          <Card className="p-6 bg-red-100 border border-red-300 text-red-800 flex items-center mb-8">
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
              {/* 2. CARD BACKGROUND: Set to #FFFFFF */}
              <Card className="p-6 h-full" style={{ backgroundColor: '#FFFFFF' }}>
                <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900">
                  {/* 3. TEXT/ICON: Dark */}
                  <BookText className="w-5 h-5 mr-2 text-emerald-600" />
                  Executive Summary
                </h2>
                {isLoading ? (
                  <div className="space-y-3">
                    {/* 3. SKELETON: Light theme */}
                    <div className="h-4 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded-md animate-pulse w-5/6" />
                    <div className="h-4 bg-gray-200 rounded-md animate-pulse w-3/4" />
                  </div>
                ) : (
                  // 3. TEXT: Dark
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {executiveSummary || 'No summary available.'}
                  </p>
                )}
              </Card>
            </motion.div>

            {/* Sentiment Trendline */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              {/* 2. CARD BACKGROUND: Set to #FFFFFF */}
              <Card className="p-6" style={{ backgroundColor: '#FFFFFF' }}>
                <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-900">
                  {/* 3. TEXT/ICON: Dark */}
                  <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
                  Sentiment Trend
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendlineData}>
                      {/* 3. CHART: Dark grid/text */}
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis dataKey="date" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: '#333' }} />
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
              {/* 2. CARD BACKGROUND: Set to #FFFFFF */}
              <Card className="p-6" style={{ backgroundColor: '#FFFFFF' }}>
                <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900">
                  {/* 3. TEXT/ICON: Dark */}
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
                      <Tooltip />
                      <Legend wrapperStyle={{ color: '#333' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            {/* Source Distribution */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              {/* 2. CARD BACKGROUND: Set to #FFFFFF */}
              <Card className="p-6" style={{ backgroundColor: '#FFFFFF' }}>
                <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-900">
                  {/* 3. TEXT/ICON: Dark */}
                  <Newspaper className="w-5 h-5 mr-2 text-emerald-600" />
                  Source Distribution
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceData} layout="vertical">
                      {/* 3. CHART: Dark grid/text */}
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis type="number" stroke="#6B7280" />
                      <YAxis dataKey="source" type="category" stroke="#6B7280" width={80} />
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
      </div>

      {/* 4. FOOTER WRAPPER: Match page background */}
      <div style={{ backgroundColor: '#CCF0B9' }}>
        <Footer />
      </div>
    </div>
  );
}