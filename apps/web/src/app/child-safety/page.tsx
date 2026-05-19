export default function ChildSafetyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-[#c0281f] mb-2">Child Safety Standards</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: May 19, 2026</p>

      <section className="space-y-6 text-gray-700 leading-relaxed">

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Our Commitment</h2>
          <p>
            GUEPOSTING is committed to providing a safe environment for all users and maintaining
            zero tolerance for child sexual abuse and exploitation (CSAE) content on our platform.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Age Restriction</h2>
          <p>
            GUEPOSTING is intended for users aged 18 and older. Users under 18 are not permitted
            to create accounts or use our services. We do not knowingly collect personal information
            from minors.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Prohibited Content</h2>
          <p>The following content is strictly prohibited on GUEPOSTING:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Any content that sexually exploits or endangers minors</li>
            <li>Child sexual abuse material (CSAM) in any form</li>
            <li>Content that grooms, exploits, or harms children</li>
            <li>Any content that violates child safety laws</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Reporting Child Safety Concerns</h2>
          <p>
            Users can report child safety concerns directly within the app or by contacting us at:
          </p>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p><strong>GUEPOSTING Child Safety Contact</strong></p>
            <p>Email: <a href="mailto:ghesang@gmail.com" className="text-[#c0281f]">ghesang@gmail.com</a></p>
            <p>Website: <a href="https://gueposting.vercel.app" className="text-[#c0281f]">gueposting.vercel.app</a></p>
          </div>
          <p className="mt-3">
            All reports are reviewed promptly. Content violating our child safety policy will be
            removed immediately and reported to relevant authorities including the National Center
            for Missing &amp; Exploited Children (NCMEC) and local law enforcement as required by law.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Enforcement</h2>
          <p>
            Any user found to be posting, sharing, or distributing content that endangers children
            will be immediately banned from the platform and reported to the appropriate authorities.
            We comply with all applicable child safety laws and regulations.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Compliance</h2>
          <p>
            GUEPOSTING complies with all relevant child safety laws and cooperates fully with
            regional and national authorities in any investigation related to child safety violations.
          </p>
        </div>

      </section>
    </div>
  );
}
