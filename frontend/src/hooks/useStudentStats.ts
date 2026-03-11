import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../config/constants';
import { authHeaders } from '../utils/api';

export function useStudentStats(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student-stats', studentId],
    queryFn: async () => {
      if (!studentId) return { reports: [], cases: [], appeals: [] };
      const [reportsRes, casesRes, appealsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/student-reports`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/cases?studentId=${studentId}`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/api/appeals?studentId=${studentId}`, { headers: authHeaders() }),
      ]);

      const [reportsData, casesData, appealsData] = await Promise.all([
        reportsRes.ok ? reportsRes.json() : Promise.resolve({ reports: [] }),
        casesRes.ok ? casesRes.json() : Promise.resolve({ cases: [] }),
        appealsRes.ok ? appealsRes.json() : Promise.resolve({ appeals: [] })
      ]);

      return {
        reports: reportsData.reports || [],
        cases: Array.isArray(casesData) ? casesData : (casesData.cases || []),
        appeals: appealsData.appeals || [],
      };
    },
    enabled: !!studentId,
  });
}
