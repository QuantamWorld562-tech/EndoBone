import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { loginDoctor, persistAuthSession, readApiError } from '../../../services';

export default function LoginView() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                className="text-xs font-semibold text-clinical-blue hover:text-clinical-blue-dark transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-clinical-blue focus:border-transparent transition-all"
              />
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
            className="w-full flex items-center justify-center gap-2 py-3 bg-clinical-blue hover:bg-clinical-blue-dark disabled:opacity-70 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-600/20 mt-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight size={16} />
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
    </div>
  );
}
