import { describe, expect, it, mock, spyOn } from "bun:test";
import { Elysia } from 'elysia';

// ── Mock Database ───────────────────────────────────────────
const mockUser = {
  id: 'user-uuid-1',
  fullName: 'John Doe',
  email: 'john@example.com',
  password: await Bun.password.hash('secret123')
};

const createMockChain = (value: any) => ({
  from: () => createMockChain(value),
  where: () => createMockChain(value),
  limit: () => createMockChain(value),
  innerJoin: () => createMockChain(value),
  returning: () => createMockChain(value),
  set: () => createMockChain(value),
  values: () => createMockChain(value),
  delete: () => createMockChain(value),
  then: (resolve: any) => Promise.resolve(value).then(resolve),
});

mock.module("../db", () => ({
  db: {
    select: (fields: any) => {
        if (fields && fields.code) return createMockChain([{ code: 'adm', type: 'admin', name: 'Administrator' }]);
        return createMockChain([mockUser]);
    },
    insert: () => createMockChain([{ id: 'session-1' }]),
    update: () => createMockChain([{ id: 'session-1' }]),
    delete: () => createMockChain([]),
  },
  checkConnection: () => Promise.resolve(true)
}));

// ── JWT Helper ───────────────────────────────────────────────
import { jwt as elysiaJwt } from '@elysiajs/jwt';

async function getTestToken(payload: any): Promise<string> {
  const secret = process.env.JWT_SECRET || 'test-secret';
  const app = new Elysia().use(elysiaJwt({ name: 'jwt', secret }));
  let token = '';
  await app
    .get('/token', async ({ jwt }) => {
      token = await jwt.sign(payload);
      return token;
    })
    .handle(new Request('http://localhost/token'));
  return token;
}


// ── Import Module & Dependencies ────────────────────────────
import { authModule, changePasswordHandler } from '../modules/auth';
import { errorHandler } from '../middlewares/errorHandler';
import { db } from '../db';

const app = new Elysia().use(errorHandler).use(authModule);

describe('Auth Module - RBAC & Change Password Unit Test', () => {
  it('RBAC: Role emp harus dapat bitmask 15 di modul SUB', async () => {
    const selectSpy = spyOn(db, 'select');
    selectSpy.mockImplementation(((fields: any) => {
        if (fields && fields.code) return createMockChain([{ code: 'emp', type: 'employee', name: 'Employee' }]) as any;
        return createMockChain([mockUser]) as any;
    }) as any);

    const loginRes = await app.handle(
      new Request('http://localhost/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com', password: 'secret123' }),
      })
    );
    const body = await loginRes.json();
    expect(body.data.user.prm.SUB).toBe(15);
    selectSpy.mockRestore();
  });

  // ── INTEGRATION TEST: CHANGE PASSWORD ──────────────────────
  
  it('Integration: Berhasil ganti password via endpoint (Self)', async () => {
    const updateSpy = spyOn(db, 'update').mockImplementation(() => createMockChain([{ id: 'user-uuid-1' }]) as any);

    const res = await app.handle(
      new Request('http://localhost/v1/auth/change-password', {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': `access_token=${await getTestToken({
                sub: 'user-uuid-1',
                email: 'john@example.com',
                roles: [{ type: 'employee' }],
                prm: {}
            })}`
        },
        body: JSON.stringify({ new_password: 'newpassword123' }),
      })
    );
    
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    updateSpy.mockRestore();
  });

  it('Integration: Admin berhasil mereset password user lain', async () => {
    const selectSpy = spyOn(db, 'select').mockImplementation(() => createMockChain([{ type: 'employee' }]) as any);
    const updateSpy = spyOn(db, 'update').mockImplementation(() => createMockChain([{ id: 'user-other' }]) as any);

    const res = await app.handle(
      new Request('http://localhost/v1/auth/change-password', {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': `access_token=${await getTestToken({
                sub: 'admin-id',
                email: 'admin@example.com',
                roles: [{ type: 'admin' }],
                prm: {}
            })}`
        },
        body: JSON.stringify({ new_password: 'newpassword123', userId: 'user-other' }),
      })
    );
    
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message).toBe('Password has been updated successfully.');
    
    selectSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it('Logic Test: Blockade Super Admin', async () => {
    const selectSpy = spyOn(db, 'select').mockImplementation(() => createMockChain([{ type: 'super_admin' }]) as any);

    const res = await app.handle(
      new Request('http://localhost/v1/auth/change-password', {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Cookie': `access_token=${await getTestToken({
                sub: 'admin-id',
                email: 'admin@example.com',
                roles: [{ type: 'admin' }],
                prm: {}
            })}`
        },
        body: JSON.stringify({ new_password: 'newpassword123', userId: 'sa-id' }),
      })
    );
    
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.message).toContain('Master Sistem');
    
    selectSpy.mockRestore();
  });
});
