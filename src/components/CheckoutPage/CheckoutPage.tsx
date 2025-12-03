"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./checkout.css";

// Declaración de tipos para Izipay
declare global {
  interface Window {
    KR: {
      setFormConfig: (config: Record<string, string>) => void;
      attachForm: (selector: string) => Promise<{ formId: string }>;
      showForm: (formId?: string) => void;
      onSubmit: (
        callback: (data: {
          clientAnswer: string;
          hash: string;
        }) => Promise<boolean> | boolean
      ) => void;
    };
  }
}
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { createOrder } from "@/services/orders";
import { createIzipayPayment } from "@/services/izipay";
import { validateAndSanitizeEmail, sanitizeString } from "@/lib/validation";
import { useCSRF } from "@/hooks/useCSRF";
import Image from "next/image";

import {
  FiArrowLeft as ArrowLeft,
  FiTruck as Truck,
  FiLock as Lock,
  FiCheck as Check,
  FiUser as User,
  FiCreditCard as CreditCard,
  FiChevronDown as ChevronDown,
} from "react-icons/fi";
import { useShippingZonesStore } from "@/store/useShippingZonesStore";
import { z } from "zod";
import CouponSection from "./CouponSection";
import { useFreeShipping } from "@/hooks/useFreeShipping";
import { freeShippingService } from "@/services/freeShipping";
import { useAuth } from "@/hooks/useAuth";
import { fetchOrdersForUser } from "@/services/orders";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    getSubtotal,
    getTotal,
    getDiscountAmount,
    appliedCoupon,
    couponDiscount,
  } = useCartStore();
  const { getCSRFField } = useCSRF();
  const { isAuthenticated, profile, loadUserProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [useSavedData, setUseSavedData] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    firstLastName: "",
    secondLastName: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    provincia: "",
  });
  const [shippingMethod, setShippingMethod] = useState<number | string>(
    "standard"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string>("");
  const [orderSuccess, setOrderSuccess] = useState<string>("");
  // Estados para el formulario de Izipay
  const [showIzipayForm, setShowIzipayForm] = useState(false);
  const [izipayFormToken, setIzipayFormToken] = useState<string>("");
  const [izipayFormLoaded, setIzipayFormLoaded] = useState(false);

  const [izipayOrderId, setIzipayOrderId] = useState<number | null>(null);
  // NUEVO: Estado para forzar recarga del formulario
  const [izipayFormKey, setIzipayFormKey] = useState(0);
  // NUEVO: Estado para modal de cancelación
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);

  // NUEVO: Estado para el modal de confirmación de cierre
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  // 🆕 Estado para controlar si el resumen del pedido está expandido (solo móvil)
  const [isOrderSummaryExpanded, setIsOrderSummaryExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 🆕 useEffect para manejar la hidratación y evitar errores de SSR
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 🆕 useEffect para pre-llenar datos guardados cuando el checkbox está marcado
  useEffect(() => {
    const fillSavedData = async () => {
      if (!useSavedData || !isAuthenticated) {
        return;
      }

      try {
        // Cargar perfil si no está disponible
        let userProfile = profile;
        if (!userProfile) {
          try {
            userProfile = await loadUserProfile();
          } catch (error) {
            console.error("Error al cargar perfil:", error);
            return;
          }
        }

        if (!userProfile || !userProfile.id || !userProfile.email) {
          return;
        }

        // 🆕 Obtener la última orden del usuario (más reciente)
        let lastOrder = null;
        try {
          const orders = await fetchOrdersForUser(
            userProfile.id,
            userProfile.email
          );

          if (orders && orders.length > 0) {
            // Ordenar por fecha de creación (más reciente primero)
            const sortedOrders = [...orders].sort((a, b) => {
              const dateA = new Date(a.date_created).getTime();
              const dateB = new Date(b.date_created).getTime();
              return dateB - dateA; // Orden descendente (más reciente primero)
            });

            lastOrder = sortedOrders[0]; // La primera es la más reciente
          }
        } catch (error) {
          console.error("Error al obtener órdenes:", error);
          // Continuar con el perfil si falla obtener órdenes
        }

        // 🆕 Preferir datos de la última orden, si no existe usar perfil
        let addressData = null;
        let phoneData = "";
        let emailData = userProfile.email || "";

        if (lastOrder) {
          // Usar shipping de la orden, si no existe usar billing
          addressData = lastOrder.shipping || lastOrder.billing;
          // El teléfono está en billing, no en shipping
          phoneData = lastOrder.billing?.phone || "";
          emailData = lastOrder.billing?.email || userProfile.email || "";
        } else {
          // Si no hay órdenes, usar datos del perfil
          addressData = userProfile.shipping || userProfile.billing;
          phoneData = addressData?.phone || "";
        }

        if (addressData) {
          // Dividir last_name en firstLastName y secondLastName
          const lastNameParts = (addressData.last_name || "").trim().split(" ");
          const firstLastName = lastNameParts[0] || "";
          const secondLastName = lastNameParts.slice(1).join(" ") || "";

          setShippingInfo({
            firstName: addressData.first_name || "",
            firstLastName: firstLastName,
            secondLastName: secondLastName,
            company: addressData.company || lastOrder?.billing?.company || "",
            email: emailData,
            phone: phoneData,
            address: addressData.address_1 || "",
            apartment: addressData.address_2 || "",
            city: addressData.city || "",
            state: addressData.state || "",
            zipCode: addressData.postcode || "",
            provincia: addressData.state || "", // Usar state como provincia si no hay campo específico
          });
        } else if (userProfile.email) {
          // Si no hay datos de envío, al menos pre-llenar el email
          setShippingInfo((prev) => ({
            ...prev,
            email: userProfile?.email || prev.email,
          }));
        }
      } catch (error) {
        console.error("Error al pre-llenar datos guardados:", error);
      }
    };

    fillSavedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useSavedData, isAuthenticated, profile]);

  type PaymentMethod = {
    id: string;
    title?: string;
    method_title?: string;
    description?: string;
    enabled?: boolean;
  };

  interface WooCommerceLocation {
    type: string;
    code: string;
    name?: string;
  }

  interface IShippingZone {
    id: number;
    name: string;
    locations: WooCommerceLocation[];
    methods: IShippingMethod[];
  }

  interface IShippingMethod {
    id: number;
    instance_id: number;
    title: string;
    order: number;
    enabled: boolean;
    method_id: string;
    method_title: string;
    method_description: string;
    settings?: {
      cost?: {
        value: string;
      };
    };
  }

  // Interfaces movidas a IShipping.ts para evitar duplicaciones
  const [shippingMethods, setShippingMethods] = useState<IShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] =
    useState<string>("transfer-peru");
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingProgress, setShippingProgress] = useState(0);

  const PROVINCIAS_PERU = [
    { label: "Lima Metropolitana", value: "PE:LMA" },
    { label: "Callao", value: "PE:CAL" },
    { label: "Arequipa", value: "PE:ARE" },
    { label: "Cusco", value: "PE:CUS" },
    { label: "Loreto", value: "PE:LOR" },
    { label: "Piura", value: "PE:PIU" },
    { label: "Lambayeque", value: "PE:LAM" },
    { label: "Áncash", value: "PE:ANC" },
    { label: "Junín", value: "PE:JUN" },
    { label: "La Libertad", value: "PE:LAL" },
    { label: "Ica", value: "PE:ICA" },
    { label: "Puno", value: "PE:PUN" },
    { label: "Huánuco", value: "PE:HUC" },
    { label: "Ayacucho", value: "PE:AYA" },
    { label: "Cajamarca", value: "PE:CAJ" },
    { label: "Amazonas", value: "PE:AMA" },
    { label: "Tacna", value: "PE:TAC" },
    { label: "Tumbes", value: "PE:TUM" },
    { label: "Pasco", value: "PE:PAS" },
    { label: "Huancavelica", value: "PE:HUV" },
    { label: "Apurímac", value: "PE:APU" },
    { label: "Madre de Dios", value: "PE:MDD" },
    { label: "Moquegua", value: "PE:MOC" },
    { label: "Ucayali", value: "PE:UCA" },
    { label: "San Martín", value: "PE:SMN" },
  ];
  const DISTRITOS_LIMA = [
    "Ancon",
    "Ate",
    "Barranco",
    "Breña",
    "Carabayllo",
    "Chaclacayo",
    "Chorrillos",
    "Cieneguilla",
    "Comas",
    "El Agustino",
    "Independencia",
    "Jesus Maria",
    "La Molina",
    "La Victoria",
    "Lince",
    "Los Olivos",
    "Lurigancho",
    "Lurin",
    "Magdalena del Mar",
    "Pueblo Libre",
    "Miraflores",
    "Pachacamac",
    "Puente Piedra",
    "Rimac",
    "San Borja",
    "San Isidro",
    "San Juan de Lurigancho",
    "San Juan de Miraflores",
    "San Luis",
    "San Martin de Porres",
    "San Miguel",
    "Santa Anita",
    "Santiago de Surco",
    "Surquillo",
    "Villa El Salvador",
    "Villa Maria del Triunfo",
  ];

  const DISTRITOS_CALLAO = [
    "Callao",
    "Bellavista",
    "Carmen de la Legua Reynoso",
    "La Perla",
    "La Punta",
    "Ventanilla",
  ];
  const CODIGOS_POSTALES_LIMA: { [key: string]: string } = useMemo(
    () => ({
      Ancon: "15123",
      Ate: "15026",
      Barranco: "15063",
      Breña: "15083",
      Carabayllo: "15121",
      Chaclacayo: "15472",
      Chorrillos: "15064",
      Cieneguilla: "15593",
      Comas: "15324",
      "El Agustino": "15009",
      Independencia: "15311",
      "Jesus Maria": "15076",
      "La Molina": "15024",
      "La Victoria": "15018",
      Lince: "15073",
      "Los Olivos": "15307",
      Lurigancho: "15457",
      Lurin: "15841",
      "Magdalena del Mar": "15076",
      "Pueblo Libre": "15084",
      Miraflores: "15074",
      Pachacamac: "15823",
      "Puente Piedra": "15121",
      Rimac: "15093",
      "San Borja": "15021",
      "San Isidro": "15046",
      "San Juan de Lurigancho": "15401",
      "San Juan de Miraflores": "15801",
      "San Luis": "15021",
      "San Martin de Porres": "15102",
      "San Miguel": "15088",
      "Santa Anita": "15009",
      "Santiago de Surco": "15039",
      Surquillo: "15048",
      "Villa El Salvador": "15831",
      "Villa Maria del Triunfo": "15809",
    }),
    []
  );

  const CODIGOS_POSTALES_CALLAO: { [key: string]: string } = useMemo(
    () => ({
      Callao: "07021",
      Bellavista: "07016",
      "Carmen de la Legua Reynoso": "07006",
      "La Perla": "07011",
      "La Punta": "07021",
      Ventanilla: "07046",
    }),
    []
  );

  const { zones, setZones, getMethodsForAddress } = useShippingZonesStore();

  // Estado para saber si las zonas ya están cargadas
  const [shippingZonesLoaded, setShippingZonesLoaded] = useState(false);

  useEffect(() => {
    // SOLO marcar como cargado - NO cargar nada en segundo plano
    setShippingZonesLoaded(true);
  }, []);

  // Función para cargar métodos reales de WooCommerce para una provincia/distrito
  const loadRealShippingMethodsForState = useCallback(
    async (state: string, city?: string) => {
      try {
        // Paso 1: Iniciar carga (20%)
        setShippingProgress(20);

        // Obtener solo las zonas de WooCommerce desde API interna
        const zonesResponse = await fetch("/api/shipping/zones");
        if (!zonesResponse.ok) {
          throw new Error(`HTTP error! status: ${zonesResponse.status}`);
        }
        const allZones = await zonesResponse.json();

        // Paso 2: Zonas obtenidas (40%)
        setShippingProgress(40);

        // Si es Lima Metropolitana o Callao, buscar SOLO el distrito específico
        if ((state === "PE:LMA" || state === "PE:CAL") && city) {
          // Buscar la zona que coincida exactamente con el nombre del distrito
          const targetZone = allZones.find(
            (zone: { name: string }) => zone.name === city
          );

          if (targetZone) {
            // Paso 3: Zona específica encontrada (60%)
            setShippingProgress(60);

            try {
              // Obtener locations de esta zona desde API interna
              const locationsResponse = await fetch(
                `/api/shipping/zones/${targetZone.id}/locations`
              );
              if (!locationsResponse.ok) {
                throw new Error(
                  `HTTP error! status: ${locationsResponse.status}`
                );
              }
              const locations = await locationsResponse.json();

              // Paso 4: Locations obtenidas (80%)
              setShippingProgress(80);

              // Obtener métodos reales de esta zona desde API interna
              const methodsResponse = await fetch(
                `/api/shipping/zones/${targetZone.id}/methods`
              );
              if (!methodsResponse.ok) {
                throw new Error(
                  `HTTP error! status: ${methodsResponse.status}`
                );
              }
              const methods = await methodsResponse.json();

              const enabledMethods = methods.filter(
                (m: { enabled: boolean }) => m.enabled
              );

              // Crear zona con métodos reales
              const zoneWithMethods: IShippingZone = {
                ...targetZone,
                locations,
                methods: enabledMethods,
              };

              // Paso 5: Métodos cargados (100%)
              setShippingProgress(100);

              // Actualizar el store con esta zona específica
              setZones([zoneWithMethods]);
              return [zoneWithMethods];
            } catch {
              return [];
            }
          } else {
            return [];
          }
        }

        // Para otras provincias, buscar DIRECTAMENTE por nombre (igual que distritos)
        // Convertir código de estado a nombre de provincia
        const stateToProvinceName: { [key: string]: string } = {
          "PE:ARE": "Arequipa",
          "PE:CUS": "Cusco",
          "PE:LOR": "Loreto",
          "PE:PIU": "Piura",
          "PE:LAM": "Lambayeque",
          "PE:ANC": "Áncash",
          "PE:JUN": "Junín",
          "PE:LAL": "La Libertad",
          "PE:ICA": "Ica",
          "PE:PUN": "Puno",
          "PE:HUC": "Huánuco",
          "PE:AYA": "Ayacucho",
          "PE:CAJ": "Cajamarca",
          "PE:HUV": "Huancavelica",
          "PE:APU": "Apurímac",
          "PE:SAM": "San Martín",
          "PE:TAC": "Tacna",
          "PE:MOQ": "Moquegua",
          "PE:PAS": "Pasco",
          "PE:TUM": "Tumbes",
          "PE:AMA": "Amazonas",
          "PE:MAD": "Madre de Dios",
          "PE:UCA": "Ucayali",
        };

        const provinceName = stateToProvinceName[state];
        if (!provinceName) {
          return [];
        }

        // Buscar la zona que coincida exactamente con el nombre de la provincia (IGUAL QUE DISTRITOS)
        const targetZone = allZones.find(
          (zone: { name: string }) => zone.name === provinceName
        );

        if (targetZone) {
          // Paso 3: Zona específica encontrada (60%)
          setShippingProgress(60);

          try {
            // Obtener locations de esta zona específica desde API interna
            const locationsResponse = await fetch(
              `/api/shipping/zones/${targetZone.id}/locations`
            );
            if (!locationsResponse.ok) {
              throw new Error(
                `HTTP error! status: ${locationsResponse.status}`
              );
            }
            const locations = await locationsResponse.json();

            // Paso 4: Locations obtenidas (80%)
            setShippingProgress(80);

            // Obtener métodos reales de esta zona específica desde API interna
            const methodsResponse = await fetch(
              `/api/shipping/zones/${targetZone.id}/methods`
            );
            if (!methodsResponse.ok) {
              throw new Error(`HTTP error! status: ${methodsResponse.status}`);
            }
            const methods = await methodsResponse.json();

            const enabledMethods = methods.filter(
              (m: { enabled: boolean }) => m.enabled
            );

            // Crear zona con métodos reales
            const zoneWithMethods: IShippingZone = {
              ...targetZone,
              locations,
              methods: enabledMethods,
            };

            // Paso 5: Métodos cargados (100%)
            setShippingProgress(100);

            // Actualizar el store con esta zona específica
            setZones([zoneWithMethods]);
            return [zoneWithMethods];
          } catch {
            return [];
          }
        } else {
          return [];
        }
      } catch {
        return [];
      }
    },
    [setZones]
  );

  useEffect(() => {
    // Obtener métodos de pago dinámicamente (solo una vez)
    const fetchMethods = async () => {
      try {
        // Obtener métodos de pago desde API interna
        const paymentsResponse = await fetch("/api/payment-gateways");
        if (!paymentsResponse.ok) {
          throw new Error(`HTTP error! status: ${paymentsResponse.status}`);
        }
        const payments = await paymentsResponse.json();
        const enabledPayments = Array.isArray(payments)
          ? payments.filter((p) => p.enabled)
          : [];

        setPaymentMethods(enabledPayments);
        if (enabledPayments.length > 0) {
          setSelectedPayment(enabledPayments[0].id);
        }
      } catch {
        setPaymentMethods([]);
      }
    };

    fetchMethods();
  }, []); // Solo se ejecuta una vez al montar

  // Autocompletar código postal cuando cambia el distrito
  useEffect(() => {
    if (shippingInfo.state === "PE:LMA" && shippingInfo.city) {
      const codigoPostal = CODIGOS_POSTALES_LIMA[shippingInfo.city] || "";
      if (codigoPostal && shippingInfo.zipCode !== codigoPostal) {
        setShippingInfo((prev) => ({ ...prev, zipCode: codigoPostal }));
      }
    } else if (shippingInfo.state === "PE:CAL" && shippingInfo.city) {
      const codigoPostal = CODIGOS_POSTALES_CALLAO[shippingInfo.city] || "";
      if (codigoPostal && shippingInfo.zipCode !== codigoPostal) {
        setShippingInfo((prev) => ({ ...prev, zipCode: codigoPostal }));
      }
    }
  }, [
    shippingInfo.state,
    shippingInfo.city,
    CODIGOS_POSTALES_LIMA,
    CODIGOS_POSTALES_CALLAO,
    shippingInfo.zipCode,
  ]);

  // Consultar métodos de envío con carga bajo demanda
  useEffect(() => {
    if (
      shippingZonesLoaded &&
      shippingInfo.state &&
      ((shippingInfo.state === "PE:LMA" &&
        shippingInfo.city &&
        shippingInfo.zipCode) ||
        (shippingInfo.state === "PE:CAL" &&
          shippingInfo.city &&
          shippingInfo.zipCode) ||
        (shippingInfo.state !== "PE:LMA" && shippingInfo.state !== "PE:CAL"))
    ) {
      setIsLoadingShipping(true);
      setShippingProgress(0); // Reiniciar progreso

      const handleShippingMethods = async () => {
        try {
          // Limpiar métodos anteriores cuando cambia la provincia
          setShippingMethods([]);
          setShippingMethod(0);

          // Primero intentar obtener métodos del cache
          let shippingMethods = getMethodsForAddress(
            shippingInfo.state,
            shippingInfo.city,
            shippingInfo.zipCode
          );

          // Para Lima Metropolitana y Callao, SIEMPRE cargar el distrito específico
          if (
            (shippingInfo.state === "PE:LMA" ||
              shippingInfo.state === "PE:CAL") &&
            shippingInfo.city
          ) {
            // Cargar métodos reales de WooCommerce para el distrito específico
            await loadRealShippingMethodsForState(
              shippingInfo.state,
              shippingInfo.city
            );

            // Intentar obtener métodos nuevamente
            shippingMethods = getMethodsForAddress(
              shippingInfo.state,
              shippingInfo.city,
              shippingInfo.zipCode
            );
          } else if (shippingMethods.length === 0) {
            // Para otras provincias, intentar cargar métodos pero con manejo de errores mejorado

            try {
              // Cargar métodos reales de WooCommerce con timeout y manejo de errores
              await loadRealShippingMethodsForState(
                shippingInfo.state,
                shippingInfo.city
              );

              // Intentar obtener métodos nuevamente después de la carga
              shippingMethods = getMethodsForAddress(
                shippingInfo.state,
                shippingInfo.city,
                shippingInfo.zipCode
              );
            } catch {
              // Si falla, usar métodos vacíos (no romper la aplicación)
              shippingMethods = [];
            }
          }

          // Actualizar métodos de envío
          setShippingMethods(shippingMethods);
          if (shippingMethods.length > 0) {
            setShippingMethod(shippingMethods[0].id);
          } else {
            setShippingMethod(0);
          }
        } catch {
          setShippingMethods([]);
          setShippingMethod(0);
        } finally {
          setIsLoadingShipping(false);
          // Resetear progreso después de un breve delay para que se vea el 100%
          setTimeout(() => {
            setShippingProgress(0);
          }, 500);
        }
      };

      handleShippingMethods();
    }
  }, [
    shippingZonesLoaded,
    shippingInfo.state,
    shippingInfo.city,
    shippingInfo.zipCode,
    getMethodsForAddress,
    zones.length,
    loadRealShippingMethodsForState, // Now safe with useCallback
  ]);

  const handlePersonalDataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    try {
      // Validar datos personales
      const personalData = {
        firstName: shippingInfo.firstName,
        firstLastName: shippingInfo.firstLastName,
        secondLastName: shippingInfo.secondLastName,
        email: shippingInfo.email,
        phone: shippingInfo.phone,
      };

      // Validar con Zod (solo campos personales)
      const validatedData = z
        .object({
          firstName: z
            .string()
            .min(1, "El nombre es requerido")
            .min(2, "El nombre debe tener al menos 2 caracteres"),
          firstLastName: z
            .string()
            .min(1, "El primer apellido es requerido")
            .min(2, "El primer apellido debe tener al menos 2 caracteres"),
          secondLastName: z
            .string()
            .min(1, "El segundo apellido es requerido")
            .min(2, "El segundo apellido debe tener al menos 2 caracteres"),
          email: z
            .string()
            .min(1, "El email es requerido")
            .email("Formato de email inválido"),
          phone: z.string().min(1, "El teléfono es requerido"),
        })
        .parse(personalData);

      // Sanitizar datos y concatenar apellidos para el backend
      const sanitizedData = {
        firstName: sanitizeString(validatedData.firstName),
        lastName: `${sanitizeString(
          validatedData.firstLastName
        )} ${sanitizeString(validatedData.secondLastName)}`.trim(),
        email: validateAndSanitizeEmail(validatedData.email),
        phone: validatedData.phone,
      };

      // Actualizar estado con datos sanitizados
      setShippingInfo((prev) => ({
        ...prev,
        ...sanitizedData,
      }));

      setCurrentStep(2);
      // 🆕 Scroll hacia arriba en móvil al cambiar de paso
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errors" in error) {
        const errors: Record<string, string> = {};
        (
          error as { errors: Array<{ path: string[]; message: string }> }
        ).errors.forEach((err) => {
          if (err.path && err.path[0]) {
            errors[err.path[0]] = err.message;
          }
        });
        setValidationErrors(errors);
      }
    }
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    try {
      // Validar dirección de envío
      const shippingData = {
        address: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        provincia: shippingInfo.provincia,
        zipCode: shippingInfo.zipCode,
      };

      // Validar con Zod
      const validatedData = z
        .object({
          address: z
            .string()
            .min(1, "La dirección es requerida")
            .min(10, "La dirección debe tener al menos 10 caracteres"),
          city: z.string().min(1, "La ciudad es requerida"),
          state: z.string().min(1, "La provincia es requerida"),
          provincia:
            shippingInfo.state !== "PE:LMA" && shippingInfo.state !== "PE:CAL"
              ? z.string().min(1, "La provincia es requerida")
              : z.string().optional(),
          zipCode:
            shippingInfo.state === "PE:LMA" || shippingInfo.state === "PE:CAL"
              ? z
                  .string()
                  .min(1, "El código postal es requerido")
                  .regex(/^\d{5}$/, "El código postal debe tener 5 dígitos")
              : z.string().optional(),
        })
        .parse(shippingData);

      // Sanitizar datos
      const sanitizedData = {
        address: sanitizeString(validatedData.address),
        city: sanitizeString(validatedData.city),
        state: validatedData.state,
        provincia: validatedData.provincia || "",
        zipCode: validatedData.zipCode || "",
      };

      // Actualizar estado con datos sanitizados
      setShippingInfo((prev) => {
        const newState = {
          ...prev,
          ...sanitizedData,
        };
        return newState;
      });

      setCurrentStep(3);
      // 🆕 Scroll hacia arriba en móvil al cambiar de paso
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errors" in error) {
        const errors: Record<string, string> = {};
        (
          error as { errors: Array<{ path: string[]; message: string }> }
        ).errors.forEach((err) => {
          if (err.path && err.path[0]) {
            errors[err.path[0]] = err.message;
          }
        });
        setValidationErrors(errors);
      }
    }
  };

  type MPItem = {
    title: string;
    quantity: number;
    unit_price: number;
    currency_id?: string;
  };

  async function pagarConMercadoPago({
    items,
    orderId,
  }: {
    items: MPItem[];
    orderId: number;
  }) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const res = await fetch(`${apiUrl}/wp-json/mp/v1/init-point`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, order_id: orderId }), // <-- Enviar order_id
    });
    const data = await res.json();
    if (data.init_point) {
      window.location.href = data.init_point;
    } else {
      alert("Error al iniciar pago con Mercado Pago");
    }
  }

  // 🆕 FUNCIÓN PARA CREAR ORDEN EN WOOCOMMERCE ANTES DE IZIPAY
  async function createWooCommerceOrderBeforeIzipay({
    amount,
    customerEmail,
    customerFirstName,
    customerLastName,
    cartItems,
    shippingInfo: shippingInfoParam,
    paymentMethod,
    shippingCost, // 🆕 Nuevo parámetro para el costo de envío calculado
    couponCode, // 🆕 Código del cupón aplicado
    discountAmount, // 🆕 Monto del descuento del cupón
  }: {
    amount: number;
    customerEmail: string;
    customerFirstName: string;
    customerLastName: string;
    cartItems: Array<{
      product_id: number;
      quantity: number;
      name: string;
      price: string;
      selectedAttributes?: Record<string, string>;
      attributes?: Array<{
        id: number;
        name: string;
        slug?: string;
      }>;
      variations?: Array<{
        id: number;
        attributes: Array<{
          id: number;
          option: string;
        }>;
      }>;
    }>;
    shippingInfo: {
      firstName: string;
      lastName: string;
      email: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      provincia: string;
      phone?: string;
      company?: string; // 🆕 Agregar campo company
    };
    paymentMethod: string;
    shippingCost?: number; // 🆕 Costo de envío calculado (considera cupón de envío gratis)
    couponCode?: string; // 🆕 Código del cupón aplicado
    discountAmount?: number; // 🆕 Monto del descuento del cupón
  }) {
    try {
      // Función para convertir selectedAttributes a meta_data para WooCommerce
      const convertAttributesToMetaData = (
        item: (typeof cartItems)[0]
      ): Array<{ key: string; value: string }> => {
        if (!item.selectedAttributes) {
          return [];
        }

        const metaData: Array<{ key: string; value: string }> = [];

        // Si tenemos los atributos del producto, usarlos para obtener el nombre correcto
        if (item.attributes && item.attributes.length > 0) {
          Object.entries(item.selectedAttributes).forEach(([attrId, value]) => {
            // Buscar el atributo en item.attributes para obtener su nombre
            const attribute = item.attributes?.find(
              (attr: any) => String(attr.id) === String(attrId)
            );

            if (attribute && value) {
              // WooCommerce usa prefijo "pa_" para atributos globales
              let key = `pa_${attribute.name
                .toLowerCase()
                .replace(/\s+/g, "_")}`;

              // Si el atributo tiene un slug, usarlo
              if (attribute.slug) {
                key = `pa_${attribute.slug}`;
              }

              metaData.push({
                key,
                value: String(value),
              });
            }
          });
        } else {
          // Si no tenemos los atributos, intentar inferir el nombre desde selectedAttributes
          // Esto es un fallback para cuando no tenemos la estructura completa
          Object.entries(item.selectedAttributes).forEach(([attrId, value]) => {
            if (value) {
              // Intentar usar el ID como nombre base (esto es un fallback)
              metaData.push({
                key: `pa_attribute_${attrId}`,
                value: String(value),
              });
            }
          });
        }

        return metaData;
      };

      // Construir line_items para WooCommerce
      const lineItems = cartItems.map((item) => {
        const metaData = convertAttributesToMetaData(item);

        return {
          product_id: item.product_id,
          quantity: item.quantity,
          ...(item.variations &&
            item.variations.length > 0 && {
              variation_id: item.variations[0].id,
            }),
          ...(metaData.length > 0 && { meta_data: metaData }),
        };
      });

      // Construir datos de facturación y envío
      const billingShipping = {
        first_name: customerFirstName,
        last_name: customerLastName,
        email: customerEmail,
        phone: shippingInfoParam.phone || "",
        address_1: shippingInfoParam.address,
        city: shippingInfoParam.city,
        state: shippingInfoParam.state,
        postcode: shippingInfoParam.zipCode,
        country: "PE",
        company: shippingInfoParam.company || "", // 🆕 Agregar campo company
      };

      // 🆕 Calcular subtotal
      const subtotal = cartItems.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      );

      // 🆕 Usar el costo de envío pasado como parámetro (ya considera cupón de envío gratis)
      // Si no se pasa, calcular desde amount - subtotal como fallback
      const finalShippingCost =
        shippingCost !== undefined
          ? shippingCost
          : Math.max(0, amount - subtotal);

      // 🆕 Construir shipping_lines para incluir el costo de envío
      // Solo incluir shipping_lines si el costo es mayor a 0 (envío gratis = no incluir shipping_lines)
      const shippingLines =
        finalShippingCost > 0
          ? [
              {
                method_id: "flat_rate",
                method_title: "Envío",
                total: finalShippingCost.toFixed(2),
              },
            ]
          : [];

      // 🆕 Construir coupon_lines si hay un cupón aplicado
      const couponLines =
        couponCode && discountAmount !== undefined && discountAmount > 0
          ? [
              {
                code: couponCode,
                discount: discountAmount.toFixed(2),
              },
            ]
          : [];

      // Crear orden en WooCommerce usando la API REST
      const orderData = {
        payment_method: paymentMethod,
        payment_method_title: "Pago con Izipay",
        status: "pending",
        billing: billingShipping,
        shipping: billingShipping,
        line_items: lineItems,
        shipping_lines: shippingLines, // 🆕 Incluir costos de envío
        ...(couponLines.length > 0 && { coupon_lines: couponLines }), // 🆕 Incluir cupones si hay
        total: amount.toString(),
      };

      // Crear orden usando el servicio
      const wcOrder = await createOrder(orderData);

      if (!wcOrder.id) {
        throw new Error("No se recibió ID de orden de WooCommerce");
      }

      return {
        success: true,
        order_id: wcOrder.id,
        order_data: wcOrder,
      };
    } catch (error) {
      throw error;
    }
  }

  // Función para pagar con Izipay
  async function pagarConIzipay({
    amount,
    customerEmail,
    customerFirstName,
    customerLastName,
    tempOrderId,
    cartItems,
    shippingInfo: shippingInfoParam,
    ipnUrl,
    returnUrl,
    wcOrderId, // 🆕 Nuevo parámetro para el ID de orden de WooCommerce
  }: {
    amount: number;
    customerEmail: string;
    customerFirstName: string;
    customerLastName: string;
    tempOrderId?: number;
    cartItems?: Array<{
      product_id: number;
      quantity: number;
      name: string;
      price: string;
      selectedAttributes?: Record<string, string>;
      variations?: Array<{
        id: number;
        attributes: Array<{
          id: number;
          option: string;
        }>;
      }>;
    }>;
    shippingInfo?: {
      firstName: string;
      lastName: string;
      email: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      provincia: string;
      company?: string; // 🆕 Agregar campo company
    };
    ipnUrl?: string;
    returnUrl?: string;
    wcOrderId?: number; // 🆕 ID de orden de WooCommerce
  }) {
    try {
      // Validar datos antes de enviar
      if (!amount || amount <= 0) {
        throw new Error("Monto inválido");
      }
      if (!customerEmail || !customerFirstName || !customerLastName) {
        throw new Error("Datos del cliente incompletos");
      }

      // 🆕 Usar el ID de orden de WooCommerce si está disponible
      const orderId = wcOrderId
        ? `WC-${wcOrderId}`
        : tempOrderId
        ? `ORDER-${tempOrderId}`
        : `ORDER-${Date.now()}`;

      // Usar el servicio de Izipay
      const paymentData = {
        amount,
        currency: "PEN",
        orderId: orderId, // 🆕 Usar el ID de orden de WooCommerce
        customerEmail,
        customerFirstName,
        customerLastName,
        // 🆕 Incluir datos del carrito para el IPN
        cartItems:
          cartItems ||
          cart.map((item) => ({
            product_id: Number(item.id),
            quantity: item.quantity,
            name: item.name,
            price: item.price,
            ...(item.selectedAttributes && {
              selectedAttributes: item.selectedAttributes,
            }),
            ...(item.variations && { variations: item.variations }),
          })),
        shippingInfo: shippingInfoParam || {
          firstName: customerFirstName,
          lastName: customerLastName,
          email: customerEmail,
          address: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          provincia: shippingInfo.provincia,
          company: shippingInfo.company, // 🆕 Agregar campo company
        },
        // 🆕 URLs para el IPN y redirección
        ipnUrl: ipnUrl || `${window.location.origin}/api/izipay/ipn`,
        returnUrl:
          returnUrl || `${window.location.origin}/payment-result/success`,
        // 🆕 AGREGAR URLs específicas para Izipay
        successUrl: `${window.location.origin}/payment-result/success`,
        errorUrl: `${window.location.origin}/payment-result/failed`,
        cancelUrl: `${window.location.origin}/payment-result/cancelled`,
      };

      const data = await createIzipayPayment(paymentData);

      if (data.success && data.form_token) {
        // 🆕 Guardar el ID de orden de WooCommerce para usarlo en la redirección
        if (wcOrderId) {
          setIzipayOrderId(wcOrderId);
        } else if (data.order_id) {
          setIzipayOrderId(data.order_id);
        }

        // Mostrar mensaje de éxito
        setOrderSuccess(
          "Pago creado exitosamente. Renderizando formulario de pago..."
        );

        // Renderizar formulario incrustado de Izipay
        if (data.public_key) {
          await renderizarFormularioIncrustado(
            data.form_token,
            data.public_key
          );
        } else {
          throw new Error("Public key no recibida de Izipay");
        }
      } else {
        throw new Error(data.error || "Error desconocido al crear el pago");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setOrderError(`Error al procesar el pago con Izipay: ${errorMessage}`);
      throw error; // Re-lanzar para que handlePaymentSubmit lo maneje
    }
  }

  // Función para renderizar el formulario incrustado de Izipay
  const renderizarFormularioIncrustado = async (
    formToken: string,
    publicKey: string
  ) => {
    try {
      // 🆕 IMPORTANTE: Cargar la librería de Izipay ANTES de usarla

      // Importar librería oficial
      const KRGlue = await import("@lyracom/embedded-form-glue");

      const endpoint = "https://static.micuentaweb.pe";

      // Cargar librería con publicKey
      const { KR } = await KRGlue.default.loadLibrary(endpoint, publicKey);

      // Verificar que KR esté disponible
      if (KR) {
        // 🆕 CONFIGURACIÓN COMPLETA con URLs de redirección
        KR.setFormConfig({
          formToken: formToken,
          "kr-language": "es-ES",
          // 🆕 AGREGAR URLs de redirección (comentadas por ahora para evitar errores de linter)
          // "kr-post-url-success": `${window.location.origin}/payment-result/success`,
          // "kr-post-url-refused": `${window.location.origin}/payment-result/failed`,
          // "kr-post-url-error": `${window.location.origin}/payment-result/failed`,
        });

        // 🆕 MANEJADOR SIMPLIFICADO: Solo confiar en el IPN del backend
        KR.onSubmit(async () => {
          try {
            // ✅ La validación de firma ahora se hace en el backend
            // No es necesario validar en el frontend por seguridad

            // 🆕 PASO 2: Procesar respuesta exitosa

            // 🆕 SIMPLIFICADO: Solo confiar en el IPN
            // El IPN se encargará de actualizar la orden en WooCommerce
            setOrderSuccess("Pago procesado exitosamente - Redirigiendo...");

            // Redirigir después de un breve delay
            setTimeout(() => {
              const orderId = izipayOrderId || "unknown";
              window.location.href = `/payment-result/success?order=${orderId}`;
            }, 100000);

            return true; // Permitir que Izipay maneje la redirección
          } catch {
            setOrderError(
              "Error procesando el pago. Por favor, inténtalo de nuevo."
            );
            return false;
          }
        });

        // 🆕 MOSTRAR FORMULARIO DE PAGO
        KR.showForm(formToken);

        // 🆕 IMPORTANTE: Mostrar el contenedor del formulario
        setShowIzipayForm(true);
        setIzipayFormToken(formToken);
        setIzipayFormLoaded(true);

        // Scroll al formulario
        setTimeout(() => {
          const formElement = document.getElementById("izipay-embedded-form");
          if (formElement) {
            formElement.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else {
        throw new Error("KR no está disponible en el navegador");
      }
    } catch {
      setOrderError("Error al mostrar el formulario de pago");
    }
  };

  // Función para confirmar el cierre del modal
  function confirmarCierreModal() {
    setShowIzipayForm(false);
    setIzipayFormToken("");
    setIzipayFormLoaded(false);
    setOrderError("");
    setOrderSuccess("");
    setIzipayOrderId(null);

    // NUEVO: Incrementar la key para forzar recarga del formulario
    setIzipayFormKey((prev) => prev + 1);

    // SOLUCIÓN RÁPIDA: Refresh completo de la página (como F5)
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  // Cargar librería oficial de Izipay
  const cargarLibreriaIzipay = useCallback(
    async (formToken: string) => {
      try {
        // NUEVO: Limpiar cualquier estado anterior

        // Importar librería oficial
        const KRGlue = await import("@lyracom/embedded-form-glue");

        const endpoint = "https://static.micuentaweb.pe";

        // NUEVO: Cargar librería con publicKey (esto resetea el estado interno)
        const { KR } = await KRGlue.default.loadLibrary(
          endpoint,
          process.env.IZIPAY_PUBLIC_KEY || ""
        );

        // Configurar formulario
        KR.setFormConfig({
          formToken: formToken,
          "kr-language": "es-ES",
        });

        // Adjuntar formulario al contenedor
        const { result } = await KR.attachForm("#micuentawebstd_rest_wrapper");

        // Mostrar formulario
        KR.showForm(result.formId);

        // 🆕 Configurar callback de envío SIMPLIFICADO: Solo IPN
        KR.onSubmit(async () => {
          // 🆕 SIMPLIFICADO: Solo confiar en el IPN
          // El IPN se encargará de actualizar la orden en WooCommerce
          setOrderSuccess("Pago procesado exitosamente - Redirigiendo...");

          // Redirigir después de un breve delay
          setTimeout(() => {
            const orderId = izipayOrderId || "unknown";
            window.location.href = `/payment-result/success?order=${orderId}`;
          }, 2000);

          return true; // Permitir que Izipay maneje la redirección
        });

        setIzipayFormLoaded(true);
      } catch {
        setOrderError("Error al cargar el formulario de pago oficial.");
      }
    },
    [izipayOrderId]
  );

  // Cargar librería oficial de Izipay e inicializar formulario
  useEffect(() => {
    if (showIzipayForm && izipayFormToken) {
      // NUEVO: Forzar recarga completa cada vez que se abre
      setIzipayFormLoaded(false);

      // Agregar un pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        cargarLibreriaIzipay(izipayFormToken);
      }, 100);
    }
  }, [
    showIzipayForm,
    izipayFormToken,
    izipayFormKey, // NUEVO: Agregar izipayFormKey como dependencia
    cargarLibreriaIzipay, // Now available
  ]);

  // 🆕 FUNCIÓN PARA CANCELAR ORDEN IZIPAY
  const cancelIzipayOrder = async () => {
    if (!izipayOrderId) {
      setOrderError("No hay orden para cancelar");
      return;
    }

    setIsCancellingOrder(true);
    setOrderError("");

    try {
      const response = await fetch(`/api/cancel-order?id=${izipayOrderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al cancelar la orden");
      }

      await response.json();

      // Limpiar estados de Izipay
      setShowIzipayForm(false);
      setIzipayFormToken("");
      setIzipayFormLoaded(false);
      setIzipayOrderId(null);
      setShowCancelModal(false);

      setOrderSuccess(
        "Orden cancelada exitosamente. Puedes elegir otro método de pago."
      );

      // Auto-cerrar mensaje después de 2 segundos
      setTimeout(() => {
        setOrderSuccess("");
      }, 2000);
    } catch {
      setOrderError("Error al cancelar la orden. Inténtalo de nuevo.");
    } finally {
      setIsCancellingOrder(false);
    }
  };

  // 🆕 FUNCIÓN PARA MOSTRAR MODAL DE CANCELACIÓN
  const handleCancelIzipay = () => {
    setShowCancelModal(true);
  };

  // 🆕 FUNCIÓN PARA CONFIRMAR CANCELACIÓN
  const confirmCancelOrder = () => {
    cancelIzipayOrder();
  };

  // 🆕 FUNCIÓN PARA CERRAR MODAL DE CANCELACIÓN
  const closeCancelModal = () => {
    setShowCancelModal(false);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setOrderError("");
    setOrderSuccess("");

    // Definir la URL de la API para usar en todo el scope
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      // Construir payload de WooCommerce

      const billingShipping = {
        first_name: shippingInfo.firstName,
        last_name:
          `${shippingInfo.firstLastName} ${shippingInfo.secondLastName}`.trim(),
        address_1: shippingInfo.address,
        address_2: shippingInfo.apartment,
        city:
          shippingInfo.state !== "PE:LMA" && shippingInfo.state !== "PE:CAL"
            ? shippingInfo.provincia && shippingInfo.city
              ? `${shippingInfo.provincia}, ${shippingInfo.city}`
              : shippingInfo.city || shippingInfo.provincia
            : shippingInfo.city,
        company: shippingInfo.company,
        state: shippingInfo.state,
        postcode: shippingInfo.zipCode,
        country: "PE",
        email: shippingInfo.email,
        phone: shippingInfo.phone,
      };

      const selectedShipping = shippingMethods.find(
        (m) => m.id === shippingMethod
      ) || {
        id: shippingMethod,
        method_title: String(shippingMethod),
        settings: { cost: { value: "0.00" } },
      };
      // 🆕 Calcular costo de envío considerando cupón de envío gratis
      // Si hay un cupón con envío gratis o califica para envío gratuito, el costo es 0
      const finalShippingCost = isShippingFree ? 0 : costoEnvio;

      const shippingLine = {
        method_id: String(selectedShipping.id),
        method_title: selectedShipping.method_title || String(shippingMethod),
        total: finalShippingCost.toFixed(2), // Usar costo calculado que considera cupón
      };
      // Función para convertir selectedAttributes a meta_data para WooCommerce
      const convertAttributesToMetaData = (
        item: (typeof cart)[0]
      ): Array<{ key: string; value: string }> => {
        if (!item.selectedAttributes || !item.attributes) {
          return [];
        }

        const metaData: Array<{ key: string; value: string }> = [];

        // Iterar sobre los atributos del producto para obtener el nombre correcto
        Object.entries(item.selectedAttributes).forEach(([attrId, value]) => {
          // Buscar el atributo en item.attributes para obtener su nombre
          const attribute = item.attributes.find(
            (attr) => String(attr.id) === String(attrId)
          );

          if (attribute && value) {
            // WooCommerce usa prefijo "pa_" para atributos globales
            // Intentar diferentes formatos de key
            let key = `pa_${attribute.name.toLowerCase().replace(/\s+/g, "_")}`;

            // Si el atributo tiene un slug, usarlo
            if (attribute.slug) {
              key = `pa_${attribute.slug}`;
            }

            metaData.push({
              key,
              value: String(value),
            });
          }
        });

        return metaData;
      };

      const lineItems = cart.map((item) => {
        let variation_id: number | undefined = undefined;
        if (
          item.selectedAttributes &&
          item.variations &&
          item.variations.length > 0
        ) {
          const match = item.variations.find((v) => {
            return v.attributes.every((a) => {
              const selected = item.selectedAttributes?.[a.id];
              return selected && selected === a.option;
            });
          });
          if (match) variation_id = match.id;
        }

        const metaData = convertAttributesToMetaData(item);

        return {
          product_id: Number(item.id),
          quantity: item.quantity,
          ...(variation_id ? { variation_id } : {}),
          ...(metaData.length > 0 && { meta_data: metaData }),
        };
      });
      const paymentMethod = paymentMethods.find(
        (p) => p.id === selectedPayment
      );

      // 🔍 PASO 1: Verificar si es Izipay ANTES de crear orden
      const isIzipayPayment =
        paymentMethod?.id === "micuentaweb" ||
        paymentMethod?.id === "izipay" ||
        paymentMethod?.id === "micuentawebstd" ||
        paymentMethod?.id?.startsWith("woo-mcw") ||
        paymentMethod?.id?.startsWith("micuentaweb");

      if (isIzipayPayment) {
        try {
          // 🆕 PASO 1: Crear orden en WooCommerce primero (estado pending)

          const wcOrderResult = await createWooCommerceOrderBeforeIzipay({
            amount: total,
            customerEmail: shippingInfo.email,
            customerFirstName: shippingInfo.firstName,
            customerLastName:
              `${shippingInfo.firstLastName} ${shippingInfo.secondLastName}`.trim(),
            cartItems: cart.map((item) => ({
              product_id: Number(item.id),
              quantity: item.quantity,
              name: item.name,
              price: item.price,
              ...(item.selectedAttributes && {
                selectedAttributes: item.selectedAttributes,
              }),
              ...(item.attributes && { attributes: item.attributes }),
              ...(item.variations && { variations: item.variations }),
            })),
            shippingInfo: {
              firstName: shippingInfo.firstName,
              lastName:
                `${shippingInfo.firstLastName} ${shippingInfo.secondLastName}`.trim(),
              email: shippingInfo.email,
              address: shippingInfo.address,
              city: shippingInfo.city,
              state: shippingInfo.state,
              zipCode: shippingInfo.zipCode,
              provincia: shippingInfo.provincia,
              phone: shippingInfo.phone,
              company: shippingInfo.company, // 🆕 Agregar campo company
            },
            paymentMethod: paymentMethod?.id || "izipay",
            shippingCost: costoEnvio, // 🆕 Pasar el costo de envío calculado (considera cupón de envío gratis)
            couponCode: appliedCoupon?.code, // 🆕 Pasar código del cupón si hay
            discountAmount: discount, // 🆕 Pasar monto del descuento
          });

          if (!wcOrderResult.success || !wcOrderResult.order_id) {
            throw new Error("No se pudo crear la orden en WooCommerce");
          }

          // 🆕 PASO 2: Procesar el pago con Izipay usando el ID de orden de WooCommerce
          await pagarConIzipay({
            amount: total,
            customerEmail: shippingInfo.email,
            customerFirstName: shippingInfo.firstName,
            customerLastName:
              `${shippingInfo.firstLastName} ${shippingInfo.secondLastName}`.trim(),
            // 🆕 Incluir datos del carrito para el IPN
            cartItems: cart.map((item) => ({
              product_id: Number(item.id),
              quantity: item.quantity,
              name: item.name,
              price: item.price,
              ...(item.selectedAttributes && {
                selectedAttributes: item.selectedAttributes,
              }),
              ...(item.attributes && { attributes: item.attributes }),
              ...(item.variations && { variations: item.variations }),
            })),
            shippingInfo: {
              firstName: shippingInfo.firstName,
              lastName:
                `${shippingInfo.firstLastName} ${shippingInfo.secondLastName}`.trim(),
              email: shippingInfo.email,
              address: shippingInfo.address,
              city: shippingInfo.city,
              state: shippingInfo.state,
              zipCode: shippingInfo.zipCode,
              provincia: shippingInfo.provincia,
              company: shippingInfo.company, // 🆕 Agregar campo company
            },
            // 🆕 URLs para el IPN de Mi Cuenta Web (WordPress)
            ipnUrl: `${apiUrl}/wp-json/izipay/v1/ipn`,
            returnUrl: `${window.location.origin}/payment-result/success`,
            // 🆕 Pasar el ID de orden de WooCommerce
            wcOrderId: wcOrderResult.order_id,
          });

          // Si llegamos aquí, la redirección ya se inició
          return;
        } catch {
          // El error ya se estableció en setOrderError dentro de pagarConIzipay
          return;
        }
      }

      // ✅ PASO 2: Para métodos NO-Izipay, crear orden normalmente

      // 🆕 Construir coupon_lines si hay un cupón aplicado
      const couponLines = appliedCoupon
        ? [
            {
              code: appliedCoupon.code,
              discount: discount.toFixed(2), // Descuento calculado
            },
          ]
        : [];

      const orderPayload = {
        payment_method: paymentMethod?.id || "transfer-peru",
        payment_method_title:
          paymentMethod?.title ||
          paymentMethod?.method_title ||
          "Transferencia bancaria",
        set_paid: false,
        total: total.toFixed(2),
        billing: billingShipping,
        shipping: billingShipping,
        line_items: lineItems,
        shipping_lines: [shippingLine],
        ...(couponLines.length > 0 && { coupon_lines: couponLines }), // 🆕 Incluir cupones si hay
        customer: {
          email: shippingInfo.email,
          first_name: shippingInfo.firstName,
          last_name:
            `${shippingInfo.firstLastName} ${shippingInfo.secondLastName}`.trim(),
        },
        ...(paymentMethod?.id === "transfer-peru" && { status: "on-hold" }), // Solo incluir status si es transfer-peru
      };

      // Crear la orden SOLO para métodos NO-Izipay
      const order = (await createOrder(orderPayload)) as {
        id: number;
        status: string;
        total: string;
        payment_method_title: string;
        order_key: string;
      };
      // Si el método de pago es cualquier Mercado Pago, redirigir a Mercado Pago
      if (paymentMethod?.id?.startsWith("woo-mercado-pago")) {
        await pagarConMercadoPago({
          items: cart.map((item) => ({
            title: item.name,
            quantity: item.quantity,
            unit_price: parseFloat(item.price),
            currency_id: "PEN",
          })),
          orderId: order.id, // <-- Pasar orderId
        });
        return;
      }

      // ✅ La lógica de Izipay ya se procesó arriba, continuar con otros métodos

      // Para otros métodos, solo redirigir a thank-you con el id de la orden
      router.push(`/thank-you?order=${order.id}`);
      return;
    } catch (error) {
      setOrderError(
        (error as { message?: string })?.message ||
          "No se pudo crear la orden. Intenta de nuevo."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Calcular subtotal, envío y total dinámicamente
  const envioSeleccionado = shippingMethods.find(
    (m) => m.id === shippingMethod
  );

  // Usar useMemo para calcular subtotal y evitar errores de hidratación
  // El cálculo se hace basado en el carrito actual y el cupón aplicado
  // Agregar dependencias del carrito para forzar recálculo cuando cambia
  const cartKey =
    cart.length > 0
      ? cart.map((item) => `${item.id}-${item.quantity}`).join(",")
      : "empty";
  const subtotal = useMemo(() => {
    if (!isClient) return 0;
    // El subtotal NO incluye descuentos, es el total del carrito sin cupones
    const calculatedSubtotal = getSubtotal();
    console.log("💰 Subtotal calculation:", {
      calculatedSubtotal,
      cartLength: cart.length,
      hasCoupon: !!appliedCoupon,
      couponCode: appliedCoupon?.code,
    });
    return calculatedSubtotal;
  }, [isClient, cart, cartKey, getSubtotal]);

  const discount = useMemo(() => {
    if (!isClient) return 0;
    return getDiscountAmount();
  }, [isClient, cart, getDiscountAmount, appliedCoupon, couponDiscount]);

  // 🆕 Calcular costo de envío original
  const originalShippingCost =
    envioSeleccionado && envioSeleccionado.settings?.cost?.value
      ? parseFloat(envioSeleccionado.settings.cost.value)
      : 0;

  // 🆕 Hook para manejar envío gratuito
  const {
    config: freeShippingConfig,
    qualifiesForFreeShipping,
    remainingForFreeShipping,
    shippingCost: calculatedShippingCost,
    calculateShipping: recalculateShipping,
  } = useFreeShipping(subtotal, originalShippingCost);

  // Forzar recálculo del envío gratuito solo cuando cambia el subtotal significativamente
  // No recalcular cuando solo cambia el cupón (el cupón se maneja directamente en isShippingFree)
  useEffect(() => {
    if (isClient && subtotal >= 0) {
      // Solo recalcular si el subtotal cambió significativamente (más de 0.01)
      // O si se removió un cupón (para resetear el cálculo)
      const timeoutId = setTimeout(() => {
        recalculateShipping(subtotal);
      }, 500); // Debounce más largo para evitar llamadas excesivas
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, subtotal]); // Solo subtotal, no appliedCoupon ni cartKey

  // Determinar si el envío es gratuito (por cupón o por threshold)
  const isShippingFree = useMemo(() => {
    if (!isClient) return false;

    // Si hay un cupón con envío gratuito, el envío es gratuito
    if (appliedCoupon?.free_shipping === true) {
      return true;
    }

    // Si no hay cupón o el cupón no tiene envío gratuito, usar el cálculo del hook
    // (basado en si el subtotal alcanza el threshold)
    return qualifiesForFreeShipping;
  }, [isClient, appliedCoupon, qualifiesForFreeShipping, subtotal]);

  const costoEnvio = useMemo(() => {
    if (!isClient) return 0;

    // Si el envío es gratuito (por cupón o por threshold), retornar 0
    if (isShippingFree) {
      return 0;
    }

    // Si no es gratuito, usar el costo original
    return originalShippingCost;
  }, [isClient, isShippingFree, originalShippingCost]);

  // Debug: Log cuando cambia el cupón o el subtotal
  useEffect(() => {
    if (isClient) {
      console.log("🛒 Checkout State Update:", {
        subtotal,
        discount,
        appliedCoupon: appliedCoupon?.code || null,
        couponFreeShipping: appliedCoupon?.free_shipping || false,
        cartLength: cart.length,
        qualifiesForFreeShipping,
        isShippingFree,
        costoEnvio,
      });
    }
  }, [
    isClient,
    subtotal,
    discount,
    appliedCoupon,
    cart.length,
    qualifiesForFreeShipping,
    isShippingFree,
    costoEnvio,
  ]);

  const total = useMemo(() => {
    if (!isClient) return 0;
    return getTotal() + costoEnvio;
  }, [isClient, cart, discount, costoEnvio, getTotal]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Botón de testing temporal */}
      {/* <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div> */}

      <div className="pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 ">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push("/cart")}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft size={20} />
              Volver al carrito
            </button>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
              Checkout
            </h1>
            {/* <div className="flex items-center gap-2 text-gray-600">
              <Lock size={16} />
              <span>
                Tus datos están protegidos con cifrado SSL de 256 bits
              </span>
            </div> */}
          </div>
          <div className="mb-8">
            {/* 🆕 INDICADOR DE PROGRESO RESPONSIVO PARA MÓVIL */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-8">
              {/* Paso 1: Datos personales */}
              <div
                className={`flex items-center gap-1 sm:gap-2 ${
                  currentStep >= 1 ? "text-primary" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    currentStep >= 1 ? "bg-primary text-white" : "bg-gray-200"
                  }`}
                >
                  {currentStep > 1 ? (
                    <Check size={12} className="sm:w-4 sm:h-4" />
                  ) : (
                    <User size={12} className="sm:w-4 sm:h-4" />
                  )}
                </div>
                <span className="font-medium text-sm sm:text-sm max-w-[80px] sm:max-w-none truncate">
                  Datos personales
                </span>
              </div>

              {/* Separador 1 */}
              <div
                className={`w-8 sm:w-12 md:w-16 h-0.5 ${
                  currentStep >= 2 ? "bg-primary" : "bg-gray-200"
                }`}
              ></div>

              {/* Paso 2: Envío */}
              <div
                className={`flex items-center gap-1 sm:gap-2 ${
                  currentStep >= 2 ? "text-primary" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    currentStep >= 2 ? "bg-primary text-white" : "bg-gray-200"
                  }`}
                >
                  {currentStep > 2 ? (
                    <Check size={12} className="sm:w-4 sm:h-4" />
                  ) : (
                    <Truck size={12} className="sm:w-4 sm:h-4" />
                  )}
                </div>
                <span className="font-medium text-sm sm:text-sm truncate">
                  Envío
                </span>
              </div>

              {/* Separador 2 */}
              <div
                className={`w-8 sm:w-12 md:w-16 h-0.5 ${
                  currentStep >= 3 ? "bg-primary" : "bg-gray-200"
                }`}
              ></div>

              {/* Paso 3: Pago */}
              <div
                className={`flex items-center gap-1 sm:gap-2 ${
                  currentStep >= 3 ? "text-primary" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    currentStep >= 3 ? "bg-primary text-white" : "bg-gray-200"
                  }`}
                >
                  {currentStep > 3 ? (
                    <Check size={12} className="sm:w-4 sm:h-4" />
                  ) : (
                    <CreditCard size={12} className="sm:w-4 sm:h-4" />
                  )}
                </div>
                <span className="font-medium text-sm sm:text-sm truncate">
                  Pago
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              {currentStep === 1 && (
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                    Datos personales
                  </h2>
                  {/* 🆕 Checkbox para usar datos guardados (solo si está autenticado) */}
                  {isAuthenticated && (
                    <div className="mb-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useSavedData}
                          onChange={(e) => setUseSavedData(e.target.checked)}
                          className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Utilizar datos guardados
                        </span>
                      </label>
                      {useSavedData && profile && (
                        <p className="text-xs text-gray-500 mt-1 ml-7">
                          Se utilizarán los datos de tu última compra
                        </p>
                      )}
                    </div>
                  )}
                  <form
                    onSubmit={handlePersonalDataSubmit}
                    className="space-y-6"
                  >
                    {/* CSRF Token - Hidden field */}
                    <input
                      type="hidden"
                      name="_csrf"
                      value={getCSRFField().value}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombres *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.firstName}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            firstName: e.target.value,
                          })
                        }
                        className="w-full uppercase placeholder:normal-case px-4 py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Ingresa tus nombres"
                      />
                      {validationErrors.firstName && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.firstName}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primer Apellido *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingInfo.firstLastName}
                          onChange={(e) =>
                            setShippingInfo({
                              ...shippingInfo,
                              firstLastName: e.target.value,
                            })
                          }
                          className="w-full uppercase placeholder:normal-case px-4 py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          placeholder="Ingresa tu primer apellido"
                        />
                        {validationErrors.firstLastName && (
                          <p className="text-red-500 text-xs mt-1">
                            {validationErrors.firstLastName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Segundo Apellido *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingInfo.secondLastName}
                          onChange={(e) =>
                            setShippingInfo({
                              ...shippingInfo,
                              secondLastName: e.target.value,
                            })
                          }
                          className="w-full uppercase placeholder:normal-case px-4 py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          placeholder="Ingresa tu segundo apellido"
                        />
                        {validationErrors.secondLastName && (
                          <p className="text-red-500 text-xs mt-1">
                            {validationErrors.secondLastName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        DNI, RUC, Cedula *
                      </label>
                      <input
                        type="number"
                        required
                        value={shippingInfo.company}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            company: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Ingresa tu DNI, RUC o Cedula"
                      />
                      {validationErrors.company && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.company}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={shippingInfo.email}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Ingresa tu email"
                      />
                      {validationErrors.email && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono *
                      </label>
                      <input
                        type="number"
                        required
                        value={shippingInfo.phone}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            phone: e.target.value,
                          })
                        }
                        className="w-full uppercase px-4 placeholder:normal-case py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Ingresa tu teléfono"
                      />
                      {validationErrors.phone && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.phone}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => router.push("/cart")}
                        className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
                        <span className="truncate">Volver al carrito</span>
                      </button>
                      <button
                        type="submit"
                        className={`flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                          shippingInfo.firstName &&
                          shippingInfo.firstLastName &&
                          shippingInfo.secondLastName &&
                          shippingInfo.email &&
                          shippingInfo.phone
                            ? "bg-primary text-white hover:scale-105"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                        disabled={
                          !shippingInfo.firstName ||
                          !shippingInfo.firstLastName ||
                          !shippingInfo.secondLastName ||
                          !shippingInfo.email ||
                          !shippingInfo.phone
                        }
                      >
                        <span className="truncate">Continuar a envío</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {currentStep === 2 && (
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                    <Truck size={20} className="sm:w-6 sm:h-6" />
                    <span className="truncate">Información de envío</span>
                  </h2>
                  <form onSubmit={handleShippingSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.address}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            address: e.target.value,
                          })
                        }
                        className="w-full uppercase placeholder:normal-case px-4 py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Ingresa tu dirección"
                      />
                      {validationErrors.address && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors.address}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Departamento, piso, referencia, etc. (opcional)
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.apartment}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            apartment: e.target.value,
                          })
                        }
                        className="w-full uppercase placeholder:normal-case px-4 py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Ingresa tu información"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          País *
                        </label>
                        <input
                          type="text"
                          value="Perú"
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Deparatamento *
                        </label>
                        <select
                          required
                          value={shippingInfo.state}
                          onChange={(e) => {
                            const newState = e.target.value;
                            setShippingInfo((prev) => ({
                              ...prev,
                              state: newState,
                              city: "", // Limpiar distrito al cambiar provincia
                              zipCode: "",
                              provincia: "", // Limpiar provincia al cambiar departamento
                            }));
                            setShippingMethod(0); // Resetear método de envío al cambiar provincia
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        >
                          <option value="">Selecciona tu departamento</option>
                          {PROVINCIAS_PERU.map((prov) => (
                            <option key={prov.value} value={prov.value}>
                              {prov.label}
                            </option>
                          ))}
                        </select>
                        {validationErrors.state && (
                          <p className="text-red-500 text-xs mt-1">
                            {validationErrors.state}
                          </p>
                        )}
                      </div>
                      {shippingInfo.state &&
                        shippingInfo.state !== "PE:LMA" &&
                        shippingInfo.state !== "PE:CAL" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Provincia *
                            </label>
                            <input
                              type="text"
                              required
                              value={shippingInfo.provincia}
                              onChange={(e) =>
                                setShippingInfo({
                                  ...shippingInfo,
                                  provincia: e.target.value,
                                })
                              }
                              className="w-full uppercase placeholder:normal-case px-4 py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              placeholder="Ingresa tu provincia"
                            />
                            {validationErrors.provincia && (
                              <p className="text-red-500 text-xs mt-1">
                                {validationErrors.provincia}
                              </p>
                            )}
                          </div>
                        )}
                      {shippingInfo.state === "PE:LMA" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Distrito *
                          </label>
                          <select
                            required
                            value={shippingInfo.city}
                            onChange={(e) => {
                              const distrito = e.target.value;
                              const codigoPostal =
                                CODIGOS_POSTALES_LIMA[distrito] || "";
                              setShippingInfo({
                                ...shippingInfo,
                                city: distrito,
                                zipCode: codigoPostal,
                              });
                              setShippingMethod(0); // Resetear método de envío al cambiar distrito
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          >
                            <option value="">Selecciona un distrito</option>
                            {DISTRITOS_LIMA.map((distrito) => (
                              <option key={distrito} value={distrito}>
                                {distrito}
                              </option>
                            ))}
                          </select>
                          {validationErrors.city && (
                            <p className="text-red-500 text-xs mt-1">
                              {validationErrors.city}
                            </p>
                          )}
                        </div>
                      )}
                      {shippingInfo.state === "PE:CAL" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Distrito *
                          </label>
                          <select
                            required
                            value={shippingInfo.city}
                            onChange={(e) => {
                              const distrito = e.target.value;
                              const codigoPostal =
                                CODIGOS_POSTALES_CALLAO[distrito] || "";
                              setShippingInfo({
                                ...shippingInfo,
                                city: distrito,
                                zipCode: codigoPostal,
                              });
                              setShippingMethod(0); // Resetear método de envío al cambiar distrito
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          >
                            <option value="">Selecciona un distrito</option>
                            {DISTRITOS_CALLAO.map((distrito) => (
                              <option key={distrito} value={distrito}>
                                {distrito}
                              </option>
                            ))}
                          </select>
                          {validationErrors.city && (
                            <p className="text-red-500 text-xs mt-1">
                              {validationErrors.city}
                            </p>
                          )}
                        </div>
                      )}
                      {shippingInfo.state &&
                        shippingInfo.state !== "PE:LMA" &&
                        shippingInfo.state !== "PE:CAL" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Distrito *
                            </label>
                            <input
                              type="text"
                              required
                              value={shippingInfo.city}
                              onChange={(e) =>
                                setShippingInfo({
                                  ...shippingInfo,
                                  city: e.target.value,
                                })
                              }
                              className="w-full uppercase placeholder:normal-case  px-4 py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              placeholder="Ingresa tu distrito"
                            />
                            {validationErrors.city && (
                              <p className="text-red-500 text-xs mt-1">
                                {validationErrors.city}
                              </p>
                            )}
                          </div>
                        )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Código postal (opcional){" "}
                          {shippingInfo.state === "PE:LMA" ||
                          shippingInfo.state === "PE:CAL"
                            ? "*"
                            : ""}
                        </label>
                        <input
                          type="number"
                          required={
                            shippingInfo.state === "PE:LMA" ||
                            shippingInfo.state === "PE:CAL"
                          }
                          value={shippingInfo.zipCode}
                          onChange={(e) =>
                            setShippingInfo({
                              ...shippingInfo,
                              zipCode: e.target.value,
                            })
                          }
                          readOnly={
                            shippingInfo.state === "PE:LMA" ||
                            shippingInfo.state === "PE:CAL"
                          }
                          className={`w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
                            shippingInfo.state === "PE:LMA" ||
                            shippingInfo.state === "PE:CAL"
                              ? "bg-gray-100 cursor-not-allowed"
                              : ""
                          }`}
                          placeholder="Ingresa tu código postal"
                        />
                        {validationErrors.zipCode && (
                          <p className="text-red-500 text-xs mt-1">
                            {validationErrors.zipCode}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* UI de métodos de envío mejorada */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Método de envío
                      </h3>
                      {shippingInfo.state &&
                      ((shippingInfo.state !== "PE:LMA" &&
                        shippingInfo.state !== "PE:CAL") ||
                        (shippingInfo.state === "PE:LMA" &&
                          shippingInfo.city) ||
                        (shippingInfo.state === "PE:CAL" &&
                          shippingInfo.city)) ? (
                        !shippingZonesLoaded || isLoadingShipping ? (
                          <div className="space-y-3">
                            <div className="h-14 rounded-xl bg-gray-200 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" />
                            </div>
                            <div className="text-center text-sm text-gray-500">
                              {!shippingZonesLoaded
                                ? "Cargando zonas de envío..."
                                : "Calculando métodos de envío..."}
                            </div>
                            {/* Indicador de progreso real */}
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
                                  style={{ width: `${shippingProgress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ) : shippingMethods.length === 0 ? (
                          <div className="text-gray-500">
                            No hay métodos de envío disponibles.
                          </div>
                        ) : !shippingMethods.some(
                            (m) => m.id === shippingMethod
                          ) ? (
                          <div className="text-gray-500">
                            Selecciona un método de envío para continuar.
                          </div>
                        ) : (
                          shippingMethods.map((method) => {
                            const isOnlyOne = shippingMethods.length === 1;
                            const isSelected = shippingMethod === method.id;
                            return (
                              <label
                                key={method.id}
                                className={`flex items-center p-4 border-2 rounded-2xl mb-3 cursor-pointer transition-colors
                                  ${
                                    isOnlyOne
                                      ? "border-primary ring-2 ring-primary/40"
                                      : isSelected
                                      ? "border-primary ring-2 ring-primary/40 bg-[#f6fffc]"
                                      : "border-gray-200 hover:border-primary"
                                  }
                                `}
                              >
                                {!isOnlyOne && (
                                  <input
                                    type="radio"
                                    name="shipping"
                                    value={method.id}
                                    checked={isSelected}
                                    onChange={(e) =>
                                      setShippingMethod(Number(e.target.value))
                                    }
                                    className="text-primary focus:ring-primary "
                                  />
                                )}
                                <div
                                  className={`flex-1 ml-3  ${
                                    isOnlyOne ? "" : ""
                                  }`}
                                >
                                  <div className="flex justify-between">
                                    <span className="font-medium">
                                      {method.title || method.method_title}
                                    </span>
                                    <span className="font-bold text-primary">
                                      {method.settings?.cost?.value !==
                                      undefined ? (
                                        method.settings.cost.value ===
                                        "0.00" ? (
                                          "Gratis"
                                        ) : isShippingFree ? (
                                          <span className="flex items-center gap-2">
                                            <span className="line-through text-gray-400">
                                              S/. {method.settings.cost.value}
                                            </span>
                                            <span className="text-green-600 font-semibold">
                                              Gratis
                                            </span>
                                          </span>
                                        ) : (
                                          `S/. ${method.settings.cost.value}`
                                        )
                                      ) : (
                                        "-"
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </label>
                            );
                          })
                        )
                      ) : (
                        <div className="text-gray-500">
                          Selecciona provincia y distrito para ver métodos de
                          envío...
                        </div>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(1);
                          // 🆕 Scroll hacia arriba en móvil al volver de paso
                          setTimeout(() => {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }, 100);
                        }}
                        className="flex-1 py-3 sm:py-4 border-2 border-gray-200 text-gray-700 rounded-xl sm:rounded-2xl font-semibold hover:border-primary hover:text-primary transition-colors text-sm sm:text-base"
                      >
                        <span className="truncate">
                          Volver a datos personales
                        </span>
                      </button>
                      <button
                        type="submit"
                        className={`flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                          shippingInfo.address &&
                          shippingInfo.state &&
                          ((shippingInfo.state === "PE:LMA" &&
                            shippingInfo.city &&
                            shippingInfo.zipCode) ||
                            (shippingInfo.state === "PE:CAL" &&
                              shippingInfo.city &&
                              shippingInfo.zipCode) ||
                            (shippingInfo.state !== "PE:LMA" &&
                              shippingInfo.state !== "PE:CAL" &&
                              shippingInfo.city)) &&
                          shippingMethod &&
                          shippingMethods.some((m) => m.id === shippingMethod)
                            ? "bg-primary text-white hover:scale-105"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                        disabled={
                          !shippingInfo.address ||
                          !shippingInfo.state ||
                          (shippingInfo.state === "PE:LMA" &&
                            (!shippingInfo.city || !shippingInfo.zipCode)) ||
                          (shippingInfo.state === "PE:CAL" &&
                            (!shippingInfo.city || !shippingInfo.zipCode)) ||
                          (shippingInfo.state !== "PE:LMA" &&
                            shippingInfo.state !== "PE:CAL" &&
                            !shippingInfo.city) ||
                          !shippingMethod ||
                          !shippingMethods.some((m) => m.id === shippingMethod)
                        }
                      >
                        <span className="truncate">Continuar a pago</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {currentStep === 3 && (
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                    <CreditCard size={20} className="sm:w-6 sm:h-6" />
                    <span className="truncate">Selecciona método de pago</span>
                  </h2>
                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    <div className="space-y-3">
                      {paymentMethods.length > 0 ? (
                        paymentMethods.map((method) => {
                          // Debug log para ver qué métodos llegan
                          const isMercadoPago =
                            method.id.includes("mercadopago") ||
                            method.id.includes("mp") ||
                            method.title
                              ?.toLowerCase()
                              .includes("mercado pago") ||
                            method.method_title
                              ?.toLowerCase()
                              .includes("mercado pago");

                          const isIzipay =
                            method.id === "izipay" ||
                            method.id.includes("izipay") ||
                            method.title?.toLowerCase().includes("izipay") ||
                            method.method_title
                              ?.toLowerCase()
                              .includes("izipay");

                          return (
                            <label
                              key={method.id}
                              className="flex items-center p-4 border-2 border-gray-200 rounded-2xl cursor-pointer hover:border-primary transition-colors"
                            >
                              <input
                                type="radio"
                                name="payment"
                                value={method.id}
                                checked={selectedPayment === method.id}
                                onChange={() => setSelectedPayment(method.id)}
                                className="text-primary focus:ring-primary"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                    {/* Logo de Mercado Pago */}
                                    {isMercadoPago && (
                                      <div className="w-12 h-8 relative">
                                        <Image
                                          src="/mercado-pago.svg"
                                          alt="Mercado Pago"
                                          fill
                                          className="object-contain"
                                        />
                                      </div>
                                    )}
                                    {/* Logo de Izipay */}
                                    {isIzipay && (
                                      <div className="w-10 h-8 relative">
                                        <Image
                                          src="/logo-izipay.svg"
                                          alt="Mercado Pago"
                                          fill
                                          className="object-contain"
                                        />
                                      </div>
                                    )}
                                    <span className="font-medium">
                                      {isIzipay
                                        ? "Pago con Izipay"
                                        : method.title || method.method_title}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {isIzipay
                                    ? "Acepta Visa y Mastercard. Pago seguro con tarjeta de crédito o débito."
                                    : method.description}
                                </p>

                                {/* Métodos de pago de Mercado Pago */}
                                {isMercadoPago && (
                                  <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 mb-2">
                                      Métodos de pago disponibles:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {/* Yape */}
                                      <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                                        <div className="w-4 h-4 relative">
                                          <Image
                                            src="/logo-yape.svg"
                                            alt="Yape"
                                            fill
                                            className="object-contain"
                                          />
                                        </div>
                                        <span className="text-xs text-green-700 font-medium">
                                          Yape
                                        </span>
                                      </div>

                                      {/* PagoEfectivo */}
                                      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                                        <div className="w-4 h-4 relative">
                                          <Image
                                            src="/pago-efectivo.svg"
                                            alt="PagoEfectivo"
                                            fill
                                            className="object-contain"
                                          />
                                        </div>
                                        <span className="text-xs text-blue-700 font-medium">
                                          PagoEfectivo
                                        </span>
                                      </div>

                                      {/* Tarjetas */}
                                      <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg">
                                        <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center">
                                          <span className="text-xs text-purple-700 font-bold">
                                            💳
                                          </span>
                                        </div>
                                        <span className="text-xs text-purple-700 font-medium">
                                          Tarjetas
                                        </span>
                                      </div>

                                      {/* Transferencia */}
                                      <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg">
                                        <div className="w-4 h-4 bg-orange-100 rounded flex items-center justify-center">
                                          <span className="text-xs text-orange-700 font-bold">
                                            🏦
                                          </span>
                                        </div>
                                        <span className="text-xs text-orange-700 font-medium">
                                          Transferencia
                                        </span>
                                      </div>

                                      {/* Billeteras */}
                                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                        <div className="w-4 h-4 bg-yellow-100 rounded flex items-center justify-center">
                                          <span className="text-xs text-yellow-700 font-bold">
                                            📱
                                          </span>
                                        </div>
                                        <span className="text-xs text-yellow-700 font-medium">
                                          Billeteras
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Tarjetas aceptadas por Izipay */}
                                {isIzipay && (
                                  <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 mb-2">
                                      Tarjetas aceptadas:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {/* Visa */}
                                      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                                        <div className="w-5 h-5 relative">
                                          <Image
                                            src="/visa.svg"
                                            alt="Visa"
                                            fill
                                            className="object-contain"
                                          />
                                        </div>
                                        <span className="text-xs text-green-700 font-medium">
                                          Visa
                                        </span>
                                      </div>

                                      {/* Mastercard */}
                                      <div className="flex items-center gap-1 bg-yellow-50  px-2 py-1 rounded-lg">
                                        <div className="w-5 h-5 relative">
                                          <Image
                                            src="/mastercard.svg"
                                            alt="MasterCard"
                                            fill
                                            className="object-contain"
                                          />
                                        </div>
                                        <span className="text-xs text-[#b57200] font-medium">
                                          MasterCard
                                        </span>
                                      </div>
                                      {/* Mastercard */}
                                      <div className="flex items-center gap-1 bg-blue-50  px-2 py-1 rounded-lg">
                                        <div className="w-5 h-5 relative">
                                          <Image
                                            src="/logo-amex.svg"
                                            alt="MasterCard"
                                            fill
                                            className="object-contain"
                                          />
                                        </div>
                                        <span className="text-xs text-[#4d74a3] font-medium">
                                          American Express
                                        </span>
                                      </div>
                                      {/* Mastercard */}
                                      <div className="flex items-center gap-1 bg-gray-50  px-2 py-1 rounded-lg">
                                        <div className="w-6 h-6 relative">
                                          <Image
                                            src="/logo-dinner.svg"
                                            alt="Dinners Club"
                                            fill
                                            className="object-contain"
                                          />
                                        </div>
                                        <span className="text-xs text-gray-700 font-medium">
                                          Diners Club
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <div className="text-gray-500">
                          Cargando métodos de pago...
                        </div>
                      )}
                    </div>
                    {/* Si el método seleccionado es tarjeta, aquí irían los campos de tarjeta. Por ahora solo transferencia bancaria, así que no mostramos nada extra */}
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(2);
                          // 🆕 Scroll hacia arriba en móvil al volver de paso
                          setTimeout(() => {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }, 100);
                        }}
                        className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-primary hover:text-primary transition-colors"
                      >
                        Volver a envío
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="flex-1 py-4 bg-primary text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Procesando...
                          </>
                        ) : (
                          <>Finalizar pedido</>
                        )}
                      </button>
                    </div>
                  </form>
                  {orderError && (
                    <div className="izipay-status error">{orderError}</div>
                  )}
                  {orderSuccess && (
                    <div className="izipay-status success">{orderSuccess}</div>
                  )}
                </div>
              )}
            </div>
            <div className="lg:col-span-1 mb-4 lg:mb-0">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg sticky top-4 sm:top-24">
                {/* 🆕 HEADER COLAPSIBLE PARA MÓVIL */}
                <div className="p-4 sm:p-6">
                  {isClient && (
                    <button
                      onClick={() =>
                        setIsOrderSummaryExpanded(!isOrderSummaryExpanded)
                      }
                      className="lg:hidden w-full flex items-center justify-between pb-4 border-b border-gray-100"
                    >
                      <h2 className="text-lg font-bold text-gray-900">
                        Resumen del pedido
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">
                          S/{" "}
                          {(
                            getTotal() + (isClient ? costoEnvio || 0 : 0)
                          ).toFixed(2)}
                        </span>
                        <ChevronDown
                          size={20}
                          className={`transition-transform duration-200 ${
                            isOrderSummaryExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>
                  )}

                  {/* 🆕 TÍTULO PARA DESKTOP (siempre visible) */}
                  <h2 className="hidden lg:block text-xl font-bold text-gray-900 mb-6">
                    Resumen del pedido
                  </h2>
                </div>

                {/* 🆕 CONTENIDO COLAPSIBLE PARA MÓVIL */}
                <div
                  className={`lg:block ${
                    !isClient
                      ? "block"
                      : isOrderSummaryExpanded
                      ? "block"
                      : "hidden"
                  }`}
                >
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                      {cart.map((item) => (
                        <div
                          key={
                            item.slug +
                            JSON.stringify(item.selectedAttributes || {})
                          }
                          className="flex items-center gap-4 mb-4"
                        >
                          <div className="w-16 h-16 flex-shrink-0 relative">
                            <Image
                              src={
                                (item.variations &&
                                  item.selectedAttributes &&
                                  item.variations.find((v) =>
                                    v.attributes.every(
                                      (a) =>
                                        item.selectedAttributes?.[a.id] ===
                                        a.option
                                    )
                                  )?.image?.src) ||
                                (typeof item.image === "string"
                                  ? item.image
                                  : item.image?.sourceUrl ||
                                    "/logo-belm-v2.png")
                              }
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover rounded-xl border-gray-200 border-3"
                            />
                            {/* Badge con cantidad */}
                            {item.quantity > 1 && (
                              <div className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                                {item.quantity}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-xs">
                              {item.name}
                            </h3>
                            {/* Mostrar atributos seleccionados */}
                            {item.selectedAttributes &&
                              Object.keys(item.selectedAttributes).length >
                                0 && (
                                <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-2">
                                  {Object.entries(item.selectedAttributes).map(
                                    ([attrId, value]) => (
                                      <span
                                        key={attrId}
                                        className="bg-accent rounded px-2 py-0.5"
                                      >
                                        {(() => {
                                          const attr = item.attributes?.find(
                                            (a) =>
                                              String(a.id) === String(attrId)
                                          );
                                          return attr
                                            ? `${attr.name}: ${value}`
                                            : value;
                                        })()}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">
                              S/. {parseFloat(item.price) * item.quantity}
                            </div>
                            <div className="text-xs text-gray-500">
                              S/. {item.price} c/u
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sección de cupón */}
                    <CouponSection className="mb-6" />

                    <div className="space-y-4 mb-6 border-t pt-4">
                      {/* 🆕 Aviso de envío gratuito dinámico */}
                      {freeShippingConfig.enabled && isShippingFree && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-sm font-medium text-green-800">
                              🎉 ¡Felicidades! Tu pedido califica para{" "}
                              {freeShippingConfig.method_title}
                              {appliedCoupon?.free_shipping && " (por cupón)"}
                            </span>
                          </div>
                        </div>
                      )}
                      {/* Mensaje de "agrega más" solo cuando NO hay cupón y NO califica para envío gratuito */}
                      {freeShippingConfig.enabled &&
                        !isShippingFree &&
                        !appliedCoupon &&
                        remainingForFreeShipping > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-sm font-medium text-blue-800">
                                🚚 Agrega {freeShippingConfig.currency_symbol}
                                {isClient
                                  ? remainingForFreeShipping.toFixed(2)
                                  : "0.00"}{" "}
                                más para obtener{" "}
                                {freeShippingConfig.method_title}
                              </span>
                            </div>
                          </div>
                        )}

                      {/* 🆕 Subtotal: Total después del descuento (no repetir subtotal de productos ni descuento) */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">
                          {isClient
                            ? `S/. ${(subtotal - discount).toFixed(2)}`
                            : "S/. 0.00"}
                        </span>
                      </div>

                      {/* Envío */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {isShippingFree
                            ? freeShippingConfig.method_title
                            : "Envío"}
                        </span>
                        <span
                          className={`font-medium ${
                            isShippingFree ? "text-green-600" : ""
                          }`}
                        >
                          {envioSeleccionado
                            ? isShippingFree
                              ? "Gratis"
                              : isClient
                              ? `S/. ${costoEnvio.toFixed(2)}`
                              : "S/. 0.00"
                            : "-"}
                        </span>
                      </div>

                      {/* Total final */}
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="gradient-text">
                            {isClient ? `S/. ${total.toFixed(2)}` : "S/. 0.00"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-2">
                      <div className="flex items-center gap-2">
                        <Lock size={12} />
                        <span>Pago seguro con Izipay</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={12} />
                        <span>Tus datos de pago están protegidos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Izipay */}
      {showIzipayForm && izipayFormToken && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl  overflow-y-auto izipay-modal">
            {/* Header del Modal */}
            <div className="bg-[#E64442] text-white p-6 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6" />
                <h3 className="text-xl font-bold">Pago con Tarjeta - Izipay</h3>
              </div>
              <button
                onClick={handleCancelIzipay}
                className="bg-[#f75956] rounded-full text-white hover:text-gray-200 transition-colors p-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              {/* Mensaje de Seguridad */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-2">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-xs font-medium text-blue-800">
                    Este formulario usa la librería oficial de <br /> Izipay
                    para máxima seguridad
                  </p>
                </div>
              </div>

              {/* Formulario Incrustado de Izipay */}
              <div
                key={izipayFormKey}
                id="micuentawebstd_rest_wrapper"
                className=" py-6 "
              >
                <div className="kr-embedded"></div>
                {!izipayFormLoaded && (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto mb-3"></div>
                      <p className="text-gray-600 font-medium">
                        Cargando formulario de pago oficial...
                      </p>
                    </div>
                  </div>
                )}

                {/* CSS oficial de Izipay */}
                <link
                  rel="stylesheet"
                  href="https://static.micuentaweb.pe/static/js/krypton-client/V4.0/ext/classic-reset.css"
                />

                {/* Estilos CSS para el formulario limpio como en la segunda imagen */}
                <style jsx>{`
                  /* Estilos para el formulario limpio como en la segunda imagen */

                  /* Logo de Izipay en la parte superior */

                  /* Estilos para todos los inputs */
                  .kr-embedded input,
                  .kr-embedded select {
                    width: 100% !important;
                    height: 48px !important;
                    border: 1px solid #d1d5db !important;
                    border-radius: 6px !important;
                    padding: 12px 16px !important;
                    font-size: 14px !important;
                    color: #374151 !important;
                    background-color: #ffffff !important;
                    transition: all 0.2s ease !important;
                    margin-bottom: 16px !important;
                  }

                  /* Placeholder text */
                  .kr-embedded input::placeholder {
                    color: #9ca3af !important;
                  }

                  /* Focus state */
                  .kr-embedded input:focus,
                  .kr-embedded select:focus {
                    outline: none !important;
                    border-color: #06b6d4 !important;
                    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1) !important;
                  }

                  /* Labels */
                  .kr-embedded label {
                    display: block !important;
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    color: #374151 !important;
                    margin-bottom: 6px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                  }

                  .kr-payment-button {
                    text-align: center !important;
                  }

                  /* Botón de pago */
                  .kr-embedded .kr-payment-button,
                  .kr-embedded button[type="submit"],
                  .kr-embedded input[type="submit"] {
                    width: 100% !important;
                    height: 52px !important;

                    color: #ffffff !important;
                    border: none !important;
                    border-radius: 8px !important;
                    font-size: 16px !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    margin-top: 8px !important;
                    text-align: center !important;
                  }

                  .kr-embedded .kr-payment-button:hover,
                  .kr-embedded button[type="submit"]:hover,
                  .kr-embedded input[type="submit"]:hover {
                    transform: translateY(-1px) !important;
                    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3) !important;
                  }

                  /* Espaciado entre campos */
                  .kr-field-wrapper {
                    margin-bottom: 20px !important;
                  }

                  /* Responsive */
                  @media (max-width: 640px) {
                    .kr-embedded {
                    }

                    .kr-embedded input,
                    .kr-embedded select {
                      height: 44px !important;
                      padding: 10px 14px !important;
                    }
                  }
                `}</style>
              </div>

              {/* Footer del Modal */}
              <div className="pt-6 border-t border-gray-200">
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-2">
                  <div className="flex items-center gap-2 justify-center">
                    <Lock className="w-5 h-5 text-orange-600" />
                    <p className="text-xs  text-orange-800">
                      Tus datos de tarjeta son procesados <br /> directamente
                      por Izipay
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación SIMPLE para cerrar Izipay */}
      {showCloseConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                ¿Cerrar formulario de pago?
              </h3>
              <p className="text-gray-600 mb-6">
                ¿Seguro que quieres cerrar? ¿Elegir otro medio de pago?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCloseConfirmation(false)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-primary hover:text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarCierreModal}
                  className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Sí, cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Modal de Confirmación de Cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ¿Cancelar pago?
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                ¿Seguro que quieres cancelar? ¿Elegir otro medio de pago?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={closeCancelModal}
                  disabled={isCancellingOrder}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmCancelOrder}
                  disabled={isCancellingOrder}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCancellingOrder ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Cancelando...
                    </>
                  ) : (
                    "Sí, cancelar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
