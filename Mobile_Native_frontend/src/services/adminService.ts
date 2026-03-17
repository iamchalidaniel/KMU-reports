import { Platform } from 'react-native';
import apiClient from './apiClient';
import { ENDPOINTS, API_BASE_URL } from '../constants/api';
import * as SecureStore from 'expo-secure-store';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface AdminUser {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  created_at?: string;
}

export interface AdminCase {
  _id: string;
  student_id?: string;
  student?: { fullName?: string; studentId?: string; program?: string };
  offense_type?: string;
  offenseType?: string;
  severity?: string;
  status?: string;
  sanctions?: string;
  incident_date?: string;
  incidentDate?: string;
  appeal_status?: string;
  description?: string;
  created_at?: string;
}

export interface AdminStudentReport {
  _id: string;
  student_id?: string | { _id: string; fullName: string; email: string; studentId: string };
  student_name?: string;
  offense_type?: string;
  severity?: string;
  status?: string;
  description?: string;
  is_anonymous?: boolean;
  created_at?: string;
}

export interface AdminStudent {
  _id: string;
  fullName?: string;
  studentId?: string;
  email?: string;
  program?: string;
  year?: number;
  hall?: string;
}

export interface MaintenanceReport {
  _id: string;
  category?: string;
  status?: string;
  priority?: string;
  description?: string;
  location?: { hall?: string; room?: string };
  reported_by?: { name?: string };
  created_at?: string;
}

export interface CaseDossierPayload {
  case_number: string;
  case_type: string;
  ob_number: string;
  incident_date: string;
  description: string;
  offense_type: string;
  student_id: string; // SIN or Phone
  dossier: {
    occurrenceDocket: any;
    statements: any[];
    warnAndCaution: any;
    signatures: {
      investigatingOfficer?: string | null;
      complainant?: string | null;
    };
  };
}

export interface AuditLog {
  _id: string;
  action?: string;
  user?: string;
  details?: string;
  timestamp?: string;
  created_at?: string;
}

// ─── Data Fetches ──────────────────────────────────────────────────────────────
export async function listAllCases(params?: { status?: string; page?: number }): Promise<{ cases: AdminCase[]; total: number }> {
  const res = await apiClient.get(ENDPOINTS.cases, { params });
  const data = res.data;
  const cases = Array.isArray(data) ? data : (data.cases ?? []);
  return { cases, total: data.total ?? cases.length };
}

export async function updateCase(id: string, update: { status?: string; sanctions?: string; admin_comments?: string }): Promise<AdminCase> {
  const res = await apiClient.put<AdminCase>(ENDPOINTS.caseById(id), update);
  return res.data;
}

export async function createCase(payload: CaseDossierPayload): Promise<AdminCase> {
  const res = await apiClient.post<AdminCase>(ENDPOINTS.cases, payload);
  return res.data;
}

export async function uploadCaseEvidence(fileUri: string, caseId: string): Promise<string> {
  try {
    const token = await SecureStore.getItemAsync('kmu_token');
    
    // Create form data
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || `st_${Date.now()}.m4a`;
    const mimeType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4';

    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: mimeType
    } as any);
    
    formData.append('caseId', caseId);

    // Using fetch directly because Axios FormData handling with React Native files can sometimes be tricky
    const uploadUrl = API_BASE_URL.replace('/api', '') + '/evidence'; // Or correct path defined by your backend
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Upload failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    return data.filename;
  } catch (error) {
    console.error('Evidence upload error:', error);
    throw error;
  }
}

export async function deleteCase(id: string): Promise<void> {
  await apiClient.delete(ENDPOINTS.caseById(id));
}

export async function listAllStudentReports(params?: { status?: string }): Promise<{ reports: AdminStudentReport[]; total: number }> {
  const res = await apiClient.get(ENDPOINTS.studentReports, { params });
  const data = res.data;
  return { reports: data.reports ?? [], total: data.total ?? 0 };
}

export async function updateStudentReport(id: string, update: { status?: string; admin_comments?: string }): Promise<AdminStudentReport> {
  const res = await apiClient.put<AdminStudentReport>(ENDPOINTS.studentReportById(id), update);
  return res.data;
}

export async function listAllStudents(): Promise<AdminStudent[]> {
  const res = await apiClient.get(ENDPOINTS.students);
  const data = res.data;
  return Array.isArray(data) ? data : (data.students ?? []);
}

export async function listAllUsers(): Promise<AdminUser[]> {
  const res = await apiClient.get('/users');
  const data = res.data;
  return Array.isArray(data) ? data : (data.users ?? []);
}

export async function listMaintenanceAdmin(): Promise<MaintenanceReport[]> {
  const res = await apiClient.get(ENDPOINTS.maintenance);
  const data = res.data;
  return Array.isArray(data) ? data : (data.reports ?? []);
}

export async function listAuditLogs(): Promise<AuditLog[]> {
  const res = await apiClient.get('/audit');
  const data = res.data;
  return Array.isArray(data) ? data : (data.logs ?? []);
}

// ─── Summary stats (used in dashboard) ─────────────────────────────────────────
export interface AdminStats {
  studentsCount: number;
  casesCount: number;
  usersCount: number;
  maintenanceCount: number;
  pendingReportsCount: number;
  openCasesCount: number;
  topOffenses: Array<{ label: string; count: number }>;
  topMaintenance: Array<{ label: string; count: number }>;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const [casesRes, studentsRes, maintenanceRes, usersRes, pendingReportsRes] = await Promise.allSettled([
    listAllCases(),
    listAllStudents(),
    listMaintenanceAdmin(),
    listAllUsers(),
    listAllStudentReports({ status: 'Pending' }),
  ]);

  const cases = casesRes.status === 'fulfilled' ? casesRes.value.cases : [];
  const students = studentsRes.status === 'fulfilled' ? studentsRes.value : [];
  const maintenance = maintenanceRes.status === 'fulfilled' ? maintenanceRes.value : [];
  const users = usersRes.status === 'fulfilled' ? usersRes.value : [];
  const pendingReports = pendingReportsRes.status === 'fulfilled' ? pendingReportsRes.value : { reports: [], total: 0 };

  // Top offense types
  const offenseCounts: Record<string, number> = {};
  cases.forEach(c => {
    const key = c.offense_type || c.offenseType || 'Unknown';
    offenseCounts[key] = (offenseCounts[key] || 0) + 1;
  });
  const topOffenses = Object.entries(offenseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  // Top maintenance categories
  const maintCounts: Record<string, number> = {};
  maintenance.forEach(m => {
    const key = m.category || 'other';
    maintCounts[key] = (maintCounts[key] || 0) + 1;
  });
  const topMaintenance = Object.entries(maintCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  return {
    studentsCount: students.length,
    casesCount: cases.length,
    usersCount: users.length,
    maintenanceCount: maintenance.length,
    pendingReportsCount: pendingReports.total,
    openCasesCount: cases.filter(c => c.status === 'Open' || c.status === 'In Progress').length,
    topOffenses,
    topMaintenance,
  };
}
