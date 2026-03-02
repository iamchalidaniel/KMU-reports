"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getProfile, updateProfile } from '../../utils/api';
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const { token, changePassword } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ username: '', name: '' });
  const [success, setSuccess] = useState<string | null>(null);

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const data = await getProfile();
        setProfile(data);
        setForm({ username: data.username || '', name: data.name || '' });
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await updateProfile(form);
      setSuccess('Profile synchronized successfully');
      setEditMode(false);
      const data = await getProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Synchronization failure');
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const success = await changePassword(oldPassword, newPassword);
      if (success) {
        setPasswordSuccess('Security credentials updated');
        setOldPassword('');
        setNewPassword('');
      } else {
        setPasswordError('Credential update failed');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Credential update failed');
    }
  }

  const safeProfile = profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : {};

  if (loading) return <div className="text-center py-20 text-kmuGreen font-black uppercase tracking-[0.5em] animate-pulse">Scanning Identity...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-24 font-serif">
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="animate-in fade-in duration-500 space-y-12">

          {/* Executive Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-10 rounded-[3rem] border-t-4 border-emerald-600 shadow-xl gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">Identity Matrix</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">
                Authorized Personnel Management & System Credentials
              </p>
            </div>
            <div className="flex bg-gray-50 dark:bg-black/20 px-6 py-4 rounded-2xl gap-8 border border-gray-100 dark:border-gray-800">
              <div className="text-center">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Session Protocol</p>
                <p className="text-xs font-black text-emerald-600 uppercase italic">Active</p>
              </div>
              <div className="text-center border-l border-gray-200 dark:border-gray-700 pl-8">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Authorization</p>
                <p className="text-xs font-black text-gray-900 dark:text-white uppercase italic">{safeProfile.role?.replace('_', ' ') || 'Subject'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Biography Section */}
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-800 p-12 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 text-gray-50/50 dark:text-gray-800/20 text-7xl font-black uppercase italic -rotate-12 pointer-events-none">BIO</div>
              <h2 className="text-2xl font-black uppercase tracking-tighter italic text-emerald-600 mb-10">Personnel Particulars</h2>

              {editMode ? (
                <form onSubmit={handleSave} className="space-y-8 font-sans relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Registry Username</label>
                    <input type="text" className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 shadow-inner outline-none" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Legal Full Name</label>
                    <input type="text" className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 shadow-inner outline-none" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  {error && <div className="text-red-600 text-[10px] font-black uppercase tracking-widest">{error}</div>}
                  {success && <div className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">{success}</div>}
                  <div className="flex gap-4">
                    <button type="submit" className="px-8 py-4 bg-emerald-600 text-white font-black text-[10px] rounded-xl hover:shadow-lg transition-all uppercase tracking-widest">Update Identity</button>
                    <button type="button" onClick={() => setEditMode(false)} className="px-8 py-4 bg-gray-100 text-gray-500 font-black text-[10px] rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest">Abort</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-10 relative z-10">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Registry Handle</h4>
                      <p className="text-sm font-black text-gray-900 dark:text-white uppercase italic">{safeProfile.username || 'Unset'}</p>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Designated Name</h4>
                      <p className="text-sm font-black text-gray-900 dark:text-white uppercase italic">{safeProfile.name || 'Unset'}</p>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Operational Role</h4>
                      <p className="text-sm font-black text-emerald-600 uppercase italic tracking-widest">{safeProfile.role || 'Unset'}</p>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Registry Datetime</h4>
                      <p className="text-sm font-black text-gray-500 uppercase italic">{safeProfile.createdAt ? new Date(safeProfile.createdAt).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditMode(true)} className="px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-[10px] rounded-[1.5rem] hover:shadow-xl transition-all uppercase tracking-[0.2em] transform hover:-translate-y-1">Modify Identity metadata</button>
                </div>
              )}
            </div>

            {/* Security Section */}
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-800 p-12 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 text-red-50/50 dark:text-red-900/10 text-7xl font-black uppercase italic -rotate-12 pointer-events-none">SEC</div>
              <h2 className="text-2xl font-black uppercase tracking-tighter italic text-red-600 mb-10">Protocol Integrity</h2>

              <form onSubmit={handlePasswordChange} className="space-y-8 font-sans relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Current Authentication Proof</label>
                  <input type="password" className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-bold focus:ring-2 focus:ring-red-500 shadow-inner outline-none" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">New Protocol Sequence</label>
                  <input type="password" className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-xs font-bold focus:ring-2 focus:ring-red-500 shadow-inner outline-none" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>
                {passwordSuccess && <div className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">{passwordSuccess}</div>}
                {passwordError && <div className="text-red-600 text-[10px] font-black uppercase tracking-widest">{passwordError}</div>}
                <button type="submit" className="px-12 py-5 bg-red-600 text-white font-black text-[10px] rounded-[1.5rem] hover:shadow-xl shadow-red-500/20 transition-all uppercase tracking-[0.2em]">🔒 Rotational Credential Update</button>
              </form>

              <div className="mt-10 p-8 bg-gray-50 dark:bg-black/20 rounded-[2rem] border border-gray-100 dark:border-gray-800 italic opacity-80">
                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Security Advisory</h4>
                <ul className="text-[10px] text-gray-500 space-y-2 font-bold leading-relaxed uppercase tracking-tight">
                  <li>• Rotate credentials every 90 operational cycles.</li>
                  <li>• Avoid legacy character patterns or obvious sequences.</li>
                  <li>• Unauthorized access attempts are formally logged.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}