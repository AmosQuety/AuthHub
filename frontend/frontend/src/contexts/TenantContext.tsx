// src/contexts/TenantContext.tsx
// Reads tenant branding from the backend and injects CSS variables dynamically.
// Downstream applications send a `?tenant=<id>` query param to AuthHub's login URL
// to trigger white-labeling for their brand.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";

interface TenantBranding {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  requireMfa: boolean;
  allowPasskeys: boolean;
}

interface TenantState {
  tenant: TenantBranding | null;
  isLoading: boolean;
}

interface TenantActions {
  refreshTenant: () => Promise<void>;
}

const TenantStateContext = createContext<TenantState | undefined>(undefined);
const TenantActionsContext = createContext<TenantActions | undefined>(undefined);

// Convert a hex color like #7c3aed to hsl values for CSS variable injection
function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyTenantTheme(tenant: TenantBranding) {
  const root = document.documentElement;

  if (tenant.primaryColor) {
    const hsl = hexToHsl(tenant.primaryColor);
    if (hsl) {
      root.style.setProperty("--color-brand-primary", `hsl(${hsl})`);
      root.style.setProperty("--color-brand-primary-hover", `hsl(${hsl} / 0.85)`);
    }
  }

  if (tenant.name) {
    document.title = `${tenant.name} — Sign In`;
  }
}

function resetTenantTheme() {
  const root = document.documentElement;
  root.style.removeProperty("--color-brand-primary");
  root.style.removeProperty("--color-brand-primary-hover");
  document.title = "AuthHub";
}


export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantBranding | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshTenant = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const tenantId = params.get("tenant");
    const clientId = params.get("client_id");

    if (!tenantId && !clientId) {
      setTenant(null);
      resetTenantTheme();
      return;
    }

    setIsLoading(true);
    const endpoint = clientId
      ? `/tenant/config?client_id=${encodeURIComponent(clientId)}`
      : `/tenant/${encodeURIComponent(tenantId!)}/config`;

    try {
      const data = await api.get(endpoint);
      if (data.tenant) {
        setTenant(data.tenant);
        applyTenantTheme(data.tenant);
      } else {
        setTenant(null);
        resetTenantTheme();
      }
    } catch {
      setTenant(null);
      resetTenantTheme();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshTenant();

    return () => {
      resetTenantTheme();
    };
  }, [refreshTenant]);

  const stateValue = useMemo<TenantState>(
    () => ({
      tenant,
      isLoading,
    }),
    [tenant, isLoading],
  );

  const actionsValue = useMemo<TenantActions>(
    () => ({
      refreshTenant,
    }),
    [refreshTenant],
  );

  return (
    <TenantStateContext.Provider value={stateValue}>
      <TenantActionsContext.Provider value={actionsValue}>{children}</TenantActionsContext.Provider>
    </TenantStateContext.Provider>
  );
}

export function useTenantState() {
  const context = useContext(TenantStateContext);
  if (context === undefined) {
    throw new Error("useTenantState must be used within a TenantProvider");
  }
  return context;
}

export function useTenantActions() {
  const context = useContext(TenantActionsContext);
  if (context === undefined) {
    throw new Error("useTenantActions must be used within a TenantProvider");
  }
  return context;
}

export function useTenant() {
  const state = useTenantState();
  const actions = useTenantActions();
  return {
    ...state,
    ...actions,
  };
}
