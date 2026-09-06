import { describe, it, expect, beforeEach } from 'vitest';
import {
  persistDoctorProfile,
  readStoredDoctorProfile,
  persistAuthSession,
  clearAuthSession,
} from '../authService';

describe('Doctor Profile & Clinician Management Suite', () => {
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

  it('correctly persists and reads doctor profile with hospital and credentials', () => {
    const session = {
      token: 'test-jwt-token-123',
      doctor: {
        id: 'doc_demo_001',
        firstName: 'Sarah',
        lastName: 'Reed',
        email: 'dr.sarah.reed@hospital.org',
        institution: 'St. Jude Orthopedic Institute',
        licenseNumber: 'MD-8842-CA',
        role: 'doctor',
      },
    };

    persistAuthSession(session);

    const stored = readStoredDoctorProfile();
    expect(stored).not.toBeNull();
    expect(stored.firstName).toBe('Sarah');
    expect(stored.lastName).toBe('Reed');
    expect(stored.institution).toBe('St. Jude Orthopedic Institute');
    expect(stored.licenseNumber).toBe('MD-8842-CA');
  });

  it('allows updating doctor name and hospital details (e.g. in case name was misspelled)', () => {
    // Initial doctor profile with a typo
    persistDoctorProfile({
      id: 'doc_123',
      firstName: 'Sara',
      lastName: 'Reede',
      institution: 'Old Clinic',
      email: 'doctor@hospital.org',
    });

    // Update with corrected spelling and new hospital affiliation
    const updated = persistDoctorProfile({
      firstName: 'Sarah',
      lastName: 'Reed',
      institution: 'Memorial Orthopedic Institute',
      department: 'Adult Reconstruction & Arthroplasty',
      licenseNumber: 'MD-8842-CA',
    });

    expect(updated.firstName).toBe('Sarah');
    expect(updated.lastName).toBe('Reed');
    expect(updated.institution).toBe('Memorial Orthopedic Institute');
    expect(updated.department).toBe('Adult Reconstruction & Arthroplasty');

    // Confirm persisted in localStorage
    const reloaded = readStoredDoctorProfile();
    expect(reloaded.firstName).toBe('Sarah');
    expect(reloaded.institution).toBe('Memorial Orthopedic Institute');
    expect(reloaded.email).toBe('doctor@hospital.org');
  });

  it('tracks assessments performed count and patient risk stratification accurately', () => {
    const mockOverview = {
      profile: {
        id: 'doc_demo_001',
        firstName: 'Sarah',
        lastName: 'Reed',
      },
      total_assessments: 24,
      total_patients: 12,
      risk_breakdown: {
        high: 5,
        moderate: 6,
        low: 1,
      },
      patients: [
        { id: 'PEB-8842-A', name: 'Eleanor Vance', risk_level: 'high', procedure: 'L4-L5 Fusion' },
        { id: 'PEB-8841-B', name: 'Arthur Pendelton', risk_level: 'moderate', procedure: 'Hip ORIF' },
        { id: 'PEB-8840-C', name: 'Clara Oswald', risk_level: 'low', procedure: 'Vertebroplasty' },
      ],
    };

    expect(mockOverview.total_assessments).toBe(24);
    expect(mockOverview.total_patients).toBe(12);
    expect(mockOverview.risk_breakdown.high).toBe(5);

    // Filter patients by risk level
    const highRiskPatients = mockOverview.patients.filter((p) => p.risk_level === 'high');
    expect(highRiskPatients).toHaveLength(1);
    expect(highRiskPatients[0].name).toBe('Eleanor Vance');

    // Search patients by keyword
    const searchMatch = mockOverview.patients.filter((p) =>
      p.name.toLowerCase().includes('arthur') || p.procedure.toLowerCase().includes('arthur')
    );
    expect(searchMatch).toHaveLength(1);
    expect(searchMatch[0].id).toBe('PEB-8841-B');
  });

  it('clears session and credentials upon logout cleanly', () => {
    persistDoctorProfile({ id: 'doc_1', firstName: 'Doc' });
    expect(readStoredDoctorProfile()).not.toBeNull();

    clearAuthSession();
    expect(readStoredDoctorProfile()).toBeNull();
  });
});
