import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Users, Zap, Lock, Code, Share2, CheckCircle } from 'lucide-react';

/**
 * AuthHub Landing Page
 *
 * SEO CONTRACT:
 * - ALL <title>, <meta>, <og:*>, and JSON-LD tags live in index.html ONLY.
 * - This component MUST NOT touch document.title or inject any meta/schema
 *   tags via useEffect. Doing so creates a race condition where the JS-injected
 *   values overwrite the static HTML that Google reliably reads on first crawl.
 *
 * HEADING HIERARCHY (critical for Google):
 * - One <h1> per page, keyword-rich, above the fold.
 * - <h2> for major sections — descriptive, not generic ("How It Works" → bad).
 * - <h3> for cards/items where they add semantic value.
 */
export default function Landing() {
  const navigate = useNavigate();
  const docsPath = '/docs';

  return (
    <div
      className="min-h-screen text-[var(--text-base)]"
      style={{
        background:
          'linear-gradient(to bottom, color-mix(in oklch, var(--bg-base) 96%, black 4%), var(--bg-base), color-mix(in oklch, var(--bg-base) 86%, oklch(0.72 0.14 220) 14%))',
      }}
    >
      {/* ================================================================
          NAVIGATION
      ================================================================ */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/10"
        style={{ backgroundColor: 'color-mix(in oklch, var(--bg-base) 88%, transparent)' }}
        aria-label="Main navigation"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* aria-label on the logo link helps screen readers + Google */}
          <a
            href="/"
            aria-label="AuthHub — Home"
            className="text-2xl font-bold font-display bg-gradient-to-r from-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent"
          >
            AuthHub
          </a>
          <div className="flex items-center gap-4">
            <a
              href="#oauth2-flow"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-base)] transition"
            >
              Docs
            </a>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-[0.75rem] bg-gradient-to-r from-[#a855f7] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] text-white text-sm font-medium transition"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* ================================================================
          HERO SECTION
          <h1> is THE most important on-page SEO signal.
          Must contain your primary keyword phrase.
          "Auth Infrastructure You Own" → nobody searches that.
          Changed to a phrase people actually search.
      ================================================================ */}
      <header className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto">

          {/* Keyword-rich h1 */}
          <h1 className="text-5xl md:text-6xl font-bold font-display mb-6 bg-gradient-to-r from-[#a855f7] via-white to-[#06b6d4] bg-clip-text text-transparent leading-tight">
            Self-Hosted OAuth 2.0 &amp; OIDC Identity Platform
          </h1>

          {/* Supporting paragraph — expands on h1 with secondary keywords */}
          <p className="text-xl text-[var(--text-muted)] mb-12 leading-relaxed">
            Developer-first authentication and authorization infrastructure with OAuth 2.0,
            OpenID Connect, Passkeys, MFA, and multi-tenant support. No Auth0. No Cognito.
            No vendor lock-in.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 rounded-[0.75rem] bg-gradient-to-r from-[#a855f7] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] text-white font-semibold transition transform hover:scale-105"
            >
              Get Started Free <ArrowRight className="inline ml-2 w-4 h-4" aria-hidden="true" />
            </button>
            <a
              href={docsPath}
              className="px-8 py-3 rounded-[0.75rem] border border-white/20 hover:border-[#a855f7] text-white font-semibold transition"
            >
              View API Documentation
            </a>
          </div>

          {/* Code snippet — semantic <pre><code> is readable by Google */}
          <div
            id="oauth2-flow"
            className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6 backdrop-blur-sm overflow-hidden scroll-mt-28"
            aria-label="OAuth 2.0 authorization code flow example"
          >
            <pre className="text-sm text-left font-mono text-[#06b6d4]">
              <code>{`// 1. Register your app — get instant OAuth 2.0 credentials
const { clientId, clientSecret } = await registerApp();

// 2. Redirect users to AuthHub for secure authentication
window.location = \`https://auth-hubb.vercel.app/oauth/authorize?
  client_id=\${clientId}&
  redirect_uri=\${appUrl}&
  response_type=code&
  scope=openid+profile+email&
  code_challenge=\${pkceChallenge}&
  code_challenge_method=S256\`;

// 3. Exchange authorization code for JWT tokens
const { accessToken, idToken } = await exchangeCode(code, codeVerifier);

// Done — your user is authenticated with OpenID Connect.
`}</code>
            </pre>
            <div className="py-5">
              <a
                href={docsPath}
                className="px-8 py-3 rounded-[0.75rem] bg-gradient-to-r from-[#a855f7] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] text-white font-semibold transition transform hover:scale-105"
              >
                Full API Documentation →
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================
          HOW IT WORKS
          h2 changed from generic "How It Works" to keyword-containing version.
          h3 on each step so Google understands the content hierarchy.
      ================================================================ */}
      <section className="max-w-6xl mx-auto px-6 py-20" aria-labelledby="how-it-works-heading">
        <h2
          id="how-it-works-heading"
          className="text-3xl font-bold font-display text-center mb-16"
        >
          OAuth 2.0 Authorization Code Flow — How AuthHub Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Code,
              title: 'Register Your OAuth 2.0 Application',
              desc: 'Create a new app in your dashboard and receive instant client credentials (client_id, client_secret) for the authorization code flow.',
            },
            {
              icon: Users,
              title: 'Authenticate Users via OpenID Connect',
              desc: 'Redirect users to AuthHub. We handle login, MFA, Passkeys, and session management. Users stay on your branded experience.',
            },
            {
              icon: Lock,
              title: 'Receive RS256-Signed JWT Tokens',
              desc: 'Get a signed access token and OIDC ID token. Redis-backed refresh token rotation keeps sessions secure and fast.',
            },
          ].map((step, i) => (
            <div key={i} className="relative">
              <div className="absolute -top-4 left-6 w-10 h-10 bg-gradient-to-r from-[#a855f7] to-[#7c3aed] rounded-full flex items-center justify-center text-white font-bold" aria-hidden="true">
                {i + 1}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-8 hover:border-[#a855f7]/50 transition">
                <step.icon className="w-12 h-12 text-[#06b6d4] mb-6" aria-hidden="true" />
                <h3 className="text-xl font-bold font-display mb-3">{step.title}</h3>
                <p className="text-[var(--text-muted)]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================
          FEATURES GRID
          h2 is descriptive. Each feature card has an h3.
          Feature titles now contain searchable terms.
      ================================================================ */}
      <section className="max-w-6xl mx-auto px-6 py-20" aria-labelledby="features-heading">
        <h2
          id="features-heading"
          className="text-3xl font-bold font-display text-center mb-16"
        >
          Authentication &amp; Authorization Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Shield,
              title: 'OAuth 2.0 with PKCE',
              desc: 'Authorization Code Flow with Proof Key for Code Exchange (PKCE) — secure for public clients including SPAs and mobile apps.',
            },
            {
              icon: Share2,
              title: 'OpenID Connect (OIDC)',
              desc: 'Full OIDC implementation with identity claims, JWKS endpoint, UserInfo endpoint, and ID token validation.',
            },
            {
              icon: Users,
              title: 'Multi-Tenant Identity Management',
              desc: 'Logical tenant isolation with strict data separation. One platform, unlimited tenants, zero cross-contamination.',
            },
            {
              icon: Lock,
              title: 'JWT Session Management',
              desc: 'RS256-signed access tokens, OIDC ID tokens, and Redis-backed refresh token rotation with configurable TTLs.',
            },
            {
              icon: Zap,
              title: 'RESTful Developer API',
              desc: 'Full API for application management, user administration, token introspection, and webhook configuration.',
            },
            {
              icon: CheckCircle,
              title: 'Passkeys, MFA &amp; WebAuthn',
              desc: 'TOTP-based multi-factor authentication, WebAuthn Passkeys, and account recovery codes. Security by design.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-[1.5rem] p-6 hover:border-[#06b6d4]/30 transition group"
            >
              <feature.icon className="w-10 h-10 text-[#a855f7] group-hover:text-[#06b6d4] transition mb-4" aria-hidden="true" />
              <h3 className="font-bold font-display mb-2">{feature.title}</h3>
              <p className="text-sm text-[var(--text-muted)]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================
          WHO IT'S FOR
          Previously anonymous bullet items.
          Now each point has an h3 so Google understands the topic.
          Competitor names (Auth0, Cognito) are intentional — users
          searching "Auth0 alternative" or "self-hosted Cognito" will find this.
      ================================================================ */}
      <section className="max-w-4xl mx-auto px-6 py-20" aria-labelledby="use-cases-heading">
        <h2
          id="use-cases-heading"
          className="text-3xl font-bold font-display text-center mb-12"
        >
          Self-Hosted Authentication for Teams That Want Control
        </h2>
        <div className="space-y-6">
          {[
            {
              heading: 'White-Label Authentication for SaaS Companies',
              body: 'Ship fully branded OAuth 2.0 and OIDC login flows without depending on a third-party identity vendor.',
            },
            {
              heading: 'Auth0 & Cognito Alternative That You Own',
              body: 'Tired of Auth0 or AWS Cognito pricing that scales against you? AuthHub runs on your infrastructure — costs stay flat as you grow.',
            },
            {
              heading: 'SSO & User Management for Internal Tools',
              body: 'Secure internal platforms and admin portals with Single Sign-On, RBAC, and centralized user management.',
            },
            {
              heading: 'Data Sovereignty & Open Identity Infrastructure',
              body: 'For organizations that need full control over authentication data. Self-host, audit, and extend AuthHub with no restrictions.',
            },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 items-start bg-white/5 p-6 rounded-[1.5rem] border border-white/10">
              <CheckCircle className="w-6 h-6 text-[#06b6d4] flex-shrink-0 mt-1" aria-hidden="true" />
              <div>
                <h3 className="font-semibold font-display mb-1">{item.heading}</h3>
                <p className="text-[var(--text-muted)] text-sm">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================
          CTA BANNER
      ================================================================ */}
      <section className="max-w-4xl mx-auto px-6 py-16 mb-20" aria-labelledby="cta-heading">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-[#a855f7]/20 to-[#06b6d4]/20 border border-[#a855f7]/30 p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-[#a855f7]/5 to-[#06b6d4]/5 blur-3xl -z-10" aria-hidden="true" />
          <h2 id="cta-heading" className="text-3xl font-bold font-display mb-6">
            Deploy Your Own OAuth 2.0 Identity Platform
          </h2>
          <p className="text-[var(--text-muted)] mb-8 max-w-2xl mx-auto">
            Get started free. No credit card required. Self-host your authentication
            infrastructure with OAuth 2.0, OpenID Connect, and multi-tenant support — in minutes.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 rounded-[0.75rem] bg-gradient-to-r from-[#a855f7] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] text-white font-semibold transition transform hover:scale-105"
          >
            Get Started Free <ArrowRight className="inline ml-2 w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          <footer> is a semantic landmark — Google uses it to understand
          page structure. Internal links here pass crawl authority.
      ================================================================ */}
      <footer className="border-t border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
          <div>
            <p className="text-lg font-bold font-display bg-gradient-to-r from-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent mb-4">
              AuthHub
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Self-hosted OAuth 2.0 &amp; OpenID Connect identity platform for developers and modern teams.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li><a href={docsPath} className="hover:text-[var(--text-base)] transition">API Documentation</a></li>
              <li><a href="/login" className="hover:text-white transition">Developer Dashboard</a></li>
              <li><a href="/login" className="hover:text-white transition">Developer Portal</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm">Open Source</h4>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li>
                <a
                  href="https://github.com/AmosQuety/AuthHub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--text-base)] transition"
                >
                  GitHub Repository
                </a>
              </li>
              <li><a href="/login" className="hover:text-[var(--text-base)] transition">Roadmap</a></li>
              <li><a href="/login" className="hover:text-[var(--text-base)] transition">Status Page</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li><a href="/terms"   className="hover:text-[var(--text-base)] transition">Terms of Service</a></li>
              <li><a href="/privacy" className="hover:text-[var(--text-base)] transition">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 px-6 py-6 text-center text-sm text-[var(--text-muted)]">
          <p>
            &copy; 2026 AuthHub. Self-hosted OAuth 2.0 &amp; OpenID Connect identity platform.
            Built with security-first principles.
          </p>
        </div>
      </footer>
    </div>
  );
}