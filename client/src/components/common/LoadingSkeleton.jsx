import { useState, useEffect } from 'react';
import {
  Activity,
  Box,
  Brain,
  CheckCircle2,
  Clock,
  Sparkles,
  FlaskConical,
} from 'lucide-react';

export function SkeletonBlock({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer ${className}`}
    />
  );
}

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
        {/* Glow ambient circle */}
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
                className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${isDone
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

export function AssessmentSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-3">
          <SkeletonBlock className="h-10 w-80 max-w-full" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-3">
          <SkeletonBlock className="h-11 w-32" />
          <SkeletonBlock className="h-11 w-36" />
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-44 w-44 rounded-full mx-auto" />
            <SkeletonBlock className="h-4 w-full" />
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-44 w-44 rounded-full mx-auto" />
            <SkeletonBlock className="h-4 w-full" />
          </div>
        </div>
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-7 w-64" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <div className="grid grid-cols-3 gap-3 pt-2">
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-7 w-56" />
            <SkeletonBlock className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MetabolicAnalyzeSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2.5">
          <SkeletonBlock className="h-9 w-72 max-w-full" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
        <SkeletonBlock className="h-11 w-44" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-5 w-16 rounded-full" />
            </div>
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-3 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Planning3DSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonBlock className="h-9 w-64" />
          <SkeletonBlock className="h-4 w-80" />
        </div>
        <SkeletonBlock className="h-10 w-36" />
      </div>
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900 rounded-3xl border border-slate-800 h-[540px] flex items-center justify-center relative overflow-hidden">
          <div className="space-y-3 text-center">
            <SkeletonBlock className="w-24 h-24 rounded-full mx-auto bg-slate-800" />
            <SkeletonBlock className="h-4 w-48 mx-auto bg-slate-800" />
          </div>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <SkeletonBlock className="h-48 w-full rounded-2xl" />
          <SkeletonBlock className="h-48 w-full rounded-2xl" />
          <SkeletonBlock className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

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
            <SkeletonBlock className="h-20 w-full rounded-2xl" />
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

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-64" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
          <SkeletonBlock className="h-10 w-28 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-8 w-20" />
            <SkeletonBlock className="h-3 w-36" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <SkeletonBlock className="h-6 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBlock key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-56" />
          <SkeletonBlock className="h-4 w-80" />
        </div>
        <SkeletonBlock className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <SkeletonBlock className="h-6 w-44" />
        <SkeletonBlock className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function AppLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 space-y-6 text-center shadow-lg">
        <SkeletonBlock className="w-16 h-16 rounded-2xl mx-auto" />
        <div className="space-y-2">
          <SkeletonBlock className="h-6 w-48 mx-auto" />
          <SkeletonBlock className="h-4 w-64 mx-auto" />
        </div>
        <SkeletonBlock className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

export function WorkspaceRouteSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <SkeletonBlock className="h-12 w-full rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonBlock className="h-96 lg:col-span-2 rounded-3xl" />
        <SkeletonBlock className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}


