import { z } from 'zod';

// Student creation validation schema
export const createStudentSchema = z.object({
  studentId: z.string()
    .min(1, 'Student ID is required')
    .max(20, 'Student ID must be less than 20 characters'),
  fullName: z.string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters'),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters'),
  contact: z.string()
    .max(20, 'Contact must be less than 20 characters')
    .optional(),
  program: z.string()
    .min(1, 'Program is required')
    .max(100, 'Program must be less than 100 characters'),
  roomNo: z.string()
    .min(1, 'Room number is required')
    .max(20, 'Room number must be less than 20 characters'),
  year: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  yearOfStudy: z.string().optional(),
  status: z.enum(['REGISTERED', 'NOT_REGISTERED', 'GRADUATED', 'SUSPENDED']).default('REGISTERED'),
  deliveryMode: z.enum(['FULLTIME', 'PARTTIME', 'DISTANCE']).default('FULLTIME'),
  firstName: z.string().max(50).optional(),
  surName: z.string().max(50).optional(),
  nrc: z.string().max(20).optional(),
  passport: z.string().max(20).optional(),
  maritalStatus: z.string().max(20).optional(),
  nationality: z.string().max(50).optional(),
  dateOfBirth: z.string().optional(),
  province: z.string().max(50).optional(),
  town: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  phone: z.string().max(20).optional()
});

// Student update validation schema
export const updateStudentSchema = z.object({
  fullName: z.string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .optional(),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters')
    .optional(),
  contact: z.string()
    .max(20, 'Contact must be less than 20 characters')
    .optional(),
  program: z.string()
    .min(1, 'Program is required')
    .max(100, 'Program must be less than 100 characters')
    .optional(),
  roomNo: z.string()
    .min(1, 'Room number is required')
    .max(20, 'Room number must be less than 20 characters')
    .optional(),
  year: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  yearOfStudy: z.string().optional(),
  status: z.enum(['REGISTERED', 'NOT_REGISTERED', 'GRADUATED', 'SUSPENDED']).optional(),
  deliveryMode: z.enum(['FULLTIME', 'PARTTIME', 'DISTANCE']).optional(),
  firstName: z.string().max(50).optional(),
  surName: z.string().max(50).optional(),
  nrc: z.string().max(20).optional(),
  passport: z.string().max(20).optional(),
  maritalStatus: z.string().max(20).optional(),
  nationality: z.string().max(50).optional(),
  dateOfBirth: z.string().optional(),
  province: z.string().max(50).optional(),
  town: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  phone: z.string().max(20).optional()
});

// Student query validation schema
export const studentQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  search: z.string().max(100).optional(),
  program: z.string().max(100).optional(),
  status: z.enum(['REGISTERED', 'NOT_REGISTERED', 'GRADUATED', 'SUSPENDED']).optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional()
});
