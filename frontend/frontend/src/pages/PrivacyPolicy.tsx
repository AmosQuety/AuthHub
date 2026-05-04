export default function PrivacyPolicy() {
  return (
    <div className="w-full min-h-screen bg-[#070710] p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="space-y-8 text-white/70">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p>
              AuthHub ("we", "our", or "us") operates the AuthHub website. This page informs you of our policies
              regarding the collection, use, and disclosure of personal data when you use our Service and the choices
              you have associated with that data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Information Collection and Use</h2>
            <p>We collect several different types of information for various purposes to provide and improve our Service.</p>
            
            <h3 className="text-lg font-semibold text-white mt-4 mb-2">Types of Data Collected:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Personal Data:</strong> Email address, name, phone number, password (if applicable)</li>
              <li><strong>Usage Data:</strong> Browser type, IP address, pages visited, time spent on pages</li>
              <li><strong>Device Data:</strong> Device information, operating system, device identifiers</li>
              <li><strong>Authentication Data:</strong> Authentication methods used, MFA preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Use of Data</h2>
            <p>AuthHub uses the collected data for various purposes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow you to participate in interactive features of our Service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information for improving our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Security of Data</h2>
            <p>
              The security of your data is important to us, but remember that no method of transmission over the
              Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable
              means to protect your Personal Data, we cannot guarantee its absolute security. We use industry-standard
              encryption, hashing, and other security measures.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Information Sharing</h2>
            <p>
              We do not sell, trade, or rent your Personal Information to third parties. We may share your information
              only in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>With your explicit consent</li>
              <li>When required by law or legal process</li>
              <li>To protect the security and rights of our Service</li>
              <li>With service providers who assist us in operating our Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our Service and hold certain
              information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being
              sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Third-Party Links</h2>
            <p>
              Our Service may contain links to third-party sites that are not operated by us. This Privacy Policy does
              not apply to third-party websites, and we are not responsible for their privacy practices. We encourage
              you to review the Privacy Policy of every website you visit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Children's Privacy</h2>
            <p>
              Our Service does not address anyone under the age of 13 ("Children"). We do not knowingly collect
              personally identifiable information from children under 13. If you are a parent or guardian and you are
              aware that your Child has provided us with Personal Data, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the "Last Updated" date at the bottom of this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <ul className="list-none space-y-1 ml-4 mt-2">
              <li>Email: privacy@authhub.com</li>
              <li>Website: https://authhub.com</li>
            </ul>
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
