"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, OFFENSE_TYPES, SEVERITY_LEVELS } from '../../config/constants';
import { authHeaders, getProfile } from '../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SmartStudentSearch from '../../components/SmartStudentSearch';
import SmartStaffSearch from '../../components/SmartStaffSearch';
import Notification, { useNotification } from '../../components/Notification';

interface Student {
  studentId: string;
  fullName: string;
  department: string;
  year?: string;
  gender?: string;
}

interface Staff {
  staffId: string;
  fullName: string;
  department: string;
  position?: string;
}

export default function SecurityDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('add-case');
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Form state
  const [caseType, setCaseType] = useState<'student' | 'staff'>('student');
  const [studentId, setStudentId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [incidentDate, setIncidentDate] = useState('');
  const [offenseType, setOffenseType] = useState('');
  const [severity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [sanctions, setSanctions] = useState('');
  const [loading, setLoading] = useState(false);

  // List state
  const [search, setSearch] = useState('');
  const [cases, setCases] = useState<any[]>([]);
  const [filteredCases, setFilteredCases] = useState<any[]>([]);

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
      if (!user || user.role !== 'security_officer') {
        setIsCheckingAuth(false);
        return;
      }
      setIsCheckingAuth(false);
    }
  }, [authLoading, token, user, router]);

  useEffect(() => {
    async function fetchStaffProfile() {
      try {
        setProfileLoading(true);
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setProfileLoading(false);
      }
    }

    async function fetchCases() {
      try {
        const res = await fetch(`${API_BASE_URL}/cases`, { headers: { ...authHeaders() } });
        if (res.ok) {
          const data = await res.json();
          setCases(Array.isArray(data) ? data : (data.cases || data || []));
        }
      } catch (err: any) {
        console.error('Fetch cases error:', err);
      }
    }

    if (token) {
      fetchStaffProfile();
      fetchCases();
    }
  }, [token]);

  useEffect(() => {
    const safeCases = Array.isArray(cases) ? cases : [];
    setFilteredCases(
      search ? safeCases.filter((c: any) =>
      (c.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.student?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
        c.staff?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.staff?.staffId?.toLowerCase().includes(search.toLowerCase()) ||
        c.offenseType?.toLowerCase().includes(search.toLowerCase()) ||
        c.status?.toLowerCase().includes(search.toLowerCase()))
      ) : safeCases
    );
  }, [search, cases]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const requestBody: any = {
        incident_date: incidentDate,
        offense_type: offenseType,
        severity,
        description,
        sanctions
      };

      if (caseType === 'student') {
        if (!studentId) throw new Error('Please select a student');
        requestBody.student_id = studentId;
      } else {
        if (!staffId) throw new Error('Please select a staff member');
        requestBody.staff_id = staffId;
      }

      const res = await fetch(`${API_BASE_URL}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) throw new Error(await res.text());

      showNotification('success', 'Case submitted successfully!');
      // Reset form
      setStudentId('');
      setStaffId('');
      setIncidentDate('');
      setOffenseType('');
      setSeverity('');
      setDescription('');
      setSanctions('');
      setSelectedStudent(null);
      setSelectedStaff(null);

      // Refresh list
      const casesRes = await fetch(`${API_BASE_URL}/cases`, { headers: { ...authHeaders() } });
      if (casesRes.ok) {
        const data = await casesRes.json();
        setCases(Array.isArray(data) ? data : (data.cases || data || []));
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to submit case');
    } finally {
      setLoading(false);
    }
  }

  if (isCheckingAuth) {
    return <div className="text-center text-kmuGreen p-12">Loading...</div>;
  }

  if (!user || user.role !== 'security_officer') {
    return <div className="text-red-600 p-12">Access denied.</div>;
  }

  const staffData = profile || user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

        {/* Banner */}
        <div className="relative mb-6 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="h-32 bg-gradient-to-r from-gray-700 to-black relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')]"></div>
          </div>
          <div className="px-6 pb-6 flex flex-col md:flex-row items-center md:items-end -mt-12 gap-6 relative z-10">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden">
              <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-4xl shadow-inner">
                {staffData.name ? staffData.name.charAt(0).toUpperCase() : staffData.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left mb-2">
              <h1 className="text-2xl font-bold uppercase">{staffData.name || 'Security Officer'}</h1>
              <p className="text-gray-600 dark:text-gray-400 font-semibold tracking-tight">Post : <span className="text-gray-800 dark:text-gray-200 font-mono">CAMPUS SECURITY</span></p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Side Nav */}
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden sticky top-24">
              <nav className="flex flex-col">
                <NavButton label="Record Case" icon="✍️" active={activeTab === 'add-case'} onClick={() => setActiveTab('add-case')} />
                <NavButton label="Case History" icon="📜" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                <NavButton label="Staff Info" icon="👤" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
                <NavButton label="Settings" icon="⚙️" active={activeTab === 'password'} onClick={() => setActiveTab('password')} />
              </nav>
            </div>
          </div>

          {/* Main Area */}
          <div className="lg:w-3/4 space-y-6">

            {activeTab === 'add-case' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold mb-8 uppercase tracking-tighter">Register Disciplinary Case</h2>

                <div className="mb-8 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl inline-flex gap-2">
                  <button
                    onClick={() => setCaseType('student')}
                    className={`px-6 py-2 rounded-lg font-bold text-xs transition ${caseType === 'student' ? 'bg-white dark:bg-gray-900 shadow text-blue-600' : 'text-gray-400'}`}
                  >STUDENT</button>
                  <button
                    onClick={() => setCaseType('staff')}
                    className={`px-6 py-2 rounded-lg font-bold text-xs transition ${caseType === 'staff' ? 'bg-white dark:bg-gray-900 shadow text-blue-600' : 'text-gray-400'}`}
                  >STAFF MEMBER</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">Search Subject</label>
                    {caseType === 'student' ? (
                      <SmartStudentSearch
                        onStudentSelect={(s) => { setSelectedStudent(s); setStudentId(s.studentId); }}
                        placeholder="Search student by name or ID..."
                      />
                    ) : (
                      <SmartStaffSearch
                        onStaffSelect={(s) => { setSelectedStaff(s); setStaffId(s.staffId); }}
                        placeholder="Search staff by name or ID..."
                      />
                    )}
                    {(selectedStudent || selectedStaff) && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl animate-in zoom-in duration-200">
                        <div className="font-bold text-blue-700 dark:text-blue-300">{(selectedStudent || selectedStaff)?.fullName}</div>
                        <div className="text-[10px] uppercase text-blue-500 font-bold">{(selectedStudent || selectedStaff)?.studentId || (selectedStaff as any)?.staffId} • {(selectedStudent || selectedStaff)?.department}</div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">Incident Date</label>
                      <input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} required className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">Offense Type</label>
                      <select value={offenseType} onChange={(e) => setOffenseType(e.target.value)} required className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3">
                        <option value="">Select Category...</option>
                        {OFFENSE_TYPES.map(ot => <option key={ot.value} value={ot.value}>{ot.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">Severity Level</label>
                      <select value={severity} onChange={(e) => setSeverity(e.target.value)} required className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3">
                        <option value="">Select Severity...</option>
                        {SEVERITY_LEVELS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">Incident Description</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detail the circumstances of the incident..."
                      required
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase text-gray-400 ml-1">Immediate Actions / Sanctions</label>
                    <input
                      type="text"
                      value={sanctions}
                      onChange={(e) => setSanctions(e.target.value)}
                      placeholder="e.g. Warning issued, Confiscation..."
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-4 rounded-xl hover:shadow-xl transition disabled:opacity-50 uppercase tracking-widest text-xs"
                  >
                    {loading ? 'Submitting...' : 'Register Formal Case'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold">Recent Incident Registry</h2>
                  <input
                    placeholder="Filter records..."
                    className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 font-bold uppercase text-gray-400">
                      <tr>
                        <th className="px-4 py-4 text-left">Subject</th>
                        <th className="px-4 py-4 text-left">Incident</th>
                        <th className="px-4 py-4 text-center">Date</th>
                        <th className="px-4 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredCases.slice(0, 15).map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer" onClick={() => router.push(`/cases/${c._id}`)}>
                          <td className="px-4 py-4">
                            <div className="font-bold">{c.student ? c.student.fullName : c.staff?.fullName}</div>
                            <div className="text-[10px] text-gray-400">{c.student ? c.student.studentId : c.staff?.staffId}</div>
                          </td>
                          <td className="px-4 py-4">{c.offenseType}</td>
                          <td className="px-4 py-4 text-center font-mono text-gray-500">{new Date(c.incidentDate).toLocaleDateString()}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold ${c.status === 'Open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{c.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'info' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8 animate-in fade-in duration-300">
                <div className="space-y-10">
                  <section>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Account Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <InfoField label="Staff ID" value={staffData.staffId || staffData.username} />
                      <InfoField label="Role" value={staffData.role?.toUpperCase().replace('_', ' ')} />
                      <InfoField label="Status" value="ACTIVE" />
                    </div>
                  </section>
                  <section>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Personal Info</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <InfoField label="First Name" value={staffData.firstName} />
                      <InfoField label="Sur Name" value={staffData.surName} />
                      <InfoField label="NRC" value={staffData.nrc} />
                      <InfoField label="Gender" value={staffData.gender} />
                      <InfoField label="Nationality" value={staffData.nationality} />
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center max-w-md mx-auto animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold mb-8 uppercase tracking-tighter">Security Settings</h2>
                <p className="text-sm text-gray-500 mb-8">Change your dashboard access password.</p>
                <button onClick={() => showNotification('info', 'Feature coming soon')} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:shadow-lg transition">INITIATE RESET</button>
              </div>
            )}

          </div>
        </div>
      </div>

      {notification?.isVisible && (
        <Notification type={notification.type} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />
      )}
    </div>
  );
}

function NavButton({ label, icon, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 transition-all border-l-4 text-left ${active
        ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white'
        : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function InfoField({ label, value }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-tighter ml-1">{label}</label>
      <div className="bg-gray-100 dark:bg-gray-800/80 rounded border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 min-h-[38px]">
        {value || '-'}
      </div>
    </div>
  );
}