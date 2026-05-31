import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../lib/api";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { error, success } = useToast();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [showTosModal, setShowTosModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Extract access token from URL or localStorage
  const accessToken = searchParams.get("access_token") || localStorage.getItem("accessToken");

  useEffect(() => {
    if (!accessToken) {
      error("No access token provided");
      navigate("/login");
      return;
    }

    // Fetch current user data with the access token
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) throw new Error("Failed to fetch user data");
        const data = await response.json();
        
        // Pre-fill name if it exists
        if (data.name) setName(data.name);
        if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
        if (data.tosAcceptedAt && data.privacyAcceptedAt) setTosAccepted(true);
      } catch (err) {
        console.error("Error fetching user data:", err);
        error("Failed to load profile data");
      }
    };

    fetchUserData();
  }, [accessToken, navigate, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      error("Name is required");
      return;
    }

    if (!phoneNumber.trim()) {
      error("Phone number is required");
      return;
    }

    if (!tosAccepted) {
      error("You must accept the Terms of Service and Privacy Policy");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/complete-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          tosAccepted: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to complete profile");
      }

      const data = await response.json();
      success("Profile completed successfully!");

      // Update auth context with new tokens
      if (data.refreshToken) {
        // Store refresh token in cookie (done by backend)
        // Store access token in state
        login(data.accessToken, data.user);
      }

      // Redirect to dashboard
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      error(err.message || "Failed to complete profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 relative">
      <div className="fixed top-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-up">
        <button 
          onClick={() => navigate("/login")}
          className="group flex items-center gap-2 text-white/40 hover:text-white mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Back to Login
        </button>

        <div className="glass-card-vivid p-8 relative overflow-hidden border-violet-500/15">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative">
            <h1 className="text-2xl font-bold text-gradient mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Complete Your Profile
            </h1>
            <p className="text-white/40 text-sm mb-8">
              Just a few details to secure your account and get started.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-400/50 focus:bg-white/[0.15] transition-all"
                  disabled={isLoading}
                />
              </div>

              {/* Phone Number Field */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-400/50 focus:bg-white/[0.15] transition-all"
                  disabled={isLoading}
                />
                <p className="text-xs text-white/30 mt-1">We may use this for SMS-based security notifications</p>
              </div>

              {/* ToS Acceptance */}
              <div className="p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tosAccepted}
                    onChange={(e) => setTosAccepted(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    disabled={isLoading}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-white">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setShowTosModal(true)}
                        className="text-violet-400 hover:text-violet-300 underline font-medium transition-colors"
                      >
                        Terms of Service
                      </button>
                      {" "}and{" "}
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 hover:text-violet-300 underline font-medium transition-colors"
                      >
                        Privacy Policy
                      </a>
                    </p>
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !tosAccepted || !name.trim() || !phoneNumber.trim()}
                className="w-full btn-primary py-3 mt-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Complete Profile
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-white/30 text-center mt-6">
              You can update these details anytime in your account settings.
            </p>
          </div>
        </div>
      </div>

      {/* ToS Modal */}
      {showTosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTosModal(false)} />
          <div className="relative glass-card-vivid w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowTosModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white rounded-full bg-white/5 transition-colors"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-white mb-6">Terms of Service</h2>

            <div className="space-y-4 text-white/70 text-sm">
              <section>
                <h3 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h3>
                <p>
                  By using AuthHub, you accept these terms and conditions. If you do not agree to abide by the
                  above, please do not use this service.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">2. Use License</h3>
                <p>
                  Permission is granted to temporarily download one copy of the materials (information or software)
                  on AuthHub for personal, non-commercial transitory viewing only. This is the grant of a license,
                  not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Modifying or copying the materials</li>
                  <li>Using the materials for any commercial purpose or for any public display</li>
                  <li>Attempting to decompile or reverse engineer any software contained on AuthHub</li>
                  <li>Removing any copyright or other proprietary notations from the materials</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">3. Disclaimer</h3>
                <p>
                  The materials on AuthHub are provided on an 'as is' basis. AuthHub makes no warranties,
                  expressed or implied, and hereby disclaims and negates all other warranties including, without
                  limitation, implied warranties or conditions of merchantability, fitness for a particular
                  purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">4. Limitations</h3>
                <p>
                  In no event shall AuthHub or its suppliers be liable for any damages (including, without
                  limitation, damages for loss of data or profit, or due to business interruption) arising out of
                  the use or inability to use the materials on AuthHub.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">5. Accuracy of Materials</h3>
                <p>
                  The materials appearing on AuthHub could include technical, typographical, or photographic errors.
                  AuthHub does not warrant that any of the materials on AuthHub are accurate, complete, or current.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">6. Modifications</h3>
                <p>
                  AuthHub may revise these terms of service for AuthHub at any time without notice. By using this
                  site, you are agreeing to be bound by the then current version of these terms of service.
                </p>
              </section>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowTosModal(false)}
                className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setTosAccepted(true);
                  setShowTosModal(false);
                }}
                className="flex-1 btn-primary py-3"
              >
                Accept & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
