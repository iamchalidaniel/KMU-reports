"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useState } from 'react';

export default function HelpPage() {
  const { user } = useAuth();
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
      setAiResponse("An error occurred while searching.");
    } finally {
      setIsLoading(false);
    }
  };

  const isStudent = user?.role === 'student';
  const isElectrician = user?.role === 'electrician';
  const isStaff = !isStudent && !isElectrician;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-24 font-sans text-sm">
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="animate-in fade-in duration-500 space-y-12">

          {/* Header */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Help Center
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Welcome to the KMU Help Center. Find guides and instructions tailored to your role.
            </p>

            <div className="max-w-2xl mx-auto relative group">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask a question about the system..."
                  className="w-full pl-6 pr-32 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all disabled:opacity-50"
                >
                  {isLoading ? "..." : "Ask AI"}
                </button>
              </form>

              {aiResponse && (
                <div className="mt-4 p-6 bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-800 rounded-xl text-left shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">✨</span>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Assistant</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {aiResponse}
                  </p>
                  <button
                    onClick={() => setAiResponse(null)}
                    className="mt-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest hover:text-blue-600 transition"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Student Help Sections */}
            {isStudent && (
              <>
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 help-section">
                  <h2 className="text-lg font-bold text-blue-600 mb-6">Reporting Incidents</h2>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">To report a disciplinary incident or problem:</p>
                    <ol className="space-y-3 list-decimal list-inside font-medium text-gray-700 dark:text-gray-300">
                      <li>Select "Report Incident" on your dashboard.</li>
                      <li>Select the type of problem and its location.</li>
                      <li>Describe the event in detail.</li>
                      <li>Submit the form for review.</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 help-section">
                  <h2 className="text-lg font-bold text-blue-600 mb-6">Repair Requests</h2>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">To request facility maintenance or repairs:</p>
                    <ol className="space-y-3 list-decimal list-inside font-medium text-gray-700 dark:text-gray-300">
                      <li>Go to the "Request Repair" section.</li>
                      <li>Select the repair category (Lighting, Socket, etc.).</li>
                      <li>Provide your room number and a description of the fault.</li>
                      <li>You can track the progress on your dashboard.</li>
                    </ol>
                  </div>
                </div>
              </>
            )}

            {/* Electrician Help Sections */}
            {isElectrician && (
              <>
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 help-section">
                  <h2 className="text-lg font-bold text-blue-600 mb-6">Managing Tasks</h2>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">How to handle assigned repair tasks:</p>
                    <ul className="space-y-3 list-disc list-inside font-medium text-gray-700 dark:text-gray-300">
                      <li>Review "Priority Tasks" on your main dashboard.</li>
                      <li>Go to "View Tasks" for the full list of assigned work.</li>
                      <li>Update the status to "In Progress" when you start.</li>
                      <li>Mark as "Completed" once the task is finished.</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 help-section">
                  <h2 className="text-lg font-bold text-blue-600 mb-6">Reports & History</h2>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">Accessing analytics and past work:</p>
                    <ul className="space-y-3 list-disc list-inside font-medium text-gray-700 dark:text-gray-300">
                      <li>Check "Reports" for task distribution by category and status.</li>
                      <li>Use the location filter to see trends in specific halls.</li>
                      <li>View "History" for a record of all previous maintenance tasks.</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {/* Staff Help Sections */}
            {isStaff && (
              <>
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 help-section">
                  <h2 className="text-lg font-bold text-blue-600 mb-6">Case Management</h2>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">Core disciplinary workflows:</p>
                    <ol className="space-y-3 list-decimal list-inside font-medium text-gray-700 dark:text-gray-300">
                      <li>Use "+ New Case" to log a new incident.</li>
                      <li>Search for students using their name or ID.</li>
                      <li>Upload relevant evidence to the case record.</li>
                      <li>Generate management reports from the Reports page.</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 help-section">
                  <h2 className="text-lg font-bold text-blue-600 mb-6">Student Registry</h2>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">Managing student records:</p>
                    <ul className="space-y-3 list-disc list-inside font-medium text-gray-700 dark:text-gray-300">
                      <li>Access the "Students" list for a global registry.</li>
                      <li>View student history to see previous incidents.</li>
                      <li>Export student data for institutional review.</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

          </div>

          <footer className="text-center space-y-2 bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Kapasa Makasa University • System Support
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
