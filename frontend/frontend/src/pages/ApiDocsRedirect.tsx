import { useEffect } from 'react';

const FALLBACK_DOCS_URL = 'https://authhub-npym.onrender.com/api/v1/docs';

function resolveDocsUrl() {
  const configured = import.meta.env.VITE_API_DOCS_URL;
  if (!configured) {
    return FALLBACK_DOCS_URL;
  }

  try {
    return new URL(configured).toString();
  } catch {
    return FALLBACK_DOCS_URL;
  }
}

export default function ApiDocsRedirect() {
  const docsUrl = resolveDocsUrl();

  useEffect(() => {
    window.location.replace(docsUrl);
  }, [docsUrl]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold mb-3">Redirecting to API Docs...</h1>
        <p className="text-[var(--text-muted)] mb-4">
          You are being redirected to the AuthHub API documentation.
        </p>
        <a href={docsUrl} className="text-[#a855f7] hover:underline" rel="noopener noreferrer">
          Continue to API docs
        </a>
      </div>
    </main>
  );
}
