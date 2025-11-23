"use client";

import { useWishlistBackendSync } from "@/hooks/useWishlistBackendSync";

interface WishlistSyncProviderProps {
  children: React.ReactNode;
}

export default function WishlistSyncProvider({
  children,
}: WishlistSyncProviderProps) {
  // Sincronizar con backend cuando el usuario esté autenticado
  useWishlistBackendSync();

  return <>{children}</>;
}
