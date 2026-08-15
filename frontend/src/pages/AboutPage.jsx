import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud, Users, Target, Zap, Code, Globe, Sparkles, CheckCircle,
  ChevronLeft, ChevronRight, Cpu, ArrowRight, ShieldCheck, Heart
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Footer from "@/components/Footer";

const HERO_IMAGE = "/mnt/data/6764ca62-3111-43da-ba19-e7a40ffe9cf2.png";

const team = [
  { 
    name: "Viraj Jadhao", 
    initials: "VJ", 
    role: "System Architect",
    bio: "Full-stack developer focused on RAG query dispatching pipelines, WebSocket telemetry streams, and database reliability.",
    skill: "Python, FastAPI, System Design"
  },
  { 
    name: "Yash Doke", 
    initials: "YD", 
    role: "AI Lead",
    bio: "Generative AI specialist designing local Ollama LLM pathways, fallback simulation parameters, and vector search embeddings.",
    skill: "PyTorch, LangChain, Ollama"
  },
  { 
    name: "Harsh Jain", 
    initials: "HJ", 
    role: "Data Engineer",
    bio: "Data pipelining architect scaling regional CPCB/IMD APIs, MongoDB vector stores, and real-time ledger observability.",
    skill: "MongoDB, ETL, SQLite"
  },
  { 
    name: "Bhumi Sirvi", 
    initials: "BS", 
    role: "Product Designer",
    bio: "UI/UX lead crafting clean design systems, accessible color stops, interactive charts, and intuitive data visualizations.",
    skill: "Figma, User Research, Accessibility"
  },
  { 
    name: "Lakshya Veer Rana", 
    initials: "LVR", 
    role: "Frontend Engineer",
    bio: "Frontend craftsman implementing interactive SVG DAG models, responsive telemetry tables, and smooth motion states.",
    skill: "React, TailwindCSS, Recharts"
  },
];

const values = [
  { icon: Target, title: "Evidence-driven", text: "Every insight is grounded in telemetry data, not guesswork." },
  { icon: Zap, title: "Realtime-first", text: "Timely satellite signals shape faster, sharper policy decisions." },
  { icon: Users, title: "People-centered", text: "Public sentiment forms the core of our causal stakeholder loops." },
];

const stack = [
  { 
    icon: Code, 
    label: "FastAPI & Python", 
    desc: "Serves all 14 intelligent hub endpoints, causal graphs, and Holt-Winters forecasts." 
  },
  { 
    icon: Globe, 
    label: "React & Tailwind", 
    desc: "Enables smooth micro-interactions, responsive SVG matrices, and chart dashboards." 
  },
  { 
    icon: Sparkles, 
    label: "Ollama & SentenceTransformers", 
    desc: "Powers prompt classification, vector embedding searches, and semantic queries." 
  },
  { 
    icon: CheckCircle, 
    label: "SQLite History Ledger", 
    desc: "Manages simulation storage and comparison tables locally with high security." 
  },
];

export default function AboutPage() {
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const [selectedTech, setSelectedTech] = useState(null);

  return (
    <div className="min-h-screen pb-12 bg-white text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-800">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden min-h-[50vh] flex items-center justify-center bg-emerald-950">
        <img
          src={HERO_IMAGE}
          alt="Climate hero"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
          style={{ transform: "scale(1.05)" }}
        />
        
        {/* Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 px-4 py-1.5 rounded-full border border-emerald-300/30 bg-emerald-950/70 backdrop-blur-sm flex items-center gap-2 shadow-sm"
          >
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-widest">
              ClimateX — Real-Time Climate Intelligence
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-extrabold mb-4 leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
          >
            Built for better climate policy —
            <br />
            <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">evidence, clarity, action.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-base sm:text-lg text-slate-100 max-w-2xl leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
          >
            We merge causal AI, live environmental data, and public sentiment into a single decision layer — empowering policymakers to shift from debate to measurable outcomes.
          </motion.p>
        </div>
      </section>

      {/* 2. MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 -mt-14 relative z-20 space-y-12">
        
        {/* Top Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[ 
            { title: "Our Story", text: "ClimateX began as a hackathon project and matured into a lightweight, audit-friendly climate intelligence engine — built for real-world policy adoption." },
            { title: "Mission Statement", text: "Equip institutions with timely evidence, sharper insights, and practical pathways to reduce pollution and accelerate sustainability." },
            { title: "Execution Pipeline", text: "Ingestion → semantic discovery → sentiment + causal scoring → targeted recommendations. Transparent, modular, and reproducible." },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="p-6 border border-emerald-200 bg-white shadow-sm hover:shadow-md transition h-full">
                <h3 className="text-lg font-bold text-slate-800 mb-2 font-mono uppercase tracking-wide">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {item.text}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* System Performance stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Active Regional Sensors", value: "142 Nodes", desc: "Aggregated ground and satellite feeds." },
            { label: "Causal Models Simulated", value: "12,400+", desc: "Holt double-exponential pathways." },
            { label: "Simulation Response Time", value: "1.2 Seconds", desc: "Vector classifications dispatch." }
          ].map((metric, i) => (
            <Card key={i} className="p-5 border border-emerald-200 bg-emerald-100/10 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{metric.label}</span>
              <span className="text-3xl font-extrabold text-emerald-700 font-mono mt-1">{metric.value}</span>
              <span className="text-[10px] text-slate-500 mt-1 font-semibold">{metric.desc}</span>
            </Card>
          ))}
        </div>

        {/* Values + Tech */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Values Grid */}
          <div className="lg:col-span-2">
            <Card className="p-6 border border-emerald-200 bg-white shadow-sm h-full space-y-6">
              <h3 className="text-lg font-bold text-slate-900 font-mono uppercase tracking-wider pb-2 border-b border-slate-100">
                Core Core Values
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {values.map((v, i) => {
                  const Icon = v.icon;
                  return (
                    <div key={i} className="p-3 border border-emerald-100/70 bg-emerald-100/10 rounded-xl space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shadow-sm">
                        <Icon className="w-4.5 h-4.5 text-emerald-600" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">{v.title}</p>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{v.text}</p>
                    </div>
                  );
                })}
              </div>

              <hr className="border-slate-100" />

              {/* Tech stack explorer */}
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-900 font-mono uppercase tracking-wider">
                  Technology Architecture
                </h4>
                <p className="text-xs text-slate-500 font-medium">Click on any module to view details.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stack.map((s, idx) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedTech(s)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50/50 transition text-left"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4.5 h-4.5 text-emerald-600" />
                        </div>
                        <div className="text-xs font-bold text-slate-700">{s.label}</div>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {selectedTech && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-4 rounded-xl bg-emerald-100/20 border border-emerald-200 text-xs text-slate-600 leading-relaxed font-semibold relative"
                    >
                      <button onClick={() => setSelectedTech(null)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                      <div className="font-bold text-emerald-700 font-mono mb-1">{selectedTech.label} Detail:</div>
                      {selectedTech.desc}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </div>

          {/* Impact Overview Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 border border-emerald-200 bg-white shadow-sm h-full flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-mono uppercase tracking-wider pb-2 border-b border-slate-100 mb-4">
                  Impact & Vision
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-4">
                  ClimateX shortens the climate-policy feedback loop — enabling governments, researchers, and NGOs to pilot interventions, measure outcomes, and scale what works.
                </p>
              </div>

              <div className="bg-emerald-50/20 border border-emerald-100 p-4 rounded-xl space-y-3 font-mono text-[10px] text-emerald-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Verified Ground telemetry checks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-500" />
                  <span>Holt-Winters double smoothing forecasts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>100% Hackathon Open-source codebase</span>
                </div>
              </div>
            </Card>
          </div>

        </div>

        {/* 3. INTERACTIVE TEAM CAROUSEL */}
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 font-mono uppercase tracking-wider">
              Project Development Team
            </h3>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setActiveTeamIndex(prev => (prev === 0 ? team.length - 1 : prev - 1))}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveTeamIndex(prev => (prev === team.length - 1 ? 0 : prev + 1))}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Carousel Slide */}
          <Card className="p-6 md:p-8 border border-emerald-200 bg-white shadow-sm flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-500/10 flex-shrink-0">
              <AvatarFallback className="text-white text-2xl font-bold">
                {team[activeTeamIndex].initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2 text-center md:text-left flex-1">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  {team[activeTeamIndex].role}
                </span>
                <h4 className="text-xl font-extrabold text-slate-800 mt-1">{team[activeTeamIndex].name}</h4>
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed font-semibold max-w-2xl">
                {team[activeTeamIndex].bio}
              </p>

              <div className="text-xs font-mono text-slate-600">
                <strong className="text-emerald-700">Skilled in:</strong> {team[activeTeamIndex].skill}
              </div>
            </div>
          </Card>
        </div>

        {/* CTA CARD */}
        <Card className="p-6 border border-emerald-200 bg-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-extrabold text-slate-800">
              Want to help shape ClimateX?
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
              Contributors are welcome. Access the repository online or reach out directly to collaborate.
            </p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <a
              href="https://github.com/Viraj281105/ClimateX"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-sm transform hover:scale-[1.02] transition"
            >
              <span>View Repository</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="mailto:viraj.jadhao28@gmail.com"
              className="inline-flex items-center px-4 py-2 border border-emerald-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Contact Team
            </a>
          </div>
        </Card>

      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
