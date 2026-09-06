import { useState, useEffect } from 'react';
import {
  Activity,
  Box,
  Brain,
  CheckCircle2,
  Clock,
  Sparkles,
  FlaskConical,
  Shield,
  Users,
  FileText,
  Bone,
  MapPin,
  Search,
  Filter,
  BarChart3,
  Layers,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';

/**
 * Reusable animated shimmer block
 */
export function SkeletonBlock({ className = '' }) {
  return (
    <div
      className={`rounded-2xl animate-shimmer ${className}`}
    />
  );
}

/**
 * Case Loading Modal Overlay (active when switching or loading a patient profile)
 */
export function CaseLoadingOverlay({
  patientId = 'PEB-8842-A',
  patientName = 'Patient Case',
  procedure = 'Total Hip Arthroplasty (THA)',
}) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    'Retrieving DEXA & Endocrine Lab Panels...',
    'Synthesizing Metabolic & Biomechanical Risk...',
    'Initializing Interactive 3D Bone Geometry...',
  ];

  useEffect(() => {
    const t1 = setTimeout(() => setStepIndex(1), 180);
    const t2 = setTimeout(() => setStepIndex(2), 360);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-2xl p-8 space-y-6 overflow-hidden text-center animate-in zoom-in-95 duration-200">
        {/* Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Center Animated Icon with Rotating Ring */}
        <div className="relative inline-flex items-center justify-center mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/30">
            <Activity size={36} className="animate-pulse" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border-2 border-blue-500/30 border-t-blue-600 animate-spin" />
        </div>

        {/* Patient Badge */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-black tracking-wide">
            <Sparkles size={13} className="text-blue-600" />
            <span>{patientId}</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {patientName}
          </h3>
          <p className="text-xs text-slate-500 font-medium truncate max-w-xs mx-auto">
            {procedure}
          </p>
        </div>

        {/* Step Progress Tracker */}
        <div className="space-y-2.5 bg-slate-50/80 border border-slate-100 rounded-2xl p-4 text-left">
          {steps.map((text, idx) => {
            const isDone = idx < stepIndex;
            const isCurrent = idx === stepIndex;
            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                  isDone
                    ? 'text-teal-700 font-semibold'
                    : isCurrent
                      ? 'text-blue-700 font-bold'
                      : 'text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 size={15} className="text-teal-600 shrink-0" />
                ) : isCurrent ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <Clock size={15} className="text-slate-300 shrink-0" />
                )}
                <span className="truncate">{text}</span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 font-semibold tracking-wide">
            Loading Patient Workspace...
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard View Skeleton (KPI Cards, Search Bar, Recent Cases Table)
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 min-w-0 max-w-full animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 min-w-0">
        <div className="space-y-2">
          <SkeletonBlock className="h-9 sm:h-10 w-64 sm:w-80" />
          <SkeletonBlock className="h-4 w-72 sm:w-96" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <SkeletonBlock className="h-10 sm:h-11 w-32 sm:w-36 rounded-xl" />
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-6 min-w-0">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="w-10 h-10 rounded-2xl" />
            </div>
            <SkeletonBlock className="h-8 sm:h-9 w-20" />
            <SkeletonBlock className="h-3 w-44" />
          </div>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <SkeletonBlock className="h-10 w-full sm:w-80 rounded-xl" />
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-9 w-20 rounded-xl" />
          <SkeletonBlock className="h-9 w-20 rounded-xl" />
          <SkeletonBlock className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Cases List Skeleton */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
        <div className="p-4 sm:p-6 bg-slate-50/50 flex items-center justify-between">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-4 w-20" />
        </div>
        {[1, 2, 3, 4].map((row) => (
          <div key={row} className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <SkeletonBlock className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shrink-0" />
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <SkeletonBlock className="h-5 w-36 sm:w-48" />
                  <SkeletonBlock className="h-4 w-20 rounded-full" />
                </div>
                <SkeletonBlock className="h-3.5 w-48 sm:w-64" />
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <SkeletonBlock className="h-6 w-20 rounded-full hidden sm:block" />
              <SkeletonBlock className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Metabolic Context View Skeleton (Biomarker Sliders, Endocrine Inputs, Patient Banner)
 */
export function MetabolicAnalyzeSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2.5">
          <SkeletonBlock className="h-9 w-72 max-w-full" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
        <SkeletonBlock className="h-11 w-44 rounded-xl" />
      </div>

      {/* Patient Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SkeletonBlock className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <SkeletonBlock className="h-5 w-48" />
            <SkeletonBlock className="h-3.5 w-60" />
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <SkeletonBlock className="h-8 w-24 rounded-xl" />
          <SkeletonBlock className="h-8 w-28 rounded-xl" />
        </div>
      </div>

      {/* 6 Biomarker Input Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-5 w-16 rounded-full" />
            </div>
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <div className="flex justify-between items-center pt-1">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * AI Assessment View Skeleton (Risk Gauge, Trend Radar, Pathway Matrix)
 */
export function AssessmentSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-3">
          <SkeletonBlock className="h-10 w-80 max-w-full" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-3">
          <SkeletonBlock className="h-11 w-32 rounded-xl" />
          <SkeletonBlock className="h-11 w-36 rounded-xl" />
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Column: Gauges */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-48 w-48 rounded-full mx-auto" />
            <SkeletonBlock className="h-4 w-full" />
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-36 w-full rounded-2xl" />
            <SkeletonBlock className="h-4 w-3/4" />
          </div>
        </div>

        {/* Right Column: AI Insights & Recommendation */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-7 w-64" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <div className="grid grid-cols-3 gap-3 pt-2">
              <SkeletonBlock className="h-20 w-full rounded-2xl" />
              <SkeletonBlock className="h-20 w-full rounded-2xl" />
              <SkeletonBlock className="h-20 w-full rounded-2xl" />
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-7 w-56" />
            <SkeletonBlock className="h-28 w-full rounded-2xl" />
            <div className="flex gap-2 pt-2">
              <SkeletonBlock className="h-8 w-28 rounded-xl" />
              <SkeletonBlock className="h-8 w-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Planning 3D View Skeleton (Interactive Viewport Canvas, Zone Inspector, ROI Notes)
 */
export function Planning3DSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-9 w-64" />
          <SkeletonBlock className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-28 rounded-xl" />
          <SkeletonBlock className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* 3D Canvas Viewport Skeleton */}
        <div className="lg:col-span-8 bg-slate-900 rounded-3xl border border-slate-800 h-[520px] sm:h-[580px] flex items-center justify-center relative overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
          
          <div className="space-y-4 text-center z-10">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center animate-pulse">
                <Bone size={32} className="text-slate-500" />
              </div>
              <div className="absolute -inset-2 rounded-full border-2 border-slate-700/50 border-t-blue-500 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-slate-300">Initializing 3D Bone Geometry...</p>
              <p className="text-xs text-slate-500">Mapping micro-architecture & cortical density zones</p>
            </div>
          </div>

          {/* Bottom Controls Pill Skeleton */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-4 py-2 rounded-2xl">
            <SkeletonBlock className="h-7 w-20 rounded-xl bg-slate-700" />
            <SkeletonBlock className="h-7 w-20 rounded-xl bg-slate-700" />
            <SkeletonBlock className="h-7 w-20 rounded-xl bg-slate-700" />
          </div>
        </div>

        {/* Right Sidebar Inspection Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="h-20 w-full rounded-2xl" />
            <SkeletonBlock className="h-3.5 w-full" />
            <SkeletonBlock className="h-3.5 w-4/5" />
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Pre-Surgical Summary View Skeleton (Plan, Checklists, Hardware Matrix)
 */
export function PreSurgicalSummarySkeleton() {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-8 w-72 max-w-full" />
            <SkeletonBlock className="h-4 w-96 max-w-full" />
          </div>
          <div className="flex gap-2">
            <SkeletonBlock className="h-10 w-28 rounded-xl" />
            <SkeletonBlock className="h-10 w-36 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <SkeletonBlock className="h-14 w-full rounded-xl" />
          <SkeletonBlock className="h-14 w-full rounded-xl" />
          <SkeletonBlock className="h-14 w-full rounded-xl" />
          <SkeletonBlock className="h-14 w-full rounded-xl" />
        </div>
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-24 w-full rounded-2xl" />
            <SkeletonBlock className="h-28 w-full rounded-2xl" />
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-6 w-40" />
            <div className="grid grid-cols-2 gap-3">
              <SkeletonBlock className="h-24 w-full rounded-xl" />
              <SkeletonBlock className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-6 w-44" />
            <SkeletonBlock className="h-40 w-full rounded-2xl" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Dashboard View Skeleton (Audit Metrics, User Table, Role Pills)
 */
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-9 w-64" />
          <SkeletonBlock className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
          <SkeletonBlock className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <SkeletonBlock className="h-9 w-28 rounded-xl" />
        <SkeletonBlock className="h-9 w-28 rounded-xl" />
        <SkeletonBlock className="h-9 w-32 rounded-xl" />
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-7 w-12" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        <div className="p-4 sm:p-6 bg-slate-50/60 flex items-center justify-between">
          <SkeletonBlock className="h-9 w-64 rounded-xl" />
          <SkeletonBlock className="h-9 w-32 rounded-xl" />
        </div>
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <SkeletonBlock className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-1.5 min-w-0">
                <SkeletonBlock className="h-4 w-40" />
                <SkeletonBlock className="h-3 w-56" />
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <SkeletonBlock className="h-6 w-20 rounded-full" />
              <SkeletonBlock className="h-8 w-16 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Top-level App Loading Skeleton (Displays on initial application load / root Suspense)
 */
export function AppLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-sm w-full animate-fade-in">
        {/* Animated Brand Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 text-white flex items-center justify-center shadow-2xl shadow-blue-500/40 animate-pulse">
            <Activity size={40} className="text-white" />
          </div>
          <div className="absolute -inset-2.5 rounded-3xl border-2 border-blue-500/20 border-t-teal-400 animate-spin" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-white tracking-tight">EndoBone AI</h2>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Orthopedic Endocrinology Decision Suite
          </p>
        </div>

        {/* Shimmering Loader Pill */}
        <div className="w-full space-y-2 pt-2">
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400 rounded-full animate-shimmer bg-[length:200%_100%]" />
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Initializing Clinical Workspace & AI Models...
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Route-aware Skeleton for Workspace Navigations (MainLayout Outlet Suspense)
 */
export function WorkspaceRouteSkeleton() {
  if (typeof window !== 'undefined') {
    const p = window.location.pathname;
    if (p.includes('/planning')) return <Planning3DSkeleton />;
    if (p.includes('/assessment')) return <AssessmentSkeleton />;
    if (p.includes('/metabolic')) return <MetabolicAnalyzeSkeleton />;
    if (p.includes('/summary')) return <PreSurgicalSummarySkeleton />;
    if (p.includes('/admin')) return <AdminDashboardSkeleton />;
  }
  return <DashboardSkeleton />;
}
