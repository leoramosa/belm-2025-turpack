"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { useOrdersStore } from "@/store/useOrdersStore";
import { useShippingZonesStore } from "@/store/useShippingZonesStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import {
  LogOut,
  Edit3,
  Plus,
  X,
  Trash2,
  User,
  MapPin,
  ShoppingBag,
  Lock,
} from "lucide-react";
import {
  updateCustomerData,
  updateCustomerBilling,
  updateCustomerShipping,
  WooAddress as WooAddressApi,
  changeUserPassword,
} from "@/services/account";
import { fetchOrdersCountForUser } from "@/services/orders";
import { toast } from "sonner";
import Link from "next/link";

// Adaptar la interfaz a la respuesta de WooCommerce
interface WooAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  company?: string;
  phone?: string;
  id?: string | number;
  isDefault?: boolean;
}

export interface WooProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  billing?: WooAddress;
  shipping?: WooAddress;
  addresses?: WooAddress[]; // Mantener para compatibilidad
  // Puedes agregar más campos según la respuesta de WooCommerce
}

interface MyAccountProfilePageProps {
  profile: WooProfile;
}

export default function MyAccountProfilePage({
  profile: initialProfile,
}: MyAccountProfilePageProps) {
  const router = useRouter();
  const logout = useUserStore((s) => s.logout);
  const clearOrders = useOrdersStore((s) => s.clearOrders);
  const setZones = useShippingZonesStore((s) => s.setZones);
  const updateProfileOptimistic = useUserStore(
    (s) => s.updateProfileOptimistic
  );
  const setGlobalProfile = useUserStore((s) => s.setProfile);
  const token = useUserStore((s) => s.token);
  const storeProfile = useUserStore((s) => s.profile);

  // Usar el profile del store si está disponible, sino usar el prop inicial
  const profile = storeProfile || initialProfile;

  // TODOS LOS HOOKS DEBEN ESTAR AQUÍ ANTES DEL RETURN TEMPRANO
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [editProfile, setEditProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<WooAddress>>({
    first_name: "",
    last_name: "",
    address_1: "",
    address_2: "",
    city: "",
    country: "Perú",
    state: "",
    postcode: "",
    phone: "",
    company: "",
  });
  const [addressType, setAddressType] = useState<"billing" | "shipping">(
    "billing"
  );
  const [editAddress, setEditAddress] = useState<Partial<WooAddress>>({});
  const [showEditAddress, setShowEditAddress] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<
    string | number | null
  >(null);

  // Wishlist debug
  const { getWishlistCount } = useWishlistStore();

  // Estado para el total de pedidos
  const [totalUserOrders, setTotalUserOrders] = useState<number | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Actualizar editProfile cuando profile cambie
  useEffect(() => {
    setEditProfile(profile);
  }, [profile]);

  // Actualizar newAddress cuando profile cambie
  useEffect(() => {
    setNewAddress((prev) => ({
      ...prev,
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
    }));
  }, [profile]);

  // Debug: Log cuando profile cambie
  useEffect(() => {
    // Profile actualizado
  }, [profile]);

  // Cargar órdenes del usuario
  useEffect(() => {
    const loadUserOrders = async () => {
      if (!profile?.id || !profile?.email) {
        return;
      }

      setLoadingOrders(true);
      try {
        const ordersCount = await fetchOrdersCountForUser(
          profile?.id,
          profile?.email
        );

        setTotalUserOrders(ordersCount);
      } catch {
        setTotalUserOrders(0);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadUserOrders();
  }, [profile?.id, profile?.email]);

  // Actualizar nombre y apellido en newAddress cuando cambie el perfil
  useEffect(() => {
    if (profile) {
      setNewAddress((prev) => ({
        ...prev,
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
      }));
    }
  }, [profile?.first_name, profile?.last_name]);

  // Actualizar addressType cuando cambie el perfil
  useEffect(() => {
    if (profile) {
      // Si ya existe una dirección de facturación, seleccionar shipping por defecto
      if (
        profile?.billing &&
        (profile?.billing?.first_name || profile?.billing?.address_1)
      ) {
        setAddressType("shipping");
      } else {
        setAddressType("billing");
      }
    }
  }, [profile?.billing, profile?.shipping]);

  // Validación de seguridad: si no hay profile, mostrar mensaje de error
  if (!profile) {
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

  // Debug: Log de datos del perfil
  // Datos del perfil procesados

  // Procesar direcciones de WooCommerce (billing y shipping)
  const processedAddresses = [];

  // Función para verificar si una dirección tiene datos
  const hasAddressData = (address: WooAddress | undefined) => {
    return address && address.address_1 && address.address_1.trim() !== "";
  };

  // Procesar dirección de facturación
  let billingAddress: WooAddress = {
    id: "billing",
    isDefault: true,
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postcode: "",
    country: "Perú",
    phone: "",
    company: "",
  };

  // Buscar dirección de facturación en addresses array primero
  if (profile?.addresses && profile.addresses.length > 0) {
    const billingFromArray = profile.addresses.find(
      (addr) => addr.id === "billing"
    );
    if (billingFromArray && hasAddressData(billingFromArray)) {
      billingAddress = {
        ...billingFromArray,
        id: "billing",
        isDefault: true,
        address_2: billingFromArray.address_2 || "",
        phone: billingFromArray.phone || "",
        company: billingFromArray.company || "",
      };
    }
  }

  // Si no hay datos en addresses array, usar profile.billing
  if (!hasAddressData(billingAddress) && profile?.billing) {
    billingAddress = {
      ...profile.billing,
      id: "billing",
      isDefault: true,
      first_name: profile.billing.first_name || profile?.first_name || "",
      last_name: profile.billing.last_name || profile?.last_name || "",
      address_2: profile.billing.address_2 || "",
      phone: profile.billing.phone || "",
      company: profile.billing.company || "",
    };
  }

  processedAddresses.push(billingAddress);

  // Procesar dirección de envío
  let shippingAddress: WooAddress = {
    id: "shipping",
    isDefault: false,
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postcode: "",
    country: "Perú",
    phone: "",
    company: "",
  };

  // Buscar dirección de envío en addresses array primero
  if (profile?.addresses && profile.addresses.length > 0) {
    const shippingFromArray = profile.addresses.find(
      (addr) => addr.id === "shipping"
    );
    if (shippingFromArray && hasAddressData(shippingFromArray)) {
      shippingAddress = {
        ...shippingFromArray,
        id: "shipping",
        isDefault: false,
        address_2: shippingFromArray.address_2 || "",
        phone: shippingFromArray.phone || "",
        company: shippingFromArray.company || "",
      };
    }
  }

  // Si no hay datos en addresses array, usar profile.shipping
  if (!hasAddressData(shippingAddress) && profile?.shipping) {
    shippingAddress = {
      ...profile.shipping,
      id: "shipping",
      isDefault: false,
      first_name: profile.shipping.first_name || profile?.first_name || "",
      last_name: profile.shipping.last_name || profile?.last_name || "",
      address_2: profile.shipping.address_2 || "",
      phone: profile.shipping.phone || "",
      company: profile.shipping.company || "",
    };
  }

  processedAddresses.push(shippingAddress);

  // Debug: Log de direcciones procesadas
  // Direcciones procesadas correctamente

  // Filtrar direcciones que tengan datos
  const addressesWithData = processedAddresses.filter(
    (address) => address.address_1 && address.address_1.trim() !== ""
  );

  // Debug: Log de direcciones con datos
  // Direcciones con datos filtradas correctamente

  // Guardar cambios de perfil
  const handleSaveProfile = async () => {
    setIsEditing(false);
    updateProfileOptimistic({
      first_name: editProfile.first_name,
      last_name: editProfile.last_name,
    });
    try {
      await updateCustomerData(profile.id, {
        first_name: editProfile.first_name,
        last_name: editProfile.last_name,
        email: profile.email,
      });
      toast.success("Datos de perfil actualizados");
    } catch {
      alert("No se pudo actualizar el perfil.");
      setGlobalProfile(profile);
      toast.error("Error al actualizar los datos de perfil");
    }
  };

  // Agregar dirección (WooCommerce solo permite una billing y una shipping)
  const handleAddAddress = async () => {
    setShowAddAddress(false);

    // Asignar el tipo de dirección
    const addressWithType = {
      ...newAddress,
      id: addressType,
    };

    // Actualización optimista
    if (addressType === "billing") {
      updateProfileOptimistic({ billing: addressWithType as WooAddress });
    } else {
      updateProfileOptimistic({ shipping: addressWithType as WooAddress });
    }

    try {
      if (addressType === "billing") {
        await updateCustomerBilling(
          profile.id,
          addressWithType as Partial<WooAddressApi>
        );
      } else {
        await updateCustomerShipping(
          profile.id,
          addressWithType as Partial<WooAddressApi>
        );
      }
      setNewAddress({
        first_name: "",
        last_name: "",
        address_1: "",
        address_2: "",
        city: "",
        country: "Perú",
        state: "",
        postcode: "",
        phone: "",
        company: "",
      });
      toast.success("Dirección agregada/actualizada");
      // No llamar a onProfileChange aquí
    } catch {
      alert("No se pudo agregar la dirección.");
      setGlobalProfile(profile); // Revertir si falla
      toast.error("Error al agregar la dirección");
    }
  };

  // Eliminar dirección (en WooCommerce, vaciar los campos de billing/shipping)
  const handleDeleteAddress = async (id: string | number) => {
    setShowDeleteModal(false);
    setAddressToDelete(null);

    // Actualización optimista
    if (id === "billing") {
      const emptyBilling: WooAddress = {
        id: "billing",
        first_name: "",
        last_name: "",
        address_1: "",
        address_2: "",
        city: "",
        country: "",
        state: "",
        postcode: "",
        phone: "",
        company: "",
      };
      updateProfileOptimistic({
        billing: emptyBilling,
      });
    } else {
      const emptyShipping: WooAddress = {
        id: "shipping",
        first_name: "",
        last_name: "",
        address_1: "",
        address_2: "",
        city: "",
        country: "",
        state: "",
        postcode: "",
        phone: "",
        company: "",
      };
      updateProfileOptimistic({
        shipping: emptyShipping,
      });
    }
    try {
      if (id === "billing") {
        await updateCustomerBilling(profile.id, {
          first_name: "",
          last_name: "",
          address_1: "",
          address_2: "",
          city: "",
          country: "",
          state: "",
          postcode: "",
          phone: "",
          company: "",
        } as Partial<WooAddressApi>);
      } else {
        await updateCustomerShipping(profile.id, {
          first_name: "",
          last_name: "",
          address_1: "",
          address_2: "",
          city: "",
          country: "",
          state: "",
          postcode: "",
          phone: "",
          company: "",
        } as Partial<WooAddressApi>);
      }
      toast.success("Dirección eliminada");
      // No llamar a onProfileChange aquí
    } catch {
      alert("No se pudo eliminar la dirección.");
      // Revertir el profile al estado anterior si falla
      if (profile) {
        setGlobalProfile(profile);
      }
      toast.error("Error al eliminar la dirección");
    }
  };

  // Editar dirección
  const handleEditAddress = (address: WooAddress) => {
    setEditAddress(address);
    setShowEditAddress(true);
  };

  // Guardar cambios de dirección
  const handleSaveAddress = async () => {
    setShowEditAddress(false);
    setEditAddress({});
    // Actualización optimista
    if (editAddress.id === "billing") {
      updateProfileOptimistic({ billing: editAddress as WooAddress });
    } else {
      updateProfileOptimistic({ shipping: editAddress as WooAddress });
    }
    try {
      if (editAddress.id === "billing") {
        await updateCustomerBilling(
          profile.id,
          editAddress as Partial<WooAddressApi>
        );
      } else {
        await updateCustomerShipping(
          profile.id,
          editAddress as Partial<WooAddressApi>
        );
      }
      toast.success("Dirección actualizada");
      // No llamar a onProfileChange aquí
    } catch {
      alert("No se pudo actualizar la dirección.");
      setGlobalProfile(profile); // Revertir si falla
      toast.error("Error al actualizar la dirección");
    }
  };

  // Logout
  const handleLogout = () => {
    logout();
    clearOrders();
    setZones([]);
    localStorage.removeItem("authToken");
    toast.success("Sesión cerrada correctamente");
    router.push("/");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    setLoadingPassword(true);
    try {
      await changeUserPassword(profile.id, newPassword, token!);
      toast.success("Contraseña actualizada correctamente");
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("No se pudo cambiar la contraseña. Verifica tu sesión.");
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-4">
              Mi Cuenta
            </h1>
            <p className="text-gray-600 text-lg">
              Gestiona tu información personal y direcciones
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <User size={32} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {profile?.first_name || ""} {profile?.last_name || ""}
                  </h2>
                  <p className="text-gray-600 mb-4">{profile.email}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleLogout}
                      className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <LogOut size={16} /> Salir
                    </button>
                    <Link
                      href="/orders"
                      className="flex-1 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-1 text-center"
                      style={{ textDecoration: "none" }}
                    >
                      <ShoppingBag size={16} /> Mis Órdenes
                    </Link>
                  </div>
                </div>
              </div>
              {/* Quick Stats */}
              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Estadísticas
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Direcciones guardadas</span>
                    <span className="font-medium">
                      {addressesWithData.length} de 2
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pedidos realizados</span>
                    <span className="font-medium">
                      {loadingOrders ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      ) : (
                        totalUserOrders ?? "-"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Productos en wishlist</span>
                    <span className="font-medium">{getWishlistCount()}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Información Personal */}
              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Información Personal
                  </h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      <Edit3 size={16} />
                      Editar
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editProfile.first_name}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        first_name: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border rounded-2xl transition-all ${
                      isEditing
                        ? "border-gray-300 focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20"
                        : "border-gray-200 bg-gray-50"
                    } outline-none`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={editProfile.last_name}
                    onChange={(e) =>
                      setEditProfile({
                        ...editProfile,
                        last_name: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border rounded-2xl transition-all ${
                      isEditing
                        ? "border-gray-300 focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20"
                        : "border-gray-200 bg-gray-50"
                    } outline-none`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editProfile.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-2xl outline-none"
                  />
                </div>
                {isEditing && (
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-6 py-3 bg-primary text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                )}
              </div>

              {/* Cambiar Contraseña */}
              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-center justify-between ">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Cambiar Contraseña
                    </h2>
                    {!showPasswordForm && (
                      <p className="text-gray-600 text-sm mt-1">
                        Haz clic en Cambiar para actualizar tu contraseña
                      </p>
                    )}
                  </div>
                  {!showPasswordForm && (
                    <button
                      onClick={() => setShowPasswordForm((v) => !v)}
                      className="px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:scale-105 transition-transform duration-300 flex items-center gap-2"
                    >
                      <Lock size={16} />
                      Cambiar
                    </button>
                  )}
                </div>

                {showPasswordForm && (
                  <form
                    className="mt-6   rounded-xl"
                    onSubmit={handleChangePassword}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nueva contraseña
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          autoComplete="new-password"
                          placeholder="Nueva contraseña"
                          required
                          minLength={6}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmar nueva contraseña
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          placeholder="Confirmar nueva contraseña"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(false)}
                        className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-gray-300 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-primary text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
                        disabled={loadingPassword}
                      >
                        {loadingPassword
                          ? "Guardando..."
                          : "Guardar contraseña"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
              {/* Direcciones */}
              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Direcciones
                  </h2>
                  <button
                    onClick={() => setShowAddAddress(true)}
                    disabled={addressesWithData.length === 2}
                    className={`px-4 py-2 rounded-xl font-semibold transition-transform duration-300 flex items-center gap-2 ${
                      addressesWithData.length === 2
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-primary text-white hover:scale-105"
                    }`}
                  >
                    <Plus size={16} />{" "}
                    {addressesWithData.length === 0
                      ? "Agregar Primera"
                      : addressesWithData.length === 1
                      ? "Agregar Segunda"
                      : "Agregar"}
                  </button>
                </div>
                {processedAddresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">
                      No tienes direcciones guardadas
                    </p>
                    <button
                      onClick={() => setShowAddAddress(true)}
                      className="px-6 py-3 bg-primary text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
                    >
                      Agregar Primera Dirección
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {processedAddresses.map((address, idx) => {
                      return (
                        <div
                          key={address.id || idx}
                          className="border border-gray-200 rounded-2xl p-4 relative flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-lg transition-shadow"
                        >
                          {address.isDefault && (
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-1 bg-[#07D6AF] text-white text-xs rounded-lg shadow">
                                Principal
                              </span>
                            </div>
                          )}
                          <div className="mb-3">
                            <div className="mb-1">
                              <span className="font-semibold text-gray-900 capitalize">
                                {address.id === "billing"
                                  ? "Dirección de Facturación"
                                  : "Dirección de Envío"}
                              </span>
                            </div>
                            <h3 className="font-medium text-gray-900">
                              {address.first_name} {address.last_name}
                            </h3>
                          </div>
                          <div className="text-sm text-gray-400 space-y-1 mb-4">
                            {address.address_1 &&
                            address.address_1.trim() !== "" ? (
                              <>
                                <p>
                                  <span className="">Dirección: </span>
                                  {address.address_1}
                                </p>
                                {address.address_2 && (
                                  <p>
                                    <span className="">
                                      Casa, Departamento, etc.:{" "}
                                    </span>
                                    {address.address_2}
                                  </p>
                                )}
                                {address.company && (
                                  <p>
                                    <span className="">DNI: </span>
                                    {address.company}
                                  </p>
                                )}
                                <p>
                                  <span className="">Distrito: </span>
                                  {address.city}
                                </p>
                                <p>
                                  <span className="">Provincia: </span>
                                  {address.state}
                                </p>
                                <p>
                                  <span className="">Código Postal: </span>
                                  {address.postcode}
                                </p>
                                {address.country && (
                                  <p>
                                    <span className="">País: </span>
                                    {address.country}
                                  </p>
                                )}
                                {address.phone && (
                                  <p className="flex items-center gap-1">
                                    <span className="">Teléfono: </span>
                                    {address.phone}
                                  </p>
                                )}
                              </>
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-gray-400 italic">
                                  No hay datos de dirección
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100 ">
                            {address.address_1 &&
                            address.address_1.trim() !== "" ? (
                              <>
                                <button
                                  onClick={() => {
                                    setAddressToDelete(address.id || idx);
                                    setShowDeleteModal(true);
                                  }}
                                  className="flex-1 py-2 text-orange-600 border border-orange-600 bg-orange-50 cursor-pointer rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-orange-100 "
                                >
                                  <Trash2
                                    size={18}
                                    className="text-orange-600 group-hover:text-white transition-colors"
                                  />{" "}
                                  Vaciar
                                </button>
                                <button
                                  onClick={() => handleEditAddress(address)}
                                  className="flex-1 py-2 text-base cursor-pointer border border-[#07D6AF] text-[#07D6AF] bg-white rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors hover:bg-[#07D6AF] hover:text-white"
                                >
                                  <Edit3
                                    size={18}
                                    className="transition-colors"
                                  />{" "}
                                  Editar
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setAddressType(
                                    address.id as "billing" | "shipping"
                                  );
                                  setShowAddAddress(true);
                                }}
                                className="flex-1 py-2 bg-primary text-white rounded-lg font-semibold hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2"
                              >
                                <Plus size={18} /> Agregar Datos
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal para agregar dirección */}
      {showAddAddress && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setShowAddAddress(false)}
            ></div>
            <div className="relative bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-pop-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Agregar Dirección
                </h3>
                <button
                  onClick={() => setShowAddAddress(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              {/* Tipo de dirección */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Tipo de Dirección
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAddressType("billing")}
                    className={`flex-1 py-3 px-4 rounded-2xl font-semibold transition-all ${
                      addressType === "billing"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Dirección de Facturación
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressType("shipping")}
                    className={`flex-1 py-3 px-4 rounded-2xl font-semibold transition-all ${
                      addressType === "shipping"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Dirección de Envío
                  </button>
                </div>
              </div>

              {/* Información del usuario (solo lectura) */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={newAddress.first_name || ""}
                      disabled
                      className="w-full px-4 py-3 border border-gray-200 bg-gray-100 rounded-2xl outline-none text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={newAddress.last_name || ""}
                      disabled
                      className="w-full px-4 py-3 border border-gray-200 bg-gray-100 rounded-2xl outline-none text-gray-600"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={newAddress.address_1 || ""}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, address_1: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                  placeholder="Calle, número, apartamento"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Dirección 2 (opcional)
                </label>
                <input
                  type="text"
                  value={newAddress.address_2 || ""}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, address_2: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                  placeholder="Referencia, piso, etc."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={newAddress.city || ""}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, city: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={newAddress.country || ""}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, country: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    value={newAddress.state || ""}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, state: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={newAddress.postcode || ""}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, postcode: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={newAddress.phone || ""}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                  placeholder="Ej: +51987654321"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Empresa (opcional)
                </label>
                <input
                  type="text"
                  value={newAddress.company || ""}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, company: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                  placeholder="Nombre de empresa"
                />
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleAddAddress}
                  className="flex-1 py-3 bg-primary text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
                >
                  Agregar Dirección
                </button>
                <button
                  onClick={() => setShowAddAddress(false)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal para editar dirección */}
      {showEditAddress && editAddress && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setShowEditAddress(false)}
            ></div>
            <div className="relative bg-white rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Editar Dirección
                </h3>
                <button
                  onClick={() => setShowEditAddress(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 pb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editAddress.first_name || ""}
                    onChange={(e) =>
                      setEditAddress({
                        ...editAddress,
                        first_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={editAddress.last_name || ""}
                    onChange={(e) =>
                      setEditAddress({
                        ...editAddress,
                        last_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                    placeholder="Ej: Pérez"
                  />
                </div>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={editAddress.address_1 || ""}
                  onChange={(e) =>
                    setEditAddress({
                      ...editAddress,
                      address_1: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                  placeholder="Calle, número, apartamento"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Casa o departamento
                </label>
                <input
                  type="text"
                  value={editAddress.address_2 || ""}
                  onChange={(e) =>
                    setEditAddress({
                      ...editAddress,
                      address_2: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                  placeholder="Referencia, piso, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Distrito
                  </label>
                  <input
                    type="text"
                    value={editAddress.city || ""}
                    onChange={(e) =>
                      setEditAddress({ ...editAddress, city: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    value={editAddress.state || ""}
                    onChange={(e) =>
                      setEditAddress({ ...editAddress, state: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={editAddress.postcode || ""}
                    onChange={(e) =>
                      setEditAddress({
                        ...editAddress,
                        postcode: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
                    Teléfono (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={editAddress.phone || ""}
                    onChange={(e) =>
                      setEditAddress({ ...editAddress, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  DNI
                </label>
                <input
                  type="text"
                  value={editAddress.company || ""}
                  onChange={(e) =>
                    setEditAddress({ ...editAddress, company: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none"
                  placeholder="Nombre de empresa"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveAddress}
                  className="flex-1 py-3 bg-primary text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={() => setShowEditAddress(false)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-pop-in">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              ¿Vaciar dirección?
            </h2>
            <p className="mb-6 text-gray-600">
              ¿Deseas vaciar esta dirección? Los datos se borrarán pero la
              dirección seguirá disponible para agregar nuevos datos.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteAddress(addressToDelete!)}
                className="flex-1 py-2 border-2 border-orange-500 text-orange-500 rounded-lg font-semibold hover:bg-orange-500 hover:text-white transition-colors"
              >
                Vaciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
