import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { PatientDataProvider } from './context/PatientDataContext';
import { hydrateAuthHeader } from './services';
import { Suspense, lazy } from 'react';

const LandingView = lazy(() => import('./components/views/Landing/LandingView'));
const LoginView = lazy(() => import('./components/views/Login/LoginView'));
const RegisterView = lazy(() => import('./components/views/Register/RegisterView'));
const DashboardView = lazy(() => import('./components/views/Dashboard/DashboardView'));
const MetabolicContextView = lazy(() => import('./components/views/MetabolicContext/MetabolicContextView'));
const AIAssessmentView = lazy(() => import('./components/views/AIAssessment/AIAssessmentView'));
const Planning3DView = lazy(() => import('./components/views/Planning3D/Planning3DView'));
const PreSurgicalSummaryView = lazy(() => import('./components/views/PreSurgicalSummary/PreSurgicalSummaryView'));
const AdminDashboardView = lazy(() => import('./components/views/Admin/AdminDashboardView'));

function ProtectedRoute({ children }) {
  const token = hydrateAuthHeader();
  return token ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const token = hydrateAuthHeader();
  return token ? <Navigate to="/dashboard" replace /> : children;
}

function AdminRoute({ children }) {
  const token = hydrateAuthHeader();
  if (!token) return <Navigate to="/login" replace />;
  // Check if current doctor has admin role
  const profileRaw = localStorage.getItem('endobone_doctor_profile');
  try {
    const profile = JSON.parse(profileRaw || '{}');
    if (profile?.role === 'admin') {
      return children;
    }
  } catch {
    // fallback
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PatientDataProvider>
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center text-slate-500 font-medium">Loading Application...</div>}>
          <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingView />} />
          <Route
            path="/login"
            element={(
              <PublicOnlyRoute>
                <LoginView />
              </PublicOnlyRoute>
            )}
          />
          <Route
            path="/register"
            element={(
              <PublicOnlyRoute>
                <RegisterView />
              </PublicOnlyRoute>
            )}
          />

          {/* Clinical Workspace Multipage App Layout */}
          <Route
            element={(
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            )}
          >
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/patients/:patientId/dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/patients/:patientId/metabolic" element={<MetabolicContextView />} />
            <Route path="/patients/:patientId/assessment" element={<AIAssessmentView />} />
            <Route path="/patients/:patientId/planning" element={<Planning3DView />} />
            <Route path="/patients/:patientId/summary" element={<PreSurgicalSummaryView />} />
            <Route path="/metabolic" element={<MetabolicContextView />} />
            <Route path="/assessment" element={<AIAssessmentView />} />
            <Route path="/planning" element={<Planning3DView />} />
            <Route path="/summary" element={<PreSurgicalSummaryView />} />
            <Route
              path="/admin"
              element={(
                <AdminRoute>
                  <AdminDashboardView />
                </AdminRoute>
              )}
            />
            <Route path="/patients/:patientId" element={<Navigate to="metabolic" replace />} />
            <Route path="/workspace" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </PatientDataProvider>
    </BrowserRouter>
  );
}
