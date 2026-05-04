import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Users, Zap, Lock, Code, Share2, CheckCircle } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Update page title and meta tags
    document.title = 'AuthHub | Developer-First Identity Platform';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'AuthHub: OAuth 2.0 & OIDC identity provider. Multi-tenant SaaS auth infrastructure you own. Built for developers.');
    }

    // Open Graph tags
    const ogTags = {
      'og:title': 'AuthHub | Developer-First Identity Platform',
      'og:description': 'OAuth 2.0 & OIDC identity provider. Multi-tenant SaaS auth infrastructure you own.',
      'og:type': 'website',
      'og:url': 'https://auth-hubb.vercel.app',
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });

    // Add JSON-LD schema
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.innerHTML = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'AuthHub',
      description: 'OAuth 2.0 & OIDC identity provider. Multi-tenant SaaS auth infrastructure.',
      url: 'https://auth-hubb.vercel.app',
      applicationCategory: 'DeveloperApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'OAuth 2.0 with PKCE',
        'OpenID Connect (OIDC)',
        'Multi-Tenant Architecture',
        'JWT Token Management',
        'Redis-backed Sessions',
        'Developer API'
      ],
    });
    document.head.appendChild(schemaScript);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0f14] via-[#0d0f14] to-[#1a1d2e] text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0d0f14]/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold font-display bg-gradient-to-r from-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent">
            AuthHub
          </div>
          <div className="flex items-center gap-4">
            <a href="#docs" className="text-sm text-gray-300 hover:text-white transition">Docs</a>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-[0.75rem] bg-gradient-to-r from-[#a855f7] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] text-white text-sm font-medium transition"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold font-display mb-6 bg-gradient-to-r from-[#a855f7] via-white to-[#06b6d4] bg-clip-text text-transparent leading-tight">
            Auth Infrastructure You Own
          </h1>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Developer-first identity platform with OAuth 2.0, OpenID Connect, and multi-tenant support. Built on rock-solid foundations — no vendor lock-in.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 rounded-[0.75rem] bg-gradient-to-r from-[#a855f7] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] text-white font-semibold transition transform hover:scale-105"
            >
              Get Started <ArrowRight className="inline ml-2 w-4 h-4" />
            </button>
            <a
              href="https://authhub-npym.onrender.com/api/v1/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-[0.75rem] border border-white/20 hover:border-[#a855f7] text-white font-semibold transition"
            >
              View API Docs
            </a>
          </div>
          
          {/* Hero visual — code snippet mockup */}
          <div className="bg-[#0a0d12]/60 border border-white/10 rounded-[1.5rem] p-6 backdrop-blur-sm overflow-hidden">
            <pre className="text-sm text-left font-mono text-[#06b6d4]">
              <code>{`// Register your app → Get credentials
const { clientId, clientSecret } = await registerApp();

// Redirect user to AuthHub for authentication
window.location = \`https://authhub.app/oauth/authorize?
  client_id=\${clientId}&
  redirect_uri=\${appUrl}&
  response_type=code&
  scope=openid+profile+email\`;

// Exchange code for tokens
const { accessToken } = await exchangeCode(code);

// Secured! Your user is authenticated.
`}</code>
            </pre>
          </div>
        </div>
      </header>

      {/* How it Works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold font-display text-center mb-16">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Code, title: 'Register Your App', desc: 'Create a new app in your dashboard, get instant client credentials.' },
            { icon: Users, title: 'Authenticate Users', desc: 'Redirect to AuthHub. We handle login, MFA, and session management.' },
            { icon: Lock, title: 'Receive Tokens', desc: 'Get JWT access & refresh tokens. Your app is now secured.' },
          ].map((step, i) => (
            <div key={i} className="relative">
              <div className="absolute -top-4 left-6 w-10 h-10 bg-gradient-to-r from-[#a855f7] to-[#7c3aed] rounded-full flex items-center justify-center text-white font-bold">
                {i + 1}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-8 hover:border-[#a855f7]/50 transition">
                <step.icon className="w-12 h-12 text-[#06b6d4] mb-6" />
                <h3 className="text-xl font-bold font-display mb-3">{step.title}</h3>
                <p className="text-gray-300">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold font-display text-center mb-16">Enterprise Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'OAuth 2.0 + PKCE', desc: 'Authorization Code Flow with proof-key for public clients.' },
            { icon: Share2, title: 'OpenID Connect', desc: 'Standard OIDC implementation with identity claims & JWKS.' },
            { icon: Users, title: 'Multi-Tenant', desc: 'Logical tenant separation with strict data isolation.' },
            { icon: Lock, title: 'JWT Sessions', desc: 'RS256 signed tokens + Redis-backed refresh token rotation.' },
            { icon: Zap, title: 'Developer API', desc: 'RESTful API for app management, user admin, webhooks.' },
            { icon: CheckCircle, title: 'MFA + Passkeys', desc: 'TOTP, WebAuthn, recovery codes. Security by design.' },
          ].map((feature, i) => (
            <div key={i} className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-[1.5rem] p-6 hover:border-[#06b6d4]/30 transition group">
              <feature.icon className="w-10 h-10 text-[#a855f7] group-hover:text-[#06b6d4] transition mb-4" />
              <h3 className="font-bold font-display mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who It's For */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold font-display text-center mb-12">Built for Teams That Want Control</h2>
        <div className="space-y-6">
          {[
            'SaaS companies needing white-label authentication without vendor lock-in.',
            'Development teams tired of Auth0/Cognito pricing as they scale.',
            'Internal tools and platforms requiring secure SSO and user management.',
            'Organizations that value open infrastructure and data sovereignty.',
          ].map((item, i) => (
            <div key={i} className="flex gap-4 items-start bg-white/5 p-6 rounded-[1.5rem] border border-white/10">
              <CheckCircle className="w-6 h-6 text-[#06b6d4] flex-shrink-0 mt-1" />
              <p className="text-gray-200">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-4xl mx-auto px-6 py-16 mb-20">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-[#a855f7]/20 to-[#06b6d4]/20 border border-[#a855f7]/30 p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-[#a855f7]/5 to-[#06b6d4]/5 blur-3xl -z-10" />
          <h2 className="text-3xl font-bold font-display mb-6">Ready to Secure Your App?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Get started free. No credit card required. Deploy your own identity infrastructure in minutes.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 rounded-[0.75rem] bg-gradient-to-r from-[#a855f7] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] text-white font-semibold transition transform hover:scale-105"
          >
            Get Started Free <ArrowRight className="inline ml-2 w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0a0d12]/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-lg font-bold font-display bg-gradient-to-r from-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent mb-4">
              AuthHub
            </div>
            <p className="text-sm text-gray-400">Developer-first identity platform for modern teams.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="https://authhub-npym.onrender.com/api/v1/docs" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">API Docs</a></li>
              <li><a href="/login" className="hover:text-white transition">Dashboard</a></li>
              <li><a href="/login" className="hover:text-white transition">Developer Portal</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="https://github.com/AmosQuety/AuthHub" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">GitHub</a></li>
              <li><a href="/login" className="hover:text-white transition">Roadmap</a></li>
              <li><a href="/login" className="hover:text-white transition">Status</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/terms-of-service" className="hover:text-white transition">Terms</a></li>
              <li><a href="/privacy-policy" className="hover:text-white transition">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 px-6 py-6 text-center text-sm text-gray-500">
          <p>&copy; 2026 AuthHub. All rights reserved. Built with security-first principles.</p>
        </div>
      </footer>
    </div>
  );
}
