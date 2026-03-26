import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number'),
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  clinic_name: z.string().max(100, 'Clinic name is too long').optional(),
});

export const patientSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  date_of_birth: z.string().optional(),
  parent_phone: z.string().max(20).optional(),
  parent_email: z.string().email().or(z.literal('')).optional(),
  notes: z.string().max(2000).optional(),
});

export const otpRequestSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number is too short')
    .max(15, 'Phone number is too long'),
});

export const otpVerifySchema = z.object({
  phone: z.string().min(10),
  code: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});

export const soapSchema = z.object({
  subjective: z.string().min(1, 'Subjective is required'),
  objective: z.string().min(1, 'Objective is required'),
  assessment: z.string().min(1, 'Assessment is required'),
  plan: z.string().min(1, 'Plan is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PatientInput = z.infer<typeof patientSchema>;
export type OTPRequestInput = z.infer<typeof otpRequestSchema>;
export type OTPVerifyInput = z.infer<typeof otpVerifySchema>;
export type SOAPInput = z.infer<typeof soapSchema>;
