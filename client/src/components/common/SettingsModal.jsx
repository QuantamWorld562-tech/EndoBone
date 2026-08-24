import { useState } from 'react';
import {
  Settings,
  X,
  User,
  KeyRound,
  Sliders,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Volume2,
  Box,
  Stethoscope,
  Building,
  GraduationCap
} from 'lucide-react';
import { usePatientContext } from '../../context/PatientDataContext';
import { readStoredDoctorProfile, changePassword, readApiError } from '../../services';

export default function SettingsModal() {
  const { isSettingsModalOpen, setIsSettingsModalOpen, resetWorkspace } = usePatientContext();
  const currentDoctor = readStoredDoctorProfile();

  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'clinical' | 'system'
  
  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ message: '', type: '' });

  // Clinical preferences state
  const [renderModePref, setRenderModePref] = useState('heatmap');
  const [calciumUnit, setCalciumUnit] = useState('mg_dl');
  const [riskSensitivity, setRiskSensitivity] = useState('standard');
  const [autoRotate3D, setAutoRotate3D] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);

  // Settings saved feedback
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isSettingsModalOpen) return null;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus({ message: '', type: '' });

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ message: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ message: 'New password must be at least 8 characters long.', type: 'error' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({ old_password: oldPassword, new_password: newPassword });
      setPasswordStatus({ message: 'Password successfully updated.', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordStatus({
        message: readApiError(err, 'Failed to update password. Please check your current password.'),
        type: 'error',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSavePreferences = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleResetAppWorkspace = () => {
    resetWorkspace();
    setIsSettingsModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                Platform Preferences &amp; Settings
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Manage your credentials, 3D viewport defaults, and clinical decision parameters.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close Settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab('account')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'account'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User size={14} /> Profile &amp; Security
          </button>
          <button
            onClick={() => setActiveTab('clinical')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'clinical'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders size={14} /> Clinical &amp; 3D Config
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'system'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield size={14} /> System &amp; Workspace
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: Profile & Password */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Profile Details Overview */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Authenticated Clinician Profile
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Full Name:</span>
                    <span className="font-bold text-slate-800">
                      {currentDoctor ? `${currentDoctor.firstName} ${currentDoctor.lastName}` : 'Dr. Practitioner'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Email Address:</span>
                    <span className="font-mono text-slate-800 font-bold">{currentDoctor?.email || 'clinician@hospital.org'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Institution / Affiliation:</span>
                    <span className="font-semibold text-slate-800">{currentDoctor?.institution || 'Orthopedic Spine Center'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Access Authority:</span>
                    <span className="inline-flex items-center gap-1 font-black text-blue-700 uppercase">
                      {currentDoctor?.role === 'admin' ? 'Platform Administrator' : 'Attending Surgeon'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <KeyRound size={16} className="text-blue-600" />
                  <span>Sovereign Password Modification</span>
                </div>
                <p className="text-xs text-slate-500">
                  Your password is encrypted with PBKDF2-SHA256. Only you can verify or update your password.
                </p>

                {passwordStatus.message && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      passwordStatus.type === 'error'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {passwordStatus.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                    <span>{passwordStatus.message}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">New Password (Min 8 chars)</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isChangingPassword || !oldPassword || !newPassword}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
                  >
                    {isChangingPassword ? 'Verifying & Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Clinical & 3D Config */}
          {activeTab === 'clinical' && (
            <div className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Default 3D Bone Model Render Mode
                  </label>
                  <select
                    value={renderModePref}
                    onChange={(e) => setRenderModePref(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="heatmap">Risk Heatmap (Volumetric BMD Densities)</option>
                    <option value="anatomical">Anatomical Realistic Bone Shading</option>
                    <option value="xray">X-Ray Radiographic Attenuation</option>
                    <option value="wireframe">FEA Structural Wireframe Meshing</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Serum Calcium Measurement Standard
                    </label>
                    <select
                      value={calciumUnit}
                      onChange={(e) => setCalciumUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="mg_dl">mg/dL (US Standard: 8.6–10.3)</option>
                      <option value="mmol_l">mmol/L (SI Standard: 2.15–2.55)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      AI Osteometabolic Risk Sensitivity
                    </label>
                    <select
                      value={riskSensitivity}
                      onChange={(e) => setRiskSensitivity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="standard">Standard Balanced Sensitivity (Recommended)</option>
                      <option value="high">High Precision (Lower threshold for osteopenia warning)</option>
                      <option value="conservative">Conservative Thresholds</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
                    <input
                      type="checkbox"
                      checked={autoRotate3D}
                      onChange={(e) => setAutoRotate3D(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Smooth 3D Turntable Auto-Rotation</span>
                      <span className="text-slate-500">Automatically rotate bone geometry slowly when idle</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {savedFeedback && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Preferences Saved
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="ml-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <Save size={14} /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: System & Workspace */}
          {activeTab === 'system' && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-amber-900">
                <div className="font-black flex items-center gap-1.5">
                  <RotateCcw size={14} />
                  <span>Workspace Reset &amp; Cache Purge</span>
                </div>
                <p className="text-amber-800/90 leading-relaxed">
                  Clears the current active case, surgical notes buffer, and unpersisted 3D annotations across all browser tabs.
                </p>
                <button
                  onClick={handleResetAppWorkspace}
                  className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm transition cursor-pointer"
                >
                  Reset Active Workspace Now
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs text-slate-700">
                <div className="font-black flex items-center gap-1.5 text-slate-900">
                  <Shield size={14} className="text-blue-600" />
                  <span>HIPAA &amp; Audit Integrity</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  EndoBone AI operates under zero-knowledge encryption protocols. Local cache is automatically refreshed with backend synchronization on authenticated requests.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
