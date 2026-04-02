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
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import HashScrollHandler from "./components/HashScrollHandler";
import { ThemeProvider } from "./components/ThemeProvider";
import ERPLayout from "./erp/ERPLayout";
import ERPDashboard from "./erp/ERPDashboard";
import ContainerManagement from "./erp/ContainerManagement";
import PurchaseManagement from "./erp/PurchaseManagement";
import ShipmentLogistics from "./erp/ShipmentLogistics";
import WarehouseInventory from "./erp/WarehouseInventory";
import SalesManagement from "./erp/SalesManagement";
import InvestorPortal from "./erp/InvestorPortal";
import FinancialReports from "./erp/FinancialReports";
import TraceabilityTracker from "./erp/TraceabilityTracker";
import Settings from "./erp/Settings";

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

function AppContent() {
  const location = useLocation();
  const isERP = location.pathname.startsWith('/erp');

  return (
    <div className={`min-h-screen ${isERP ? 'bg-slate-100' : 'bg-white dark:bg-slate-950'} font-sans text-slate-900 dark:text-slate-100 selection:bg-green-100 dark:selection:bg-green-900 selection:text-green-900 dark:selection:text-green-100 transition-colors duration-300`}>
      {!isERP && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/team" element={<Team />} />
          <Route path="/products" element={<Products />} />
          <Route path="/trace" element={<Traceability />} />
          <Route path="/investor" element={<Investor />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          
          {/* ERP Routes */}
          <Route path="/erp" element={<ERPLayout />}>
            <Route index element={<ERPDashboard />} />
            <Route path="dashboard" element={<ERPDashboard />} />
            <Route path="containers" element={<ContainerManagement />} />
            <Route path="purchases" element={<PurchaseManagement />} />
            <Route path="shipments" element={<ShipmentLogistics />} />
            <Route path="inventory" element={<WarehouseInventory />} />
            <Route path="sales" element={<SalesManagement />} />
            <Route path="investors" element={<InvestorPortal />} />
            <Route path="reports" element={<FinancialReports />} />
            <Route path="traceability" element={<TraceabilityTracker />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<div className="p-10 text-center text-slate-400">Module coming soon...</div>} />
          </Route>
        </Routes>
      </main>
      {!isERP && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <HashScrollHandler />
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}
