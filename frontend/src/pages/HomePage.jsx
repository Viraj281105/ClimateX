import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Brain, MessageSquare, Beaker, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Footer from '@/components/Footer';

const HomePage = () => {
  const features = [
    {
      icon: TrendingUp,
      title: 'Climate Dashboard',
      description:
        'Real-time weather, emissions, and environmental metrics across India.',
      color: 'from-emerald-500 to-teal-500',
      link: '/dashboard',
    },
    {
      icon: Brain,
      title: 'Causal Simulator',
      description:
        'Model climate-policy cause–effect pathways using AI-driven inference.',
      color: 'from-cyan-500 to-blue-500',
      link: '/causal-simulator',
    },
    {
      icon: MessageSquare,
      title: 'Sentiment Tracker',
      description:
        'Analyze India’s public sentiment on climate policy with live AI monitoring.',
      color: 'from-amber-500 to-orange-500',
      link: '/sentiment-tracker',
    },
    {
      icon: Beaker,
      title: 'Policy Lab',
      description:
        'Adaptive AI-generated recommendations for evidence-backed decisions.',
      color: 'from-emerald-500 to-cyan-500',
      link: '/policy-lab',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">

      {/* HERO SECTION */}
      <section 
        className="relative min-h-screen flex items-center justify-center text-center text-white overflow-hidden pt-20"
        style={{ backgroundColor: '#000000' }}
      >
        {/* Background Video */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="hero-background-video opacity-[0.85]"
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>

        {/* ❌ Removed blur effect */}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 px-6 max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)]"
          >
            ClimateX  
            <div className="mt-2 text-emerald-400">
              Real-Time Climate Intelligence  
            </div>
            <span className="text-white">for India</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed"
          >
            Empowering policymakers with AI-driven insights, predictive modeling,  
            and intelligent climate analytics tailored for India’s unique ecosystem.
          </motion.p>

          {/* ❌ Removed CTA buttons entirely */}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section 
        className="py-20 relative" 
        style={{ backgroundColor: '#CCF0B9' }}
      >
        <div className="max-w-7xl mx-auto px-6">

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              Powerful Climate Tools
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              A comprehensive suite built to empower climate researchers,  
              policy designers, and innovators shaping India’s green future.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -6, scale: 1.03 }}
                  transition={{ delay: index * 0.08, duration: 0.45 }}
                  viewport={{ once: true }}
                >
                  <Link to={feature.link}>
                    <Card
                      className="p-6 h-full flex flex-col gap-4 cursor-pointer rounded-xl border border-emerald-900/40
                                 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-700/20"
                      style={{ backgroundColor: '#FFFFFF' }}
                    >
                      <div
                        className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} 
                                    flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900">
                        {feature.title}
                      </h3>

                      <p className="text-sm text-gray-700 leading-relaxed">
                        {feature.description}
                      </p>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div style={{ backgroundColor: '#CCF0B9' }}>
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;
