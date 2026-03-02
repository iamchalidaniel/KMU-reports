"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import ProtectedRoute from "../../(protected)/ProtectedRoute";
import CaseDossierForm, { FormData } from "../../../components/CaseDossierForm";

function NewCaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialData, setInitialData] = useState<Partial<FormData> | undefined>(undefined);

  useEffect(() => {
    const studentId = searchParams.get('studentId');

    if (studentId) {
      setInitialData({
        dossier: {
          occurrenceDocket: {
            accused: {
              sin: studentId,
              phone: '',
              name: '', address: '', yearOfStudy: '', programOfStudy: '',
              sex: '', age: '', nationality: '', tribe: '', village: '', chief: '', district: ''
            }
          }
        } as any
      });
    }
  }, [searchParams]);

  const handleSuccess = () => {
    router.push('/cases');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">
          {/* New Case Header */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Inquiry Genesis</h1>
              <p className="text-sm text-gray-500 font-semibold mt-1">KMU Disciplinary Intake / Protocol Initialization</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="bg-gray-100 dark:bg-gray-800 text-gray-600 font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-200 transition"
              >
                Discard Protocol
              </button>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            <CaseDossierForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              initialData={initialData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewCasePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="text-center py-12 text-kmuGreen uppercase tracking-[0.5em] font-black text-sm animate-pulse italic">Initializing Case Dossier Matrix...</div>
        </div>
      }>
        <NewCaseContent />
      </Suspense>
    </ProtectedRoute>
  );
}