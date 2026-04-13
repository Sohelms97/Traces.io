import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin, Search } from "lucide-react";
import { useCMS } from "../hooks/useCMS";

export default function Footer() {
  const { cmsData } = useCMS();

  const siteSettings = cmsData.site || {
    siteTitle: "TRACES.IO",
    siteLogo: "",
    tagline: "Traceability First",
    address: "123 Business Bay, Dubai, United Arab Emirates",
    email: "info@farmersmarket.asia",
    phone: "+971 4 123 4567",
    socialLinks: {
      facebook: "#",
      twitter: "#",
      linkedin: "#",
      instagram: "#"
    }
  };

  return (
    <footer className="bg-blue-950 text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              {siteSettings.siteLogo ? (
                <img src={siteSettings.siteLogo} alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white">
                  <Search size={18} className="rotate-90" />
                </div>
              )}
              <span className="text-3xl font-bold tracking-tighter">{siteSettings.siteTitle}</span>
              {!siteSettings.siteLogo && <div className="w-2 h-2 rounded-full bg-green-500" />}
            </div>
            <p className="text-blue-200/70 leading-relaxed">
              Farmers Market Asia's leading traceability platform. From Source to Table — Every Step Traced. Building trust through transparency.
            </p>
            <div className="flex space-x-4">
              <a href={siteSettings.socialLinks?.facebook || "#"} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-green-600 transition-colors">
                <Facebook size={18} />
              </a>
              <a href={siteSettings.socialLinks?.twitter || "#"} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-green-600 transition-colors">
                <Twitter size={18} />
              </a>
              <a href={siteSettings.socialLinks?.linkedin || "#"} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-green-600 transition-colors">
                <Linkedin size={18} />
              </a>
              <a href={siteSettings.socialLinks?.instagram || "#"} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-green-600 transition-colors">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-blue-200/70 hover:text-green-400 transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-blue-200/70 hover:text-green-400 transition-colors">About Us</Link></li>
              <li><Link to="/team" className="text-blue-200/70 hover:text-green-400 transition-colors">Our Team</Link></li>
              <li><Link to="/products" className="text-blue-200/70 hover:text-green-400 transition-colors">Our Products</Link></li>
              <li><Link to="/trace" className="text-blue-200/70 hover:text-green-400 transition-colors">Traceability</Link></li>
              <li><Link to="/investor" className="text-blue-200/70 hover:text-green-400 transition-colors">Investor Portal</Link></li>
              <li><Link to="/contact" className="text-blue-200/70 hover:text-green-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <MapPin className="text-green-500 shrink-0" size={20} />
                <span className="text-blue-200/70 whitespace-pre-line">{siteSettings.address}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="text-green-500 shrink-0" size={20} />
                <span className="text-blue-200/70">{siteSettings.phone}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="text-green-500 shrink-0" size={20} />
                <span className="text-blue-200/70">{siteSettings.email}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">Newsletter</h4>
            <p className="text-blue-200/70 mb-4 text-sm">Stay updated with our latest products and traceability reports.</p>
            <form className="space-y-3">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
              />
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors text-sm">
                Subscribe Now
              </button>
            </form>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-blue-200/50">
          <p>© 2026 Farmers Market Asia. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
