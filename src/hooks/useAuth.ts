import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { useOrdersStore } from "@/store/useOrdersStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { fetchUserAccountData } from "@/services/account";

export const useAuth = () => {
  const router = useRouter();
  const { user, profile, logout, setProfile, token } = useUserStore();
  const { clearOrders } = useOrdersStore();
  const { clearWishlist, loadFromBackend } = useWishlistStore();
  const hasLoadedWishlistRef = useRef(false);
  const previousAuthStateRef = useRef(false);

  // Verificar si el usuario está autenticado
  // Después del login solo tenemos user y token, profile se carga después
  // Consideramos autenticado si tiene user y token, incluso sin profile
  const isAuthenticated =
    !!user && (!!token || !!user.token || !!user.user_email);

  // Función para cargar el perfil del usuario
  const loadUserProfile = async (
    forceReload: boolean = false,
    emailOverride?: string
  ) => {
    // Si ya tenemos profile y no se fuerza recarga, retornar el existente
    if (!forceReload && profile && profile.email) {
      return profile;
    }

    if (!isAuthenticated && !emailOverride) {
      console.warn("Intento de cargar perfil sin autenticación");
      return null;
    }

    try {
      // Intentar obtener el email de múltiples fuentes
      let userEmail = emailOverride;

      // Si no se pasó email, intentar obtenerlo del store
      if (!userEmail) {
        // Esperar un momento para que el store se actualice (si es necesario)
        if (!user || Object.keys(user).length === 0) {
          // Intentar obtener del store nuevamente después de un pequeño delay
          await new Promise((resolve) => setTimeout(resolve, 100));
          const currentUser = useUserStore.getState().user;
          userEmail =
            currentUser?.user_email ||
            currentUser?.email ||
            user?.user_email ||
            user?.email;
        } else {
          userEmail = user?.user_email || user?.email;
        }
      }

      // Si aún no hay email, intentar desde el profile existente
      if (!userEmail && profile?.email) {
        userEmail = profile.email;
      }

      if (!userEmail) {
        console.error(
          "No se encontró email del usuario. User:",
          user,
          "Profile:",
          profile
        );
        // No lanzar error, retornar null para que el componente maneje el estado
        return null;
      }

      console.log("Cargando perfil para email:", userEmail);

      // Intentar cargar datos reales de WooCommerce
      try {
        const userData = await fetchUserAccountData(userEmail);
        console.log("Perfil cargado exitosamente:", userData);
        setProfile(userData);
        return userData;
      } catch (fetchError) {
        console.error("Error al obtener datos de WooCommerce:", fetchError);
        // Si falla WooCommerce, NO crear perfil básico aquí
        // Dejar que el componente maneje el estado de carga
        throw fetchError;
      }
    } catch (error) {
      console.error("Error total al cargar perfil:", error);
      // No crear perfil de emergencia, dejar que el componente maneje el error
      throw error;
    }
  };

  // Función para proteger rutas
  const requireAuth = (redirectTo: string = "/login") => {
    if (!isAuthenticated) {
      router.push(redirectTo);
      return false;
    }
    return true;
  };

  // Función para cerrar sesión completamente
  const handleLogout = () => {
    logout();
    clearOrders(); // Limpiar órdenes del cache
    clearWishlist(); // Limpiar wishlist del cache
    router.push("/");
  };

  // Verificar autenticación en cada render
  useEffect(() => {
    if (!isAuthenticated) {
      // Solo limpiar datos sensibles (órdenes) cuando se pierde la sesión
      clearOrders();
      // Resetear el flag cuando se desautentica
      if (previousAuthStateRef.current) {
        hasLoadedWishlistRef.current = false;
      }
      previousAuthStateRef.current = false;
      return;
    }

    // Solo cargar wishlist del backend cuando el usuario se autentica por primera vez
    // No recargar en cada render para evitar sobrescribir cambios locales
    const justAuthenticated = !previousAuthStateRef.current && isAuthenticated;
    previousAuthStateRef.current = true;

    if (justAuthenticated && !hasLoadedWishlistRef.current) {
      // Usuario recién autenticado: sincronizar wishlist desde el backend
      loadFromBackend(true).then(() => {
        hasLoadedWishlistRef.current = true;
      });
    }
    // loadFromBackend es estable del store, no necesita estar en dependencias
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, clearOrders]);

  return {
    user,
    profile,
    isAuthenticated,
    requireAuth,
    logout: handleLogout,
    loadUserProfile,
  };
};
