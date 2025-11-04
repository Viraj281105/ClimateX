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
    { name: 'Positive', value: 45, color: 'hsl(var(--emerald))' },
    { name: 'Neutral', value: 30, color: 'hsl(var(--cyan))' },
    { name: 'Negative', value: 25, color: 'hsl(var(--amber))' },
  ];

  const mockTweets = [
    { user: 'EcoWarrior', text: 'Great initiative for renewable energy! 🌱', sentiment: 'positive' },
    { user: 'ClimateWatch', text: 'We need faster implementation of green policies.', sentiment: 'neutral' },
    { user: 'GreenIndia', text: 'Air quality improvements are visible! Keep it up! 💚', sentiment: 'positive' },
    { user: 'ConcernedCitizen', text: 'Policy looks good but execution is slow.', sentiment: 'negative' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-3">
            State <span className="text-gradient-emerald">Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            Deep-dive into state-level climate data and policy impact analysis.
          </p>

          {/* State Selector */}
          <div className="max-w-xs">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="glass-card border-white/10">
                <SelectValue placeholder="Choose State" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10">
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
          <TabsList className="glass-card border border-white/10 p-1">
            <TabsTrigger value="climate" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <BarChart3 className="w-4 h-4 mr-2" />
              Climate Data
            </TabsTrigger>
            <TabsTrigger value="simulator" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <TrendingUp className="w-4 h-4 mr-2" />
              Policy Simulator
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
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
              <Card className="glass-card p-6">
                <p className="text-sm text-muted-foreground mb-2">Avg Temperature</p>
                <p className="text-3xl font-bold text-amber-400">28.5°C</p>
                <p className="text-xs text-muted-foreground mt-1">+3.2°C from last year</p>
              </Card>
              <Card className="glass-card p-6">
                <p className="text-sm text-muted-foreground mb-2">Air Quality Index</p>
                <p className="text-3xl font-bold text-red-400">258</p>
                <p className="text-xs text-muted-foreground mt-1">Poor - Action needed</p>
              </Card>
              <Card className="glass-card p-6">
                <p className="text-sm text-muted-foreground mb-2">Total Rainfall</p>
                <p className="text-3xl font-bold text-cyan-400">145 mm</p>
                <p className="text-xs text-muted-foreground mt-1">Past 6 months</p>
              </Card>
            </motion.div>

            <Card className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-6">Climate Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={climateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="temp" stroke="hsl(var(--amber))" strokeWidth={2} name="Temperature" />
                    <Line type="monotone" dataKey="aqi" stroke="hsl(var(--cyan))" strokeWidth={2} name="AQI" />
                    <Line type="monotone" dataKey="rainfall" stroke="hsl(var(--emerald))" strokeWidth={2} name="Rainfall" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          {/* Policy Simulator Tab */}
          <TabsContent value="simulator" className="space-y-6">
            <Card className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-6">Policy Configuration</h3>
              <div className="space-y-8">
                <div>
                  <label className="text-sm text-muted-foreground mb-3 block">
                    Policy Budget: ₹{policyBudget}Cr
                  </label>
                  <Slider
                    value={policyBudget}
                    onValueChange={setPolicyBudget}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-3 block">
                    Implementation Time: {implementationTime} months
                  </label>
                  <Slider
                    value={implementationTime}
                    onValueChange={setImplementationTime}
                    max={48}
                    step={6}
                    className="w-full"
                  />
                </div>
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                  Run Simulation
                </Button>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-6">Predicted Impact</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={beforeAfterData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="before" fill="hsl(var(--amber))" name="Before Policy" />
                    <Bar dataKey="after" fill="hsl(var(--emerald))" name="After Policy" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          {/* Sentiment Tracker Tab */}
          <TabsContent value="sentiment" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card p-6">
                <h3 className="text-xl font-semibold mb-6">Sentiment Distribution</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="glass-card p-6">
                <h3 className="text-xl font-semibold mb-6">Public Opinion Feed</h3>
                <div className="space-y-4 h-80 overflow-y-auto custom-scrollbar">
                  {mockTweets.map((tweet, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border ${
                        tweet.sentiment === 'positive'
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : tweet.sentiment === 'neutral'
                          ? 'bg-cyan-500/10 border-cyan-500/30'
                          : 'bg-amber-500/10 border-amber-500/30'
                      }`}
                    >
                      <p className="font-medium text-sm text-foreground mb-1">@{tweet.user}</p>
                      <p className="text-sm text-muted-foreground">{tweet.text}</p>
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