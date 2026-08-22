import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { PatientDataProvider } from './context/PatientDataContext';
import { hydrateAuthHeader } from './services';
import {
  LandingView,
  LoginView,
  RegisterView,
  DashboardView,
  MetabolicContextView,
  AIAssessmentView,
  Planning3DView,
  PreSurgicalSummaryView,
} from './components/views';

function ProtectedRoute({ children }) {
  const token = hydrateAuthHeader();
  return token ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const token = hydrateAuthHeader();
  return token ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PatientDataProvider>
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
            <Route path="/patients/:patientId/dashboard" element={<DashboardView />} />
            <Route path="/patients/:patientId/metabolic" element={<MetabolicContextView />} />
            <Route path="/patients/:patientId/assessment" element={<AIAssessmentView />} />
            <Route path="/patients/:patientId/planning" element={<Planning3DView />} />
            <Route path="/patients/:patientId/summary" element={<PreSurgicalSummaryView />} />
            <Route path="/patients/:patientId" element={<Navigate to="metabolic" replace />} />
            <Route path="/workspace" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PatientDataProvider>
    </BrowserRouter>
  );
}
