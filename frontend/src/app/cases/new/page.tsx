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
              phone: studentId,
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
    <div className="py-8">
      <CaseDossierForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        initialData={initialData}
      />
    </div>
  );
}

export default function NewCasePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="text-center py-12 text-kmuGreen uppercase tracking-widest font-bold">Initializing Case Dossier...</div>}>
        <NewCaseContent />
      </Suspense>
    </ProtectedRoute>
  );
}