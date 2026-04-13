import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search, Sun, Moon, LayoutDashboard, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "../contexts/AuthContext";
import { useCMS } from "../hooks/useCMS";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { cmsData } = useCMS();

  const siteSettings = cmsData.site || {
    siteTitle: "TRACES.IO",
    siteLogo: "",
    tagline: "Traceability First"
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Team", path: "/team" },
    { name: "Products", path: "/products" },
    { name: "Traceability", path: "/trace" },
    { name: "Investor Portal", path: "/investor" },
    { name: "Contact", path: "/contact" },
  ];

  const isHomePage = location.pathname === "/";

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled || !isHomePage ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            {siteSettings.siteLogo ? (
              <img src={siteSettings.siteLogo} alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-600/20 group-hover:scale-110 transition-transform">
                <Search size={24} className="rotate-90" />
              </div>
            )}
            <div className="flex flex-col">
              <span className={`text-xl font-black tracking-tighter leading-none ${scrolled || !isHomePage ? "text-blue-900 dark:text-white" : "text-white"}`}>
                {siteSettings.siteTitle}
              </span>
              <span className={`text-[10px] font-bold tracking-[0.2em] uppercase opacity-60 ${scrolled || !isHomePage ? "text-slate-500 dark:text-slate-400" : "text-white"}`}>
                {siteSettings.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-green-500 ${
                  scrolled || !isHomePage ? "text-slate-700 dark:text-slate-300" : "text-white/90"
                } ${location.pathname === link.path ? "text-green-500 font-semibold" : ""}`}
              >
                {link.name}
              </Link>
            ))}
            
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all ${
                scrolled || !isHomePage ? "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" : "text-white hover:bg-white/10"
              }`}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {user ? (
              <Link
                to="/erp/dashboard"
                className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className={`flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-full border transition-all ${
                  scrolled || !isHomePage 
                    ? "border-slate-200 text-slate-700 hover:bg-slate-50" 
                    : "border-white/30 text-white hover:bg-white/10"
                }`}
              >
                <LogIn size={16} />
                Login
              </Link>
            )}

            <Link
              to="/trace"
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2"
            >
              <Search size={16} />
              Trace a Product
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all ${
                scrolled || !isHomePage ? "text-slate-700 dark:text-slate-300" : "text-white"
              }`}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={24} /> : <Sun size={24} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`${scrolled || !isHomePage ? "text-blue-900 dark:text-white" : "text-white"}`}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white dark:bg-slate-900 shadow-xl py-6 px-4 md:hidden"
          >
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg font-medium text-slate-800 dark:text-slate-200 hover:text-green-600 ${
                    location.pathname === link.path ? "text-green-600" : ""
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                {user ? (
                  <Link
                    to="/erp/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="bg-blue-900 text-white px-6 py-3 rounded-xl text-center font-bold flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard size={20} />
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-3 rounded-xl text-center font-bold flex items-center justify-center gap-2"
                  >
                    <LogIn size={20} />
                    Login to ERP
                  </Link>
                )}
                <Link
                  to="/trace"
                  onClick={() => setIsOpen(false)}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl text-center font-bold flex items-center justify-center gap-2"
                >
                  <Search size={20} />
                  Trace a Product
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
