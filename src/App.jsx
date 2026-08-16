import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { PatientDataProvider } from './context/PatientDataContext';
import {
  LandingView,
  DashboardView,
  MetabolicContextView,
  AIAssessmentView,
  Planning3DView,
  PreSurgicalSummaryView,
} from './components/views';

export default function App() {
  return (
    <PatientDataProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingView />} />

        {/* Clinical Workspace Multipage App Layout */}
        <Route element={<MainLayout />}>
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
    </BrowserRouter>
  </PatientDataProvider>
  );
}
