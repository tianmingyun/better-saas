import { cn } from '@/lib/utils';

function SkeletonDiv({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export function LoadingSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Skeleton */}
      <div className="w-64 border-r bg-card p-4">
        <SkeletonDiv className="mb-6 h-8 w-32" />
        <div className="space-y-2">
          <SkeletonDiv className="h-10 w-full" />
          <SkeletonDiv className="h-10 w-full" />
          <SkeletonDiv className="h-10 w-full" />
          <SkeletonDiv className="h-10 w-full" />
          <SkeletonDiv className="h-10 w-full" />
          <SkeletonDiv className="h-10 w-full" />
          <SkeletonDiv className="h-10 w-full" />
          <SkeletonDiv className="h-10 w-full" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-1 flex-col">
        {/* Header Skeleton */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <SkeletonDiv className="h-8 w-48" />
            <SkeletonDiv className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <SkeletonDiv className="h-8 w-64" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-3">
                <SkeletonDiv className="h-32 w-full" />
                <SkeletonDiv className="h-4 w-3/4" />
                <SkeletonDiv className="h-4 w-1/2" />
              </div>
              <div className="space-y-3">
                <SkeletonDiv className="h-32 w-full" />
                <SkeletonDiv className="h-4 w-3/4" />
                <SkeletonDiv className="h-4 w-1/2" />
              </div>
              <div className="space-y-3">
                <SkeletonDiv className="h-32 w-full" />
                <SkeletonDiv className="h-4 w-3/4" />
                <SkeletonDiv className="h-4 w-1/2" />
              </div>
              <div className="space-y-3">
                <SkeletonDiv className="h-32 w-full" />
                <SkeletonDiv className="h-4 w-3/4" />
                <SkeletonDiv className="h-4 w-1/2" />
              </div>
              <div className="space-y-3">
                <SkeletonDiv className="h-32 w-full" />
                <SkeletonDiv className="h-4 w-3/4" />
                <SkeletonDiv className="h-4 w-1/2" />
              </div>
              <div className="space-y-3">
                <SkeletonDiv className="h-32 w-full" />
                <SkeletonDiv className="h-4 w-3/4" />
                <SkeletonDiv className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
