import { cx } from "@/utils/cx";

interface PageSkeletonProps {
  variant?: "list" | "detail" | "form" | "cards" | "dashboard";
  rows?: number;
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cx("rounded-lg bg-quaternary", className)} />;
}

function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex flex-col gap-1">
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="mt-1 h-4 w-96" />
      </div>
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-10 w-64 rounded-lg" />
        <SkeletonBlock className="ml-auto h-10 w-32 rounded-lg" />
      </div>
      <div className="rounded-xl border border-secondary">
        <div className="border-b border-secondary bg-secondary px-4 py-3">
          <SkeletonBlock className="h-4 w-full" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-secondary px-4 py-4 last:border-0">
            <SkeletonBlock className="size-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-48" />
              <SkeletonBlock className="h-3 w-32" />
            </div>
            <SkeletonBlock className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <SkeletonBlock className="h-5 w-24" />
      <div className="flex flex-col gap-1">
        <SkeletonBlock className="h-8 w-72" />
        <SkeletonBlock className="mt-1 h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-secondary p-5 space-y-3">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-6 w-32" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-secondary p-6 space-y-4">
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-4 w-5/6" />
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <SkeletonBlock className="h-5 w-24" />
      <div className="flex flex-col gap-1">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="mt-1 h-4 w-80" />
      </div>
      <div className="rounded-xl border border-secondary p-6 space-y-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3">
        <SkeletonBlock className="h-10 w-24 rounded-lg" />
        <SkeletonBlock className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex flex-col gap-1">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="mt-1 h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border border-secondary p-5 space-y-3">
            <SkeletonBlock className="size-10 rounded-lg" />
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <SkeletonBlock className="h-10 w-72" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-secondary p-5 space-y-3">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-8 w-16" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-xl border border-secondary p-4 space-y-2">
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-6 w-12" />
          </div>
        ))}
      </div>
      <SkeletonBlock className="h-64 rounded-xl" />
    </div>
  );
}

export function PageSkeleton({ variant = "list", rows = 6 }: PageSkeletonProps) {
  switch (variant) {
    case "dashboard":
      return <DashboardSkeleton />;
    case "detail":
      return <DetailSkeleton />;
    case "form":
      return <FormSkeleton />;
    case "cards":
      return <CardsSkeleton />;
    case "list":
    default:
      return <ListSkeleton rows={rows} />;
  }
}
