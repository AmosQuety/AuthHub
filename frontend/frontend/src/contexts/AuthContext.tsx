import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
  roles?: string[];
  createdAt: string;
  hasPassword?: boolean;
  mfaEnabled?: boolean;
  clientCount?: number;
  providers?: { id: string; name: string }[];
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (accessToken: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface AuthContextType extends AuthState, AuthActions {}

const AuthStateContext = createContext<AuthState | undefined>(undefined);
const AuthActionsContext = createContext<AuthActions | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Removed useCallback: React 19 Compiler handles function memoization automatically
  const refreshProfile = async () => {
    try {
      const data = await api.get("/auth/me");
      setUser(data.user);
    } catch (e) {
      setUser(null);
      localStorage.removeItem("accessToken");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check for "accessToken" handover cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
    };

    const deleteCookie = (name: string) => {
      document.cookie = `${name}=; Max-Age=-99999999; path=/; sameSite=lax;`;
    };

    const handoverToken = getCookie("accessToken");
    if (handoverToken) {
      console.log("AuthHub: Handover token detected, initializing session...");
      localStorage.setItem("accessToken", handoverToken);
      deleteCookie("accessToken");
      // If there's a token in the URL, remove it to keep history clean
      if (window.location.search.includes("access_token=")) {
        const url = new URL(window.location.href);
        url.searchParams.delete("access_token");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }

    refreshProfile();

    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem("accessToken");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const login = (accessToken: string, profile: UserProfile) => {
    localStorage.setItem("accessToken", accessToken);
    setUser(profile);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  };

  // Removed useMemo: React 19 Compiler handles object literal memoization automatically
  const stateValue: AuthState = {
    user,
    isLoading,
    isAuthenticated: !!user,
  };

  const actionsValue: AuthActions = {
    login,
    logout,
    refreshProfile,
  };

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthActionsContext.Provider value={actionsValue}>{children}</AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}

export function useAuthState() {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error("useAuthState must be used within an AuthProvider");
  }
  return context;
}

export function useAuthActions() {
  const context = useContext(AuthActionsContext);
  if (context === undefined) {
    throw new Error("useAuthActions must be used within an AuthProvider");
  }
  return context;
}

export function useAuth() {
  const state = useAuthState();
  const actions = useAuthActions();
  return {
    ...state,
    ...actions,
  } as AuthContextType;
}
