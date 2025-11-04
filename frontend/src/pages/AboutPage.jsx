import { motion } from 'framer-motion';
import { Cloud, Users, Target, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Footer from '@/components/Footer';

const AboutPage = () => {
  const teamMembers = [
    {
      name: 'Priya Sharma',
      role: 'Lead Climate Scientist',
      initials: 'PS',
      bio: 'PhD in Climate Science with 10+ years in environmental research.',
    },
    {
      name: 'Arjun Patel',
      role: 'AI/ML Engineer',
      initials: 'AP',
      bio: 'Specializes in predictive modeling and causal inference systems.',
    },
    {
      name: 'Ananya Reddy',
      role: 'Data Analyst',
      initials: 'AR',
      bio: 'Expert in big data analytics and climate data visualization.',
    },
    {
      name: 'Rohan Kumar',
      role: 'Policy Advisor',
      initials: 'RK',
      bio: 'Former government consultant on sustainable development policies.',
    },
  ];

  const values = [
    {
      icon: Target,
      title: 'Evidence-Based',
      description: 'Every recommendation is backed by rigorous data analysis and scientific research.',
    },
    {
      icon: Zap,
      title: 'Real-Time Intelligence',
      description: 'Continuous monitoring and instant insights for proactive climate action.',
    },
    {
      icon: Users,
      title: 'People-Centric',
      description: 'Incorporating public sentiment to ensure policies resonate with communities.',
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-2xl mb-6">
            <Cloud className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            About <span className="text-gradient-emerald">ClimateX</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            ClimateX is an AI-powered platform designed to enable evidence-based climate policymaking by integrating real-time data, causal inference, and public sentiment analytics.
          </p>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <Card className="glass-card p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 gradient-animated opacity-10" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">
                Our <span className="text-gradient-emerald">Mission</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                To empower policymakers and citizens with real-time climate intelligence, enabling data-driven decisions that lead to sustainable and impactful climate action across India.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Core Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-12">
            Our <span className="text-gradient-emerald">Values</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="glass-card-hover p-6 text-center">
                  <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-center mb-12">
            Meet Our <span className="text-gradient-emerald">Team</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Card className="glass-card-hover p-6 text-center h-full flex flex-col">
                  <Avatar className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-cyan-500">
                    <AvatarFallback className="text-white text-xl font-bold">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                  <p className="text-emerald-400 text-sm mb-3">{member.role}</p>
                  <p className="text-muted-foreground text-sm flex-1">{member.bio}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Technology Stack Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16"
        >
          <Card className="glass-card p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Built for the <span className="text-gradient-emerald">Climate Innovation Hackathon</span>
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              ClimateX was developed as part of a national initiative to leverage technology for climate action. Our platform combines cutting-edge AI, big data analytics, and user-centric design to create a powerful tool for climate intelligence.
            </p>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutPage;