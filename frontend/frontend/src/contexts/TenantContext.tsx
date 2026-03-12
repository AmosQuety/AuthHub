// src/contexts/TenantContext.tsx
// Reads tenant branding from the backend and injects CSS variables dynamically.
// Downstream applications send a `?tenant=<id>` query param to AuthHub's login URL
// to trigger white-labeling for their brand.

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface TenantBranding {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  requireMfa: boolean;
  allowPasskeys: boolean;
}

interface TenantContextValue {
  tenant: TenantBranding | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  isLoading: false,
});

export function useTenant() {
  return useContext(TenantContext);
}

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantBranding | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Downstream apps pass ?tenant=<tenantId> when redirecting to AuthHub
    const params = new URLSearchParams(window.location.search);
    const tenantId = params.get("tenant");

    if (!tenantId) {
      resetTenantTheme();
      return;
    }

    setIsLoading(true);

    fetch(`${API_URL}/auth/tenant/${encodeURIComponent(tenantId)}/config`)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        if (data.tenant) {
          setTenant(data.tenant);
          applyTenantTheme(data.tenant);
        }
      })
      .catch(() => {
        // Unknown tenant — silently use default AuthHub branding
        resetTenantTheme();
      })
      .finally(() => setIsLoading(false));

    return () => {
      resetTenantTheme();
    };
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}
