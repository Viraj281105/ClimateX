import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Causal Simulator', path: '/causal-simulator' },
    { name: 'Sentiment Tracker', path: '/sentiment-tracker' },
    { name: 'Policy Lab', path: '/policy-lab' },
    { name: 'About', path: '/about' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      // Updated main background color
      className="fixed top-0 left-0 right-0 z-[9999] bg-[#90bd85] shadow-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side: App name - Added logo and updated text color */}
          <Link
            to="/"
            // UPDATED: Increased font size from text-xl to text-2xl
            className="flex items-center text-gray-900 text-2xl font-bold tracking-wide hover:text-black transition-colors"
          >
            {/* Added logo - assuming it's in your /public folder */}
            <img 
              src="/logo.png" 
              alt="ClimateX Logo" 
              // *** UPDATED SIZE HERE ***
              className="h-12 w-12 mr-2" 
            />
            ClimateX
          </Link>

          {/* Desktop Navigation - Updated text, active, and hover colors */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                // UPDATED: text-sm font-medium -> text-base font-bold
                // UPDATED: text-gray-800 -> text-gray-900
                className={`px-4 py-2 rounded-lg text-base font-bold transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'bg-black/10 text-gray-900' // Active state
                    : 'text-gray-900 hover:bg-black/5' // Inactive state (darker)
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button - Updated icon color and hover */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            // Updated icon color
            className="md:hidden p-2 rounded-lg hover:bg-black/10 transition-colors text-gray-900"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Updated to be a white "card" */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            // Changed to 'bg-white' to act as a card, with a subtle border
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  // UPDATED: text-sm font-medium -> text-base font-bold
                  // UPDATED: text-gray-800 -> text-gray-900
                  className={`block px-4 py-3 rounded-lg text-base font-bold transition-all duration-200 ${
                    location.pathname === link.path
                      ? 'bg-gray-100 text-gray-900' // Active state
                      : 'text-gray-900 hover:bg-gray-100' // Inactive state (darker)
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
  );
};

export default Navbar;