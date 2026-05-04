import { Code, Globe, Activity } from 'lucide-react';
import type { OAuthClient } from '../types';

interface IntegrationGuideModalProps {
  guideClient: OAuthClient;
  setGuideClient: (client: OAuthClient | null) => void;
  activeGuideTab: 'api' | 'oauth' | 'm2m';
  setActiveGuideTab: (tab: 'api' | 'oauth' | 'm2m') => void;
}

export function IntegrationGuideModal({
  guideClient,
  setGuideClient,
  activeGuideTab,
  setActiveGuideTab
}: IntegrationGuideModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setGuideClient(null)}></div>
      <div className="relative glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Integration Guide</h2>
            <p className="text-sm text-gray-400">How to connect <span className="text-white font-bold">{guideClient.name}</span> to AuthHub.</p>
          </div>
          <button onClick={() => setGuideClient(null)} className="p-2 text-gray-500 hover:text-white rounded-full bg-white/5">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 mb-6 overflow-x-auto">
          {[
            { id: 'api', label: 'Direct API (Custom Forms)', icon: Code, desc: 'Total UI Control' },
            { id: 'oauth', label: 'OAuth 2.0 Web Flow', icon: Globe, desc: 'Hosted "Sign In" UI' },
            { id: 'm2m', label: 'Machine-to-Machine', icon: Activity, desc: 'Backend-to-Backend' },
          ].map(tab => {
            const isActive = activeGuideTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveGuideTab(tab.id as any)}
                className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg transition-all ${isActive ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Icon className="w-4 h-4" /> {tab.label}
                </div>
                <span className={`text-[10px] mt-1 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>{tab.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Tab: Direct API */}
        {activeGuideTab === 'api' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-xl">
              <h3 className="text-brand-primary font-bold mb-2">Build Your Own Forms</h3>
              <p className="text-sm text-gray-300">
                Use this method if you want 100% control over the user experience (like WhatsApp Copy). 
                Your users never leave your app. Just pass your <code className="text-white">client_id</code> to immediately scope them to your isolated tenant.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> 1. Register a User</h4>
              <pre className="bg-black/60 border border-white/8 rounded-xl p-4 text-xs text-brand-primary overflow-x-auto">
{`POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "client_id": "${guideClient.clientId}"
}`}
              </pre>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> 2. Login User</h4>
              <pre className="bg-black/60 border border-white/8 rounded-xl p-4 text-xs text-brand-primary overflow-x-auto">
{`POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123",
  "client_id": "${guideClient.clientId}"
}`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab: OAuth Hosted */}
        {activeGuideTab === 'oauth' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
              <h3 className="text-purple-400 font-bold mb-2">"Sign In with AuthHub" Button</h3>
              <p className="text-sm text-gray-300">
                Use this method (Authorization Code Flow) if you don't want to build login forms or handle passwords.
                Redirect the user to AuthHub, and we will redirect them back with an authorization code.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">1. Redirect user to AuthHub</h4>
              <p className="text-[10px] text-gray-500 block mb-2">Send the browser explicitly to this URL:</p>
              <pre className="bg-black/60 border border-white/8 rounded-xl p-4 text-xs text-purple-300 overflow-x-auto whitespace-pre-wrap break-all">
{`GET /api/v1/oidc/auth?
client_id=${guideClient.clientId}&
redirect_uri=${guideClient.redirectUris[0] || 'YOUR_REDIRECT_URI'}&
response_type=code&
scope=openid profile email`}
              </pre>
            </div>

            {!guideClient.isPublic && (
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-bold text-white">2. Exchange Code for Tokens</h4>
                <p className="text-[10px] text-gray-500 block mb-2">When they return to your app with ?code=XYZ, your backend exchanges it:</p>
                <pre className="bg-black/60 border border-white/8 rounded-xl p-4 text-xs text-purple-300 overflow-x-auto">
{`POST /api/v1/oidc/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=XYZ&
redirect_uri=${guideClient.redirectUris[0] || 'YOUR_REDIRECT_URI'}&
client_id=${guideClient.clientId}&
client_secret=YOUR_CLIENT_SECRET`}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Tab: M2M */}
        {activeGuideTab === 'm2m' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {guideClient.isPublic ? (
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center">
                <h3 className="text-red-400 font-bold mb-2">Not Available</h3>
                <p className="text-sm text-gray-300">
                  Machine-to-Machine (Client Credentials) flow is only available for <strong>Confidential Clients</strong> because it requires securely storing a Client Secret. This app is a Public Client.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
                  <h3 className="text-orange-400 font-bold mb-2">Backend Services</h3>
                  <p className="text-sm text-gray-300">
                    Use this method for background jobs, microservices, or external APIs to authenticate directly with AuthHub without a user present (Client Credentials Flow).
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white">Get an Access Token</h4>
                  <pre className="bg-black/60 border border-white/8 rounded-xl p-4 text-xs text-orange-300 overflow-x-auto">
{`POST /api/v1/oidc/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id=${guideClient.clientId}&
client_secret=YOUR_CLIENT_SECRET`}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
