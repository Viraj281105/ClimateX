// src/pages/DashboardPage.jsx
// Upgraded DashboardPage — Light-theme (Option L). Uses existing WeatherMap component.
// Preserves all original data / API logic. Visual & interaction upgrades only.

import { useState, useEffect } from "react";
import WeatherMap from "@/components/WeatherMap";

import { motion } from "framer-motion";
import {
  Cloud,
  Droplets,
  Leaf,
  Thermometer,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import Footer from "@/components/Footer";

const getAqiText = (aqi) =>
  ({
    1: "Good",
    2: "Fair",
    3: "Moderate",
    4: "Poor",
    5: "Very Poor",
  }[aqi] || "N/A");

const formatAqiTime = (timestamp) =>
  new Date(timestamp * 1000).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay },
});

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([]);
  const [aqiTrend, setAqiTrend] = useState([]);
  const [progress, setProgress] = useState(0);

  // Scroll progress for the thin progress bar at top
  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY || window.pageYOffset;
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      const pct = total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0;
      setProgress(pct);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const API_KEY =
      process.env.REACT_APP_WEATHER_API_KEY || process.env.VITE_WEATHER_API_KEY;
    const lat = 18.5204;
    const lon = 73.8567;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      if (!API_KEY) {
        setError(
          "Missing API key in .env (REACT_APP_WEATHER_API_KEY or VITE_WEATHER_API_KEY)."
        );
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

        if (!weatherRes.ok || !aqiRes.ok) throw new Error("Failed to fetch external APIs.");

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
            label: "Temperature",
            value: weatherData?.main?.temp ? `${weatherData.main.temp.toFixed(1)}°C` : "N/A",
            trend: weatherData?.weather?.[0]?.description || "N/A",
            color: "from-amber-500 to-orange-500",
          },
          {
            icon: Cloud,
            label: "Air Quality Index",
            value: currentAqi,
            trend: getAqiText(currentAqi),
            color: "from-red-500 to-pink-500",
          },
          {
            icon: Droplets,
            label: "Rainfall",
            value: weatherData?.rain?.["1h"] ? `${weatherData.rain["1h"]} mm` : "0 mm",
            trend: "Real-time",
            color: "from-cyan-500 to-blue-500",
          },
          {
            icon: Leaf,
            label: "CO₂ Levels",
            value: "405 ppm",
            trend: "+5 ppm",
            color: "from-emerald-500 to-teal-500",
          },
        ]);
      } catch (e) {
        setError(e.message || "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: "#CCF0B9" }}>
      {/* top scroll progress */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="h-1 w-full bg-black/10">
          <div
            className="h-1 transition-all duration-150"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg,#10b981,#06b6d4)",
            }}
          />
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        {/* Page Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-24 mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            India <span className="font-extrabold" style={{ color: "#13451b" }}>Climate Dashboard</span>
          </h1>
          <p className="text-gray-700 text-lg max-w-2xl">
            Real-time monitoring for weather, pollution, and environmental changes — actionable at a glance.
          </p>
        </motion.div>

        {/* Grid: Map + Sidebar stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Card
              className="p-6 shadow-lg rounded-2xl overflow-hidden"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold" style={{ color: "#13451b" }}>
                  National Overview
                </h2>
                <div className="text-sm text-gray-500">Centered: Pune, MH • Live</div>
              </div>

              {/* WeatherMap framed */}
              <div className="rounded-xl overflow-hidden border border-gray-100 shadow-inner">
                <div style={{ height: 420 }}>
                  <WeatherMap />
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-600">
                <span className="sr-only">Interactive weather & air-quality map centered on Pune, India.</span>
                <span aria-hidden>Tip: Pinch / drag to explore map layers.</span>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
          >
            {/* Loading / Error states preserved */}
            {isLoading ? (
              <Card className="p-6 h-[400px] flex items-center justify-center" style={{ backgroundColor: "#FFFFFF" }}>
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" aria-hidden />
                <span className="sr-only">Loading data</span>
              </Card>
            ) : error ? (
              <Card className="p-6 h-[400px] flex flex-col items-center justify-center text-red-700" style={{ backgroundColor: "#FFFFFF" }}>
                <AlertTriangle className="w-8 h-8 mb-3" />
                <p>{error}</p>
              </Card>
            ) : (
              stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Card className="p-6 rounded-2xl shadow-md hover:shadow-xl transition" style={{ backgroundColor: "#FFFFFF" }}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-500">{stat.label}</p>
                          <p className="text-3xl font-bold text-gray-900 my-1">{stat.value}</p>
                          <p className="text-xs text-gray-500">{stat.trend}</p>
                        </div>

                        <div
                          className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-md`}
                          aria-hidden
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </div>

        {/* Air Quality Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-6 rounded-2xl shadow-lg" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Air Quality (PM2.5)</h2>
              <div className="text-sm text-gray-500">Recent trend</div>
            </div>

            <div className="h-80">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={aqiTrend} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
                    <defs>
                      <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="10%" stopColor="#10b981" stopOpacity={0.28} />
                        <stop offset="90%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="6 6" stroke="rgba(0,0,0,0.06)" />
                    <XAxis stroke="#6b7280" dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e6e6e6",
                        borderRadius: 10,
                        boxShadow: "0 6px 20px rgba(16,185,129,0.08)",
                      }}
                      labelStyle={{ color: "#374151" }}
                    />

                    <Area
                      type="monotone"
                      dataKey="pm2_5"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#aqiGradient)"
                      dot={{ r: 0 }}
                      activeDot={{ r: 5 }}
                    />
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
