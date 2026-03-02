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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-serif">
      <div className="max-w-7xl mx-auto py-6">
        <div className="animate-in fade-in duration-300 space-y-6 px-4 sm:px-0">
          {/* Executive Command Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-8 rounded-[2rem] border-t-4 border-red-600 shadow-xl gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">Inquiry Genesis</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">
                KMU Disciplinary Intake / Protocol Initialization
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCancel} className="bg-gray-100 dark:bg-gray-800 text-gray-500 font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-2xl hover:bg-gray-200 transition">Discard Protocol</button>
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