import { z } from 'zod';

// Login validation schema
export const loginSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .max(50, 'Username must be less than 50 characters'),
  password: z.string()
    .min(1, 'Password is required')
    .max(100, 'Password must be less than 100 characters')
});

// User registration validation schema
export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  role: z.enum(['admin', 'user', 'security_officer', 'chief_security_officer', 'dean_of_students', 'assistant_dean', 'secretary', 'hall_warden', 'electrician', 'student'])
    .default('user')
});

// Student registration validation schema
export const registerStudentSchema = z.object({
  sin: z.string()
    .min(1, 'Student ID (SIN) is required')
    .max(20, 'Student ID must be less than 20 characters'),
  name: z.string()
    .min(1, 'Full name is required')
    .max(100, 'Name must be less than 100 characters'),
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
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
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

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(6, 'New password must be at least 6 characters')
    .max(100, 'New password must be less than 100 characters')
});
