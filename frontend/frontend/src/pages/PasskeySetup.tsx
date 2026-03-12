import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Fingerprint, Loader2, ArrowLeft, Plus, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";

// In a real app, this should come from package.json dependencies: "@simplewebauthn/browser"
// We are dynamically importing it because we asked the user to install it in the background
let startRegistration: any;
let browserWebAuthnSupported = false;

try {
  // @ts-ignore - Will be available after `npm install @simplewebauthn/browser`
  import("@simplewebauthn/browser").then((module) => {
    startRegistration = module.startRegistration;
    browserWebAuthnSupported = module.browserSupportsWebAuthn();
  }).catch(() => {
    console.warn("SimpleWebAuthn browser library not loaded yet.");
  });
} catch (e) {
  // ignore
}

export default function PasskeySetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegisterPasskey = async () => {
    if (!startRegistration) {
      setError("WebAuthn library is still loading or not installed. Try again in a moment.");
      return;
    }

    if (!browserWebAuthnSupported) {
      setError("Your browser or device does not support Passkeys.");
      return;
    }

    setIsRegistering(true);
    setError("");
    setSuccessMsg("");

    try {
      // 1. Get Registration Options from our backend
      const options = await api.post("/auth/passkey/register/options");

      // 2. Pass options to the browser to prompt TouchID / FaceID / YubiKey
      let passkeyResponse;
      try {
        passkeyResponse = await startRegistration({ optionsJSON: options });
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          throw new Error("Registration cancelled or timed out.");
        }
        throw new Error(err.message || "Failed to interact with your device authenticator.");
      }

      // 3. Send the response back to the backend to verify and store safely
      const verificationResponse = await api.post("/auth/passkey/register/verify", passkeyResponse);
      
      if (verificationResponse.verified) {
        setSuccessMsg("Passkey registered successfully! You can now use it to log in.");
      } else {
        setError(verificationResponse.error || "Verification failed securely on the server.");
      }
      
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || "Backend configuration error.");
      } else {
        setError(err.message || "An unexpected error occurred during Passkey setup.");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="w-full max-w-2xl p-8 glass-card mx-auto mt-12 md:mt-24">
      <div className="flex items-center gap-3 mb-8">
        <Link 
          to="/"
          className="p-2 -ml-2 text-gray-400 hover:text-white rounded-lg hover:bg-brand-surface transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Fingerprint className="w-6 h-6 text-brand-primary" /> Passkeys
          </h1>
          <p className="text-gray-400 text-sm mt-1">Sign in safely and easily with biometric authentication.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-6 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 mb-6 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <p className="font-medium">{successMsg}</p>
        </div>
      )}

      <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
        <div className="p-6 border-b border-brand-border">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">What are Passkeys?</h3>
              <p className="text-gray-400 text-sm mt-2 max-w-md leading-relaxed">
                Passkeys replace your password with your device's built-in security. 
                Use Face ID, Touch ID, Windows Hello, or a hardware security key to sign in securely across your devices.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-brand-base flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-surface border border-brand-border/50 shadow-inner mb-6 relative">
            <Fingerprint className="w-8 h-8 text-gray-300" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center border-2 border-brand-base">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <h4 className="font-medium text-white mb-2">Register a new Passkey</h4>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">
            You'll be prompted by your operating system to verify your identity.
          </p>
          
          <button 
            onClick={handleRegisterPasskey}
            disabled={isRegistering}
            className="btn-primary"
          >
            {isRegistering ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Waiting for device...</>
            ) : (
              <><Plus className="w-5 h-5 -ml-1" /> Add a Passkey</>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
