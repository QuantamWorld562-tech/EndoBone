import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { persistAuthSession, readApiError, registerDoctor, googleSignInDoctor } from '../../../services';

export default function RegisterView() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    licenseNumber: '',
    institution: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setErrorMessage('Please enter your first and last name.');
      return;
    }
    if (!form.email.trim()) {
      setErrorMessage('Please enter your email address (Gmail or Medical Email).');
      return;
    }
    if (!form.password.trim()) {
      setErrorMessage('Please enter a password.');
      return;
    }
    if (!agreed) {
      setErrorMessage('Please agree to the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const session = await registerDoctor({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        licenseNumber: (form.licenseNumber || '').trim(),
        institution: (form.institution || '').trim(),
      });
      persistAuthSession(session);
      navigate('/dashboard');
    } catch (error) {
      const msg = readApiError(error, 'Unable to create account right now. Please try again.');
      if (msg.toLowerCase().includes('already exists')) {
        setErrorMessage('An account with this email already exists. You can log in using the link below or sign in with Google.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setErrorMessage('');
      setGoogleLoading(true);
      try {
        const session = await googleSignInDoctor({
          access_token: codeResponse.access_token,
          // Passing fallback info in case we are using the local simulation (though we shouldn't need it on real OAuth)
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
          institution: form.institution.trim() || undefined,
          licenseNumber: form.licenseNumber.trim() || undefined,
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
    try {
      googleLoginHandler();
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* ── Left panel ── */}
      <aside className="hidden lg:flex flex-col w-96 flex-shrink-0 bg-slate-100 border-r border-slate-200 px-10 py-10 justify-between">
        {/* Branding */}
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center p-1.5">
              <img src="/logo2.png" alt="EndoBone AI" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-clinical-blue leading-tight">EndoBone AI</h1>
              <p className="text-xs text-slate-500 font-medium">Precision Diagnostics Platform</p>
            </div>
          </div>

          {/* Bone illustration placeholder */}
          <div className="rounded-xl overflow-hidden bg-slate-200 aspect-[4/3] flex items-center justify-center mb-6">
            <img
              src="/hero-bone-display.png"
              alt="3D bone model"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback when image is missing */}
            <div
              className="hidden w-full h-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300"
              aria-hidden="true"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 opacity-60" />
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed text-center">
            Join the premier network of clinicians utilizing advanced AI for precise bone health
            assessment and pre-surgical planning.
          </p>
        </div>

        {/* Footer note */}
        <p className="text-xs text-slate-400 text-center">
          © 2024 EndoBone AI. For clinical research use only.
        </p>
      </aside>

      {/* ── Right panel ── */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-xl">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Clinician Registration
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Create your account to access the platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Personal Information */}
            <section>
              <h3 className="text-xs font-bold text-clinical-blue uppercase tracking-widest mb-3">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="e.g. Sarah"
                    required
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="e.g. Jenkins"
                    required
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </section>

            {/* Professional Credentials */}
            <section>
              <h3 className="text-xs font-bold text-clinical-blue uppercase tracking-widest mb-3">
                Professional Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Medical License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={form.licenseNumber}
                    onChange={handleChange}
                    placeholder="e.g. MD1234567"
                    required
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="label">Institution / Practice</label>
                  <input
                    type="text"
                    name="institution"
                    value={form.institution}
                    onChange={handleChange}
                    placeholder="e.g. General Hospital"
                    required
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </section>

            {/* Account Security */}
            <section>
              <h3 className="text-xs font-bold text-clinical-blue uppercase tracking-widest mb-3">
                Account Security
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Email Address (Gmail / Medical Email)</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="doctor@gmail.com"
                    required
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="input-field text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Must be at least 8 characters, include a number and a symbol.
                  </p>
                </div>
              </div>
            </section>

            {/* Terms */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${agreed
                        ? 'bg-clinical-blue border-clinical-blue'
                        : 'bg-white border-slate-300'
                      }`}
                  >
                    {agreed && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 10 8"
                        aria-hidden="true"
                      >
                        <path
                          d="M1 4l2.5 2.5L9 1"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-slate-600 leading-relaxed">
                  I agree to the{' '}
                  <button
                    type="button"
                    className="font-semibold text-clinical-blue hover:text-clinical-blue-dark transition-colors"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    className="font-semibold text-clinical-blue hover:text-clinical-blue-dark transition-colors"
                  >
                    Privacy Policy
                  </button>
                  , and confirm I am a licensed medical professional.
                </span>
              </label>
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
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-clinical-blue hover:bg-clinical-blue-dark disabled:opacity-60 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account with Email
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

            {/* Google Registration Button */}
            {/* <button
              type="button"
              disabled={loading || googleLoading}
              onClick={handleGoogleLogin}
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

          {/* Sign in link */}
          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-semibold text-clinical-blue hover:text-clinical-blue-dark transition-colors"
            >
              Login
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
