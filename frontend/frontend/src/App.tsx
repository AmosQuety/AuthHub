import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TenantProvider } from "./contexts/TenantContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle";
import { ProtectedRoute, PublicRoute } from "./components/AuthRoutes";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MfaChallenge from "./pages/MfaChallenge";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Authorize from "./pages/Authorize";
import MfaSetup from "./pages/MfaSetup";
import PasskeySetup from "./pages/PasskeySetup";
import DeveloperPortal from "./pages/DeveloperPortal";
import Webhooks from "./pages/Webhooks";
import SecurityAudit from "./pages/SecurityAudit";
import Billing from "./pages/Billing";
import { AdminRoute } from "./components/AdminRoute";
import AdminClients from "./pages/admin/AdminClients";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTenantConfig from "./pages/admin/AdminTenantConfig";
import AdminObservability from "./pages/admin/AdminObservability";

export default function App() {
  return (
    <ThemeProvider>
      <TenantProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <ThemeToggle />
              <Routes>
          {/* Public Authentication Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            
            {/* Edge Case: User has valid credentials but needs to clear MFA hurdle */}
            {/* This is intentionally distinct from standard login */}
            <Route path="/mfa-challenge" element={<MfaChallenge />} />
          </Route>

          {/* Protected Area */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<div className="text-white">Settings</div>} />
            <Route path="/authorize" element={<Authorize />} />
            <Route path="/mfa-setup" element={<MfaSetup />} />
            <Route path="/passkey-setup" element={<PasskeySetup />} />
            <Route path="/developer" element={<DeveloperPortal />} />
            <Route path="/webhooks" element={<Webhooks />} />
            <Route path="/security-audit" element={<SecurityAudit />} />
            <Route path="/billing" element={<Billing />} />
          </Route>

          {/* Admin Console — requires ADMIN role */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/clients" element={<AdminClients />} />
            <Route path="/admin/tenants/:id" element={<AdminTenantConfig />} />
            <Route path="/admin/observability" element={<AdminObservability />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </TenantProvider>
    </ThemeProvider>
  );
}
