import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Brain, MessageSquare, Beaker, TrendingUp, ShieldAlert, 
  Terminal, Zap, Leaf, Flame, HelpCircle, Activity 
} from 'lucide-react';
import Footer from '@/components/Footer';

const HomePage = () => {
  // --- 1. State for Interactive Calculator ---
  const [calcType, setCalcType] = useState('Solar');
  const [calcQty, setCalcQty] = useState(50);
  const [calcResult, setCalcResult] = useState({ offset: 0, savings: 0 });

  useEffect(() => {
    const factor = { Solar: 850, Wind: 950, Afforestation: 22 }[calcType] || 100;
    const offset = calcQty * factor;
    const savings = offset * 400; // shadow carbon tax: Rs 400/ton
    setCalcResult({ offset, savings });
  }, [calcType, calcQty]);

  // --- 2. State for Diagnostic Terminal ---
  const [terminalLogs, setTerminalLogs] = useState([]);
  const fullLogs = [
    "Establishing handshake with ClimateX Sentinel Node...",
    "Query Dispatcher: ONLINE (Inference models loaded)",
    "Live Telemetry Stream: CONNECTED to ws://localhost:8000/api/v1/live/ws",
    "History Ledger SQLite: INITIALIZED [climatex_history.db]",
    "Regional anomaly detection maps active across 4 grids.",
    "STATUS: SECURE. COMMAND INTERFACE READY."
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullLogs.length) {
        setTerminalLogs(prev => [...prev, fullLogs[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // --- 3. State for Climate Clock ---
  const [clockTime, setClockTime] = useState({
    years: 6, days: 302, hours: 14, minutes: 22, seconds: 15, ms: 231
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setClockTime(prev => {
        let nextMs = prev.ms - 17;
        let nextSec = prev.seconds;
        let nextMin = prev.minutes;
        let nextHr = prev.hours;
        
        if (nextMs < 0) {
          nextMs = 999;
          nextSec--;
        }
        if (nextSec < 0) {
          nextSec = 59;
          nextMin--;
        }
        if (nextMin < 0) {
          nextMin = 59;
          nextHr--;
        }
        if (nextHr < 0) {
          nextHr = 23;
        }
        return { ...prev, ms: nextMs, seconds: nextSec, minutes: nextMin, hours: nextHr };
      });
    }, 17);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: TrendingUp,
      title: 'Climate Dashboard',
      description: 'Real-time weather, emissions, and environmental metrics across India.',
      color: 'from-emerald-400 to-emerald-500',
      link: '/dashboard',
    },
    {
      icon: Brain,
      title: 'Causal Simulator',
      description: 'Model climate-policy cause–effect pathways using AI-driven inference.',
      color: 'from-emerald-500 to-emerald-600',
      link: '/causal-simulator',
    },
    {
      icon: MessageSquare,
      title: 'Sentiment Tracker',
      description: 'Analyze India’s public sentiment on climate policy with live AI monitoring.',
      color: 'from-emerald-600 to-emerald-400',
      link: '/sentiment-tracker',
    },
    {
      icon: Beaker,
      title: 'Policy Lab',
      description: 'Adaptive AI-generated recommendations for evidence-backed decisions.',
      color: 'from-emerald-400 to-teal-500',
      link: '/policy-lab',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-700 font-sans selection:bg-emerald-100 selection:text-emerald-800">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden bg-white">
        {/* Background Video */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-100 z-0"
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>

        {/* Ambient Light Green/White Overlay - Only bottom transitions to white */}
        <div className="absolute inset-0 bg-gradient-to-t from-white from-5% via-white/5 via-15% to-transparent z-1" />

        {/* Pulsing Light Green Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#a7f3d0_1px,transparent_1px),linear-gradient(to_bottom,#a7f3d0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-10 z-2" />

        <div className="relative z-10 px-6 max-w-5xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="mb-4 px-4 py-1.5 rounded-full border border-emerald-300 bg-emerald-100/90 backdrop-blur-sm flex items-center gap-2 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-widest">
              India Climate Sentinel Network Active
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
          >
            Climate<span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-300 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">X</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8 }}
            className="text-lg md:text-xl text-slate-100 max-w-3xl mx-auto leading-relaxed mb-10 font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          >
            A next-generation environmental command intelligence suite mapping causal policy logic, 
            stakeholder agentics, and real-time state telemetry across India.
          </motion.p>

          {/* Diagnostics Console Window */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-full max-w-2xl bg-white/95 border border-emerald-200 rounded-xl overflow-hidden shadow-md shadow-emerald-500/5 backdrop-blur-sm"
          >
            <div className="bg-emerald-100 border-b border-emerald-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-mono text-emerald-800 font-bold">system_diagnostics.sh</span>
              </div>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-100" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-100" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
            </div>
            <div className="p-4 min-h-[140px] text-left font-mono text-xs text-emerald-700 space-y-1.5">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <span className="text-emerald-500 select-none font-bold">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
              <span className="inline-block w-1.5 h-4 bg-emerald-400 ml-1 animate-ping" />
            </div>
          </motion.div>

          {/* Scroll Down Arrow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: 1 }}
            className="mt-12 flex flex-col items-center gap-1 cursor-pointer"
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
          >
            <span className="text-xs text-emerald-700 uppercase tracking-widest font-mono font-bold">Initialize Command Systems</span>
            <div className="w-1.5 h-6 rounded-full bg-emerald-100 relative overflow-hidden">
              <div className="w-full h-1/2 bg-emerald-400 absolute top-0 animate-bounce" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. CORE MODULES SECTION (White theme, lighter green grids) */}
      <section className="py-24 relative bg-white border-t border-emerald-200/60">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-4">
              Premium Intelligence Core Modules
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
              Interactive systems deployed to simulate policy effects, analyze state telemetry, and generate forecasts.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="group relative"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-300 to-emerald-400 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
                  
                  <Link to={feature.link}>
                    <div className="relative p-6 h-full flex flex-col gap-4 cursor-pointer rounded-2xl bg-emerald-100/10 border border-emerald-200 shadow-sm hover:border-emerald-400/80 transition duration-300">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-emerald-500" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-600 transition">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        {feature.description}
                      </p>
                      <div className="mt-auto pt-2 flex items-center gap-1 text-xs font-mono text-emerald-500 font-bold group-hover:translate-x-1 transition duration-300">
                        <span>LAUNCH INSTANCE</span>
                        <span>&rarr;</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE CORNER */}
      <section className="py-24 relative bg-white border-t border-b border-emerald-200/50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Climate Countdown Clock */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col justify-center p-8 rounded-2xl bg-emerald-100/20 border border-emerald-200 shadow-sm backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-mono text-emerald-600 uppercase tracking-widest font-bold">Active Sentinel Thresholds</span>
            </div>
            
            <h3 className="text-3xl font-extrabold text-slate-800 mb-2">Climate Urgency countdown</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
              Ticking countdown estimation towards the global temperature threshold increase limit (+1.5C) calculated based on real-time greenhouse output scales.
            </p>

            {/* Light themed digital clock with lighter green boxes */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center mb-6">
              {[
                { val: clockTime.years, label: 'YEARS' },
                { val: clockTime.days, label: 'DAYS' },
                { val: clockTime.hours, label: 'HOURS' },
                { val: clockTime.minutes, label: 'MINUTES' },
                { val: clockTime.seconds, label: 'SECONDS' }
              ].map((timeUnit, idx) => (
                <div key={idx} className="bg-white border border-emerald-200 rounded-xl p-3 shadow-sm">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600">
                    {String(timeUnit.val).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-emerald-500/80 font-mono tracking-wider mt-1">{timeUnit.label}</div>
                </div>
              ))}
              <div className="bg-white border border-emerald-200 rounded-xl p-3 flex flex-col justify-center shadow-sm">
                <div className="text-lg font-bold font-mono text-emerald-400">
                  .{String(clockTime.ms).padStart(3, '0')}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono tracking-wider mt-1">MS</div>
              </div>
            </div>

            <div className="bg-white border border-emerald-200 rounded-lg p-3 flex justify-between items-center text-xs font-mono text-emerald-600 font-bold">
              <span>Carbon Budget Left:</span>
              <span className="font-bold text-emerald-500">286.32 GT (IPCC)</span>
            </div>
          </motion.div>

          {/* Interactive Mini Carbon Offset Ledger */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-emerald-100/20 border border-emerald-200 shadow-sm backdrop-blur-sm flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-mono text-emerald-600 uppercase tracking-widest font-bold">Real-Time Offset Estimator</span>
            </div>
            
            <h3 className="text-3xl font-extrabold text-slate-800 mb-2">Estimate Project Yields</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed font-medium">
              Select an environmental project type and slide quantity to instantly estimate carbon offset tonnage and virtual carbon tax savings.
            </p>

            {/* Selector buttons */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {['Solar', 'Wind', 'Afforestation'].map((type) => (
                <button
                  key={type}
                  onClick={() => setCalcType(type)}
                  className={`py-2 rounded-lg text-xs font-mono transition-all duration-300 border font-bold ${
                    calcType === type 
                      ? 'bg-emerald-200 border-emerald-300 text-emerald-800 shadow-sm' 
                      : 'bg-white border-emerald-200 hover:border-emerald-300 text-slate-500'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Slider */}
            <div className="mb-8">
              <div className="flex justify-between text-xs font-mono text-slate-600 mb-2 font-semibold">
                <span>Project Quantity:</span>
                <span className="text-emerald-500 font-bold">{calcQty} {calcType === 'Afforestation' ? 'Hectares' : 'MW'}</span>
              </div>
              <input
                type="range"
                min="1"
                max={calcType === 'Afforestation' ? '1000' : '200'}
                value={calcQty}
                onChange={(e) => setCalcQty(Number(e.target.value))}
                className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Calculator Display Panel */}
            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="bg-white border border-emerald-200 p-4 rounded-xl shadow-sm">
                <div className="text-xs text-slate-500 font-mono mb-1 font-semibold">Annual CO2 Offset</div>
                <div className="text-xl font-bold text-emerald-600 font-mono">
                  {calcResult.offset.toLocaleString()} <span className="text-xs">tons</span>
                </div>
              </div>
              <div className="bg-white border border-emerald-200 p-4 rounded-xl shadow-sm">
                <div className="text-xs text-slate-500 font-mono mb-1 font-semibold">Tax Savings (Shadow)</div>
                <div className="text-xl font-bold text-emerald-600 font-mono">
                  ₹{(calcResult.savings / 100000).toFixed(1)}L <span className="text-xs">INR</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. REAL-TIME REGIONAL ANOMALY TICKER */}
      <section className="py-16 relative bg-emerald-100/30 overflow-hidden border-b border-emerald-200/50 shadow-sm">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />
        
        <div className="max-w-7xl mx-auto px-6 mb-8 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-emerald-500 animate-pulse" />
          <span className="text-xs font-mono text-emerald-600 uppercase tracking-widest font-extrabold">Active Sentinel Alerts Ticker</span>
        </div>

        {/* Animated Marquee of Alerts */}
        <div className="flex gap-8 animate-[marquee_25s_linear_infinite] whitespace-nowrap">
          {[
            { region: "Indo-Gangetic Plain", alert: "AQI Crisis: PM2.5 Exceeds 450", severity: "CRITICAL" },
            { region: "Thar Desert", alert: "Extreme Heat Dome: High temp 47.8°C", severity: "WARNING" },
            { region: "Western Ghats", alert: "Landslide and flood watch active", severity: "STABLE" },
            { region: "Marathwada", alert: "Precipitation Deficit: Moisture low", severity: "WARNING" }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-white border border-emerald-200"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${
                item.severity === "CRITICAL" ? "bg-red-400 animate-pulse" : (item.severity === "WARNING" ? "bg-amber-400" : "bg-emerald-400")
              }`} />
              <span className="text-xs font-mono text-emerald-500 font-bold uppercase">{item.region}:</span>
              <span className="text-xs text-slate-600 font-sans">{item.alert}</span>
            </div>
          ))}
          {/* Duplicate to create infinite loop */}
          {[
            { region: "Indo-Gangetic Plain", alert: "AQI Crisis: PM2.5 Exceeds 450", severity: "CRITICAL" },
            { region: "Thar Desert", alert: "Extreme Heat Dome: High temp 47.8°C", severity: "WARNING" },
            { region: "Western Ghats", alert: "Landslide and flood watch active", severity: "STABLE" },
            { region: "Marathwada", alert: "Precipitation Deficit: Moisture low", severity: "WARNING" }
          ].map((item, idx) => (
            <div 
              key={idx + 4} 
              className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-white border border-emerald-200"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${
                item.severity === "CRITICAL" ? "bg-red-400 animate-pulse" : (item.severity === "WARNING" ? "bg-amber-400" : "bg-emerald-400")
              }`} />
              <span className="text-xs font-mono text-emerald-500 font-bold uppercase">{item.region}:</span>
              <span className="text-xs text-slate-600 font-sans">{item.alert}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <div className="bg-white border-t border-emerald-100">
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;
