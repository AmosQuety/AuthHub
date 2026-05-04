import { CheckCircle2, Copy } from 'lucide-react';
import type { CreatedClientData } from './types';

interface CreatedAppBannerProps {
  createdClient: CreatedClientData;
  setCreatedClient: (client: CreatedClientData | null) => void;
  copyToClipboard: (text: string, key: string) => void;
  copyStatus: Record<string, boolean>;
}

export function CreatedAppBanner({
  createdClient,
  setCreatedClient,
  copyToClipboard,
  copyStatus
}: CreatedAppBannerProps) {
  return (
    <div className="mb-10 border border-green-500/30 bg-green-500/5 p-6 rounded-2xl glass-card animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3 mb-2 text-green-400">
        <CheckCircle2 className="w-6 h-6" />
        <h2 className="text-lg font-bold text-white">App Registered — Isolated Tenant Space Provisioned! 🎉</h2>
      </div>
      <p className="text-sm text-gray-300 mb-5">
        Your app now has its own isolated space in AuthHub. All users who sign up through your app will be scoped to this tenant only.
        <span className="text-red-400 font-bold ml-1">Save these credentials now — the secret is shown only once.</span>
      </p>

      {/* .env snippet */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase font-bold text-gray-400">Add to your app's .env</label>
          <button
            onClick={() => copyToClipboard(
              [
                `AUTHHUB_URL=${import.meta.env.VITE_API_URL?.replace('/api/v1','') || 'http://localhost:3000'}`,
                `AUTHHUB_JWKS_URL=${import.meta.env.VITE_API_URL?.replace('/api/v1','') || 'http://localhost:3000'}/api/v1/oidc/.well-known/jwks.json`,
                `AUTHHUB_CLIENT_ID=${createdClient.tenantSlug ?? ''}`,
                ...(createdClient.clientSecret ? [`AUTHHUB_CLIENT_SECRET=${createdClient.clientSecret}`] : []),
                `AUTHHUB_TENANT_ID=${createdClient.tenantId ?? ''}`,
              ].join('\n'),
              'env_block'
            )}
            className="flex items-center gap-1.5 text-xs text-brand-primary hover:text-white transition-colors"
          >
            <Copy className={`w-3.5 h-3.5 ${copyStatus['env_block'] ? 'text-green-400' : ''}`} />
            {copyStatus['env_block'] ? 'Copied!' : 'Copy all'}
          </button>
        </div>
        <pre className="bg-black/60 border border-white/8 rounded-xl p-4 text-xs text-gray-300 overflow-x-auto leading-relaxed font-mono">
{`AUTHHUB_URL=${import.meta.env.VITE_API_URL?.replace('/api/v1','') || 'http://localhost:3000'}
AUTHHUB_JWKS_URL=${import.meta.env.VITE_API_URL?.replace('/api/v1','') || 'http://localhost:3000'}/api/v1/oidc/.well-known/jwks.json
AUTHHUB_CLIENT_ID=${createdClient.tenantSlug ?? '(your-tenant-slug)'}
${createdClient.clientSecret ? `AUTHHUB_CLIENT_SECRET=${createdClient.clientSecret}` : '# No secret (public client)'}
AUTHHUB_TENANT_ID=${createdClient.tenantId ?? '(your-tenant-uuid)'}`}
        </pre>
      </div>

      {/* Individual fields */}
      <div className="space-y-2">
        {([
          { label: 'Tenant ID (UUID)',      val: createdClient.tenantId ?? '',  key: 'tid',    hint: 'Unique ID for your isolated space' },
          { label: 'Client ID (slug)',       val: createdClient.tenantSlug ?? '',key: 'slug',   hint: 'Used as AUTHHUB_CLIENT_ID — pass this when registering/logging in users' },
          ...(createdClient.clientSecret ? [{ label: 'Client Secret', val: createdClient.clientSecret, key: 'sec', hint: 'Never shown again — store securely' }] : []),
        ] as { label: string; val: string; key: string; hint: string }[]).map(item => (
          <div key={item.key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase font-bold text-gray-500">{item.label}</label>
              <span className="text-[10px] text-gray-600">{item.hint}</span>
            </div>
            <div className="flex bg-black/40 p-2.5 rounded-lg border border-white/5 items-center justify-between gap-3">
              <code className="text-brand-primary text-xs truncate flex-1">{item.val}</code>
              <button onClick={() => copyToClipboard(item.val, item.key)} className="shrink-0">
                <Copy className={`w-3.5 h-3.5 ${copyStatus[item.key] ? 'text-green-400' : 'text-gray-500'}`} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setCreatedClient(null)}
        className="mt-6 text-sm text-gray-400 hover:text-white underline"
      >
        ✓ I've saved my credentials
      </button>
    </div>
  );
}
