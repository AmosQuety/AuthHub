import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TenantProvider } from "./contexts/TenantContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle";
import { ProtectedRoute, PublicRoute } from "./components/AuthRoutes";
import { AdminRoute } from "./components/AdminRoute";

declare const __INCLUDE_ADMIN__: boolean;
declare const __INCLUDE_DEVELOPER__: boolean;

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
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const MfaChallenge = lazy(() => import("./pages/MfaChallenge"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Authorize = lazy(() => import("./pages/Authorize"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));

// Enterprise Layout & Pages
const AppShell = lazy(() => import("./pages/shell/AppShell"));
const Overview = lazy(() => import("./pages/Overview"));
const Users = lazy(() => import("./pages/Users"));
const Applications = lazy(() => import("./pages/developer/Applications"));
const Webhooks = lazy(() => import("./pages/Webhooks"));
const ApiLogs = lazy(() => import("./pages/developer/ApiLogs"));
const Sessions = lazy(() => import("./pages/security/Sessions"));
const MfaSetup = lazy(() => import("./pages/MfaSetup"));
const PasskeySetup = lazy(() => import("./pages/PasskeySetup"));
const Profile = lazy(() => import("./pages/account/Profile"));

const AdminClients = __INCLUDE_ADMIN__ ? lazy(() => import("./pages/admin/AdminClients")) : null;
const AdminUsers = __INCLUDE_ADMIN__ ? lazy(() => import("./pages/admin/AdminUsers")) : null;
const AdminTenantConfig = __INCLUDE_ADMIN__
  ? lazy(() => import("./pages/admin/AdminTenantConfig"))
  : null;
const AdminObservability = __INCLUDE_ADMIN__
  ? lazy(() => import("./pages/admin/AdminObservability"))
  : null;
const AdminDashboard = __INCLUDE_ADMIN__
  ? lazy(() => import("./pages/admin/AdminDashboard"))
  : null;
const AdminTenants = __INCLUDE_ADMIN__
  ? lazy(() => import("./pages/admin/Tenants"))
  : null;
const SystemSettings = __INCLUDE_ADMIN__
  ? lazy(() => import("./pages/admin/SystemSettings"))
  : null;
const RootKeys = __INCLUDE_ADMIN__
  ? lazy(() => import("./pages/admin/RootKeys"))
  : null;

import { PageSkeleton } from "./components/Skeleton";

function RouteFallback() {
  return (
    <div className="flex w-full">
      <PageSkeleton />
    </div>
  );
}

export default function App() {
  const prefetchDashboard = () => {
    // Overview is the new dashboard entry point
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
                  {/* Public Authentication Routes */}
                  <Route element={<PublicRoute />}>
                    <Route path="/login" element={<Login onIntentPrefetchDashboard={prefetchDashboard} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/verify-email/:token" element={<VerifyEmail />} />

                    {/* Edge Case: User has valid credentials but needs to clear MFA hurdle */}
                    {/* This is intentionally distinct from standard login */}
                    <Route path="/mfa-challenge" element={<MfaChallenge />} />
                  </Route>
                  
                  {/* Unrestricted Auth Pages */}
                  <Route path="/auth/complete-profile" element={<CompleteProfile />} />

                  {/* Public Legal Pages */}
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />


                  {/* Enterprise Authenticated Shell */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppShell />}>
                      <Route path="/" element={<Overview />} />
                      {/* Removed /users from ordinary system per user request */}
                      
                      <Route path="/developer/applications" element={<Applications />} />
                      <Route path="/developer/webhooks" element={<Webhooks />} />
                      <Route path="/developer/api-logs" element={<ApiLogs />} />
                      
                      <Route path="/security/sessions" element={<Sessions />} />
                      <Route path="/security/mfa" element={<MfaSetup />} />
                      <Route path="/security/passkeys" element={<PasskeySetup />} />
                      
                      <Route path="/account/profile" element={<Profile />} />

                      {AdminUsers && AdminClients && AdminTenantConfig && AdminObservability ? (
                        <>
                          <Route path="/admin/users" element={<AdminUsers />} />
                          <Route path="/admin/clients" element={<AdminClients />} />
                          <Route path="/admin/dashboard" element={<AdminDashboard />} />
                          <Route path="/admin/tenants" element={<AdminTenants />} />
                          <Route path="/admin/settings" element={<SystemSettings />} />
                          <Route path="/admin/keys" element={<RootKeys />} />
                          <Route path="/settings/branding" element={<AdminTenantConfig />} />
                          <Route path="/admin/observability" element={<AdminObservability />} />
                        </>
                      ) : null}
                    </Route>

                    {/* Specialized standalone protected pages (no sidebar) */}
                    <Route path="/authorize" element={<Authorize />} />
                    <Route path="/change-password" element={<ChangePassword />} />
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
