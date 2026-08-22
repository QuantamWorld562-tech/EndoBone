export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />;
}

export function AssessmentSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <SkeletonBlock className="h-10 w-80" />
          <SkeletonBlock className="h-4 w-96" />
        </div>
        <div className="flex gap-3">
          <SkeletonBlock className="h-11 w-40" />
          <SkeletonBlock className="h-11 w-40" />
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonBlock className="h-80 w-full" />
          <SkeletonBlock className="h-80 w-full" />
        </div>
        <div className="lg:col-span-3 space-y-6">
          <SkeletonBlock className="h-64 w-full" />
          <SkeletonBlock className="h-56 w-full" />
          <SkeletonBlock className="h-72 w-full" />
        </div>
      </div>
    </div>
  );
}

export function MetabolicAnalyzeSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm animate-pulse">
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-12 w-full" />
      <SkeletonBlock className="h-3 w-2/3" />
    </div>
  );
}
