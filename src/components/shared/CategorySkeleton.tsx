"use client";

interface CategorySkeletonProps {
  count?: number;
}

export default function CategorySkeleton({ count = 4 }: CategorySkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
      {skeletons.map((i) => (
        <div key={i} className="flex flex-col items-center animate-pulse">
          <div className="w-40 h-40 rounded-full bg-gray-200 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      ))}
    </div>
  );
}
