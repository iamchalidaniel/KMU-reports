"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useState } from 'react';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isLoading) return;

    setIsLoading(true);
    setAiResponse(null);

    try {
      const sections = document.querySelectorAll('.help-section');
      const context = Array.from(sections).map(s => (s as HTMLElement).innerText).join("\n\n");

      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Context from Manual:\n${context}\n\nUser Question: ${searchQuery}` }],
          formType: 'help'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiResponse(data.response);
      } else {
        setAiResponse("I'm sorry, I couldn't process your request right now.");
      }
    } catch (err) {
      console.error('Help search error:', err);
      setAiResponse("An error occurred while searching. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-24 font-sans">
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="animate-in fade-in duration-500 space-y-12">

          {/* Header */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-600 text-[10px] font-bold uppercase tracking-widest mb-2">
              Operational Intelligence & Support
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">
              Knowledge <span className="text-blue-600">Base</span>
            </h1>

            <div className="max-w-3xl mx-auto relative group">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query compliance protocols, case logic, or reporting..."
                  className="w-full pl-6 pr-40 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-sans"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {isLoading ? "Querying..." : "Execute Search"}
                </button>
              </form>

              {aiResponse && (
                <div className="mt-4 p-6 bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-800 rounded-xl text-left shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">✨</span>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">AI Synthesis Result</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm font-sans">
                    {aiResponse}
                  </p>
                  <button
                    onClick={() => setAiResponse(null)}
                    className="mt-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest hover:text-blue-600 transition"
                  >
                    Clear Synthesis
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Help Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Quick Start Matrix */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-10 help-section">
              <h2 className="text-xl font-bold uppercase tracking-tight text-blue-600 mb-8">Operational Onboarding</h2>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Core Workflow</h3>
                  <ul className="space-y-4 text-gray-600 dark:text-gray-400 font-sans text-sm">
                    <li className="flex gap-4">
                      <span className="text-blue-600 font-bold">01.</span>
                      <span>Navigate via the **Command Sidebar** to access specialized modules.</span>
                    </li>
                    <li className="flex gap-4">
                      <span className="text-blue-600 font-bold">02.</span>
                      <span>Initiate cases via the **"+ New Case"** directive in the Executive Command Bar.</span>
                    </li>
                    <li className="flex gap-4">
                      <span className="text-blue-600 font-bold">03.</span>
                      <span>Utilize **Smart Search** to retrieve student histories and active dossier metadata.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Key Features Matrix */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-10 help-section">
              <h2 className="text-xl font-bold uppercase tracking-tight text-blue-600 mb-8">System Capabilities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Case Logic</h3>
                  <ul className="space-y-2 text-xs text-gray-500 leading-relaxed uppercase">
                    <li>• Guided Offense Classification</li>
                    <li>• Multi-level Severity Index</li>
                    <li>• Real-time Status Tracking</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Forensics</h3>
                  <ul className="space-y-2 text-xs text-gray-500 leading-relaxed uppercase">
                    <li>• Secure Evidence Vault</li>
                    <li>• Strategic Export (DOCX/Excel)</li>
                    <li>• Full Audit Provenance</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Comprehensive Documentation */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-10 help-section">
              <h2 className="text-xl font-bold uppercase tracking-tight text-blue-600 mb-10">Disciplinary Protocol Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 font-sans">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 border-b-2 border-blue-50 dark:border-blue-900/30 pb-2">Inquiry Genesis</h3>
                  <ol className="space-y-3 text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-semibold">
                    <li>1. Deploy to **"Inquiry Genesis"** via top-level navigation.</li>
                    <li>2. Query and select the **Accused Subject** from the registry.</li>
                    <li>3. Define the **Offense Classification** and chronological sequence.</li>
                    <li>4. Finalize via the **Seal Protocol** (Digital Authentication).</li>
                  </ol>
                </div>
                <div className="space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 border-b-2 border-blue-50 dark:border-blue-900/30 pb-2">Dossier Oversight</h3>
                  <ol className="space-y-3 text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-semibold">
                    <li>1. Monitor active protocols via the **Cases Ledger**.</li>
                    <li>2. Update **Dossier Status** (Under Review / Closed).</li>
                    <li>3. Attach **Forensic Evidence** to established indices.</li>
                    <li>4. Generate **Executive Reports** for committee review.</li>
                  </ol>
                </div>
                <div className="space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 border-b-2 border-blue-50 dark:border-blue-900/30 pb-2">Registry Science</h3>
                  <ol className="space-y-3 text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-semibold">
                    <li>1. Navigate to **"Student Registry"** for global search.</li>
                    <li>2. Aggregate **Compliance Trends** via AI-powered dashboards.</li>
                    <li>3. Synchronize **Operational Data** via offline-first architecture.</li>
                  </ol>
                </div>
              </div>
            </div>

          </div>

          <footer className="text-center space-y-4 bg-white dark:bg-gray-900 p-10 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Kapasa Makasa University • Security Authority
            </div>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
              CampusCare Ecosystem v3.0 • Developed by Chali Daniel & Grace Namonje
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
