import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal harus 6 karakter'),
});

export type LoginFormInputs = z.infer<typeof loginSchema>;
