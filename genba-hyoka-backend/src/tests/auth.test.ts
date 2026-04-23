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
        // Jika sedang mengambil roleType (untuk getAuthData)
        if (fields && fields.code) return createMockChain([{ code: 'adm', type: 'admin' }]);
        // Default untuk ambil data user
        return createMockChain([mockUser]);
    },
    insert: () => createMockChain([{ id: 'session-1' }]),
    update: () => createMockChain([{ id: 'session-1' }]),
    delete: () => createMockChain([]),
  },
  checkConnection: () => Promise.resolve(true)
}));

// ── Import Module ────────────────────────────────────────────
import { authModule } from '../modules/auth';
import { errorHandler } from '../middlewares/errorHandler';
import { db } from '../db';

const app = new Elysia().use(errorHandler).use(authModule);

// ── Tests ────────────────────────────────────────────────────
describe('Auth Module - Issue #33 RBAC Unit Test', () => {
  it('Scenario 1: Role emp harus dapat bitmask 15 di modul SUB', async () => {
    const selectSpy = spyOn(db, 'select');
    // Implementasi pintar: bedakan query user vs query role
    selectSpy.mockImplementation(((fields: any) => {
        if (fields && fields.code) return createMockChain([{ code: 'emp', type: 'employee' }]) as any;
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
    
    expect(body.data.user.roles).toContainEqual({ code: 'emp', type: 'employee' });
    expect(body.data.user.prm.SUB).toBe(15);
    
    selectSpy.mockRestore();
  });

  it('Scenario 2: Role man harus dapat bitmask 1 di modul USR', async () => {
    const selectSpy = spyOn(db, 'select');
    selectSpy.mockImplementation(((fields: any) => {
        if (fields && fields.code) return createMockChain([{ code: 'man', type: 'manager' }]) as any;
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
    
    expect(body.data.user.roles).toContainEqual({ code: 'man', type: 'manager' });
    expect(body.data.user.prm.USR).toBe(1);
    
    selectSpy.mockRestore();
  });

  it('Scenario 3: Multi-role adm & man harus mendapatkan gabungan bitmask (OR)', async () => {
    const selectSpy = spyOn(db, 'select');
    selectSpy.mockImplementation(((fields: any) => {
        if (fields && fields.code) return createMockChain([{ code: 'adm', type: 'admin' }, { code: 'man', type: 'manager' }]) as any;
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
    
    expect(body.data.user.roles).toContainEqual({ code: 'adm', type: 'admin' });
    expect(body.data.user.roles).toContainEqual({ code: 'man', type: 'manager' });
    expect(body.data.user.prm.USR).toBe(15); // Admin (15) OR Manager (1)
    
    selectSpy.mockRestore();
  });
});


