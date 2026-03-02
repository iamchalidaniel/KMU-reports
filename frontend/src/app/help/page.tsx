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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-24 font-serif">
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="animate-in fade-in duration-500 space-y-16">

          {/* Executive Header */}
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center px-6 py-2 rounded-full bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              Operational Intelligence & Support
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">
              Knowledge <span className="text-emerald-600">Base</span>
            </h1>

            <div className="max-w-3xl mx-auto relative group">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query compliance protocols, case logic, or reporting..."
                  className="w-full pl-10 pr-32 py-6 bg-white dark:bg-gray-900 border-none rounded-[2rem] shadow-2xl shadow-emerald-500/10 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all text-sm font-sans italic"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="absolute right-3 top-3 bottom-3 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {isLoading ? "Querying..." : "Execute Search"}
                </button>
              </form>

              {aiResponse && (
                <div className="mt-6 p-8 bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-800 rounded-[2.5rem] text-left shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">✨</span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">AI Synthesis Result</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm font-sans">
                    {aiResponse}
                  </p>
                  <button
                    onClick={() => setAiResponse(null)}
                    className="mt-6 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-emerald-600 transition"
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
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-800 p-12 help-section">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic text-emerald-600 mb-8">Operational Onboarding</h2>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Core Workflow</h3>
                  <ul className="space-y-4 text-gray-600 dark:text-gray-400 font-sans text-sm">
                    <li className="flex gap-4">
                      <span className="text-emerald-500 font-black italic">01.</span>
                      <span>Navigate via the **Command Sidebar** to access specialized modules.</span>
                    </li>
                    <li className="flex gap-4">
                      <span className="text-emerald-500 font-black italic">02.</span>
                      <span>Initiate cases via the **"+ New Case"** directive in the Executive Command Bar.</span>
                    </li>
                    <li className="flex gap-4">
                      <span className="text-emerald-500 font-black italic">03.</span>
                      <span>Utilize **Smart Search** to retrieve student histories and active dossier metadata.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Key Features Matrix */}
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-800 p-12 help-section">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic text-orange-600 mb-8">System Capabilities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-600">Case Logic</h3>
                  <ul className="space-y-2 text-xs text-gray-500 leading-relaxed">
                    <li>• Guided Offense Classification</li>
                    <li>• Multi-level Severity Index</li>
                    <li>• Real-time Status Tracking</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-600">Forensics</h3>
                  <ul className="space-y-2 text-xs text-gray-500 leading-relaxed">
                    <li>• Secure Evidence Vault</li>
                    <li>• Strategic Export (DOCX/Excel)</li>
                    <li>• Full Audit Provenance</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Comprehensive Documentation */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-800 p-12 help-section">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic text-red-600 mb-12">Disciplinary Protocol Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 font-sans">
                <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-red-600 border-b-2 border-red-50 pb-2">Inquiry Genesis</h3>
                  <ol className="space-y-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    <li>1. Deploy to **"Inquiry Genesis"** via top-level navigation.</li>
                    <li>2. Query and select the **Accused Subject** from the registry.</li>
                    <li>3. Define the **Offense Classification** and chronological sequence.</li>
                    <li>4. Finalize via the **Seal Protocol** (Digital Authentication).</li>
                  </ol>
                </div>
                <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-red-600 border-b-2 border-red-50 pb-2">Dossier Oversight</h3>
                  <ol className="space-y-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    <li>1. Monitor active protocols via the **Cases Ledger**.</li>
                    <li>2. Update **Dossier Status** (Under Review / Closed).</li>
                    <li>3. Attach **Forensic Evidence** to established indices.</li>
                    <li>4. Generate **Executive Reports** for committee review.</li>
                  </ol>
                </div>
                <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-red-600 border-b-2 border-red-50 pb-2">Registry Science</h3>
                  <ol className="space-y-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    <li>1. Navigate to **"Student Registry"** for global search.</li>
                    <li>2. Aggregate **Compliance Trends** via AI-powered dashboards.</li>
                    <li>3. Synchronize **Operational Data** via offline-first architecture.</li>
                  </ol>
                </div>
              </div>
            </div>

          </div>

          <footer className="text-center space-y-4 bg-gray-100/50 dark:bg-gray-900 p-12 rounded-[3rem] border border-gray-200 dark:border-gray-800">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">
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
