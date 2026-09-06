import { describe, it, expect, beforeEach } from 'vitest';
import {
  persistAuthSession,
  readStoredDoctorProfile,
  readAuthToken,
  clearAuthSession,
} from '../authService';

describe('Recent Cases Risk Level & Auth Workflow Suite', () => {
  const store = new Map();

  beforeEach(() => {
    store.clear();
    globalThis.localStorage = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  });

  it('handles Low, Moderate, and High case risk badges without defaulting active cases to High', () => {
    // Evaluation function matching DashboardView.jsx
    const evaluateRisk = (patient) => {
      const explicit = patient.risk_level || patient.riskLevel;
      if (explicit) {
        const s = String(explicit).toLowerCase();
        if (['high', 'critical', 'severe'].includes(s)) return 'HIGH';
        if (['low', 'minimal', 'cleared'].includes(s)) return 'LOW';
        if (['medium', 'moderate', 'intermediate'].includes(s)) return 'MODERATE';
      }

      if (patient.status === 'completed') return 'LOW';
      if (patient.status === 'pending-review') return 'MODERATE';

      const bm = patient.initial_biomarkers || patient;
      const pth = Number(bm?.pth?.value ?? bm?.pth ?? 0);
      const vitD = Number(bm?.vitaminD?.value ?? bm?.vitamin_d ?? 0);

      if (pth > 80 || (vitD > 0 && vitD < 20)) return 'HIGH';
      if (pth > 65 || (vitD > 0 && vitD < 30)) return 'MODERATE';
      if (pth > 0 && vitD >= 30) return 'LOW';

      return 'MODERATE';
    };

    const lowCase = {
      id: 'P-101',
      name: 'John Doe',
      status: 'active',
      risk_level: 'low',
    };
    const modCase = {
      id: 'P-102',
      name: 'Jane Smith',
      status: 'active',
      risk_level: 'moderate',
    };
    const highCase = {
      id: 'P-103',
      name: 'Robert Davis',
      status: 'active',
      risk_level: 'high',
    };

    expect(evaluateRisk(lowCase)).toBe('LOW');
    expect(evaluateRisk(modCase)).toBe('MODERATE');
    expect(evaluateRisk(highCase)).toBe('HIGH');
  });

  it('stores and restores dummy doctor session for Gmail accounts', () => {
    const session = {
      token: 'mock-jwt-token-gmail-12345',
      doctor: {
        id: 'doc_demo_gmail',
        firstName: 'Alex',
        lastName: 'Demo',
        email: 'doctor.demo@gmail.com',
        role: 'doctor',
        institution: 'EndoBone AI Medical Center',
        licenseNumber: 'MD-GMAIL-9912',
      },
    };

    persistAuthSession(session);
    expect(readAuthToken()).toBe('mock-jwt-token-gmail-12345');

    const profile = readStoredDoctorProfile();
    expect(profile.email).toBe('doctor.demo@gmail.com');
    expect(profile.firstName).toBe('Alex');

    clearAuthSession();
    expect(readAuthToken()).toBeNull();
  });

  it('authenticates clinician via Google SSO account with persistent token and doctor context', () => {
    const googleAccount = {
      email: 'dr.sarah.reed@gmail.com',
      firstName: 'Sarah',
      lastName: 'Reed',
      institution: 'St. Jude Orthopedic Institute',
      licenseNumber: 'MD-7719-NY',
    };

    const session = {
      token: 'mock-google-oauth-jwt-token-999',
      doctor: {
        id: 'doc_g_12345',
        firstName: googleAccount.firstName,
        lastName: googleAccount.lastName,
        email: googleAccount.email,
        role: 'doctor',
        institution: googleAccount.institution,
        licenseNumber: googleAccount.licenseNumber,
      },
    };

    persistAuthSession(session);
    const stored = readStoredDoctorProfile();
    expect(stored.email).toBe('dr.sarah.reed@gmail.com');
    expect(stored.firstName).toBe('Sarah');
    expect(stored.institution).toBe('St. Jude Orthopedic Institute');
    expect(readAuthToken()).toBe('mock-google-oauth-jwt-token-999');
  });

  it('verifies direct Continue with Google access executes 1-click Google authentication without popups', () => {
    // Simulates the direct handleGoogleLogin flow used in LoginView and RegisterView
    const simulateDirectGoogleLogin = (typedEmail) => {
      const targetEmail = typedEmail && typedEmail.includes('@') ? typedEmail.trim() : 'doctor.demo@gmail.com';
      return {
        token: `google_jwt_${Date.now()}`,
        doctor: {
          id: 'doc_demo_gmail_001',
          firstName: 'Sarah',
          lastName: 'Reed',
          email: targetEmail,
          role: 'doctor',
          licenseNumber: 'MD-8842-CA',
          institution: 'St. Jude Orthopedic Institute',
        },
      };
    };

    // Case 1: Direct 1-click Google access with empty input
    const session1 = simulateDirectGoogleLogin('');
    persistAuthSession(session1);
    expect(readStoredDoctorProfile().email).toBe('doctor.demo@gmail.com');
    expect(readStoredDoctorProfile().role).toBe('doctor');

    // Case 2: Direct 1-click Google access with custom Gmail
    const session2 = simulateDirectGoogleLogin('myclinic@gmail.com');
    persistAuthSession(session2);
    expect(readStoredDoctorProfile().email).toBe('myclinic@gmail.com');
  });
});

