"use client";
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../config/constants';
import { authHeaders } from '../../utils/api';
import { useOfflineApi } from '../../hooks/useOfflineSync';
import Notification, { useNotification } from '../../components/Notification';
import Link from 'next/link';

interface Evidence {
  _id?: string;
  id?: string;
  fileName?: string;
  filename?: string;
  case?: { _id: string; description: string } | string;
  uploadedBy?: { _id: string; name: string } | string;
  uploadedAt?: string;
}

interface Case {
  _id: string;
  description: string;
}

export default function EvidencePage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [caseId, setCaseId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const { apiCall } = useOfflineApi();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!authLoading && !token) {
        router.replace('/login');
        setIsCheckingAuth(false);
        return;
      }
      if (authLoading) {
        setIsCheckingAuth(true);
        return;
      }
      setIsCheckingAuth(false);
    }
  }, [authLoading, token, router]);

  async function fetchData() {
    setLoading(true);
    try {
      const evRes = await apiCall<any>('get', '/evidence');
      setEvidence(Array.isArray(evRes.data) ? evRes.data : (evRes.data.evidence || []));
      setOfflineMode(evRes.offline);

      const casesRes = await apiCall<any>('get', '/cases');
      setCases(Array.isArray(casesRes.data) ? casesRes.data : (casesRes.data.cases || []));
    } catch (err: any) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'security_officer' || user.role === 'chief_security_officer')) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !caseId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caseId', caseId);
      const res = await fetch(`${API_BASE_URL}/evidence`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (res.ok) {
        showNotification('success', 'Forensic metadata synchronized');
        setFile(null);
        setCaseId('');
        fetchData();
      }
    } catch (err) {
      showNotification('error', 'Upload integrity failure');
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(id: string, filename: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/evidence/${id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
      }
    } catch (err) {
      showNotification('error', 'Retrieval failed');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Purge forensic evidence? This is irreversible.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/evidence/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        showNotification('success', 'Evidence purged');
        fetchData();
      }
    } catch (err) {
      showNotification('error', 'Purge failed');
    }
  }

  if (isCheckingAuth) {
    return <div className="text-center p-12 text-kmuGreen font-serif">Initializing Forensic Vault...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-serif">
      <div className="max-w-7xl mx-auto py-6">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Executive Command Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-8 rounded-[2rem] border-t-4 border-blue-600 shadow-xl gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">Forensic Vault</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">
                KMU Unified Evidence Repository & Metadata Archive {offlineMode && <span className="text-orange-500 font-black ml-2">• OFFLINE PROTOCOL</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                🔒 {evidence.length} Secured Assets
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Terminal */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-gray-800 p-10">
              <h2 className="text-xl font-black uppercase tracking-tighter italic text-blue-600 mb-8">Asset Ingress</h2>
              <form onSubmit={handleUpload} className="space-y-6 font-sans">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Case Dossier Association</label>
                  <select
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 transition-all shadow-inner outline-none"
                    value={caseId}
                    onChange={e => setCaseId(e.target.value)}
                    required
                  >
                    <option value="">Select Target...</option>
                    {cases.map(c => <option key={c._id} value={c._id}>{c.description || 'Unlabeled Case'}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">File Payload</label>
                  <input
                    type="file"
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] hover:shadow-xl hover:shadow-blue-500/30 transition-all text-[10px] uppercase tracking-widest"
                >
                  {uploading ? 'Archiving Payload...' : 'Authorize Vault Entry'}
                </button>
              </form>
            </div>

            {/* Asset Ledger Grid */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 ml-6 mb-4 font-bold italic">Secured Asset Ledger</h2>
              {loading ? (
                <div className="text-center py-20 text-blue-600 font-black text-xs uppercase animate-pulse tracking-widest">Scanning Repository...</div>
              ) : evidence.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-20 text-center border border-gray-100 dark:border-gray-800 italic text-gray-400 text-sm">Vault contains zero forensic entities.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evidence.map((item) => {
                    const id = item._id || item.id || '';
                    const filename = item.fileName || item.filename || 'Unknown Metadata';
                    const fileUrl = `${API_BASE_URL}/evidence/${id}/download`;
                    const ext = filename.split('.').pop()?.toLowerCase();
                    const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');

                    return (
                      <div key={id} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-6 hover:shadow-xl transition-all group overflow-hidden">
                        <div className="h-40 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-4 overflow-hidden border border-gray-100 dark:border-gray-800 flex items-center justify-center relative">
                          {isImg ? (
                            <img src={fileUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={filename} />
                          ) : (
                            <span className="text-4xl">📎</span>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                            <button onClick={() => handleDownload(id, filename)} className="bg-white text-black font-black px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest hover:bg-gray-100 transition">Download</button>
                            <button onClick={() => handleDelete(id)} className="bg-red-600 text-white font-black px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest hover:bg-red-700 transition">Purge</button>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-extrabold text-gray-900 dark:text-white uppercase text-xs truncate italic tracking-tighter" title={filename}>{filename}</h3>
                          <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase tracking-tight">Case Dossier Index</p>
                          <div className="mt-4 flex flex-col gap-1">
                            <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Metadata Hash</div>
                            <div className="text-[10px] font-bold text-gray-600 dark:text-gray-400 truncate">{id}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {notification?.isVisible && <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />}
    </div>
  );
}