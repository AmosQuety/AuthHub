import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, Loader2, ShieldCheck, Database, KeySquare, X, Check } from "lucide-react";

export default function Authorize() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state: initially true so we don't flash the consent screen if it's going to be auto-skipped
  const [checkingConsent, setCheckingConsent] = useState(true);

  // Extract OAuth Parameters
  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const responseType = searchParams.get("response_type");
  const scope = searchParams.get("scope");
  const state = searchParams.get("state");
  const codeChallenge = searchParams.get("code_challenge");
  const codeChallengeMethod = searchParams.get("code_challenge_method");

  // Validate required parameters visually before attempting request
  useEffect(() => {
    if (!clientId || !redirectUri || responseType !== "code") {
      setError("Invalid OAuth 2.0 authorization request. Missing or unsupported parameters.");
      setCheckingConsent(false);
    }
  }, [clientId, redirectUri, responseType]);

  const handleConsent = async (allow: boolean) => {
    if (!allow) {
      // User clicked Deny
      if (redirectUri) {
        const url = new URL(redirectUri);
        url.searchParams.append("error", "access_denied");
        if (state) url.searchParams.append("state", state);
        window.location.href = url.toString();
      } else {
        setError("You denied access, but no safe redirect URL was provided.");
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: responseType,
        scope,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod
      };

      const response = await api.post("/oauth/authorize", payload);
      
      if (response.redirectUrl) {
        // Important: Use vanilla window.location to redirect the browser to the third-party client
        window.location.href = response.redirectUrl;
      } else {
        throw new Error("Authorization server did not return a redirect URL.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.data?.error_description || err?.data?.error || err.message || "Failed to authorize client");
      setIsLoading(false);
      setCheckingConsent(false);
    }
  };

  // Check Single Sign-On (SSO) Consent Bypass
  useEffect(() => {
    // Only check if parameters are valid and user is logged in
    if (!user || !clientId || !redirectUri || responseType !== "code") return;

    let mounted = true;

    const checkExistingConsent = async () => {
      try {
        const res = await api.get(`/oauth/consent-check?client_id=${clientId}&scope=${scope || ''}`);
        if (mounted) {
          if (res.consentRequired === false) {
            console.log('[AuthHub] Consent previously granted. Auto-approving login...');
            // Automatically grant access, bypassing UI
            await handleConsent(true);
          } else {
            // Need to show UI
            setCheckingConsent(false);
          }
        }
      } catch (err) {
        console.error("Failed to check consent status. Falling back to manual consent UI.", err);
        if (mounted) setCheckingConsent(false);
      }
    };

    checkExistingConsent();

    return () => { mounted = false; };
  }, [user, clientId, redirectUri, responseType, scope]);

  // While checking or processing auto-login, show loading state exclusively
  if (checkingConsent || isLoading) {
    return (
      <div className="min-h-screen bg-black text-slate-200 font-sans flex items-center justify-center p-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[100px] pointer-events-none" />

        <div className="max-w-md w-full relative z-10 flex flex-col items-center justify-center text-center">
           <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
           <p className="text-slate-400 font-medium pb-24">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md p-8 glass-card text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 text-red-500 mb-6">
          <X className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Authorization Error</h2>
        <p className="text-gray-400 mb-8">{error}</p>
      </div>
    );
  }

  // Parse scopes into readable bullet points
  const requestedScopes = scope ? scope.split(" ") : [];

  return (
    <div className="w-full max-w-md bg-brand-base rounded-2xl border border-brand-border overflow-hidden shadow-2xl">
      {/* App Header Header */}
      <div className="bg-brand-surface p-6 text-center border-b border-brand-border relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-base border border-brand-border shadow-sm mb-4">
          <Database className="w-8 h-8 text-brand-primary" />
        </div>
        <h1 className="text-xl font-bold text-white">Application Integration</h1>
        <p className="text-gray-400 mt-2 text-sm max-w-xs mx-auto">
          An external application (<span className="text-white font-medium">{clientId}</span>) wants to connect to your AuthHub account.
        </p>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <LogIn className="w-5 h-5 shrink-0" />
          <p className="text-sm">
            You are signed in as <span className="font-semibold text-white">{user?.email}</span>.
          </p>
        </div>

        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">This application will be able to:</h3>
        
        <ul className="space-y-4 mb-8">
          <li className="flex gap-3">
            <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-white">Verify your identity</p>
              <p className="text-gray-500 mt-0.5">Know who is currently signed in</p>
            </div>
          </li>
          
          {requestedScopes.includes("email") && (
            <li className="flex gap-3">
              <KeySquare className="w-5 h-5 text-green-400 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-white">Read your email address</p>
                <p className="text-gray-500 mt-0.5">View &lt;{user?.email}&gt;</p>
              </div>
            </li>
          )}
        </ul>

        <div className="flex gap-3 pt-6 border-t border-brand-border">
          <button 
            type="button" 
            disabled={isLoading}
            onClick={() => handleConsent(false)}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-medium bg-brand-surface hover:bg-red-500/10 hover:text-red-400 border border-brand-border transition-colors text-white"
          >
            Cancel
          </button>
          
          <button 
            type="button"
            disabled={isLoading}
            onClick={() => handleConsent(true)}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-medium bg-brand-primary hover:bg-brand-primary-hover transition-colors text-white shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <><Check className="w-4 h-4" /> Allow Access</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
