import { create } from "zustand";
import { IOrder } from "@/interface/IOrder";
import { fetchOrderById } from "@/services/orders";

interface OrdersState {
  orders: IOrder[];
  currentOrder: IOrder | null;
  loading: boolean;
  error: string | null;
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

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  loadOrders: async (customerId: number, email?: string) => {
    set({ loading: true, error: null });
    try {
      // Si hay email, buscar por id y email; si no, solo por id
      let orders: IOrder[] = [];
      if (email) {
        const { fetchOrdersForUser } = await import("@/services/orders");
        orders = await fetchOrdersForUser(customerId, email);
      } else {
        const { fetchOrdersByCustomerId } = await import("@/services/orders");
        orders = await fetchOrdersByCustomerId(customerId);
      }
      set({ orders, loading: false });
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
    set({ loading: true, error: null });
    try {
      const order = await fetchOrderById(orderId, customerId, customerEmail);
      set({ currentOrder: order, loading: false });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al cargar orden";
      set({ error: errorMessage, loading: false });
    }
  },
  clearOrders: () => set({ orders: [], currentOrder: null }),
  clearError: () => set({ error: null }),
  setCurrentOrder: (order: IOrder) => set({ currentOrder: order }),
}));
