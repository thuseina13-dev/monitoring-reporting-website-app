import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal harus 6 karakter'),
});

export type LoginFormInputs = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  new_password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus memiliki minimal 1 huruf besar')
    .regex(/[a-z]/, 'Password harus memiliki minimal 1 huruf kecil')
    .regex(/[0-9]/, 'Password harus memiliki minimal 1 angka'),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirm_password'],
});

export type ChangePasswordFormInputs = z.infer<typeof changePasswordSchema>;
