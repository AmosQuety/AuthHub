import { Webhook, Cog } from "lucide-react";

export default function Webhooks() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="w-6 h-6 text-brand-primary" /> 
            Webhooks
          </h1>
          <p className="text-gray-400 mt-1">Configure endpoints to receive real-time event notifications.</p>
        </div>
      </div>

      <div className="glass-card text-center py-16">
          <Cog className="w-12 h-12 mx-auto mb-4 text-gray-600 animate-[spin_4s_linear_infinite]" />
          <h3 className="text-xl font-medium text-white mb-2">Coming Soon</h3>
          <p className="text-gray-400 max-w-md mx-auto">
             Webhook delivery is currently being implemented. You'll soon be able to subscribe to events like `user.created`, `login.failed`, and `token.revoked` to sync state with your backend applications.
          </p>
      </div>
    </div>
  );
}
