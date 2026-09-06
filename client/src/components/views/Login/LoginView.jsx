import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff, KeyRound, X } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { loginDoctor, googleSignInDoctor, persistAuthSession, readApiError } from '../../../services';

export default function LoginView() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const executeLogin = async (targetEmail, targetPassword) => {
    setErrorMessage('');
    setLoading(true);

    try {
      const session = await loginDoctor({ email: targetEmail, password: targetPassword });
      persistAuthSession(session);
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(readApiError(error, 'Unable to sign in. Please verify your email and password.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your email address (e.g. doctor.demo@gmail.com).');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }
    await executeLogin(email.trim(), password);
  };

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setErrorMessage('');
      setGoogleLoading(true);
      try {
        const session = await googleSignInDoctor({
          access_token: codeResponse.access_token,
        });
        persistAuthSession(session);
        navigate('/dashboard');
      } catch (error) {
        setErrorMessage(readApiError(error, 'Google sign-in failed.'));
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.warn('Google Login Error:', error);
      setErrorMessage('Google authentication failed. Please try again.');
    },
  });

  const handleGoogleLogin = () => {
    setErrorMessage('');
    // For testing/mocking in absence of valid Client ID, fallback to mock if error occurs
    try {
      googleLoginHandler();
    } catch (e) {
      console.warn(e);
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
                onClick={() => setIsForgotPasswordOpen(true)}
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                tabIndex={-1}
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
          {/* <div className="relative my-3 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs text-slate-400 font-semibold uppercase">Or</span>
            <div className="border-t border-slate-200 w-full" />
          </div> */}

          {/* Google Single Sign-On Button */}
          {/* <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition shadow-sm cursor-pointer disabled:opacity-70"
          >
            {googleLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-clinical-blue rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>{googleLoading ? 'Signing in with Google...' : 'Continue with Google'}</span>
          </button> */}
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

      {/* Forgot Password Recovery Modal */}
      {isForgotPasswordOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsForgotPasswordOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition p-1"
            >
              <X size={18} />
            </button>

            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3.5">
              <KeyRound size={22} />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">Reset Clinical Access</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              For HIPAA security compliance, password resets require verification by your institution administrator or you can sign in directly using Google Single Sign-On.
            </p>

            <div className="space-y-2 mb-5 bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Hospital Admin:</span>
                <span className="font-mono text-slate-900">admin@endobone.ai</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Demo Account:</span>
                <span className="font-mono text-blue-600">Doctor@2026!</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordOpen(false);
                  handleGoogleLogin();
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                Sign in with Google
              </button>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
