export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  METABOLIC: '/patients/:patientId/metabolic',
  ASSESSMENT: '/patients/:patientId/assessment',
  PLANNING: '/patients/:patientId/planning',
  SUMMARY: '/patients/:patientId/summary',
};

export const getPatientRoute = (patientId, tab = 'metabolic') => {
  return `/patients/${patientId}/${tab}`;
};

export const STEP_LABELS = [
  { tab: 'dashboard', label: 'Dashboard', short: '01', path: () => '/dashboard' },
  { tab: 'metabolic', label: 'Metabolic', short: '02', path: (pid) => (pid ? `/patients/${pid}/metabolic` : '/metabolic') },
  { tab: 'assessment', label: 'AI Assessment', short: '03', path: (pid) => (pid ? `/patients/${pid}/assessment` : '/assessment') },
  { tab: 'planning', label: '3D Planning', short: '04', path: (pid) => (pid ? `/patients/${pid}/planning` : '/planning') },
  { tab: 'summary', label: 'Pre-Surgery', short: '05', path: (pid) => (pid ? `/patients/${pid}/summary` : '/summary') },
];

export const RISK_LEVELS = {
  HIGH: 'High',
  MODERATE: 'Moderate',
  LOW: 'Low',
};
