import { z } from 'zod';

// Case creation validation schema
export const createCaseSchema = z.object({
  student_ids: z.array(z.string()).optional(),
  student_id: z.string().optional(),
  staff_id: z.string().optional(),
  offense_type: z.string()
    .min(1, 'Offense type is required')
    .max(100, 'Offense type must be less than 100 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  status: z.enum(['open', 'under_investigation', 'closed', 'appealed', 'dismissed'])
    .default('open'),
  severity: z.enum(['minor', 'moderate', 'serious', 'very_serious'])
    .default('minor'),
  incident_date: z.string().optional(),
  location: z.string().max(200).optional(),
  witnesses: z.array(z.string()).optional(),
  evidence_ids: z.array(z.string()).optional()
});

// Case update validation schema
export const updateCaseSchema = z.object({
  offense_type: z.string()
    .min(1, 'Offense type is required')
    .max(100, 'Offense type must be less than 100 characters')
    .optional(),
  description: z.string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  status: z.enum(['open', 'under_investigation', 'closed', 'appealed', 'dismissed'])
    .optional(),
  severity: z.enum(['minor', 'moderate', 'serious', 'very_serious'])
    .optional(),
  incident_date: z.string().optional(),
  location: z.string().max(200).optional(),
  witnesses: z.array(z.string()).optional(),
  evidence_ids: z.array(z.string()).optional(),
  verdict: z.string().max(2000).optional(),
  penalty: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional()
});

// Case query validation schema
export const caseQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  studentId: z.string().optional(),
  status: z.enum(['open', 'under_investigation', 'closed', 'appealed', 'dismissed']).optional(),
  severity: z.enum(['minor', 'moderate', 'serious', 'very_serious']).optional(),
  search: z.string().max(100).optional()
});
