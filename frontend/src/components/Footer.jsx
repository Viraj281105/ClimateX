import { Cloud, Github, Twitter, Linkedin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer
      className="relative mt-20 border-t border-gray-200 text-gray-700"
      style={{ backgroundColor: 'transparent' }}  // <-- FIXED
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center shadow-lg">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ClimateX</span>
            </div>

            <p className="text-gray-600 text-sm max-w-md">
              Real-Time Climate Intelligence for India. Empowering policymakers
              with AI insights, predictive modeling, and data-driven solutions
              for sustainable climate action.
            </p>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-800">Connect</h3>
            <div className="flex space-x-3">
              <a className="w-10 h-10 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all duration-300 hover:scale-110">
                <Github className="w-5 h-5 text-gray-700" />
              </a>
              <a className="w-10 h-10 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all duration-300 hover:scale-110">
                <Twitter className="w-5 h-5 text-gray-700" />
              </a>
              <a className="w-10 h-10 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all duration-300 hover:scale-110">
                <Linkedin className="w-5 h-5 text-gray-700" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-500 text-sm">
              © 2025 ClimateX | Built for Climate Innovation Hackathon
            </p>

            <div className="flex space-x-6">
              <a className="text-gray-500 hover:text-gray-800 text-sm transition-colors">
                Privacy Policy
              </a>
              <a className="text-gray-500 hover:text-gray-800 text-sm transition-colors">
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
