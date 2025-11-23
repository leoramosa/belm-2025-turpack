"use client";

import { useGlobalLoaderStore } from "@/store/useGlobalLoaderStore";

interface ActionLoaderProps {
  action: string;
  duration?: number;
  children: React.ReactNode;
}

export default function ActionLoader({
  action,
  duration = 1000,
  children,
}: ActionLoaderProps) {
  const { startLoading, stopLoading } = useGlobalLoaderStore();

  const handleAction = async () => {
    startLoading(action);

    // Simular la acción
    await new Promise((resolve) => setTimeout(resolve, duration));

    stopLoading();
  };

  return <div onClick={handleAction}>{children}</div>;
}
