import { Cloud, Github, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer
      className="relative mt-20 border-t border-white/10 text-white"
      style={{ backgroundColor: '#021f02' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ClimateX</span>
            </div>
            <p className="text-gray-300 text-sm max-w-md">
              Real-Time Climate Intelligence for India. Empowering policymakers with AI insights, predictive modeling, and data-driven solutions for sustainable climate action.
            </p>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold mb-4 text-emerald-400">Connect</h3>
            <div className="flex space-x-3">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-emerald-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <Github className="w-5 h-5 text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-cyan-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <Twitter className="w-5 h-5 text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-emerald-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <Linkedin className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2025 ClimateX | Built for Climate Innovation Hackathon
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Glow Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl" />
      </div>
    </footer>
  );
};

export default Footer;
