import WeatherMap from "../components/WeatherMap";
import { motion } from 'framer-motion';
import { Cloud, Droplets, Wind, Leaf } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Footer from '@/components/Footer';

const DashboardPage = () => {
  // Mock data for AQI trend
  const aqiData = [
    { month: 'Jan', aqi: 180 },
    { month: 'Feb', aqi: 195 },
    { month: 'Mar', aqi: 210 },
    { month: 'Apr', aqi: 240 },
    { month: 'May', aqi: 265 },
    { month: 'Jun', aqi: 220 },
    { month: 'Jul', aqi: 190 },
    { month: 'Aug', aqi: 175 },
    { month: 'Sep', aqi: 185 },
    { month: 'Oct', aqi: 210 },
    { month: 'Nov', aqi: 235 },
    { month: 'Dec', aqi: 250 },
  ];

  const stats = [
    {
      icon: Wind,
      label: 'Temperature',
      value: '32°C',
      trend: '+2.5°C from avg',
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-400',
    },
    {
      icon: Cloud,
      label: 'Air Quality Index',
      value: '210',
      trend: 'Poor',
      color: 'from-red-500 to-pink-500',
      textColor: 'text-red-400',
    },
    {
      icon: Droplets,
      label: 'Rainfall',
      value: '12 mm',
      trend: 'This week',
      color: 'from-cyan-500 to-blue-500',
      textColor: 'text-cyan-400',
    },
    {
      icon: Leaf,
      label: 'CO₂ Levels',
      value: '405 ppm',
      trend: '+5 ppm',
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-3">
            India <span className="text-gradient-emerald">Climate Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Real-time climate intelligence and environmental monitoring across India.
          </p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="glass-card p-6 h-full">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="text-gradient-emerald">National Overview</span>
              </h2>

              {/* 🌍 Live Weather Map */}
              <div className="rounded-xl overflow-hidden h-[500px] border border-white/10">
                <WeatherMap />
              </div>
            </Card>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="glass-card-hover p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className={`text-3xl font-bold ${stat.textColor} mb-1`}>
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">{stat.trend}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </motion.div>
        </div>

        {/* AQI Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-6">
              Air Quality Index <span className="text-gradient-emerald">Trend</span>
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aqiData}>
                  <defs>
                    <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--emerald))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--emerald))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="aqi"
                    stroke="hsl(var(--emerald))"
                    strokeWidth={2}
                    fill="url(#aqiGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default DashboardPage;
