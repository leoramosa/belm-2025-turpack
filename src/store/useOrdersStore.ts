import { create } from "zustand";
import { StateCreator } from "zustand";
import { PersistOptions } from "zustand/middleware";
import { persist } from "zustand/middleware";
import { IOrder } from "@/interface/IOrder";
import { fetchOrderById } from "@/services/orders";

interface OrdersState {
  orders: IOrder[];
  currentOrder: IOrder | null;
  loading: boolean;
  error: string | null;
  lastLoaded: number | null; // Timestamp de última carga
  loadOrders: (customerId: number, email?: string) => Promise<void>;
  loadOrderById: (
    orderId: number,
    customerId?: number,
    customerEmail?: string
  ) => Promise<void>;
  clearOrders: () => void;
  clearError: () => void;
  setCurrentOrder: (order: IOrder) => void;
}

type PersistedState = {
  orders: IOrder[];
  currentOrder: IOrder | null;
  lastLoaded: number | null;
};

type MyPersist = (
  config: StateCreator<OrdersState>,
  options: PersistOptions<OrdersState, PersistedState>
) => StateCreator<OrdersState>;

// Tiempo de cache: 5 minutos (300000 ms)
const CACHE_DURATION = 5 * 60 * 1000;

export const useOrdersStore = create<OrdersState>(
  (persist as MyPersist)(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      loading: false,
      error: null,
      lastLoaded: null,
      loadOrders: async (customerId: number, email?: string) => {
        const state = get();
        // Si tenemos datos en cache recientes (menos de 5 minutos), usar cache
        const now = Date.now();
        if (
          state.orders.length > 0 &&
          state.lastLoaded &&
          now - state.lastLoaded < CACHE_DURATION
        ) {
          // Datos en cache válidos, no recargar
          set({ loading: false });
          return;
        }

        set({ loading: true, error: null });
        try {
          // Si hay email, buscar por id y email; si no, solo por id
          let orders: IOrder[] = [];
          if (email) {
            const { fetchOrdersForUser } = await import("@/services/orders");
            orders = await fetchOrdersForUser(customerId, email);
          } else {
            const { fetchOrdersByCustomerId } = await import(
              "@/services/orders"
            );
            orders = await fetchOrdersByCustomerId(customerId);
          }
          set({ orders, loading: false, lastLoaded: now });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Error al cargar órdenes";
          set({
            error: errorMessage,
            loading: false,
          });
        }
      },
      loadOrderById: async (
        orderId: number,
        customerId?: number,
        customerEmail?: string
      ) => {
        const state = get();
        // Si tenemos la orden en cache y es la misma, no recargar
        if (
          state.currentOrder &&
          state.currentOrder.id === orderId &&
          state.lastLoaded &&
          Date.now() - state.lastLoaded < CACHE_DURATION
        ) {
          set({ loading: false });
          return;
        }

        set({ loading: true, error: null });
        try {
          const order = await fetchOrderById(
            orderId,
            customerId,
            customerEmail
          );
          set({ currentOrder: order, loading: false, lastLoaded: Date.now() });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Error al cargar orden";
          set({ error: errorMessage, loading: false });
        }
      },
      clearOrders: () =>
        set({ orders: [], currentOrder: null, lastLoaded: null }),
      clearError: () => set({ error: null }),
      setCurrentOrder: (order: IOrder) =>
        set({ currentOrder: order, lastLoaded: Date.now() }),
    }),
    {
      name: "orders-storage",
      // Solo persistir orders y currentOrder, no loading/error
      partialize: (state) => ({
        orders: state.orders,
        currentOrder: state.currentOrder,
        lastLoaded: state.lastLoaded,
      }),
    }
  )
);
