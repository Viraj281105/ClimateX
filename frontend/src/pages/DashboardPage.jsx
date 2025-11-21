// File: D:\Hackathons\PCCOE IGC\ClimateX\frontend\src\pages\DashboardPage.jsx
// Updated DashboardPage — Light-theme (Option L). Uses existing WeatherMap component.

import { useState, useEffect } from 'react';
import WeatherMap from '@/components/WeatherMap';

import { motion } from 'framer-motion';
import {
  Cloud,
  Droplets,
  Leaf,
  Thermometer,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import Footer from '@/components/Footer';

const getAqiText = (aqi) =>
  ({
    1: 'Good',
    2: 'Fair',
    3: 'Moderate',
    4: 'Poor',
    5: 'Very Poor',
  }[aqi] || 'N/A');

const formatAqiTime = (timestamp) =>
  new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([]);
  const [aqiTrend, setAqiTrend] = useState([]);

  useEffect(() => {
    const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || process.env.VITE_WEATHER_API_KEY;
    const lat = 18.5204;
    const lon = 73.8567;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      if (!API_KEY) {
        setError('Missing API key in .env (REACT_APP_WEATHER_API_KEY or VITE_WEATHER_API_KEY).');
        setIsLoading(false);
        return;
      }

      try {
        const [weatherRes, aqiRes] = await Promise.all([
          fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
          ),
          fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`
          ),
        ]);

        if (!weatherRes.ok || !aqiRes.ok) throw new Error('Failed to fetch external APIs.');

        const weatherData = await weatherRes.json();
        const aqiData = await aqiRes.json();

        // defensive checks
        const aqiList = (aqiData && aqiData.list) || [];

        setAqiTrend(
          aqiList.map((i) => ({
            date: formatAqiTime(i.dt),
            pm2_5: i.components.pm2_5,
          }))
        );

        const currentAqi = aqiList[0]?.main?.aqi || 0;

        setStats([
          {
            icon: Thermometer,
            label: 'Temperature',
            value: weatherData?.main?.temp ? `${weatherData.main.temp.toFixed(1)}°C` : 'N/A',
            trend: weatherData?.weather?.[0]?.description || 'N/A',
            color: 'from-amber-500 to-orange-500',
          },
          {
            icon: Cloud,
            label: 'Air Quality Index',
            value: currentAqi,
            trend: getAqiText(currentAqi),
            color: 'from-red-500 to-pink-500',
          },
          {
            icon: Droplets,
            label: 'Rainfall',
            value: weatherData?.rain?.['1h'] ? `${weatherData.rain['1h']} mm` : '0 mm',
            trend: 'Real-time',
            color: 'from-cyan-500 to-blue-500',
          },
          {
            icon: Leaf,
            label: 'CO₂ Levels',
            value: '405 ppm',
            trend: '+5 ppm',
            color: 'from-emerald-500 to-teal-500',
          },
        ]);
      } catch (e) {
        setError(e.message || 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: '#CCF0B9' }}>
      <div className="px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-24 mb-10"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            India <span className="font-extrabold" style={{ color: '#13451b' }}>Climate Dashboard</span>
          </h1>
          <p className="text-gray-700 text-lg max-w-2xl">
            Real-time monitoring for weather, pollution, and environmental changes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
            <Card className="p-6 shadow-lg rounded-2xl" style={{ backgroundColor: '#FFFFFF' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#13451b' }}>
                National Overview
              </h2>

              {/* Use existing light-theme WeatherMap (Option L) */}
              <div aria-hidden={isLoading}>
                <WeatherMap />
              </div>

              {/* Accessible note for screen readers */}
              <p className="sr-only">Interactive weather & air-quality map centered on Pune, India.</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            {isLoading ? (
              <Card className="p-6 h-[400px] flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" aria-hidden />
                <span className="sr-only">Loading data</span>
              </Card>
            ) : error ? (
              <Card className="p-6 h-[400px] flex flex-col items-center justify-center text-red-700" style={{ backgroundColor: '#FFFFFF' }}>
                <AlertTriangle className="w-8 h-8 mb-3" />
                <p>{error}</p>
              </Card>
            ) : (
              stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="p-6 rounded-2xl shadow-md" style={{ backgroundColor: '#FFFFFF' }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900 my-1">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.trend}</p>
                      </div>

                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-md`}>
                        <Icon className="w-6 h-6 text-white" aria-hidden />
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-6 rounded-2xl shadow-lg" style={{ backgroundColor: '#FFFFFF' }}>
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Air Quality (PM2.5)</h2>

            <div className="h-80">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={aqiTrend}>
                    <defs>
                      <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="10%" stopColor="hsl(var(--emerald))" stopOpacity={0.3} />
                        <stop offset="90%" stopColor="hsl(var(--emerald))" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis stroke="#6b7280" dataKey="date" />
                    <YAxis stroke="#6b7280" />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                      }}
                    />

                    <Area type="monotone" dataKey="pm2_5" stroke="hsl(var(--emerald))" strokeWidth={2} fill="url(#aqiGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
