// Removed Vanta.js imports and code, as previously discussed, since we're using video
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Brain, MessageSquare, Beaker, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Footer from '@/components/Footer';
// No need for 'useEffect' or 'useRef' if Vanta.js is completely removed
// import { useEffect, useRef } from 'react'; // REMOVE if Vanta.js is fully gone

const HomePage = () => {
  // REMOVE all Vanta.js related refs and useEffect.
  // const vantaRef = useRef(null);
  // const vantaEffect = useRef(null);
  // useEffect(() => { ... });

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
    // Reverted to a simple div wrapper for the whole page.
    // The min-h-screen is good to ensure it takes full height.
    <div className="min-h-screen">
      
      {/* 1. Hero Section: This is where the video will live */}
      <section
        // Added 'homepage-hero-section' class for specific video styling
        className="relative min-h-screen flex flex-col items-center justify-center text-center text-white overflow-hidden pt-16 homepage-hero-section"
        // Set the background color directly here. This must match your video's background.
        style={{ backgroundColor: '#13451b' }} 
      >
        {/* 2. Place the video tag directly inside the Hero section */}
        <video autoPlay loop muted playsInline className="hero-background-video">
          {/* Ensure this path is correct: /background-video.mp4 needs to be in your 'public' folder */}
          <source src="/background-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* 3. This div contains all your actual content (text, etc.) and needs z-index above the video */}
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

      {/* 4. Features Section: Keep its original background and styling */}
      <section
        className="py-20 relative"
        // This was '#57af50' in your original code. Let's keep it.
        style={{ backgroundColor: '#57af50' }} 
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
                    <Card
                      className="p-6 h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20"
                      style={{ backgroundColor: '#13451b', border: '1px solid #0e3a0f' }}
                    >
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

      {/* 5. Footer: Keep its original background and styling */}
      <div className="-mt-20" style={{ backgroundColor: '#021f02' }}>
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;