import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAdminNavSync } from "@/hooks/use-admin-nav-sync";
import { useAdminStore } from "@/store/admin-store";

const { push, replace } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

// Reasignable para simular cambios de URL (back/forward) entre renders
let mockSearchParams: URLSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => mockSearchParams,
}));

function resetStore() {
  useAdminStore.setState({ activeSection: "products" });
  useAdminStore.getState().resetAllNavState();
}

describe("useAdminNavSync", () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    mockSearchParams = new URLSearchParams();
    window.history.replaceState({}, "", "/");
    resetStore();
  });

  it("hidrata el store desde la URL al montar", () => {
    mockSearchParams = new URLSearchParams(
      "section=orders&page=5&q=teclado&status=active"
    );

    const { unmount } = renderHook(() => useAdminNavSync());

    const state = useAdminStore.getState();
    expect(state.activeSection).toBe("orders");
    expect(state.navState.orders).toEqual({
      page: 5,
      search: "teclado",
      status: "active",
    });
    // Las demás secciones se resetean a valores por defecto
    expect(state.navState.products).toEqual({
      page: 1,
      search: "",
      status: "all",
    });

    unmount();
  });

  it("usa defaults cuando la URL no trae parámetros válidos", () => {
    mockSearchParams = new URLSearchParams("section=desconocido&page=0");

    const { unmount } = renderHook(() => useAdminNavSync());

    const state = useAdminStore.getState();
    expect(state.activeSection).toBe("products");
    expect(state.navState.products).toEqual({
      page: 1,
      search: "",
      status: "all",
    });

    unmount();
  });

  it("pushea cuando cambia la página", () => {
    const { unmount } = renderHook(() => useAdminNavSync());

    act(() => {
      useAdminStore.getState().setNavState("products", { page: 2 });
    });

    expect(push).toHaveBeenCalledWith("/admin?section=products&page=2");
    expect(replace).not.toHaveBeenCalled();

    unmount();
  });

  it("reemplaza la URL al cambiar búsqueda y filtros", () => {
    const { unmount } = renderHook(() => useAdminNavSync());

    act(() => {
      useAdminStore.getState().setNavState("products", { search: "teclado", page: 1 });
    });
    expect(replace).toHaveBeenCalledWith("/admin?section=products&q=teclado");

    act(() => {
      useAdminStore.getState().setNavState("products", { status: "active", page: 1 });
    });
    expect(replace).toHaveBeenCalledWith("/admin?section=products&q=teclado&status=active");

    expect(push).not.toHaveBeenCalled();

    unmount();
  });

  it("reemplaza la URL cuando la búsqueda resetea la página a 1", () => {
    const { unmount } = renderHook(() => useAdminNavSync());

    act(() => {
      useAdminStore.getState().setNavState("products", { page: 2 });
    });
    expect(push).toHaveBeenCalledWith("/admin?section=products&page=2");

    act(() => {
      useAdminStore.getState().setNavState("products", { search: "teclado", page: 1 });
    });

    expect(replace).toHaveBeenCalledWith("/admin?section=products&q=teclado");
    expect(push).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledTimes(1);

    unmount();
  });

  it("pushea al cambiar de sección", () => {
    const { unmount } = renderHook(() => useAdminNavSync());

    act(() => {
      useAdminStore.getState().setActiveSection("orders");
    });

    expect(push).toHaveBeenCalledWith("/admin?section=orders");

    unmount();
  });

  it("rehidrata el store ante cambios externos de la URL (back/forward)", () => {
    mockSearchParams = new URLSearchParams("section=products&page=3");

    const { rerender, unmount } = renderHook(() => useAdminNavSync());
    expect(useAdminStore.getState().navState.products.page).toBe(3);

    // Simulamos el back: la URL cambia externamente y el store debe seguirla
    window.history.replaceState({}, "", "/admin?section=products&page=2");
    mockSearchParams = new URLSearchParams("section=products&page=2");
    rerender();

    expect(useAdminStore.getState().navState.products.page).toBe(2);
    // No debe re-pushear la misma URL
    expect(push).not.toHaveBeenCalled();

    unmount();
  });

  it("no escribe la URL si el store ya coincide con ella", () => {
    mockSearchParams = new URLSearchParams("section=products&page=3");
    window.history.replaceState({}, "", "/admin?section=products&page=3");

    const { unmount } = renderHook(() => useAdminNavSync());

    act(() => {
      useAdminStore.getState().setNavState("products", { page: 3 });
    });

    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();

    unmount();
  });
});
