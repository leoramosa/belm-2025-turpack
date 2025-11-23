import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { useOrdersStore } from "@/store/useOrdersStore";
import OrdersList from "../OrdersList";
import OrderDetail from "../OrderDetail";

// Mock de Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock de los stores
jest.mock("@/store/userStore");
jest.mock("@/store/useOrdersStore");

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
};

describe("🔒 Orders Security Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe("OrdersList Security", () => {
    it("🔒 should redirect to login when user is not authenticated", () => {
      // Mock usuario NO autenticado
      (useUserStore as jest.Mock).mockReturnValue({
        profile: null,
      });

      (useOrdersStore as jest.Mock).mockReturnValue({
        orders: [],
        loading: false,
        error: null,
        loadOrders: jest.fn(),
        clearOrders: jest.fn(),
      });

      render(<OrdersList />);

      // Debe mostrar mensaje de login requerido
      expect(
        screen.getByText("Debes iniciar sesión para ver tus órdenes")
      ).toBeInTheDocument();
      expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
    });

    it("🔒 should clear orders when user logs out", () => {
      const mockClearOrders = jest.fn();

      // Mock usuario autenticado inicialmente
      (useUserStore as jest.Mock).mockReturnValue({
        profile: { id: 1, email: "test@test.com" },
      });

      (useOrdersStore as jest.Mock).mockReturnValue({
        orders: [{ id: 1, customer_id: 1 }],
        loading: false,
        error: null,
        loadOrders: jest.fn(),
        clearOrders: mockClearOrders,
      });

      const { rerender } = render(<OrdersList />);

      // Cambiar a usuario NO autenticado
      (useUserStore as jest.Mock).mockReturnValue({
        profile: null,
      });

      rerender(<OrdersList />);

      // Debe limpiar órdenes
      expect(mockClearOrders).toHaveBeenCalled();
    });
  });

  describe("OrderDetail Security", () => {
    it("🔒 should redirect when trying to access order without authentication", () => {
      // Mock usuario NO autenticado
      (useUserStore as jest.Mock).mockReturnValue({
        profile: null,
      });

      (useOrdersStore as jest.Mock).mockReturnValue({
        currentOrder: null,
        loading: false,
        error: null,
        loadOrderById: jest.fn(),
        clearError: jest.fn(),
      });

      render(<OrderDetail orderId="123" />);

      // Debe mostrar mensaje de login requerido
      expect(
        screen.getByText(
          "Debes iniciar sesión para ver los detalles de la orden"
        )
      ).toBeInTheDocument();
    });

    it("🔒 should redirect when trying to access order from different user", async () => {
      // Mock usuario autenticado
      (useUserStore as jest.Mock).mockReturnValue({
        profile: { id: 1, email: "user1@test.com" },
      });

      // Mock orden de otro usuario
      (useOrdersStore as jest.Mock).mockReturnValue({
        currentOrder: {
          id: 123,
          customer_id: 2, // Diferente usuario
          billing: { email: "user2@test.com" },
        },
        loading: false,
        error: null,
        loadOrderById: jest.fn(),
        clearError: jest.fn(),
      });

      render(<OrderDetail orderId="123" />);

      // Debe redirigir a orders
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/orders");
      });
    });

    it("🔒 should allow access to own order", () => {
      const mockProfile = { id: 1, email: "user1@test.com" };

      // Mock usuario autenticado
      (useUserStore as jest.Mock).mockReturnValue({
        profile: mockProfile,
      });

      // Mock orden del usuario actual
      (useOrdersStore as jest.Mock).mockReturnValue({
        currentOrder: {
          id: 123,
          customer_id: 1, // Mismo usuario
          billing: { email: "user1@test.com" },
          status: "completed",
          total: "100.00",
          currency: "PEN",
          line_items: [],
          shipping: {},
          payment_method_title: "Test Payment",
        },
        loading: false,
        error: null,
        loadOrderById: jest.fn(),
        clearError: jest.fn(),
      });

      render(<OrderDetail orderId="123" />);

      // Debe mostrar la orden
      expect(screen.getByText("Pedido #123")).toBeInTheDocument();
    });
  });
});
