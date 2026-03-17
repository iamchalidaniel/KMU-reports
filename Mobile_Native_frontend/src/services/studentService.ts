import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/api';

// ─── Student Report ────────────────────────────────────────────────────────────
export interface StudentReport {
  _id: string;
  student_id?: string | { _id: string; fullName: string; email: string; studentId: string };
  student_name?: string;
  incident_date?: string;
  description: string;
  offense_type: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Reviewed' | 'Approved' | 'Rejected' | 'Converted';
  is_anonymous?: boolean;
  admin_comments?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateStudentReportInput {
  description: string;
  offense_type?: string;
  severity?: 'Low' | 'Medium' | 'High';
  incident_date?: string;
  is_anonymous?: boolean;
}

export async function listStudentReports(): Promise<StudentReport[]> {
  const res = await apiClient.get<{ reports: StudentReport[]; total: number }>(ENDPOINTS.studentReports);
  return res.data.reports ?? [];
}

export async function getStudentReport(id: string): Promise<StudentReport> {
  const res = await apiClient.get<StudentReport>(ENDPOINTS.studentReportById(id));
  return res.data;
}

export async function createStudentReport(input: CreateStudentReportInput): Promise<StudentReport> {
  const res = await apiClient.post<{ message: string; report: StudentReport }>(ENDPOINTS.studentReports, input);
  return res.data.report;
}

// ─── Cases ────────────────────────────────────────────────────────────────────
export interface StudentCase {
  _id: string;
  student_id?: string;
  incident_date?: string;
  description?: string;
  offense_type?: string;
  severity?: string;
  status?: string;
  sanctions?: string;
  appeal_status?: 'pending' | 'approved' | 'rejected';
  appeal_reason?: string;
  appeal_date?: string;
  appeal_decision?: string;
  created_at?: string;
  updated_at?: string;
}

export async function listStudentCases(): Promise<StudentCase[]> {
  const res = await apiClient.get<{ cases: StudentCase[] } | StudentCase[]>(ENDPOINTS.cases);
  if (Array.isArray(res.data)) return res.data;
  return (res.data as { cases: StudentCase[] }).cases ?? [];
}

// ─── Appeals ──────────────────────────────────────────────────────────────────
// Appeals live on the Case model. An appeal is a Case that has been appealed.
export interface Appeal {
  _id: string;
  student_id?: string;
  incident_date?: string;
  offense_type?: string;
  status?: string;
  appealStatus?: 'pending' | 'approved' | 'rejected';
  appealReason?: string;
  appealDate?: string;
  appealDecision?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function listAppeals(): Promise<Appeal[]> {
  const res = await apiClient.get<{ appeals: Appeal[]; total: number }>(ENDPOINTS.appeals);
  return res.data.appeals ?? [];
}

export async function submitAppeal(caseId: string, appeal_reason: string): Promise<void> {
  await apiClient.post(ENDPOINTS.submitAppeal(caseId), { appeal_reason });
}

// ─── Maintenance ──────────────────────────────────────────────────────────────
export interface MaintenanceReport {
  _id: string;
  category?: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  status?: string;
  location?: {
    hall?: string;
    room?: string;
    area?: string;
  };
  reported_by?: {
    name?: string;
    student_id?: string;
    contact?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export type MaintenanceCategory = 'plumbing' | 'electrical' | 'furniture' | 'structural' | 'cleaning' | 'pest_control' | 'other';
export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface CreateMaintenanceInput {
  category: MaintenanceCategory;
  description: string;
  priority?: MaintenancePriority;
  location?: {
    hall?: string;
    room?: string;
    area?: string;
  };
  reported_by?: {
    name?: string;
  };
}

export async function listMaintenanceReports(): Promise<MaintenanceReport[]> {
  const res = await apiClient.get<{ reports: MaintenanceReport[] }>(ENDPOINTS.maintenance);
  return res.data.reports ?? [];
}

export async function createMaintenanceReport(input: CreateMaintenanceInput): Promise<MaintenanceReport> {
  const res = await apiClient.post<MaintenanceReport>(ENDPOINTS.maintenance, input);
  return res.data;
}
