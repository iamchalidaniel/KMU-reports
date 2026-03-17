import Constants from 'expo-constants';

// API base URL – set EXPO_PUBLIC_API_URL in your .env file.
// For local dev on a physical device, use your machine's LAN IP (e.g. http://192.168.x.x:5000/api).
// For the Android emulator: http://10.0.2.2:5000/api
// For the iOS simulator:    http://localhost:5000/api
export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string) ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:5000/api';

export const ENDPOINTS = {
  // Auth
  login: '/login',
  studentRegister: '/student-register',

  // Current user
  me: '/users/me',

  // Student Reports (student can GET own + POST new)
  studentReports: '/student-reports',
  studentReportById: (id: string) => `/student-reports/${id}`,

  // Cases (student sees own cases)
  cases: '/cases',
  caseById: (id: string) => `/cases/${id}`,

  // Appeals (live on the Case model; student submits via POST /:caseId/submit)
  appeals: '/appeals',
  submitAppeal: (caseId: string) => `/appeals/${caseId}/submit`,

  // Maintenance (student can GET own + POST new)
  maintenance: '/maintenance',
  maintenanceById: (id: string) => `/maintenance/${id}`,

  // Admin-only (for future admin screens)
  students: '/students',
  studentById: (id: string) => `/students/${id}`,
  reports: '/reports',
  reportById: (id: string) => `/reports/${id}`,

  // Admin user management
  users: '/users',
  userById: (id: string) => `/users/${id}`,

  // Audit logs (admin + academic_office only)
  audit: '/audit',

  // Health
  health: '/health',
};

