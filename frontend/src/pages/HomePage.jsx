import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Brain, MessageSquare, Beaker, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Footer from '@/components/Footer';
import * as THREE from 'three';

const HomePage = () => {
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  useEffect(() => {
    if (window.VANTA && window.VANTA.TOPOLOGY && vantaRef.current) {
      vantaEffect.current = window.VANTA.TOPOLOGY({
        el: vantaRef.current,
        THREE: window.THREE || THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        // 1. FIXED: Changed from lime green to the theme's emerald color
        color: 0x10b981, 
        backgroundColor: 0x021f02, // Correct dark green background
        points: 12.0,
        maxDistance: 22.0,
        spacing: 18.0,
      });
    }

    return () => {
      try {
        if (
          vantaEffect.current &&
          typeof vantaEffect.current.destroy === 'function'
        ) {
          vantaEffect.current.destroy();
        }
      } catch (err) {
        console.warn('Vanta cleanup skipped safely:', err);
      } finally {
        vantaEffect.current = null;
      }
    };
  }, []);

  const features = [
    {
      icon: TrendingUp,
      title: 'Climate Dashboard',
      description:
        'Real-time weather & emissions tracking across India with interactive visualizations.',
      color: 'from-emerald-500 to-teal-500',
      link: '/dashboard',
    },
    {
      icon: Brain,
      title: 'Causal Simulator',
      description:
        'Predict policy impact using advanced AI and causal inference models.',
      color: 'from-cyan-500 to-blue-500',
      link: '/causal-simulator',
    },
    {
      icon: MessageSquare,
      title: 'Sentiment Tracker',
      description:
        'Analyze public opinion on climate policies with real-time sentiment analysis.',
      color: 'from-amber-500 to-orange-500',
      link: '/sentiment-tracker',
    },
    {
      icon: Beaker,
      title: 'Policy Lab',
      description:
        'Adaptive AI recommendations for evidence-based climate policymaking.',
      color: 'from-emerald-500 to-cyan-500',
      link: '/policy-lab',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Vanta Background */}
      <section
        ref={vantaRef}
        className="relative min-h-screen flex flex-col items-center justify-center text-center text-white overflow-hidden pt-16"
        style={{ backgroundColor: '#021f02' }} // Fallback background
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              <span>ClimateX</span>
              <br />
              <span className="text-emerald-400">
                Real-Time Climate Intelligence
              </span>
              <br />
              <span>for India</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
              Empowering policymakers with AI insights, predictive modeling, and
              real-time data for sustainable climate action.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      {/* 2. FIXED: Changed background to the site's dark theme */}
      <section
        className="py-20 relative"
        style={{ backgroundColor: '#021f02' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Powerful Climate Tools
            </h2>
            {/* 3. FIXED: Changed text to gray-300 for consistency */}
            <p className="text-lg max-w-2xl mx-auto text-gray-300">
              Comprehensive suite of AI-powered tools for climate intelligence
              and policymaking.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Link to={feature.link}>
                    <Card className="glass-card-hover p-6 h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-white/90">
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

      {/* Footer with dark green background */}
      <div style={{ backgroundColor: '#021f02' }}>
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;