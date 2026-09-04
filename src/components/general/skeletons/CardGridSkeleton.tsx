import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface CardGridSkeletonProps {
  count?: number
  columns?: 1 | 2 | 3 | 4
  className?: string
}

const columnClasses: Record<NonNullable<CardGridSkeletonProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
}

export function CardGridSkeleton({
  count = 6,
  columns = 3,
  className,
}: CardGridSkeletonProps) {
  return (
    <div className={cn("grid gap-4", columnClasses[columns], className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
        >
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  )
}
