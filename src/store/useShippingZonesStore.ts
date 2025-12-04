import { create } from "zustand";
import { StateCreator } from "zustand";
import { PersistOptions } from "zustand/middleware";
import { persist } from "zustand/middleware";
import {
  IShippingZone,
  IShippingZonesState,
  IShippingMethod,
} from "@/interface/IShipping";

type PersistedState = {
  zones: IShippingZone[];
  lastUpdated: number;
};

type MyPersist = (
  config: StateCreator<IShippingZonesState>,
  options: PersistOptions<IShippingZonesState, PersistedState>
) => StateCreator<IShippingZonesState>;

export const useShippingZonesStore = create<IShippingZonesState>(
  (persist as MyPersist)(
    (set, get) => ({
      zones: [],
      isLoading: false,
      lastUpdated: 0,
      error: null,
      setZones: (zones) => set({ zones, lastUpdated: Date.now(), error: null }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      getMethodsForAddress: (state, city, zipCode) => {
        const zones = get().zones;

        // Si no hay zonas cargadas, retornar array vacío
        if (zones.length === 0) {
          return [];
        }

        // OPTIMIZACIÓN: Cache de zona por defecto para evitar búsquedas repetidas
        let defaultZone: IShippingZone | undefined;
        const getDefaultZone = () => {
          if (!defaultZone) {
            defaultZone = zones.find((zone) => zone.id === 0);
          }
          return defaultZone;
        };

        // OPTIMIZACIÓN: Función helper para filtrar métodos habilitados
        const getEnabledMethods = (zone: IShippingZone): IShippingMethod[] => {
          if (!zone.methods || zone.methods.length === 0) {
            return [];
          }
          return zone.methods.filter((m) => m.enabled);
        };

        // Función helper para buscar en una zona específica
        const findInZone = (
          zone: IShippingZone,
          searchType: string,
          searchValue: string
        ): boolean => {
          if (!zone.locations || zone.locations.length === 0) {
            return false;
          }

          return zone.locations.some((loc) => {
            if (loc.type !== searchType) return false;

            switch (searchType) {
              case "postcode":
                return loc.code === searchValue;
              case "city":
                return loc.name === searchValue || loc.code === searchValue;
              case "state":
                return loc.code === searchValue;
              default:
                return false;
            }
          });
        };

        // 1. Si es Lima Metropolitana, buscar por nombre del distrito - CORREGIDO
        if (state === "PE:LMA" && city) {
          for (const zone of zones) {
            if (zone.id === 0) continue; // Saltar zona por defecto

            // Buscar por nombre del distrito - como funcionaba antes
            const zoneMatches = zone.name === city;

            if (zoneMatches) {
              const methods = getEnabledMethods(zone);
              return methods;
            }
          }
        }

        // 2. Si es Callao, buscar por nombre del distrito - CORREGIDO
        if (state === "PE:CAL" && city) {
          for (const zone of zones) {
            if (zone.id === 0) continue; // Saltar zona por defecto

            // Buscar por nombre del distrito - como funcionaba antes
            const zoneMatches = zone.name === city;

            if (zoneMatches) {
              const methods = getEnabledMethods(zone);
              return methods;
            }
          }
        }

        // 3. Buscar por código postal (ignorando zona por defecto)
        if (zipCode) {
          for (const zone of zones) {
            if (zone.id === 0) continue; // Saltar zona por defecto

            if (findInZone(zone, "postcode", zipCode)) {
              const methods = getEnabledMethods(zone);
              return methods;
            }
          }
          // Fallback a zona por defecto
          const fallbackZone = getDefaultZone();
          if (fallbackZone) {
            const methods = getEnabledMethods(fallbackZone);
            return methods;
          }
        }

        // 4. Luego por ciudad (ignorando zona por defecto)
        if (city) {
          for (const zone of zones) {
            if (zone.id === 0) continue; // Saltar zona por defecto

            if (findInZone(zone, "city", city)) {
              const methods = getEnabledMethods(zone);
              return methods;
            }
          }
          // Fallback a zona por defecto
          const fallbackZone = getDefaultZone();
          if (fallbackZone) {
            const methods = getEnabledMethods(fallbackZone);
            return methods;
          }
        }

        // 3. Ahora buscar por estado/provincia (ignorando zona por defecto)
        if (state) {
          for (const zone of zones) {
            if (zone.id === 0) continue; // Saltar zona por defecto

            if (findInZone(zone, "state", state)) {
              const methods = getEnabledMethods(zone);
              return methods;
            }
          }
          // Fallback a zona por defecto
          const fallbackZone = getDefaultZone();
          if (fallbackZone) {
            const methods = getEnabledMethods(fallbackZone);
            return methods;
          }
        }

        // Buscar en zona por defecto como fallback final
        const finalZone = getDefaultZone();
        if (finalZone) {
          const methods = getEnabledMethods(finalZone);
          return methods;
        }

        return [];
      },
      clearCache: () => set({ zones: [], lastUpdated: 0, error: null }),
      // Función para obtener métodos de envío por zona ID
      getMethodsByZoneId: (zoneId: number) => {
        const zones = get().zones;
        const zone = zones.find((z) => z.id === zoneId);

        if (!zone) {
          return [];
        }

        return zone.methods?.filter((m) => m.enabled) || [];
      },
      // Función para obtener todas las zonas disponibles
      getAvailableZones: () => {
        const zones = get().zones;
        return zones.filter((zone) => zone.methods && zone.methods.length > 0);
      },
    }),
    {
      name: "shipping-zones-storage",
      partialize: (state) => ({
        zones: state.zones,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
