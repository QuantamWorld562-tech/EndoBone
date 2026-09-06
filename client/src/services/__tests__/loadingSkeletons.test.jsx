import { describe, it, expect } from 'vitest';
import React from 'react';
import {
  SkeletonBlock,
  CaseLoadingOverlay,
  DashboardSkeleton,
  MetabolicAnalyzeSkeleton,
  AssessmentSkeleton,
  Planning3DSkeleton,
  PreSurgicalSummarySkeleton,
  AdminDashboardSkeleton,
  AppLoadingSkeleton,
  WorkspaceRouteSkeleton,
} from '../../components/common/LoadingSkeleton';

describe('Loading Skeletons Suite', () => {
  it('exports all necessary skeleton components', () => {
    expect(typeof SkeletonBlock).toBe('function');
    expect(typeof CaseLoadingOverlay).toBe('function');
    expect(typeof DashboardSkeleton).toBe('function');
    expect(typeof MetabolicAnalyzeSkeleton).toBe('function');
    expect(typeof AssessmentSkeleton).toBe('function');
    expect(typeof Planning3DSkeleton).toBe('function');
    expect(typeof PreSurgicalSummarySkeleton).toBe('function');
    expect(typeof AdminDashboardSkeleton).toBe('function');
    expect(typeof AppLoadingSkeleton).toBe('function');
    expect(typeof WorkspaceRouteSkeleton).toBe('function');
  });

  it('instantiates all skeletons as valid React elements', () => {
    const skeletons = [
      <SkeletonBlock key="1" />,
      <CaseLoadingOverlay key="2" />,
      <DashboardSkeleton key="3" />,
      <MetabolicAnalyzeSkeleton key="4" />,
      <AssessmentSkeleton key="5" />,
      <Planning3DSkeleton key="6" />,
      <PreSurgicalSummarySkeleton key="7" />,
      <AdminDashboardSkeleton key="8" />,
      <AppLoadingSkeleton key="9" />,
      <WorkspaceRouteSkeleton key="10" />,
    ];

    skeletons.forEach((element) => {
      expect(React.isValidElement(element)).toBe(true);
    });
  });

  it('renders SkeletonBlock with custom className', () => {
    const el = SkeletonBlock({ className: 'h-10 w-20' });
    expect(el.props.className).toContain('h-10 w-20');
    expect(el.props.className).toContain('animate-shimmer');
  });
});
