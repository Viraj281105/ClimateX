import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Footer from '@/components/Footer';

const StateDashboardPage = () => {
  const [selectedState, setSelectedState] = useState('delhi');
  const [policyBudget, setPolicyBudget] = useState([50]);
  const [implementationTime, setImplementationTime] = useState([24]);

  const states = [
    { value: 'delhi', label: 'Delhi' },
    { value: 'maharashtra', label: 'Maharashtra' },
    { value: 'tamilnadu', label: 'Tamil Nadu' },
    { value: 'karnataka', label: 'Karnataka' },
    { value: 'westbengal', label: 'West Bengal' },
  ];

  // Mock climate data
  const climateData = [
    { month: 'Jan', temp: 18, aqi: 220, rainfall: 5 },
    { month: 'Feb', temp: 21, aqi: 240, rainfall: 8 },
    { month: 'Mar', temp: 27, aqi: 260, rainfall: 12 },
    { month: 'Apr', temp: 33, aqi: 280, rainfall: 15 },
    { month: 'May', temp: 36, aqi: 295, rainfall: 20 },
    { month: 'Jun', temp: 35, aqi: 250, rainfall: 85 },
  ];

  // Mock policy simulation data
  const beforeAfterData = [
    { category: 'AQI', before: 250, after: 180 },
    { category: 'CO₂', before: 450, after: 380 },
    { category: 'Green Cover', before: 20, after: 35 },
  ];

  // Mock sentiment data
  const sentimentData = [
    { name: 'Positive', value: 45, color: '#10b981' },
    { name: 'Neutral', value: 30, color: '#06b6d4' },
    { name: 'Negative', value: 25, color: '#f59e0b' },
  ];

  const mockTweets = [
    { user: 'EcoWarrior', text: 'Great initiative for renewable energy! 🌱', sentiment: 'positive' },
    { user: 'ClimateWatch', text: 'We need faster implementation of green policies.', sentiment: 'neutral' },
    { user: 'GreenIndia', text: 'Air quality improvements are visible! Keep it up! 💚', sentiment: 'positive' },
    { user: 'ConcernedCitizen', text: 'Policy looks good but execution is slow.', sentiment: 'negative' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 bg-white text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            State-Level <span className="text-emerald-600">Diagnostics</span>
          </h1>
          <p className="text-slate-600 text-lg mb-6 font-medium">
            Deep-dive into state-level climate data, regional public feedback, and policy simulation projections.
          </p>

          {/* State Selector */}
          <div className="max-w-xs">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="bg-white border-emerald-200 text-slate-800 rounded-xl">
                <SelectValue placeholder="Choose State" />
              </SelectTrigger>
              <SelectContent className="bg-white text-slate-800">
                {states.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="climate" className="space-y-8">
          <TabsList className="bg-emerald-100 border border-emerald-200 p-1 text-slate-700 rounded-xl">
            <TabsTrigger 
              value="climate" 
              className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-lg"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Climate Data
            </TabsTrigger>
            <TabsTrigger 
              value="simulator" 
              className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-lg"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Policy Simulator
            </TabsTrigger>
            <TabsTrigger 
              value="sentiment" 
              className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-lg"
            >
              <Users className="w-4 h-4 mr-2" />
              Sentiment Tracker
            </TabsTrigger>
          </TabsList>

          {/* Climate Data Tab */}
          <TabsContent value="climate" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <Card className="p-6 border border-emerald-200 bg-emerald-100/10 shadow-sm rounded-2xl">
                <p className="text-xs text-slate-500 font-mono uppercase tracking-wider font-bold">Avg Temperature</p>
                <p className="text-3xl font-extrabold text-amber-600 font-mono mt-1">28.5°C</p>
                <p className="text-xs text-slate-500 mt-1 font-semibold">+3.2°C from baseline shifts</p>
              </Card>
              <Card className="p-6 border border-emerald-200 bg-emerald-100/10 shadow-sm rounded-2xl">
                <p className="text-xs text-slate-500 font-mono uppercase tracking-wider font-bold">Air Quality Index</p>
                <p className="text-3xl font-extrabold text-red-600 font-mono mt-1">258</p>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Poor - Response active</p>
              </Card>
              <Card className="p-6 border border-emerald-200 bg-emerald-100/10 shadow-sm rounded-2xl">
                <p className="text-xs text-slate-500 font-mono uppercase tracking-wider font-bold">Total Rainfall</p>
                <p className="text-3xl font-extrabold text-cyan-600 font-mono mt-1">145 mm</p>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Past 6 months cumulative</p>
              </Card>
            </motion.div>

            <Card className="p-6 border border-emerald-200 bg-white shadow-sm rounded-2xl">
              <h3 className="text-lg font-bold mb-6 text-slate-900 font-mono uppercase tracking-wider">Climate Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={climateData}>
                    <CartesianGrid strokeDasharray="6 6" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="month" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="temp" stroke="#d97706" strokeWidth={2} name="Temperature" />
                    <Line type="monotone" dataKey="aqi" stroke="#0891b2" strokeWidth={2} name="AQI" />
                    <Line type="monotone" dataKey="rainfall" stroke="#059669" strokeWidth={2} name="Rainfall" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          {/* Policy Simulator Tab */}
          <TabsContent value="simulator" className="space-y-6">
            <Card className="p-6 border border-emerald-200 bg-white shadow-sm rounded-2xl">
              <h3 className="text-lg font-bold mb-6 text-slate-900 font-mono uppercase tracking-wider">Policy Configuration</h3>
              <div className="space-y-8">
                <div>
                  <label className="text-xs font-mono font-bold text-slate-500 mb-3 block uppercase tracking-wide">
                    Policy Budget allocation: ₹{policyBudget}Cr
                  </label>
                  <Slider
                    value={policyBudget}
                    onValueChange={setPolicyBudget}
                    max={100}
                    step={5}
                    className="w-full cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono font-bold text-slate-500 mb-3 block uppercase tracking-wide">
                    Implementation Timeline: {implementationTime} months
                  </label>
                  <Slider
                    value={implementationTime}
                    onValueChange={setImplementationTime}
                    max={48}
                    step={6}
                    className="w-full cursor-pointer"
                  />
                </div>
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl shadow-sm">
                  Run Local Simulation
                </Button>
              </div>
            </Card>

            <Card className="p-6 border border-emerald-200 bg-white shadow-sm rounded-2xl">
              <h3 className="text-lg font-bold mb-6 text-slate-900 font-mono uppercase tracking-wider">Predicted Impact</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={beforeAfterData}>
                    <CartesianGrid strokeDasharray="6 6" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="category" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="before" fill="#d97706" name="Before Policy" />
                    <Bar dataKey="after" fill="#10b981" name="After Policy" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          {/* Sentiment Tracker Tab */}
          <TabsContent value="sentiment" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 border border-emerald-200 bg-white shadow-sm rounded-2xl">
                <h3 className="text-lg font-bold mb-6 text-slate-900 font-mono uppercase tracking-wider">Sentiment Distribution</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={95}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6 border border-emerald-200 bg-white shadow-sm rounded-2xl">
                <h3 className="text-lg font-bold mb-6 text-slate-900 font-mono uppercase tracking-wider">Public Opinion Feed</h3>
                <div className="space-y-4 h-80 overflow-y-auto pr-1 custom-scrollbar">
                  {mockTweets.map((tweet, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border ${
                        tweet.sentiment === 'positive'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : tweet.sentiment === 'neutral'
                          ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      <p className="font-bold text-xs mb-1">@{tweet.user}</p>
                      <p className="text-xs font-semibold leading-relaxed">{tweet.text}</p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default StateDashboardPage;