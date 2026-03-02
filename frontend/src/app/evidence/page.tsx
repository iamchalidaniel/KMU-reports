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
        showNotification('success', 'File uploaded successfully');
        setFile(null);
        setCaseId('');
        fetchData();
      }
    } catch (err) {
      showNotification('error', 'Failed to upload file');
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
      showNotification('error', 'Failed to download file');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this evidence file? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/evidence/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        showNotification('success', 'File deleted successfully');
        fetchData();
      }
    } catch (err) {
      showNotification('error', 'Failed to delete file');
    }
  }

  if (isCheckingAuth) {
    return <div className="text-center p-12 text-kmuGreen font-sans">Loading evidence...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-in fade-in duration-300 space-y-6">

          {/* Evidence Header */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Evidence Management</h1>
              <p className="text-sm text-gray-500 font-semibold mt-1">
                Manage case evidence and uploaded files {offlineMode && <span className="text-orange-500 font-bold ml-2">• OFFLINE MODE</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 border border-blue-200">
                🔒 {evidence.length} Files
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Terminal */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              <h2 className="text-lg font-bold uppercase tracking-tight text-blue-600 mb-6">Upload Evidence</h2>
              <form onSubmit={handleUpload} className="space-y-5 font-sans">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Link to Case</label>
                  <select
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    value={caseId}
                    onChange={e => setCaseId(e.target.value)}
                    required
                  >
                    <option value="">Select Case...</option>
                    {cases.map(c => <option key={c._id} value={c._id}>{c.description || 'Unlabeled Case'}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Select File</label>
                  <input
                    type="file"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all text-xs uppercase tracking-widest"
                >
                  {uploading ? 'Uploading...' : 'Upload Evidence'}
                </button>
              </form>
            </div>

            {/* Asset Ledger Grid */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-2 mb-2 italic">Evidence List</h2>
              {loading ? (
                <div className="text-center py-20 text-blue-600 font-bold text-xs uppercase animate-pulse tracking-widest">Loading...</div>
              ) : evidence.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl p-20 text-center border border-gray-100 dark:border-gray-800 italic text-gray-400 text-sm">No evidence files found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evidence.map((item) => {
                    const id = item._id || item.id || '';
                    const filename = item.fileName || item.filename || 'Unknown Metadata';
                    const fileUrl = `${API_BASE_URL}/evidence/${id}/download`;
                    const ext = filename.split('.').pop()?.toLowerCase();
                    const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');

                    return (
                      <div key={id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md transition-all group overflow-hidden">
                        <div className="h-40 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4 overflow-hidden border border-gray-100 dark:border-gray-800 flex items-center justify-center relative">
                          {isImg ? (
                            <img src={fileUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={filename} />
                          ) : (
                            <span className="text-4xl text-gray-400">📎</span>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                            <button onClick={() => handleDownload(id, filename)} className="bg-white text-black font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-gray-50 transition">Download</button>
                            <button onClick={() => handleDelete(id)} className="bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-red-700 transition">Purge</button>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white uppercase text-xs truncate tracking-tight" title={filename}>{filename}</h3>
                          <p className="text-[10px] text-gray-400 font-semibold mt-1 uppercase tracking-tight">Case Description</p>
                          <div className="mt-3 flex flex-col gap-1">
                            <div className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">File ID</div>
                            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate uppercase">{id}</div>
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