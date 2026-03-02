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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-24 font-sans">
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="animate-in fade-in duration-500 space-y-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white uppercase">Identity Matrix</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Authorized Personnel Management & System Credentials
              </p>
            </div>
            <div className="flex bg-gray-50 dark:bg-gray-800/50 px-5 py-3 rounded-lg gap-6 border border-gray-100 dark:border-gray-800">
              <div className="text-center">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Session Protocol</p>
                <p className="text-xs font-bold text-emerald-600 uppercase">Active</p>
              </div>
              <div className="text-center border-l border-gray-200 dark:border-gray-700 pl-6">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Authorization</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">{safeProfile.role?.replace('_', ' ') || 'Subject'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Biography Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 overflow-hidden relative group">
              <h2 className="text-lg font-bold uppercase tracking-tight text-emerald-600 mb-8">Personnel Particulars</h2>

              {editMode ? (
                <form onSubmit={handleSave} className="space-y-6 relative z-10">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Registry Username</label>
                    <input type="text" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none transition" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Legal Full Name</label>
                    <input type="text" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none transition" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  {error && <div className="text-red-600 text-[10px] font-bold uppercase tracking-widest">{error}</div>}
                  {success && <div className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest">{success}</div>}
                  <div className="flex gap-3">
                    <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-[10px] rounded-lg hover:bg-emerald-700 transition-all uppercase tracking-widest shadow-sm">Update Identity</button>
                    <button type="button" onClick={() => setEditMode(false)} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold text-[10px] rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all uppercase tracking-widest">Abort</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8 relative z-10">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Registry Handle</h4>
                      <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">{safeProfile.username || 'Unset'}</p>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Designated Name</h4>
                      <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">{safeProfile.name || 'Unset'}</p>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Operational Role</h4>
                      <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">{safeProfile.role || 'Unset'}</p>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Registry Datetime</h4>
                      <p className="text-sm font-bold text-gray-500 uppercase">{safeProfile.createdAt ? new Date(safeProfile.createdAt).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditMode(true)} className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-[10px] rounded-lg hover:opacity-90 transition-all uppercase tracking-widest shadow-sm">Modify Identity metadata</button>
                </div>
              )}
            </div>

            {/* Security Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 overflow-hidden relative">
              <h2 className="text-lg font-bold uppercase tracking-tight text-red-600 mb-8">Protocol Integrity</h2>

              <form onSubmit={handlePasswordChange} className="space-y-6 relative z-10">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Current Authentication Proof</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none transition" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">New Protocol Sequence</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none transition" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>
                {passwordSuccess && <div className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest">{passwordSuccess}</div>}
                {passwordError && <div className="text-red-600 text-[10px] font-bold uppercase tracking-widest">{passwordError}</div>}
                <button type="submit" className="px-8 py-3 bg-red-600 text-white font-bold text-[10px] rounded-lg hover:bg-red-700 transition-all uppercase tracking-widest shadow-sm">🔒 Update Credentials</button>
              </form>

              <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Security Advisory</h4>
                <ul className="text-[10px] text-gray-500 space-y-2 font-bold uppercase tracking-tight">
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-red-500 rounded-full"></span> Rotate credentials every 90 cycles.</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-red-500 rounded-full"></span> Avoid obvious legacy sequences.</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-red-500 rounded-full"></span> Access attempts are formally logged.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}