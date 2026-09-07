import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Sparkles, Eye, EyeOff, X, KeyRound, HelpCircle } from 'lucide-react';
import { loginDoctor, persistAuthSession, readApiError } from '../../../services';

export default function LoginView() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const session = await loginDoctor({ email, password });
      persistAuthSession(session);
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(readApiError(error, 'Unable to sign in right now. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const session = await loginDoctor({
        email: 'doctor.demo@gmail.com',
        password: 'Doctor@2026!',
      });
      persistAuthSession(session);
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(readApiError(error, 'Unable to sign in with demo account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50 flex flex-col items-center justify-center px-4">
      {/* Logo + branding */}
      <div className="flex flex-col items-center mb-8 space-y-3">
        <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center p-2 border border-slate-200">
          <img src="/logo2.png" alt="EndoBone AI" className="w-full h-full object-contain" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-clinical-blue tracking-tight">EndoBone AI</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Secure Clinician Access</p>
        </div>
      </div>

      {/* Form card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200/80 px-8 py-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address (Gmail / Medical Email)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@gmail.com"
                required
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-clinical-blue focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-semibold text-clinical-blue hover:text-clinical-blue-dark transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-clinical-blue focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {errorMessage ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errorMessage}
            </p>
          ) : null}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-clinical-blue hover:bg-clinical-blue-dark disabled:opacity-70 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-600/20 mt-1 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign In with Email
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs text-slate-400 font-semibold uppercase">Or</span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Use Demo Account Option Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 hover:border-emerald-400 text-emerald-800 font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-emerald-600/40 border-t-emerald-600 rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={18} className="text-emerald-600" />
                <span>Use Demo Account</span>
              </>
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-sm text-slate-500 mt-5">
          Don&apos;t have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="font-semibold text-clinical-blue hover:text-clinical-blue-dark transition-colors"
          >
            Register
          </button>
        </p>
      </div>

      {/* HIPAA notice */}
      <div className="flex flex-col items-center gap-1.5 mt-8 text-center">
        <ShieldCheck size={20} className="text-slate-400" />
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          HIPAA Compliant System. Unauthorized access is strictly prohibited and logged.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-clinical-blue">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Clinician Credential Recovery</h3>
                  <p className="text-xs text-slate-500">Access recovery & demo credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-slate-600">
              <p>
                To maintain HIPAA and institutional security compliance, password resets require verification with your hospital system administrator or PACS liaison.
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-clinical-blue" />
                  <span>Evaluation & Sandbox Credentials:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left font-mono">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="block text-[10px] uppercase text-slate-400 font-sans font-bold">Email</span>
                    <span className="text-slate-800 text-[11px] select-all">doctor.demo@gmail.com</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="block text-[10px] uppercase text-slate-400 font-sans font-bold">Password</span>
                    <span className="text-slate-800 text-[11px] select-all">Doctor@2026!</span>
                  </div>
                </div>
              </div>

              <div className="text-slate-500 text-[11px] leading-relaxed">
                Emergency IT Helpdesk: <span className="font-medium text-slate-700">support@endobone.ai</span> | Ext: 4401
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('doctor.demo@gmail.com');
                  setPassword('Doctor@2026!');
                  setShowForgotModal(false);
                }}
                className="flex-1 py-2.5 bg-clinical-blue text-white rounded-xl text-xs font-bold hover:bg-clinical-blue-dark transition-colors shadow-sm"
              >
                Fill Demo Credentials
              </button>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
