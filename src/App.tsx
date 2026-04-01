import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Team from "./pages/Team";
import Products from "./pages/Products";
import Traceability from "./pages/Traceability";
import Investor from "./pages/Investor";
import Contact from "./pages/Contact";
import HashScrollHandler from "./components/HashScrollHandler";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Only scroll to top if there's no hash (anchor link)
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <HashScrollHandler />
      <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-green-100 selection:text-green-900">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/team" element={<Team />} />
            <Route path="/products" element={<Products />} />
            <Route path="/trace" element={<Traceability />} />
            <Route path="/investor" element={<Investor />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
