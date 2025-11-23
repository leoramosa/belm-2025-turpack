"use client";
import MyAccountProfilePage from "@/components/MyAccountProfilePage";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function MyAccountPageWrapper() {
  const { profile } = useUserStore();
  const { isAuthenticated, loadUserProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const hasAttemptedLoad = useRef(false);

  useEffect(() => {
    const initializeProfile = async () => {
      // Si no está autenticado, redirigir a login
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      // Si ya tenemos profile, no cargar de nuevo
      if (profile) {
        setIsLoading(false);
        return;
      }

      // Si ya intentamos cargar y no hay profile, mostrar error
      if (hasAttemptedLoad.current && !profile) {
        setIsLoading(false);
        return;
      }

      try {
        await loadUserProfile();
        setIsLoading(false);
        hasAttemptedLoad.current = true;
      } catch (error) {
        console.error("Error cargando perfil:", error);
        hasAttemptedLoad.current = true;
        // NO redirigir a login para evitar bucle infinito
        // Solo mostrar error en la página
        setIsLoading(false);
      }
    };

    // Solo cargar si está autenticado
    if (isAuthenticated) {
      initializeProfile();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, profile, router, loadUserProfile]);

  // Mostrar loading solo si está autenticado y no tiene profile
  if (isLoading && isAuthenticated && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (ya se redirige)
  if (!isAuthenticated) {
    return null;
  }

  // Si no hay profile después de cargar, mostrar mensaje de error
  if (!profile && hasAttemptedLoad.current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error cargando perfil
          </h2>
          <p className="text-gray-600 mb-4">
            No se pudo cargar tu perfil. Esto puede deberse a un problema de
            conexión.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return <MyAccountProfilePage profile={profile!} />;
}
