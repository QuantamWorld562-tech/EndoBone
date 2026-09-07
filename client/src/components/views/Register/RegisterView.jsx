import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Sparkles, X, FileText, ShieldCheck } from 'lucide-react';
import { persistAuthSession, readApiError, registerDoctor, loginDoctor } from '../../../services';

export default function RegisterView() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [legalModal, setLegalModal] = useState(null); // 'terms' | 'privacy' | null

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
    if (!agreed) {
      setErrorMessage('You must review and accept the Terms of Service and Privacy Policy to register.');
      return;
    }
    setErrorMessage('');
    setLoading(true);

    try {
      const session = await registerDoctor(form);
      persistAuthSession(session);
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(readApiError(error, 'Unable to create account right now. Please try again.'));
    } finally {
      setLoading(false);
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
          © 2026 EndoBone AI. For clinical research use only.
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
                    onClick={() => setLegalModal('terms')}
                    className="font-semibold text-clinical-blue hover:text-clinical-blue-dark underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setLegalModal('privacy')}
                    className="font-semibold text-clinical-blue hover:text-clinical-blue-dark underline underline-offset-2 transition-colors cursor-pointer"
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
            <div className="relative my-3 flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs text-slate-400 font-semibold uppercase">Or</span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {/* Demo Account Option */}
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
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
                  setErrorMessage(readApiError(error, 'Failed to sign in with demo account.'));
                } finally {
                  setLoading(false);
                }
              }}
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

          {/* Sign in link */}
          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-semibold text-clinical-blue hover:text-clinical-blue-dark transition-colors cursor-pointer"
            >
              Login
            </button>
          </p>
        </div>
      </main>

      {/* Legal terms / privacy modal */}
      {legalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setLegalModal(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-clinical-blue">
                  {legalModal === 'terms' ? <FileText size={20} /> : <ShieldCheck size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {legalModal === 'terms' ? 'Terms of Service' : 'Privacy & HIPAA Compliance Policy'}
                  </h3>
                  <p className="text-xs text-slate-500">EndoBone AI Precision Clinical Diagnostics</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600 overflow-y-auto leading-relaxed flex-1">
              {legalModal === 'terms' ? (
                <>
                  <p className="font-semibold text-slate-800">1. Clinician Authorization & Scope</p>
                  <p>
                    EndoBone AI is an AI-assisted clinical decision support tool designed for licensed orthopedic surgeons, radiologists, and endocrinologists. It is intended to assist, not replace, professional clinical judgment and diagnostic expertise.
                  </p>
                  <p className="font-semibold text-slate-800">2. Security & Credentials</p>
                  <p>
                    Users must maintain the confidentiality of institutional credentials and refrain from sharing individual access keys. All system actions are timestamped and audited under HIPAA Title II.
                  </p>
                  <p className="font-semibold text-slate-800">3. Diagnostic Verification</p>
                  <p>
                    Measurements, 3D bone volume reconstructions, T-scores, and BMD volumetric estimates must be verified against primary DICOM scans and institutional PACS records before surgical intervention.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-800">1. Protected Health Information (PHI)</p>
                  <p>
                    All patient DICOM data, demographics, and bone scan records are handled under strict HIPAA and HITECH security standards. DICOM headers are de-identified or encrypted with AES-256 in transit and at rest.
                  </p>
                  <p className="font-semibold text-slate-800">2. Audit Logging</p>
                  <p>
                    Access logs record clinician identity, patient MRN viewed, risk assessments computed, and surgical notes created. Logs are preserved for regulatory compliance and hospital accreditation.
                  </p>
                  <p className="font-semibold text-slate-800">3. Data Retention</p>
                  <p>
                    Clinical trial and evaluation cases are sandboxed. Institutional PACS integrations adhere to Business Associate Agreements (BAA) with healthcare provider networks.
                  </p>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAgreed(true);
                  setLegalModal(null);
                }}
                className="py-2 px-4 bg-clinical-blue text-white rounded-xl text-xs font-bold hover:bg-clinical-blue-dark transition-colors"
              >
                Accept & Agree
              </button>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="py-2 px-4 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
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
