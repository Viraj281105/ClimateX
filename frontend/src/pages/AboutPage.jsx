// src/pages/AboutPage.jsx
import React from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  Users,
  Target,
  Zap,
  Code,
  Globe,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Footer from "@/components/Footer";

const HERO_IMAGE = "/mnt/data/6764ca62-3111-43da-ba19-e7a40ffe9cf2.png";

const team = [
  { name: "Viraj Jadhao", initials: "VJ", bio: "Full-stack dev focused on AI integration and system reliability." },
  { name: "Yash Doke", initials: "YD", bio: "Generative AI specialist — prototype to production." },
  { name: "Bhumi Sirvi", initials: "BS", bio: "UI/UX designer — clarity-first interfaces and accessible flows." },
  { name: "Lakshya Veer Rana", initials: "LVR", bio: "Frontend craftsman — performance and pixel polish." },
  { name: "Harsh Jain", initials: "HJ", bio: "Data engineer — pipelines, quality, and observability." },
];

const values = [
  { icon: Target, title: "Evidence-driven", text: "Every insight is grounded in data, not guesswork." },
  { icon: Zap, title: "Realtime-first", text: "Timely signals shape faster, sharper decisions." },
  { icon: Users, title: "People-centered", text: "Public sentiment forms the backbone of our policy logic." },
];

const stack = [
  { icon: Code, label: "Python, FastAPI, PyTorch" },
  { icon: Globe, label: "React, Tailwind, Recharts, Leaflet" },
  { icon: Sparkles, label: "Ollama, HuggingFace, SentenceTransformers" },
  { icon: CheckCircle, label: "MongoDB + Vector Search" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay },
});

export default function AboutPage() {
  return (
    <div
      className="min-h-screen pb-12 text-gray-900"
      style={{ backgroundColor: "#CCF0B9" }}
    >
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        aria-label="About ClimateX hero"
        style={{ minHeight: "50vh" }}
      >
        <img
          src={HERO_IMAGE}
          alt="Climate hero"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.6)", transform: "scale(1.05)" }}
        />

        {/* NEW: contrast overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(19,69,27,0.45), rgba(0,0,0,0.45))",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 flex flex-col justify-center h-full">
          <motion.div {...fadeUp(0)} className="max-w-3xl">
            <div className="inline-flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-black/20"
                style={{
                  background: "linear-gradient(135deg,#10b981,#06b6d4)",
                }}
              >
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-100/90">
                ClimateX — Real-Time Climate Intelligence
              </span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight"
              style={{
                color: "white",
                textShadow: "0 2px 14px rgba(0,0,0,0.55)",
              }}
            >
              Built for better climate policy —
              <br />
              <span style={{ color: "#CCF0B9" }}>evidence, clarity, action.</span>
            </h1>

            <p
              className="text-lg text-gray-100/90 max-w-2xl"
              style={{ textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}
            >
              We merge causal AI, live environmental data, and public sentiment
              into a single decision layer — empowering policymakers to shift
              from debate to measurable outcomes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 -mt-14 relative z-20">
        {/* Top cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[ 
            { title: "Our Story", text: "ClimateX began as a hackathon project and matured into a lightweight, audit-friendly climate intelligence engine — built for real-world policy adoption." },
            { title: "Mission", text: "Equip institutions with timely evidence, sharper insights, and practical pathways to reduce pollution and accelerate sustainability." },
            { title: "How we work", text: "Ingestion → semantic discovery → sentiment + causal scoring → targeted recommendations. Transparent, modular, and reproducible." },
          ].map((item, idx) => (
            <motion.div key={idx} {...fadeUp(0.05 + idx * 0.06)}>
              <Card
                className="p-6 shadow-md hover:shadow-xl transition-all duration-300 rounded-xl"
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  {item.title}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {item.text}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Values + Tech */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
          {/* VALUES */}
          <motion.div {...fadeUp(0.22)} className="lg:col-span-2">
            <Card
              className="p-6 shadow-md hover:shadow-xl transition-all duration-300 rounded-xl"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <h3 className="text-xl font-semibold mb-4" style={{ color: "#13451b" }}>
                What we value
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {values.map((v, i) => {
                  const Icon = v.icon;
                  return (
                    <div
                      key={i}
                      className="flex gap-3 items-start p-3 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow"
                        style={{
                          background: "linear-gradient(135deg,#10b981,#06b6d4)",
                        }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{v.title}</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{v.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <hr className="my-6 border-gray-200" />

              <h4 className="text-lg font-semibold mb-3 text-gray-900">
                Tech & Architecture
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stack.map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-md border border-gray-100 hover:border-emerald-400/40 hover:shadow transition"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(19,69,27,0.06)" }}
                      >
                        <Icon className="w-5 h-5 text-[#13451b]" />
                      </div>
                      <div className="text-sm text-gray-700">{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* IMPACT */}
          <motion.div {...fadeUp(0.28)}>
            <Card
              className="p-6 shadow-md hover:shadow-xl transition-all duration-300 rounded-xl"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <h3 className="text-xl font-semibold mb-4" style={{ color: "#13451b" }}>
                Impact & Vision
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                ClimateX shortens the climate-policy feedback loop — enabling governments,
                researchers, and NGOs to pilot interventions, measure outcomes, and scale
                what works.
              </p>

              <ul className="space-y-3 text-sm text-gray-700">
                <li>• Pilot-ready playbooks for focused interventions</li>
                <li>• Monitoring with reproducible transparency</li>
                <li>• Roadmap to measure societal-scale outcomes by 2030</li>
              </ul>
            </Card>
          </motion.div>
        </div>

        {/* TEAM */}
        <motion.div {...fadeUp(0.34)} className="mt-12">
          <h3 className="text-2xl font-bold mb-6 text-gray-900">The Team</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {team.map((m, i) => (
              <motion.div key={i} {...fadeUp(0.38 + i * 0.03)}>
                <Card
                  className="p-5 text-center shadow hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <div className="flex flex-col items-center">
                    <Avatar className="w-20 h-20 mb-4 bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-600/30">
                      <AvatarFallback className="text-white text-lg font-bold">
                        {m.initials}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="font-semibold text-gray-900">{m.name}</div>
                      <div className="text-sm text-gray-600 mt-2 leading-relaxed">
                        {m.bio}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div {...fadeUp(0.56)} className="mt-14">
          <Card
            className="p-6 flex flex-col md:flex-row items-center justify-between shadow-md hover:shadow-xl transition-all duration-300 rounded-xl"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                Want to help shape ClimateX?
              </h4>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                Whether it's code, domain insights, or datasets — contributors are welcome.
                Raise an issue or reach out to collaborate.
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex gap-3">
              <a
                href="https://github.com/Viraj281105/ClimateX"
                className="inline-flex items-center px-4 py-2 rounded-md font-medium transform hover:scale-[1.03] transition"
                style={{
                  background: "linear-gradient(135deg,#10b981,#06b6d4)",
                  color: "#fff",
                }}
              >
                View repo
              </a>
              <a
                href="mailto:viraj.jadhao28@gmail.com"
                className="inline-flex items-center px-4 py-2 rounded-md font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
              >
                Contact team
              </a>
            </div>
          </Card>
        </motion.div>
      </main>

      {/* FOOTER */}
      <div style={{ backgroundColor: "#CCF0B9" }}>
        <Footer />
      </div>
    </div>
  );
}
