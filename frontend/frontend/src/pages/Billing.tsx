import { useState, useEffect } from "react";
import { CreditCard, Zap, ShieldCheck, Check, Loader2, Star, Server } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../contexts/ToastContext";

interface BillingStatus {
  active: boolean;
  planId: string;
  status?: string;
  currentPeriodEnd?: string;
}

export default function Billing() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { error } = useToast();

  useEffect(() => {
    api.get("/billing/status")
      .then(setStatus)
      .catch(() => error("Failed to load billing status. Please check if your backend Stripe is configured."))
      .finally(() => setIsLoading(false));
  }, [error]);

  const handleCheckout = async (priceId: string, planName: string) => {
    setIsProcessing(planName);
    try {
      const data = await api.post("/billing/checkout-session", { priceId });
      window.location.href = data.url;
    } catch (err: any) {
      error(err.message || "Checkout failed. Is Stripe fully configured?");
    } finally {
      setIsProcessing(null);
    }
  };

  const handlePortal = async () => {
    setIsProcessing("portal");
    try {
      const data = await api.post("/billing/customer-portal");
      window.location.href = data.url;
    } catch (err: any) {
      error(err.message || "Failed to open billing portal.");
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  const isPro = status?.planId === "price_pro" || status?.planId === "pro_plan"; // Example matchers
  const isEnterprise = status?.planId === "price_enterprise" || status?.planId === "enterprise_plan";

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-up">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-600/20 rounded-full blur-[80px] pointer-events-none" />
        <p className="text-[10px] uppercase tracking-widest text-violet-400 font-bold flex items-center justify-center gap-2">
          <CreditCard className="w-3.5 h-3.5" /> Subscription & Billing
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Simple, transparent pricing
        </h1>
        <p className="text-white/40 text-sm md:text-base leading-relaxed">
          Start for free, upgrade when you need advanced security, higher rate limits, and priority support. 
        </p>
      </div>

      {/* Current Status Banner */}
      {status?.active && status.planId !== "free" && (
        <div className="glass-card-vivid p-6 max-w-2xl mx-auto border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 font-semibold text-white">
              <Check className="w-4 h-4 text-emerald-400" /> Active Subscription: <span className="text-emerald-300 capitalize">{status.planId.replace('price_', '')}</span>
            </div>
            <p className="text-xs text-white/40 mt-1">
              {status.currentPeriodEnd ? `Renews on ${new Date(status.currentPeriodEnd).toLocaleDateString()}` : "Managing billing via Stripe."}
            </p>
          </div>
          <button 
            onClick={handlePortal}
            disabled={isProcessing === "portal"}
            className="btn-secondary !w-auto text-sm"
          >
            {isProcessing === "portal" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Manage Billing"}
          </button>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        {/* Free Plan */}
        <div className="glass-card p-8 flex flex-col relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Hobby</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-white/40 text-sm">/month</span>
            </div>
            <p className="text-xs text-white/40 mt-3">Perfect for side projects and learning.</p>
          </div>
          
          <ul className="space-y-3 mb-8 flex-1">
            {[
              "Up to 1,000 monthly active users",
              "Basic email/password auth",
              "Standard OAuth 2.0 flows",
              "Community support"
            ].map(f => (
              <li key={f} className="text-sm text-white/60 flex items-start gap-2">
                <Check className="w-4 h-4 text-white/30 shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>
          
          <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed border-dashed">
            {status?.planId === "free" || !status?.active ? "Current Plan" : "Downgrade"}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="glass-card-vivid p-8 flex flex-col relative overflow-hidden border-violet-500/30 shadow-[0_0_40px_rgba(124,58,237,0.15)] transform md:-translate-y-4">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-600 to-cyan-400" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl" />
          
          <div className="mb-6 relative">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/20 text-[10px] font-bold text-violet-300 uppercase tracking-wider mb-4">
              <Zap className="w-3 h-3" /> Most Popular
            </div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Pro</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">$29</span>
              <span className="text-white/40 text-sm">/month</span>
            </div>
            <p className="text-xs text-white/40 mt-3">Advanced security & higher limits for startups.</p>
          </div>
          
          <ul className="space-y-3 mb-8 flex-1 relative">
            {[
              "Up to 25,000 monthly active users",
              "Passkeys & WebAuthn support",
              "Enforced MFA (TOTP)",
              "Webhooks for 15+ events",
              "Custom domain support",
              "Email support"
            ].map(f => (
              <li key={f} className="text-sm text-white/80 flex items-start gap-2">
                <Check className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>
          
          {isPro ? (
            <button onClick={handlePortal} className="btn-secondary w-full border-emerald-500/30 text-emerald-400">
              Manage Pro Plan
            </button>
          ) : (
            <button 
              onClick={() => handleCheckout("price_pro_dummy", "Pro")} 
              disabled={!!isProcessing}
              className="btn-primary w-full shadow-[0_0_20px_rgba(124,58,237,0.3)]"
            >
              {isProcessing === "Pro" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Upgrade to Pro"}
            </button>
          )}
        </div>

        {/* Enterprise Plan */}
        <div className="glass-card p-8 flex flex-col relative overflow-hidden group hover:border-cyan-500/20 transition-all">
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
          
          <div className="mb-6 relative">
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Scale</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">$299</span>
              <span className="text-white/40 text-sm">/month</span>
            </div>
            <p className="text-xs text-white/40 mt-3">For high-volume, security-critical businesses.</p>
          </div>
          
          <ul className="space-y-3 mb-8 flex-1 relative">
            {[
              "Unlimited monthly active users",
              "Advanced anomaly detection",
              "Sanctioned Impersonation (Audit)",
              "SAML / Enterprise SSO",
              "Dedicated account manager",
              "SLA 99.99% Uptime"
            ].map(f => (
              <li key={f} className="text-sm text-white/60 flex items-start gap-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" /> {f}
              </li>
            ))}
          </ul>
          
          {isEnterprise ? (
            <button onClick={handlePortal} className="btn-secondary w-full border-emerald-500/30 text-emerald-400">
              Manage Scale Plan
            </button>
          ) : (
            <button 
              onClick={() => handleCheckout("price_scale_dummy", "Scale")} 
              disabled={!!isProcessing}
              className="btn-secondary w-full group-hover:bg-cyan-500/10 group-hover:text-cyan-300 group-hover:border-cyan-500/30"
            >
              {isProcessing === "Scale" ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Upgrade to Scale"}
            </button>
          )}
        </div>
        
      </div>

      <div className="text-center pt-8 border-t border-white/5 pb-20">
        <p className="text-white/30 text-xs">
          Stripe is used for secure payment processing. You can cancel or downgrade your plan at any time through the billing portal.
        </p>
      </div>

    </div>
  );
}
