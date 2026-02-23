"use client";

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center space-x-3">
            <img 
              src="/kmu_logo.svg" 
              alt="KMU Logo" 
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-bold text-gray-900 dark:text-white">KMU Reports</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link 
              href="/login"
              className="px-6 py-2 text-kmuGreen font-medium hover:text-green-700 transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/public/report"
              className="px-6 py-2 bg-kmuGreen text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              File Report
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-8">
              <img 
                src="/kmu_logo.svg" 
                alt="Kapasa Makasa University Logo" 
                className="h-24 w-24 mx-auto object-contain"
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Campus Incident Reporting
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
              A secure, confidential platform for reporting campus incidents and facilitating swift resolution. File reports anonymously or with your identity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/public/report"
                className="px-8 py-4 bg-kmuGreen text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-colors shadow-lg"
              >
                File a Report
              </Link>
              <Link 
                href="#features"
                className="px-8 py-4 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-bold text-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-kmuGreen/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-kmuGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Anonymous Reporting</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Report incidents confidentially without revealing your identity. Your privacy and safety are our priority.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-kmuGreen/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-kmuGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Real-Time Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor your report status at every step. Receive updates on investigation progress and outcomes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-kmuGreen/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-kmuGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Secure Handling</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your information is encrypted and protected by strict privacy standards and institutional policies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">How It Works</h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-kmuGreen text-white flex items-center justify-center font-bold text-lg">1</div>
                  <div className="w-1 h-16 bg-gray-300 dark:bg-gray-700 mt-4"></div>
                </div>
                <div className="pb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">File Your Report</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Fill out the report form with details about the incident. Provide as much information as possible to help us understand the situation.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-kmuGreen text-white flex items-center justify-center font-bold text-lg">2</div>
                  <div className="w-1 h-16 bg-gray-300 dark:bg-gray-700 mt-4"></div>
                </div>
                <div className="pb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Secure Submission</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your report is securely submitted and assigned a unique reference number for tracking purposes.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-kmuGreen text-white flex items-center justify-center font-bold text-lg">3</div>
                  <div className="w-1 h-16 bg-gray-300 dark:bg-gray-700 mt-4"></div>
                </div>
                <div className="pb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Investigation</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our team reviews and investigates your report according to institutional policies and procedures.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-kmuGreen text-white flex items-center justify-center font-bold text-lg">4</div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Resolution</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You receive updates on the investigation outcome and any actions taken.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-kmuGreen text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to File a Report?</h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto opacity-95">
            Your voice matters. File a report today and help us maintain a safe and respectful campus community.
          </p>
          <Link 
            href="/public/report"
            className="inline-block px-10 py-4 bg-white text-kmuGreen rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            File a Report Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src="/kmu_logo.svg" 
                  alt="KMU Logo" 
                  className="w-8 h-8 mr-3"
                />
                <span className="text-lg font-bold text-white">KMU Reports</span>
              </div>
              <p className="text-sm">
                Secure incident reporting platform for Kapasa Makasa University.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/public/report" className="hover:text-white transition-colors">File Report</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/home" className="hover:text-white transition-colors">Home</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>IT Help Desk: helpdesk@kmu.edu</li>
                <li>Student Affairs: affairs@kmu.edu</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p className="mb-2">
              &copy; {new Date().getFullYear()} Kapasa Makasa University. All rights reserved.
            </p>
            <p className="text-gray-500">
              Developed by Daniel Chali & Grace Namonje
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
