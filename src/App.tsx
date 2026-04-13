import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import React, { useEffect } from "react";
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
import InvestorPortal from "./erp/investor/InvestorPortal";
import InvestorDetail from "./erp/investor/InvestorDetail";
import InvestmentDistribution from "./erp/investor/InvestmentDistribution";
import NewInvestorWizard from "./erp/investor/NewInvestorWizard";
import FinancialReports from "./erp/FinancialReports";
import TraceabilityTracker from "./erp/TraceabilityTracker";
import Settings from "./erp/Settings";
import Documents from "./erp/Documents";
import ProductCatalog from "./erp/ProductCatalog";
import UserManagement from "./erp/UserManagement";
import WebsiteManager from "./erp/WebsiteManager";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import AccessDenied from "./pages/AccessDenied";
import { rolePermissions } from "./lib/permissions";

function ProtectedRoute({ children, requiredPath }: { children: React.ReactNode, requiredPath?: string }) {
  const { user, loading, role } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (requiredPath && role) {
    const isAllowed = rolePermissions[role]?.some(path => requiredPath.startsWith(path));
    if (!isAllowed) return <Navigate to="/erp/access-denied" />;
  }

  return <>{children}</>;
}

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
  const isLoginPage = location.pathname === '/login';

  return (
    <div className={`min-h-screen ${isERP ? 'bg-slate-100 text-slate-900' : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100'} font-sans selection:bg-green-100 dark:selection:bg-green-900 selection:text-green-900 dark:selection:text-green-100 transition-colors duration-300`}>
      {!isERP && !isLoginPage && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
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
          <Route path="/erp" element={<ProtectedRoute><ERPLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ProtectedRoute requiredPath="/erp/dashboard"><ERPDashboard /></ProtectedRoute>} />
            <Route path="containers" element={<ProtectedRoute requiredPath="/erp/containers"><ContainerManagement /></ProtectedRoute>} />
            <Route path="purchases" element={<ProtectedRoute requiredPath="/erp/purchases"><PurchaseManagement /></ProtectedRoute>} />
            <Route path="shipments" element={<ProtectedRoute requiredPath="/erp/shipments"><ShipmentLogistics /></ProtectedRoute>} />
            <Route path="inventory" element={<ProtectedRoute requiredPath="/erp/inventory"><WarehouseInventory /></ProtectedRoute>} />
            <Route path="sales" element={<ProtectedRoute requiredPath="/erp/sales"><SalesManagement /></ProtectedRoute>} />
            <Route path="investors" element={<ProtectedRoute requiredPath="/erp/investors"><InvestorPortal /></ProtectedRoute>} />
            <Route path="investors/new" element={<ProtectedRoute requiredPath="/erp/investors"><NewInvestorWizard /></ProtectedRoute>} />
            <Route path="investors/:id" element={<ProtectedRoute requiredPath="/erp/investors"><InvestorDetail /></ProtectedRoute>} />
            <Route path="investors/distribution" element={<ProtectedRoute requiredPath="/erp/investors"><InvestmentDistribution /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute requiredPath="/erp/reports"><FinancialReports /></ProtectedRoute>} />
            <Route path="traceability" element={<ProtectedRoute requiredPath="/erp/traceability"><TraceabilityTracker /></ProtectedRoute>} />
            <Route path="catalog" element={<ProtectedRoute requiredPath="/erp/catalog"><ProductCatalog /></ProtectedRoute>} />
            <Route path="website" element={<ProtectedRoute requiredPath="/erp/website"><WebsiteManager /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute requiredPath="/erp/users"><UserManagement /></ProtectedRoute>} />
            <Route path="documents" element={<ProtectedRoute requiredPath="/erp/documents"><Documents /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute requiredPath="/erp/settings"><Settings /></ProtectedRoute>} />
            <Route path="access-denied" element={<AccessDenied />} />
            <Route path="*" element={<div className="p-10 text-center text-slate-400">Module coming soon...</div>} />
          </Route>
        </Routes>
      </main>
      {!isERP && !isLoginPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <HashScrollHandler />
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
