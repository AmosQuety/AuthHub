import { Webhook, Network, ArrowRight } from "lucide-react";

export default function Webhooks() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1 flex items-center gap-2">
            <Webhook className="w-3 h-3 text-cyan-400" /> Developer Tools
          </p>
          <h1 className="text-3xl font-bold text-gradient" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Webhooks
          </h1>
          <p className="text-white/40 mt-1.5 text-sm">Configure endpoints to receive real-time event notifications.</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden relative border border-cyan-500/15">
        {/* Glow corner */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />

        <div className="text-center py-20 px-6 relative z-10">
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-600/20 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <Network className="w-8 h-8 text-cyan-300 animate-float" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Event Streaming
          </h3>
          <p className="text-white/40 max-w-md mx-auto text-sm leading-relaxed mb-8">
            Webhook delivery is currently being engineered. You'll soon be able to subscribe to events like <code className="text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded text-xs">user.created</code>, <code className="text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded text-xs">login.failed</code>, and <code className="text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded text-xs">token.revoked</code> to sync state with your backend applications in milliseconds.
          </p>
          <button className="btn-secondary !w-auto inline-flex items-center gap-2 opacity-50 cursor-not-allowed">
            Roadmap Update <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
