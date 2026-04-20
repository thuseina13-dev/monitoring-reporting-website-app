import { loginSchema } from './validations';

describe('loginSchema', () => {
  it('should validate a correct email and password', () => {
    const data = { email: 'test@example.com', password: 'password123' };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should fail on invalid email', () => {
    const data = { email: 'invalid-email', password: 'password123' };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
       // Log the error to see its structure
       // console.log(JSON.stringify(result.error, null, 2));
       const flatten = result.error.flatten();
       const messages = flatten.fieldErrors.email || [];
       expect(messages).toContain('Format email tidak valid');
    }
  });

  it('should fail on short password', () => {
    const data = { email: 'test@example.com', password: '123' };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
       const flatten = result.error.flatten();
       const messages = flatten.fieldErrors.password || [];
       expect(messages).toContain('Password minimal harus 6 karakter');
    }
  });
});
