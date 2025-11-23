// Interfaces unificadas para Shipping - Elimina duplicaciones y conflictos
export interface IShippingLocation {
  type: string;
  code: string;
  name?: string;
}

export interface IShippingMethod {
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

export interface IShippingZone {
  id: number;
  name: string;
  locations: IShippingLocation[];
  methods: IShippingMethod[];
}

// Tipos para WooCommerce API
export interface IWooCommerceZone {
  id: number;
  name: string;
}

export interface IWooCommerceLocation {
  type: string;
  code: string;
  name?: string;
}

export interface IWooCommerceMethod {
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

// Tipo para el store optimizado
export interface IShippingZonesState {
  zones: IShippingZone[];
  isLoading: boolean;
  lastUpdated: number;
  error: string | null;
  setZones: (zones: IShippingZone[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getMethodsForAddress: (
    state: string,
    city: string,
    zipCode: string
  ) => IShippingMethod[];
  getMethodsByZoneId: (zoneId: number) => IShippingMethod[];
  getAvailableZones: () => IShippingZone[];
  clearCache: () => void;
}
