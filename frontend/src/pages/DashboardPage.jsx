import { useState, useEffect, useRef } from "react";
import WeatherMap from "@/components/WeatherMap";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud, Droplets, Leaf, Thermometer, Loader2, AlertTriangle,
  Radio, Zap, ShieldAlert, ChevronRight, Terminal, BarChart2, Activity
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([]);
  const [aqiTrend, setAqiTrend] = useState([]);
  const [progress, setProgress] = useState(0);

  // --- 1. State for Advanced Features ---
  const [mapTab, setMapTab] = useState("map"); // "map" or "globe"
  const [liveLogs, setLiveLogs] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("Delhi-NCR");
  const [microGrid, setMicroGrid] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [forecastTab, setForecastTab] = useState("Carbon Dioxide Emissions");

  const [activeGlobeNode, setActiveGlobeNode] = useState(null);
  const wsRef = useRef(null);

  // Scroll Progress
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

  // --- 2. Live WebSocket / Polling Stream Connection ---
  useEffect(() => {
    const connectWS = () => {
      const wsUrl = "ws://localhost:8000/api/v1/live/ws";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const timestampStr = new Date(data.timestamp * 1000).toLocaleTimeString();
          setLiveLogs(prev => [
            `[${timestampStr}] ${data.satellite_feed_log} (Delhi AQI: ${data.aqi_sensor_delhi}, Solar: ${data.solar_generation_kw}kW)`,
            ...prev.slice(0, 15)
          ]);
        } catch (e) {
          console.error("Error parsing WS frame:", e);
        }
      };

      ws.onerror = () => {
        fallbackPolling();
      };

      ws.onclose = () => {
        // Retry connection after 5 seconds
        setTimeout(connectWS, 5000);
      };
    };

    const fallbackPolling = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/live/poll");
        if (res.ok) {
          const data = await res.json();
          const timestampStr = new Date(data.timestamp * 1000).toLocaleTimeString();
          setLiveLogs(prev => [
            `[${timestampStr}] ${data.satellite_feed_log} (Delhi AQI: ${data.aqi_sensor_delhi}, Solar: ${data.solar_generation_kw}kW) [POLL]`,
            ...prev.slice(0, 15)
          ]);
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    };

    connectWS();
    const pollInterval = setInterval(fallbackPolling, 4000);

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearInterval(pollInterval);
    };
  }, []);

  // --- 3. Fetch Sentinel Anomalies & Forecasts & Micro Grid ---
  useEffect(() => {
    const fetchSentinelDetails = async () => {
      try {
        // Anomalies
        const aRes = await fetch("http://localhost:8000/api/v1/sentinel/anomalies");
        if (aRes.ok) {
          const aData = await aRes.ok ? await aRes.json() : [];
          setAnomalies(aData);
        }
        // Forecast
        const fRes = await fetch("http://localhost:8000/api/v1/sentinel/forecast?target_year=2042");
        if (fRes.ok) {
          const fData = await fRes.json();
          setForecastData(fData);
        }
      } catch (e) {
        console.error("Sentinel fetch error:", e);
      }
    };

    fetchSentinelDetails();
  }, []);

  // --- 4. Fetch Micro Grid on Region Change ---
  useEffect(() => {
    const fetchMicroGrid = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/intelligence/micro-grid?region=${encodeURIComponent(selectedRegion)}`);
        if (res.ok) {
          const data = await res.json();
          setMicroGrid(data);
          if (data.cells && data.cells.length > 0) {
            setSelectedCell(data.cells[4]); // Select center cell initially
          }
        }
      } catch (e) {
        console.error("Microgrid fetch error:", e);
      }
    };
    fetchMicroGrid();
  }, [selectedRegion]);

  // --- 5. Fetch Weather API Data ---
  useEffect(() => {
    const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || process.env.VITE_WEATHER_API_KEY;
    const lat = 18.5204;
    const lon = 73.8567;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      if (!API_KEY) {
        setError("Missing API key in .env (REACT_APP_WEATHER_API_KEY or VITE_WEATHER_API_KEY).");
        setIsLoading(false);
        return;
      }

      try {
        const [weatherRes, aqiRes] = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
          fetch(`https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`),
        ]);

        if (!weatherRes.ok || !aqiRes.ok) throw new Error("Failed to fetch external APIs.");

        const weatherData = await weatherRes.json();
        const aqiData = await aqiRes.json();
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
            color: "from-emerald-400 to-emerald-600",
          },
          {
            icon: Cloud,
            label: "Air Quality Index",
            value: currentAqi,
            trend: getAqiText(currentAqi),
            color: "from-emerald-600 to-emerald-800",
          },
          {
            icon: Droplets,
            label: "Rainfall",
            value: weatherData?.rain?.["1h"] ? `${weatherData.rain["1h"]} mm` : "0 mm",
            trend: "Real-time Integration",
            color: "from-emerald-500 to-teal-600",
          },
          {
            icon: Leaf,
            label: "CO₂ Levels",
            value: "405 ppm",
            trend: "+5 ppm annual shift",
            color: "from-emerald-600 to-teal-700",
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

  // Format Recharts Forecast Data
  const activeForecastSeries = forecastData.find(f => f.indicator === forecastTab);
  const chartData = activeForecastSeries ? [
    ...activeForecastSeries.historical.map(h => ({
      year: h.year,
      value: h.value,
      type: "Historical"
    })),
    ...activeForecastSeries.forecast.map(f => ({
      year: f.year,
      value: f.projected_value,
      lower: f.confidence_lower,
      upper: f.confidence_upper,
      type: "Forecast"
    }))
  ] : [];

  return (
    <div className="min-h-screen pb-16 bg-white text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-800">
      
      {/* Top scroll progress */}
      <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
        <div className="h-1 w-full bg-emerald-100">
          <div
            className="h-1 transition-all duration-150"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg,#10b981,#059669)",
            }}
          />
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Page Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-24 mb-8"
        >
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
            India <span className="text-emerald-600 drop-shadow-sm">Climate Operations Room</span>
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl font-medium">
            Real-time geospatial monitoring, telemetry streams, and neural predictive projections.
          </p>
        </motion.div>

        {/* 1. TOP STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {isLoading ? (
            Array(4).fill(0).map((_, idx) => (
              <Card key={idx} className="p-6 rounded-2xl border border-emerald-100 bg-emerald-50/10 h-[100px] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </Card>
            ))
          ) : error ? (
            <Card className="col-span-4 p-6 flex items-center gap-3 text-red-700 border-red-200 bg-red-50 rounded-2xl">
              <AlertTriangle className="w-6 h-6" />
              <p className="font-semibold">{error}</p>
            </Card>
          ) : (
            stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="p-6 rounded-2xl border border-emerald-200/50 bg-emerald-50/10 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider font-bold">{stat.label}</p>
                        <p className="text-3xl font-extrabold text-slate-800 my-1 font-mono">{stat.value}</p>
                        <p className="text-xs text-emerald-700 font-semibold">{stat.trend}</p>
                      </div>
                      <div className={`w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-sm`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* 2. GRID: Map Overview + Live Telemetry Stream Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Geospatial Map & Holographic Globe Card */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card className="p-6 shadow-sm border border-emerald-200/60 rounded-2xl overflow-hidden bg-white flex flex-col h-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                  <span>Sentinel Geospatial Console</span>
                </h2>
                
                {/* Tab select */}
                <div className="flex bg-emerald-100/60 border border-emerald-200 p-0.5 rounded-lg text-xs font-mono font-bold text-emerald-800">
                  <button
                    onClick={() => setMapTab("map")}
                    className={`px-3 py-1 rounded-md transition ${mapTab === "map" ? "bg-white shadow-sm" : ""}`}
                  >
                    Weather Map
                  </button>
                  <button
                    onClick={() => setMapTab("globe")}
                    className={`px-3 py-1 rounded-md transition ${mapTab === "globe" ? "bg-white shadow-sm animate-pulse" : ""}`}
                  >
                    Holo Globe
                  </button>
                </div>
              </div>

              {/* Console window content */}
              <div className="rounded-xl overflow-hidden border border-emerald-100 shadow-inner h-[380px] relative bg-slate-950 flex items-center justify-center">
                {mapTab === "map" ? (
                  <div className="w-full h-full">
                    <WeatherMap />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-white relative">
                    {/* Spinning SVG Globe */}
                    <svg className="w-64 h-64 select-none relative" viewBox="0 0 300 300">
                      <circle cx="150" cy="150" r="110" fill="none" stroke="#059669" strokeWidth="1" strokeDasharray="5 5" />
                      <circle cx="150" cy="150" r="95" fill="none" stroke="#10b981" strokeWidth="1.5" className="opacity-50" />
                      
                      {/* Grid lines */}
                      <ellipse cx="150" cy="150" rx="95" ry="30" fill="none" stroke="#a7f3d0" strokeWidth="1" className="opacity-40 animate-[spin_8s_linear_infinite]" />
                      <ellipse cx="150" cy="150" rx="30" ry="95" fill="none" stroke="#a7f3d0" strokeWidth="1" className="opacity-40 animate-[spin_12s_linear_infinite]" />
                      
                      {/* Nodes / Stations */}
                      {[
                        { name: "Delhi Node", x: 140, y: 90, desc: "Delhi-NCR ground grid. Status: PM2.5 Alert active." },
                        { name: "Pune Core Node", x: 120, y: 170, desc: "Pune core telemetry feed. Status: Operational." },
                        { name: "Kolkata Node", x: 210, y: 140, desc: "East regional monitor. Status: Standby." },
                        { name: "Mumbai Node", x: 90, y: 180, desc: "Mumbai coastal anomalies feed. Status: Rain watch." }
                      ].map((node) => (
                        <g 
                          key={node.name} 
                          transform={`translate(${node.x}, ${node.y})`}
                          className="cursor-pointer group"
                          onClick={() => setActiveGlobeNode(node)}
                        >
                          <circle r="6" fill="#047857" className="animate-ping opacity-75" />
                          <circle r="4" fill="#34d399" />
                          <text x="8" y="4" className="text-[8px] font-mono fill-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            {node.name}
                          </text>
                        </g>
                      ))}
                    </svg>

                    {/* Active Globe Node Details HUD overlay */}
                    <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-emerald-500/40 rounded-xl p-3 text-[10px] font-mono text-emerald-400">
                      {activeGlobeNode ? (
                        <div>
                          <strong className="text-emerald-300 uppercase block">{activeGlobeNode.name} Active</strong>
                          <p className="mt-0.5 text-[9px] text-slate-300">{activeGlobeNode.desc}</p>
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-400">Hover or click glowing nodes on the wireframe grid to establish data link.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Scrolling Live Telemetry Terminal */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="p-6 h-[446px] flex flex-col border border-emerald-200/60 rounded-2xl bg-white shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  <span>Sentinel Stream Logs</span>
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </div>

              {/* Terminal Logs Box */}
              <div className="flex-1 overflow-y-auto font-mono text-[10px] text-emerald-800 space-y-2 bg-emerald-50/30 border border-emerald-200/40 rounded-xl p-3 custom-scrollbar">
                {liveLogs.length === 0 ? (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                    <span>Awaiting incoming data packages...</span>
                  </div>
                ) : (
                  liveLogs.map((log, idx) => (
                    <div key={idx} className="leading-normal border-b border-emerald-200/20 pb-1">
                      <span className="text-emerald-500 font-bold">&gt;&gt;</span> {log}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* 3. INTERACTIVE MICRO-GRID SENSOR LAYER EXPLORER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Micro Grid Select & Grid Matrix */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <Card className="p-6 border border-emerald-200/60 rounded-2xl bg-white shadow-sm h-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Sentinel Grid Overlay</h3>
                  <p className="text-xs text-slate-500 font-medium">Click on any sensor cell to pull structural telemetry.</p>
                </div>
                
                {/* Region Selector */}
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-3 py-1.5 border border-emerald-200 bg-white rounded-lg text-xs font-mono font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                >
                  {["Delhi-NCR", "Mumbai-MMR", "Bangalore", "Kolkata"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* 3x3 Grid of Sensor cells */}
              {microGrid ? (
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  {microGrid.cells.map((cell, idx) => {
                    const isSelected = selectedCell && selectedCell.latitude === cell.latitude && selectedCell.longitude === cell.longitude;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedCell(cell)}
                        className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-2 font-mono transition-all duration-300 ${
                          isSelected
                            ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/10 scale-105"
                            : "bg-emerald-50/30 border-emerald-200/60 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-800"
                        }`}
                      >
                        <span className="text-[10px] opacity-75">CELL-{idx+1}</span>
                        <span className="text-xs font-bold mt-1">[{cell.latitude}, {cell.longitude}]</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              )}
            </Card>
          </motion.div>

          {/* Cell Details Display Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-6 border border-emerald-200/60 rounded-2xl bg-white shadow-sm h-full flex flex-col">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-widest font-bold">Cell Telemetry Details</span>
                {selectedCell && (
                  <h4 className="text-lg font-bold text-slate-800 mt-1 font-mono">
                    Sensor [{selectedCell.latitude}, {selectedCell.longitude}]
                  </h4>
                )}
              </div>

              {selectedCell ? (
                <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-center bg-emerald-50/30 border border-emerald-100 p-2.5 rounded-xl text-xs font-mono text-slate-700">
                    <span>Solar Irradiance:</span>
                    <span className="font-bold text-emerald-800">{selectedCell.solar_irradiance} kWh/m²</span>
                  </div>
                  <div className="flex justify-between items-center bg-emerald-50/30 border border-emerald-100 p-2.5 rounded-xl text-xs font-mono text-slate-700">
                    <span>Wind Power Density:</span>
                    <span className="font-bold text-emerald-800">{selectedCell.wind_density} W/m²</span>
                  </div>
                  <div className="flex justify-between items-center bg-emerald-50/30 border border-emerald-100 p-2.5 rounded-xl text-xs font-mono text-slate-700">
                    <span>Canopy Density Index:</span>
                    <span className="font-bold text-emerald-800">{(selectedCell.forest_canopy_index * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-emerald-50/30 border border-emerald-100 p-2.5 rounded-xl text-xs font-mono text-slate-700">
                    <span>Soil Moisture:</span>
                    <span className="font-bold text-emerald-800">{selectedCell.soil_moisture_pct}%</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                  Select a cell to view analytics.
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* 4. DUAL SECTION: ACTIVE REGIONAL ANOMALIES + 2050 PATHWAYS FORECASTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Anomalies and Mitigation Protocols */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <Card className="p-6 border border-emerald-200/60 rounded-2xl bg-white shadow-sm h-full flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-emerald-600" />
                <span>Active Sentinel Warnings</span>
              </h3>

              <div className="space-y-4 overflow-y-auto max-h-[360px] pr-2 custom-scrollbar">
                {anomalies.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">{item.region_name}</span>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                        item.sentinel_alert_status === "CRITICAL"
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "bg-amber-50 border-amber-200 text-amber-700"
                      }`}>
                        {item.sentinel_alert_status}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-semibold">{item.anomaly_type}</span>
                      <span className="font-mono text-emerald-700 font-bold">Severity: {item.severity_index}/10</span>
                    </div>
                    <div className="text-[10px] text-slate-600 bg-white border border-emerald-100 p-2 rounded-lg leading-normal">
                      <strong className="text-emerald-700 font-bold uppercase tracking-wide block mb-1">Response Protocol:</strong>
                      {item.mitigation_protocol}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* 2050 Projections Double Exp Smoothing Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <Card className="p-6 border border-emerald-200/60 rounded-2xl bg-white shadow-sm h-full flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                    <BarChart2 className="w-5 h-5 text-emerald-600" />
                    <span>Neural Forecasting Pathways (2050)</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Holt double-exponential models smoothing historical noise.</p>
                </div>
                
                {/* Active Chart Series Selector */}
                <select
                  value={forecastTab}
                  onChange={(e) => setForecastTab(e.target.value)}
                  className="px-3 py-1.5 border border-emerald-200 bg-white rounded-lg text-xs font-mono font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                >
                  {forecastData.map((f) => (
                    <option key={f.indicator} value={f.indicator}>{f.indicator}</option>
                  ))}
                </select>
              </div>

              {/* Chart */}
              <div className="h-72 flex-1">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
                      <defs>
                        <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="10%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="90%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="6 6" stroke="rgba(0,0,0,0.06)" />
                      <XAxis stroke="#6b7280" dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: 12,
                          boxShadow: "0 4px 15px rgba(16,185,129,0.05)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#valueGrad)"
                        dot={{ r: 0 }}
                        name="Projected Value"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

        </div>

      </div>

      <Footer />
    </div>
  );
}
