export default function TermsOfService() {
  return (
    <div className="w-full min-h-screen bg-[#070710] p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="space-y-8 text-white/70">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By using AuthHub ("the Service"), you accept and agree to be bound by the terms and provision of this
              agreement. AuthHub reserves the right to make changes to these Terms of Service and its policies and
              operating procedures at any time. If we do this, we will post the changes on this page and will indicate
              at the top of this page the date these terms were last revised. Your continued use of the Service
              following the posting of revised Terms of Service means that you accept and agree to the changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
            <p>
              AuthHub is a centralized authentication platform that provides OAuth 2.0, OIDC, and various
              authentication methods including password, social login, MFA, and biometric authentication.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate, complete, and current information during registration</li>
              <li>Maintain the confidentiality of your account and password</li>
              <li>Be responsible for all activities that occur under your account</li>
              <li>Notify AuthHub immediately of any unauthorized use of your account</li>
              <li>Not use the Service for any unlawful purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Intellectual Property Rights</h2>
            <p>
              AuthHub and its original content, features, and functionality are owned by AuthHub, its creators,
              licensors, and other providers of such material and are protected by international copyright, trademark,
              and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. User Content</h2>
            <p>
              In these Terms of Service, "User Content" shall mean any audio, video, text, images, or other material
              you choose to post on the Service. By posting User Content on the Service, you grant AuthHub a
              world-wide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish,
              transmit, display and distribute such content in any media or medium and for any purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Limitation of Liability</h2>
            <p>
              IN NO EVENT SHALL AUTHHUB, NOR ITS DIRECTORS, EMPLOYEES, OR AGENTS, BE LIABLE TO YOU FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, PROFITS, OR
              USE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless AuthHub and its parent, subsidiaries, affiliates, officers,
              directors, agents, and employees from any claim, demand, or damage, including reasonable attorneys' fees,
              asserted by any third party due to or arising out of your use of the Service or your violation of the
              Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Termination</h2>
            <p>
              AuthHub may terminate your access to the entire Service and any related services provided to you
              immediately, without any notice or explanation provided to you, if in its sole opinion you have violated
              any provision of the Terms of Service or any other guidelines which are incorporated by reference into the
              Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Governing Law</h2>
            <p>
              These Terms of Service and the privacy practices of AuthHub are governed by the laws of the United States,
              and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at support@authhub.com.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-white/40 text-sm">
            Last Updated: April 25, 2026
          </p>
        </div>
      </div>
    </div>
  );
}
