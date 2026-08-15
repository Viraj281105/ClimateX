import { Cloud, Github, Twitter, Linkedin, Radio, CheckCircle, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  // Dynamic Latencies for Mock Node Monitor
  const [latencies, setLatencies] = useState({
    imd: 18,
    cpcb: 22,
    database: 9
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLatencies({
        imd: Math.floor(15 + Math.random() * 8),
        cpcb: Math.floor(20 + Math.random() * 12),
        database: Math.floor(7 + Math.random() * 6)
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-emerald-100 border-t border-emerald-200 text-slate-700 mt-20 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Left Column: Brand & Sentinel Node Latency */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shadow-sm">
                <Cloud className="w-6 h-6 text-emerald-500" />
              </div>
              <span className="text-xl font-bold text-slate-800">Climate<span className="text-emerald-500">X</span></span>
            </div>

            <p className="text-slate-600 text-sm max-w-sm font-medium">
              Real-Time Climate Command & Analytics Suite for India. 
              Empowering agencies and researchers with causal policy modeling and live regional monitoring.
            </p>

            {/* Health Monitor */}
            <div className="p-4 bg-white border border-emerald-200 rounded-xl max-w-sm space-y-2 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
                <span>SENTINEL NODE MONITOR</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-500">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>IMD Server</span>
                  </div>
                  <div className="font-bold text-emerald-700 mt-0.5">{latencies.imd}ms</div>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>CPCB Core</span>
                  </div>
                  <div className="font-bold text-emerald-700 mt-0.5">{latencies.cpcb}ms</div>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Ledger DB</span>
                  </div>
                  <div className="font-bold text-emerald-700 mt-0.5">{latencies.database}ms</div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column: Resource Directories */}
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase mb-4">Core Systems</h3>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/dashboard" className="text-slate-600 hover:text-emerald-600 transition-colors">
                  Telemetry Dashboard
                </Link>
              </li>
              <li>
                <Link to="/causal-simulator" className="text-slate-600 hover:text-emerald-600 transition-colors">
                  Causal DAG Engine
                </Link>
              </li>
              <li>
                <Link to="/sentiment-tracker" className="text-slate-600 hover:text-emerald-600 transition-colors">
                  Sentiment Analyzer
                </Link>
              </li>
              <li>
                <Link to="/policy-lab" className="text-slate-600 hover:text-emerald-600 transition-colors">
                  Policy Lab RAG
                </Link>
              </li>
            </ul>
          </div>

          {/* Right Column: Alerts Subscription & Connect */}
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase mb-3">Sentinel Alerts</h3>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Email for policy alerts"
                  className="w-full px-3 py-1.5 border border-emerald-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-medium"
                />
                <button className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition shadow-sm">
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase mb-3">Connect</h3>
              <div className="flex space-x-2">
                <a className="w-8 h-8 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100/50 flex items-center justify-center transition-all duration-300">
                  <Github className="w-4 h-4 text-slate-600" />
                </a>
                <a className="w-8 h-8 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100/50 flex items-center justify-center transition-all duration-300">
                  <Twitter className="w-4 h-4 text-slate-600" />
                </a>
                <a className="w-8 h-8 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100/50 flex items-center justify-center transition-all duration-300">
                  <Linkedin className="w-4 h-4 text-slate-600" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-emerald-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-slate-600 text-xs font-medium">
              © 2026 ClimateX | Built for PCCOE IGC Hackathon
            </p>

            <div className="flex space-x-6 text-xs font-semibold">
              <a className="text-slate-600 hover:text-emerald-700 transition-colors">
                Privacy Policy
              </a>
              <a className="text-slate-600 hover:text-emerald-700 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
