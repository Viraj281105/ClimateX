import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Droplets, Leaf, Thermometer, Loader2, AlertTriangle } from 'lucide-react';
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

// --- Imports needed for the WeatherMap ---
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaCloud,
  FaCloudRain,
  FaWind,
  FaTemperatureHigh,
  FaBolt,
  FaSnowflake,
} from "react-icons/fa";

// --- WeatherMap Component (Inlined) ---
const WeatherMap = () => {
  const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
  const puneCoords = [18.5204, 73.8567];
  const [activeLayer, setActiveLayer] = useState("temp_new");

  const layers = [
    { id: "temp_new", icon: <FaTemperatureHigh />, name: "Temperature" },
    { id: "clouds_new", icon: <FaCloud />, name: "Clouds" },
    { id: "precipitation_new", icon: <FaCloudRain />, name: "Precipitation" },
    { id: "wind_new", icon: <FaWind />, name: "Wind" },
    { id: "pressure_new", icon: <FaBolt />, name: "Pressure" },
    { id: "snow_new", icon: <FaSnowflake />, name: "Snow" },
  ];

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          // This toolbar sits *on top* of the map, so it should stay dark for contrast.
          backgroundColor: "rgba(2, 31, 2, 0.7)", 
          borderRadius: "12px",
          padding: "8px 12px",
          zIndex: 1000,
          display: "flex",
          gap: "12px",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            title={layer.name}
            style={{
              color: activeLayer === layer.id ? "#34d399" : "white",
              fontSize: "20px",
              background:
                activeLayer === layer.id
                  ? "rgba(16, 185, 129, 0.2)"
                  : "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: "8px",
              transition: "all 0.2s ease-in-out",
            }}
          >
            {layer.icon}
          </button>
        ))}
      </div>
      <MapContainer
        center={puneCoords}
        zoom={6}
        style={{
          height: "500px",
          width: "100%",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <TileLayer
          key={activeLayer}
          url={`https://tile.openweathermap.org/map/${activeLayer}/{z}/{x}/{y}.png?appid=${API_KEY}`}
          opacity={0.7}
        />
      </MapContainer>
    </div>
  );
};

// --- Helper Functions for API Data ---
const getAqiText = (aqi) => {
  switch (aqi) {
    case 1: return 'Good';
    case 2: return 'Fair';
    case 3: return 'Moderate';
    case 4: return 'Poor';
    case 5: return 'Very Poor';
    default: return 'N/A';
  }
};

const formatAqiTime = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

// --- Main Dashboard Page Component ---
const DashboardPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([]);
  const [aqiTrend, setAqiTrend] = useState([]);

  useEffect(() => {
    const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
    const lat = 18.5204;
    const lon = 73.8567;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      if (!API_KEY) {
        setError("Weather API key is missing. Please check your .env file.");
        setIsLoading(false);
        return;
      }

      try {
        const [weatherRes, aqiRes] = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
          fetch(`https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
        ]);

        if (!weatherRes.ok || !aqiRes.ok) {
          throw new Error("Failed to fetch data from OpenWeatherMap.");
        }

        const weatherData = await weatherRes.json();
        const aqiData = await aqiRes.json();

        // --- Process Data ---
        const currentTemp = weatherData.main.temp;
        const currentRain = weatherData.rain ? weatherData.rain['1h'] || 0 : 0;
        const currentAqiIndex = aqiData.list[0].main.aqi; 
        const currentAqiText = getAqiText(currentAqiIndex);
        
        const formattedAqiTrend = aqiData.list.map(item => ({
          date: formatAqiTime(item.dt),
          pm2_5: item.components.pm2_5, 
        }));
        
        // --- Set All State ---
        setAqiTrend(formattedAqiTrend);
        setStats([
          {
            icon: Thermometer,
            label: 'Temperature',
            value: `${currentTemp.toFixed(1)}°C`,
            trend: weatherData.weather[0].description,
            color: 'from-amber-500 to-orange-500',
            textColor: 'text-amber-400',
          },
          {
            icon: Cloud,
            label: 'Air Quality Index',
            value: currentAqiIndex,
            trend: currentAqiText,
            color: 'from-red-500 to-pink-500',
            textColor: 'text-red-400',
          },
          {
            icon: Droplets,
            label: 'Rainfall (1h)',
            value: `${currentRain} mm`,
            trend: 'Real-time',
            color: 'from-cyan-500 to-blue-500',
            textColor: 'text-cyan-400',
          },
          {
            icon: Leaf,
            label: 'CO₂ Levels (Mock)',
            value: '405 ppm',
            trend: '+5 ppm',
            color: 'from-emerald-500 to-teal-500',
            textColor: 'text-emerald-400',
          },
        ]);

      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    // 1. PAGE BACKGROUND: Set to #11c877
    <div className="min-h-screen pb-12" style={{ backgroundColor: '#11c877' }}>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header - Text is now dark to show on light bg */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 pt-24 text-gray-900"
        >
          <h1 className="text-4xl font-bold mb-3">
            India <span className="text-gradient-emerald" style={{color: '#021f02'}}>Climate Dashboard</span>
          </h1>
          <p className="text-lg text-gray-800">
            Real-time climate intelligence and environmental monitoring across
            India.
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
            {/* 2. CARD BACKGROUND: Set to #021f02 */}
            <Card className="p-6 h-full" style={{ backgroundColor: '#021f02' }}>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                {/* Text inside card is light again */}
                <span className="text-gradient-emerald">National Overview</span>
              </h2>
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
            {isLoading ? (
              <Card 
                className="p-6 h-[400px] flex justify-center items-center"
                style={{ backgroundColor: '#021f02' }} // 2. CARD BACKGROUND
              >
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              </Card>
            ) : error ? (
              <Card 
                className="p-6 h-[400px] flex flex-col justify-center items-center"
                style={{ backgroundColor: '#021f02' }} // 2. CARD BACKGROUND
              >
                <AlertTriangle className="w-8 h-8 mb-4 text-red-400" />
                <span className="text-center text-red-400">{error}</span>
              </Card>
            ) : (
              stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="p-6" style={{ backgroundColor: '#021f02' }}> {/* 2. CARD BACKGROUND */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Text inside card is light */}
                        <p className="text-sm text-muted-foreground mb-1">
                          {stat.label}
                        </p>
                        <p
                          className={`text-3xl font-bold ${stat.textColor} mb-1`}
                        >
                          {stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stat.trend}
                        </p>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </motion.div>
        </div>

        {/* AQI Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* 2. CARD BACKGROUND: Set to #021f02 */}
          <Card className="p-6" style={{ backgroundColor: '#021f02' }}>
            <h2 className="text-xl font-semibold mb-6">
              Air Quality (PM2.5){' '}
              <span className="text-gradient-emerald">Forecast</span>
            </h2>
            <div className="h-80">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                </div>
              ) : error ? (
                 <div className="flex justify-center items-center h-full text-red-400">
                  <AlertTriangle className="w-5 h-5 mr-2" /> {error}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={aqiTrend}>
                    <defs>
                      {/* Reverted gradient to emerald */}
                      <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--emerald))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--emerald))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)" // Light grid lines
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))" // Light text
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))" // Light text
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
                      dataKey="pm2_5"
                      name="PM2.5"
                      stroke="hsl(var(--emerald))" // Emerald line
                      strokeWidth={2}
                      fill="url(#aqiGradient)"
                      // The "ball" is now emerald
                      activeDot={{ 
                        r: 6, 
                        fill: 'hsl(var(--emerald))', 
                        stroke: '#FFF', 
                        strokeWidth: 2 
                      }}
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
};

export default DashboardPage;