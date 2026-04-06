import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function LoginPage() {
  const { user, login, loginWithEmail, registerWithEmail, resetPassword, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return (
    <div className="min-h-screen bg-[#1F4E79] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
    </div>
  );
  
  if (user) return <Navigate to="/erp/dashboard" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (isReset) {
        await resetPassword(email);
        setMessage('Password reset email sent! Check your inbox.');
        setIsReset(false);
      } else if (isRegister) {
        if (!name) throw new Error('Please enter your full name');
        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error('Auth error full details:', err);
      let friendlyMessage = err.message || 'An error occurred during authentication';
      
      const isInvalidCredential = 
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/invalid-login-credentials' ||
        err.message?.toLowerCase().includes('invalid-credential');

      if (isInvalidCredential) {
        friendlyMessage = 'Invalid email or password. If you haven\'t registered this account yet, please click "Register" below. If you are an administrator, ensure "Email/Password" is enabled in Firebase Console.';
      } else if (err.code === 'auth/user-not-found') {
        friendlyMessage = 'No account found with this email. Please register first.';
      } else if (err.code === 'auth/wrong-password') {
        friendlyMessage = 'Incorrect password. Please try again or reset your password.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many failed login attempts. Please try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        friendlyMessage = 'Network error. Please check your internet connection.';
      }
      
      setError(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1F4E79] flex items-center justify-center p-4 font-['Inter']">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md space-y-8 relative overflow-hidden"
      >
        {/* Logo Section */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
            <i className="fa-solid fa-link text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-black text-[#1F4E79] tracking-tight">TRACES.IO</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Internal ERP Portal</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.form 
            key={isRegister ? 'register' : isReset ? 'reset' : 'login'}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onSubmit={handleSubmit} 
            className="space-y-5"
          >
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}
            
            {message && (
              <div className="p-4 bg-green-50 border border-green-100 text-green-600 text-xs font-bold rounded-xl flex items-center gap-2">
                <i className="fa-solid fa-circle-check"></i>
                {message}
              </div>
            )}

            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative">
                  <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium text-slate-700 transition-all"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium text-slate-700 transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {!isReset && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  {!isRegister && (
                    <button 
                      type="button"
                      onClick={() => setIsReset(true)}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium text-slate-700 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1F4E79] text-white py-4 rounded-2xl font-bold hover:bg-[#163a5a] transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <i className={`fa-solid ${isReset ? 'fa-paper-plane' : 'fa-right-to-bracket'}`}></i>
              )}
              {isReset ? 'Send Reset Link' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </motion.form>
        </AnimatePresence>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
            <span className="bg-white px-4 text-slate-300">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={login}
          className="w-full bg-white border border-slate-200 py-4 rounded-2xl font-bold text-slate-700 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Google Account
        </button>

        <div className="text-center space-y-4">
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setIsReset(false);
              setError(null);
            }}
            className="text-sm font-bold text-slate-500 hover:text-[#1F4E79] transition-colors"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
          
          {isReset && (
            <button 
              onClick={() => setIsReset(false)}
              className="block w-full text-sm font-bold text-slate-500 hover:text-[#1F4E79] transition-colors"
            >
              Back to Login
            </button>
          )}

          <p className="text-[10px] text-slate-300 font-medium pt-4 border-t border-slate-50">
            Authorized access only. All activities are monitored and logged.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
