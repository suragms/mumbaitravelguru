'use client';

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-monsoon/40 rounded ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-harbour border border-monsoon/50 rounded-xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-9 h-9 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <SkeletonBlock className="h-3.5 w-3/5" />
          <SkeletonBlock className="h-3 w-2/5" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <SkeletonBlock className="h-4 w-12" />
          <SkeletonBlock className="h-3 w-16" />
        </div>
        <div className="flex flex-col items-center space-y-1">
          <SkeletonBlock className="h-3 w-full" />
          <SkeletonBlock className="h-2 w-8" />
        </div>
        <div className="space-y-1.5 text-right">
          <SkeletonBlock className="h-4 w-12 ml-auto" />
          <SkeletonBlock className="h-3 w-16 ml-auto" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <SkeletonBlock className="h-5 w-14 rounded-full" />
        <SkeletonBlock className="h-5 w-14 rounded-full" />
        <SkeletonBlock className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-monsoon/30">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-8 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonHotelCard() {
  return (
    <div className="bg-harbour border border-monsoon/50 rounded-xl overflow-hidden">
      <SkeletonBlock className="h-36 sm:h-44 rounded-none" />
      <div className="p-3 sm:p-4 space-y-2.5">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-5 w-12 rounded" />
          <SkeletonBlock className="h-3 w-20" />
        </div>
        <div className="flex gap-1.5">
          <SkeletonBlock className="h-5 w-14 rounded-full" />
          <SkeletonBlock className="h-5 w-14 rounded-full" />
          <SkeletonBlock className="h-5 w-10 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-monsoon/30">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-8 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonBusCard() {
  return (
    <div className="bg-harbour border border-monsoon/50 rounded-xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="w-9 h-9 rounded-lg" />
          <div className="space-y-1.5">
            <SkeletonBlock className="h-3.5 w-32" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        </div>
        <SkeletonBlock className="h-5 w-14 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <SkeletonBlock className="h-4 w-12" />
          <SkeletonBlock className="h-3 w-16" />
        </div>
        <div className="flex flex-col items-center space-y-1">
          <SkeletonBlock className="h-3 w-full" />
          <SkeletonBlock className="h-2 w-12" />
        </div>
        <div className="space-y-1.5 text-right">
          <SkeletonBlock className="h-4 w-12 ml-auto" />
          <SkeletonBlock className="h-3 w-16 ml-auto" />
        </div>
      </div>
      <div className="flex gap-2">
        <SkeletonBlock className="h-5 w-14 rounded-full" />
        <SkeletonBlock className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-monsoon/30">
        <div className="space-y-1">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-3 w-20" />
        </div>
        <SkeletonBlock className="h-8 w-28 rounded-lg" />
      </div>
    </div>
  );
}
