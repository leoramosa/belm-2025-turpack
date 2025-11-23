import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { useOrdersStore } from "@/store/useOrdersStore";
import { fetchUserAccountData } from "@/services/account";

export const useAuth = () => {
  const router = useRouter();
  const { user, profile, logout, setProfile } = useUserStore();
  const { clearOrders } = useOrdersStore();

  // Verificar si el usuario está autenticado
  // Después del login solo tenemos user y token, profile se carga después
  // Consideramos autenticado si tiene user y token, incluso sin profile
  const isAuthenticated = !!user && (!!user.token || !!user.user_email);

  // Función para cargar el perfil del usuario
  const loadUserProfile = async () => {
    if (!isAuthenticated || profile) {
      return profile;
    }

    try {
      const userEmail = user?.user_email || user?.email;
      if (!userEmail) {
        throw new Error("No se encontró email del usuario");
      }

      // Intentar cargar datos reales de WooCommerce primero
      try {
        const userData = await fetchUserAccountData(userEmail);

        setProfile(userData);
        return userData;
      } catch {
        // Si falla WooCommerce, crear perfil básico con datos del login
        const basicProfile = {
          id: user?.id || 0,
          email: userEmail,
          first_name: user?.first_name || "Usuario",
          last_name: user?.last_name || "Cliente",
          username: user?.user_login || userEmail,
          billing: {
            first_name: user?.first_name || "Usuario",
            last_name: user?.last_name || "Cliente",
            email: userEmail,
            address_1: "",
            city: "",
            state: "",
            postcode: "",
            country: "PE",
            phone: "",
          },
          shipping: {
            first_name: user?.first_name || "Usuario",
            last_name: user?.last_name || "Cliente",
            address_1: "",
            city: "",
            state: "",
            postcode: "",
            country: "PE",
          },
        };

        setProfile(basicProfile);
        return basicProfile;
      }
    } catch {
      // En caso de error total, crear un perfil básico de emergencia
      const emergencyProfile = {
        id: 0,
        email: user?.user_email || user?.email || "",
        first_name: "Usuario",
        last_name: "Cliente",
        username: user?.user_login || user?.user_email || "",
        billing: {
          first_name: "Usuario",
          last_name: "Cliente",
          email: user?.user_email || user?.email || "",
          address_1: "",
          city: "",
          state: "",
          postcode: "",
          country: "PE",
          phone: "",
        },
        shipping: {
          first_name: "Usuario",
          last_name: "Cliente",
          address_1: "",
          city: "",
          state: "",
          postcode: "",
          country: "PE",
        },
      };
      setProfile(emergencyProfile);
      return emergencyProfile;
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
    router.push("/");
  };

  // Verificar autenticación en cada render
  useEffect(() => {
    if (!isAuthenticated) {
      // Limpiar datos sensibles si no está autenticado
      clearOrders();
    }
  }, [isAuthenticated]); // Removido clearOrders de dependencias

  return {
    user,
    profile,
    isAuthenticated,
    requireAuth,
    logout: handleLogout,
    loadUserProfile,
  };
};
