import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Activity, Search, ShieldAlert, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const location = useLocation();

  // Mock telemetry data updates
  const [telemetry, setTelemetry] = useState({
    delhiAqi: 184.2,
    mumbaiAqi: 74.5,
    solarPowerKw: 485.2,
    windPowerKw: 112.4
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        delhiAqi: round(prev.delhiAqi + randomOffset(-2, 3), 1),
        mumbaiAqi: round(prev.mumbaiAqi + randomOffset(-1, 2), 1),
        solarPowerKw: round(prev.solarPowerKw + randomOffset(-10, 15), 1),
        windPowerKw: round(prev.windPowerKw + randomOffset(-5, 8), 1)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const round = (val, dec) => Number(val.toFixed(dec));
  const randomOffset = (min, max) => Math.random() * (max - min) + min;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    setTimeout(() => {
      const q = searchQuery.toLowerCase();
      let subsystem = "Policy Recommender";
      let description = "Finds adaptive AI recommendations using government documents.";
      let path = "/policy-lab";

      if (anyMatch(q, ["cause", "causal", "counterfactual", "impact"])) {
        subsystem = "Causal Simulator";
        description = "Analyze counterfactual effects on air quality and economic metrics.";
        path = "/causal-simulator";
      } else if (anyMatch(q, ["forecast", "future", "predict", "anomaly"])) {
        subsystem = "Climate Dashboard";
        description = "View long-term climate projections and micro-grid sensor layers.";
        path = "/dashboard";
      } else if (anyMatch(q, ["sentiment", "public", "opinion", "tweet"])) {
        subsystem = "Sentiment Tracker";
        description = "Monitor state-by-state public sentiment and climate news trends.";
        path = "/sentiment-tracker";
      }

      setSearchResult({ subsystem, description, path });
      setIsSearching(false);
    }, 800);
  };

  const anyMatch = (str, keywords) => keywords.some(k => str.includes(k));

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Causal Simulator', path: '/causal-simulator' },
    { name: 'Sentiment Tracker', path: '/sentiment-tracker' },
    { name: 'Policy Lab', path: '/policy-lab' },
    { name: 'About', path: '/about' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed top-0 left-0 right-0 z-[999] bg-emerald-100/95 border-b border-emerald-200/80 backdrop-blur-md shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left Brand Logo */}
            <Link
              to="/"
              className="flex items-center text-slate-800 text-2xl font-extrabold tracking-tight hover:text-emerald-700 transition-colors"
            >
              <img 
                src="/logo.png" 
                alt="ClimateX Logo" 
                className="h-10 w-10 mr-2 border border-emerald-200 rounded-lg p-0.5 bg-white shadow-sm" 
              />
              Climate<span className="text-emerald-600">X</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    location.pathname === link.path
                      ? 'bg-white text-emerald-800 border border-emerald-200 shadow-sm'
                      : 'text-slate-700 hover:bg-emerald-200/50 hover:text-slate-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Right Action Buttons */}
            <div className="hidden md:flex items-center space-x-2">
              {/* Telemetry Indicator Toggle */}
              <button
                onClick={() => {
                  setIsTelemetryOpen(!isTelemetryOpen);
                  setIsSearchOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all duration-300 ${
                  isTelemetryOpen 
                    ? 'bg-white border-emerald-300 text-emerald-800 shadow-sm' 
                    : 'bg-emerald-200/60 border-emerald-200/60 text-emerald-700 hover:bg-emerald-200/50'
                }`}
              >
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>TELEMETRY ONLINE</span>
              </button>

              {/* Search Toggle */}
              <button
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  setIsTelemetryOpen(false);
                }}
                className={`p-2 rounded-lg border transition-all ${
                  isSearchOpen 
                    ? 'bg-white border-emerald-300 text-emerald-700 shadow-sm' 
                    : 'bg-emerald-200/60 border-emerald-200/60 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  setIsMobileMenuOpen(false);
                }}
                className="p-2 rounded-lg border bg-emerald-200/60 border-emerald-200/60 text-emerald-705"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-emerald-200 text-slate-800 border border-emerald-200"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* 1. SLIDING TELEMETRY PANEL DRAWER */}
        <AnimatePresence>
          {isTelemetryOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-100/40 border-t border-b border-emerald-200/60 overflow-hidden shadow-inner"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-emerald-200 rounded-xl p-3 shadow-sm">
                  <div className="text-[10px] text-slate-500 font-mono tracking-wider">CPCB DELHI AQI</div>
                  <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{telemetry.delhiAqi}</div>
                </div>
                <div className="bg-white border border-emerald-200 rounded-xl p-3 shadow-sm">
                  <div className="text-[10px] text-slate-500 font-mono tracking-wider">CPCB MUMBAI AQI</div>
                  <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{telemetry.mumbaiAqi}</div>
                </div>
                <div className="bg-white border border-emerald-200 rounded-xl p-3 shadow-sm">
                  <div className="text-[10px] text-slate-500 font-mono tracking-wider">SOLAR GENERATION</div>
                  <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{telemetry.solarPowerKw} kW</div>
                </div>
                <div className="bg-white border border-emerald-200 rounded-xl p-3 shadow-sm">
                  <div className="text-[10px] text-slate-500 font-mono tracking-wider">WIND GRID ACTIVE</div>
                  <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{telemetry.windPowerKw} kW</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. SLIDING SEARCH PANEL DRAWER */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-100 border-t border-b border-emerald-200 overflow-hidden shadow-inner"
            >
              <div className="max-w-3xl mx-auto px-4 py-6">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type natural query (e.g. 'forecast 2030' or 'cause of policy')"
                    className="flex-1 px-4 py-2 border border-emerald-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg text-sm flex items-center gap-1 shadow-sm"
                  >
                    <span>Dispatch</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Search Results Display */}
                <AnimatePresence mode="wait">
                  {isSearching && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-mono text-emerald-600">
                      <Activity className="w-3.5 h-3.5 animate-spin" />
                      <span>Classifying query vectors...</span>
                    </div>
                  )}
                  {searchResult && !isSearching && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-white border border-emerald-200 rounded-xl shadow-sm"
                    >
                      <div className="text-xs font-mono text-emerald-600 uppercase tracking-widest font-bold">Subsystem Inferred</div>
                      <h4 className="text-lg font-bold text-slate-800 mt-1">{searchResult.subsystem}</h4>
                      <p className="text-xs text-slate-600 mt-1">{searchResult.description}</p>
                      
                      <Link
                        to={searchResult.path}
                        onClick={() => setIsSearchOpen(false)}
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800 font-mono"
                      >
                        <span>GOTO INSTANCE</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. MOBILE MENU PANEL */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-emerald-100 border-t border-emerald-200/60"
            >
              <div className="px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-base font-bold transition-all duration-200 ${
                      location.pathname === link.path
                        ? 'bg-white text-emerald-800 border border-emerald-200'
                        : 'text-slate-700 hover:bg-emerald-200/50'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
      {/* Spacer to avoid content cutoff */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;