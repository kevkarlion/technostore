"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useAdminStore,
  ADMIN_SECTIONS,
  createDefaultNavState,
  type AdminSection,
} from "@/store/admin-store";

function isAdminSection(value: string | null): value is AdminSection {
  return !!value && (ADMIN_SECTIONS as readonly string[]).includes(value);
}

function parsePage(raw: string | null): number {
  const parsed = parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * Ordena y serializa los query params para comparar URLs de forma estable,
 * sin importar el orden en que se escribieron los parámetros.
 */
function canonicalQuery(search: string): string {
  const params = new URLSearchParams(search);
  return [...params.entries()]
    .sort(([keyA], [keyB]) => (keyA < keyB ? -1 : keyA > keyB ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

/**
 * Puente entre el store del admin y la URL del navegador.
 *
 * - La URL es la fuente de verdad: al montar, hidrata el store desde los params.
 * - Los cambios del store se escriben de vuelta a la URL (push para sección y
 *   página, replace para búsqueda/filtros) para que el botón atrás funcione.
 * - Si la URL cambia externamente (back/forward), rehidrata el store.
 */
export function useAdminNavSync() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Evita rehidratar dos veces y protege contra loops de escritura
  const hydrated = useRef(false);

  // 1. Hidratación inicial: leer la URL y sembrar el store
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const section = isAdminSection(searchParams.get("section"))
      ? (searchParams.get("section") as AdminSection)
      : "products";

    // Resetea TODAS las secciones defensivamente para que valores viejos
    // persistidos no se filtren, y aplica los params de la sección activa.
    const navState = createDefaultNavState();
    navState[section] = {
      page: parsePage(searchParams.get("page")),
      search: searchParams.get("q") ?? "",
      status: searchParams.get("status") ?? "all",
    };

    useAdminStore.setState({ activeSection: section, navState });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Store → URL: reescribir la URL cuando cambia sección o navState
  useEffect(() => {
    const unsubscribe = useAdminStore.subscribe((state, prevState) => {
      if (
        state.activeSection === prevState.activeSection &&
        state.navState === prevState.navState
      ) {
        return;
      }

      const { activeSection, navState } = state;
      const current = navState[activeSection];

      const params = new URLSearchParams();
      params.set("section", activeSection);
      if (current.page > 1) params.set("page", String(current.page));
      if (current.search.trim()) params.set("q", current.search.trim());
      if (current.status && current.status !== "all") {
        params.set("status", current.status);
      }

      const query = params.toString();
      const href = query ? `/admin?${query}` : "/admin";

      // Evitar escribir la URL si ya es la que está activa
      if (canonicalQuery(window.location.search) === canonicalQuery(query)) {
        return;
      }

      const sectionChanged = state.activeSection !== prevState.activeSection;
      const searchChanged =
        state.navState[state.activeSection].search !==
        prevState.navState[state.activeSection].search;
      const statusChanged =
        state.navState[state.activeSection].status !==
        prevState.navState[state.activeSection].status;

      // Push para sección y cambios de página; replace para búsquedas y
      // filtros (aunque reseteen la página a 1) para no spamear el historial
      // con cada tecla.
      if (sectionChanged || (!searchChanged && !statusChanged)) {
        router.push(href);
      } else {
        router.replace(href);
      }
    });

    return unsubscribe;
  }, [router]);

  // 3. URL → Store: rehidratar ante cambios externos de la URL (back/forward)
  useEffect(() => {
    const section = isAdminSection(searchParams.get("section"))
      ? (searchParams.get("section") as AdminSection)
      : "products";
    const page = parsePage(searchParams.get("page"));
    const search = searchParams.get("q") ?? "";
    const status = searchParams.get("status") ?? "all";

    const { activeSection, navState } = useAdminStore.getState();
    const current = navState[section];

    // Si la URL ya refleja el store, no tocar nada
    if (
      activeSection === section &&
      current.page === page &&
      current.search === search &&
      current.status === status
    ) {
      return;
    }

    const next = createDefaultNavState();
    next[section] = { page, search, status };
    useAdminStore.setState({ activeSection: section, navState: next });
  }, [searchParams]);
}
