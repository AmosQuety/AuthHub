import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TenantProvider } from "./contexts/TenantContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle";
import { ProtectedRoute, PublicRoute } from "./components/AuthRoutes";

type PreloadableComponent<T extends ComponentType<any>> = T & {
  preload: () => Promise<unknown>;
};

function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): PreloadableComponent<LazyExoticComponent<T>> {
  const Component = lazy(factory) as PreloadableComponent<LazyExoticComponent<T>>;
  Component.preload = factory;
  return Component;
}

const Login = lazyWithPreload(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazyWithPreload(() => import("./pages/Dashboard"));
const MfaChallenge = lazy(() => import("./pages/MfaChallenge"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Authorize = lazy(() => import("./pages/Authorize"));
const MfaSetup = lazy(() => import("./pages/MfaSetup"));
const PasskeySetup = lazy(() => import("./pages/PasskeySetup"));
const Webhooks = lazy(() => import("./pages/Webhooks"));
const SecurityAudit = lazy(() => import("./pages/SecurityAudit"));
const Billing = lazy(() => import("./pages/Billing"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));

function RouteFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
    </div>
  );
}

export default function App() {
  const prefetchDashboard = () => {
    void Dashboard.preload();
  };

  return (
    <ThemeProvider>
      <TenantProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <ThemeToggle />
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route element={<PublicRoute />}>
                    <Route path="/login" element={<Login onIntentPrefetchDashboard={prefetchDashboard} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/verify-email/:token" element={<VerifyEmail />} />
                    <Route path="/mfa-challenge" element={<MfaChallenge />} />
                  </Route>

                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/settings" element={<div className="text-white">Settings</div>} />
                    <Route path="/authorize" element={<Authorize />} />
                    <Route path="/mfa-setup" element={<MfaSetup />} />
                    <Route path="/passkey-setup" element={<PasskeySetup />} />
                    <Route path="/webhooks" element={<Webhooks />} />
                    <Route path="/security-audit" element={<SecurityAudit />} />
                    <Route path="/change-password" element={<ChangePassword />} />
                    {/* <Route path="/billing" element={<Billing />} /> */}
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </TenantProvider>
    </ThemeProvider>
  );
}
