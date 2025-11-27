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
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Limpiar timeout si existe
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    const initializeProfile = async () => {
      // Si no está autenticado, redirigir a login
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      // Si ya tenemos profile y tiene datos válidos, no cargar de nuevo
      if (profile && profile.id && profile.email) {
        console.log(
          "Profile ya existe con datos válidos, no es necesario cargar"
        );
        setIsLoading(false);
        hasAttemptedLoad.current = true;
        return;
      }

      // Esperar un tiempo razonable para que el perfil cargado en LoginPage se sincronice
      // Esto evita mostrar el error prematuramente
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Verificar nuevamente si el profile se cargó mientras esperábamos
      const currentProfile = useUserStore.getState().profile;
      if (currentProfile && currentProfile.id && currentProfile.email) {
        console.log("Profile se cargó mientras esperábamos");
        setIsLoading(false);
        hasAttemptedLoad.current = true;
        return;
      }

      // Si ya intentamos cargar y no hay profile, intentar de nuevo una vez más
      if (hasAttemptedLoad.current && !currentProfile) {
        console.log("Reintentando cargar perfil...");
        hasAttemptedLoad.current = false; // Permitir un reintento
        // Esperar un poco antes de reintentar
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      try {
        console.log("Iniciando carga de perfil...");

        // Obtener el email del store directamente para evitar race conditions
        const currentUser = useUserStore.getState().user;
        let userEmail = currentUser?.user_email || currentUser?.email;

        // Si no hay email del user, intentar obtenerlo del profile existente
        if (!userEmail && currentProfile?.email) {
          userEmail = currentProfile.email;
          console.log("Usando email del profile existente:", userEmail);
        }

        // Si aún no hay email, esperar un poco más y reintentar
        if (!userEmail) {
          console.warn("No hay email disponible, esperando...");
          await new Promise((resolve) => setTimeout(resolve, 500));

          const retryUser = useUserStore.getState().user;
          const retryProfile = useUserStore.getState().profile;
          userEmail =
            retryUser?.user_email || retryUser?.email || retryProfile?.email;

          // Verificar si el profile se cargó mientras esperábamos
          if (retryProfile && retryProfile.id && retryProfile.email) {
            console.log("Profile se cargó durante la espera");
            setIsLoading(false);
            hasAttemptedLoad.current = true;
            return;
          }
        }

        // Si finalmente no hay email, pero hay profile válido, no hacer nada
        if (!userEmail && currentProfile && currentProfile.email) {
          console.log("Profile ya existe, no es necesario cargar de nuevo");
          setIsLoading(false);
          hasAttemptedLoad.current = true;
          return;
        }

        // Si no hay email, no intentar cargar (evitar errores)
        if (!userEmail) {
          console.warn(
            "No se pudo obtener el email. Esperando a que el perfil se cargue desde el login..."
          );
          // No marcar como intentado todavía, dar más tiempo
          // Configurar un timeout para mostrar error solo después de mucho tiempo
          loadingTimeoutRef.current = setTimeout(() => {
            if (!useUserStore.getState().profile) {
              console.warn(
                "Timeout: El perfil no se cargó después de mucho tiempo"
              );
              setIsLoading(false);
              hasAttemptedLoad.current = true;
            }
          }, 5000); // Esperar 5 segundos antes de mostrar error
          return;
        }

        const loadedProfile = await loadUserProfile(!currentProfile, userEmail);
        console.log("Perfil cargado:", loadedProfile);

        if (loadedProfile) {
          setIsLoading(false);
          hasAttemptedLoad.current = true;
        } else {
          console.warn("No se pudo cargar el perfil");
          // No marcar como intentado todavía, dar más tiempo
          loadingTimeoutRef.current = setTimeout(() => {
            if (!useUserStore.getState().profile) {
              setIsLoading(false);
              hasAttemptedLoad.current = true;
            }
          }, 3000);
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
        // No marcar como intentado inmediatamente, dar tiempo para que se cargue desde login
        loadingTimeoutRef.current = setTimeout(() => {
          if (!useUserStore.getState().profile) {
            setIsLoading(false);
            hasAttemptedLoad.current = true;
          }
        }, 3000);
      }
    };

    // Solo cargar si está autenticado
    if (isAuthenticated) {
      initializeProfile();
    } else {
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isAuthenticated, profile, router, loadUserProfile]);

  // Efecto para detectar cuando el profile se carga y actualizar el estado
  useEffect(() => {
    if (profile && profile.id && profile.email && isLoading) {
      console.log("Profile detectado, actualizando estado de loading");
      setIsLoading(false);
      hasAttemptedLoad.current = true;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    }
  }, [profile, isLoading]);

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

  // Si no hay profile después de cargar Y ha pasado suficiente tiempo, mostrar mensaje de error
  // Solo mostrar error si realmente ha fallado después de varios intentos
  if (!profile && hasAttemptedLoad.current && !isLoading) {
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
            onClick={() => {
              hasAttemptedLoad.current = false;
              setIsLoading(true);
              // Forzar recarga del perfil
              const currentUser = useUserStore.getState().user;
              const userEmail = currentUser?.user_email || currentUser?.email;
              if (userEmail) {
                loadUserProfile(true, userEmail)
                  .then(() => {
                    setIsLoading(false);
                    hasAttemptedLoad.current = true;
                  })
                  .catch(() => {
                    setIsLoading(false);
                    hasAttemptedLoad.current = true;
                  });
              } else {
                setIsLoading(false);
              }
            }}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Solo mostrar el perfil si tiene datos válidos (id y email)
  if (profile && profile.id && profile.email) {
    return <MyAccountProfilePage profile={profile} />;
  }

  // Si aún está cargando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  // Si no hay perfil y no está cargando, mostrar error
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Perfil no disponible
        </h2>
        <p className="text-gray-600 mb-4">
          No se pudo cargar tu perfil. Por favor, intenta de nuevo.
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
