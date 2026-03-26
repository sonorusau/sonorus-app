import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
}: SkeletonProps): JSX.Element {
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {
    width: width || (variant === "circular" ? height : "100%"),
    height: height || (variant === "text" ? "1rem" : undefined),
  };

  return (
    <div
      className={`skeleton ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

// Patient card skeleton for loading states in patient list
export function PatientCardSkeleton(): JSX.Element {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 skeleton rounded" />
          <div className="h-3 w-20 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}

// Patient detail skeleton for main content area
export function PatientDetailSkeleton(): JSX.Element {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full skeleton" />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-48 skeleton rounded" />
          <div className="h-4 w-32 skeleton rounded" />
        </div>
      </div>

      {/* Quick stats skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white/5 rounded-xl p-4 border border-white/10"
          >
            <div className="h-8 w-12 skeleton rounded mb-2 mx-auto" />
            <div className="h-3 w-16 skeleton rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Details section skeleton */}
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <div className="bg-white/5 px-5 py-3">
          <div className="h-4 w-32 skeleton rounded" />
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 skeleton rounded" />
              <div className="h-5 w-28 skeleton rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Recordings section skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 skeleton rounded" />
          <div className="h-9 w-28 skeleton rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <RecordingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Recording card skeleton for recording lists
export function RecordingCardSkeleton(): JSX.Element {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full skeleton" />
          <div className="space-y-2">
            <div className="h-4 w-24 skeleton rounded" />
            <div className="h-3 w-36 skeleton rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-lg skeleton" />
          <div className="w-8 h-8 rounded-lg skeleton" />
          <div className="w-16 h-8 rounded-lg skeleton" />
        </div>
      </div>
    </div>
  );
}

// Generic list skeleton
export function ListSkeleton({ count = 5 }: { count?: number }): JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 skeleton rounded" />
              <div className="h-3 w-1/2 skeleton rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
