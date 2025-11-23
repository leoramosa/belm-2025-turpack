"use client";

interface ProductSkeletonProps {
  count?: number;
  viewMode?: "grid" | "list";
}

export default function ProductSkeleton({
  count = 8,
  viewMode = "grid",
}: ProductSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {skeletons.map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-md p-6 flex flex-col md:flex-row gap-6 items-center animate-pulse"
          >
            <div className="relative w-full md:w-56 flex-shrink-0">
              <div className="w-full h-48 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="flex-1 w-full space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {skeletons.map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl shadow-md flex flex-col h-full animate-pulse"
        >
          <div className="relative object-cover overflow-hidden rounded-t-2xl">
            <div className="w-full aspect-square bg-gray-200"></div>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-6 bg-gray-200 rounded w-20 mb-3"></div>
            <div className="mt-auto">
              <div className="h-10 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
