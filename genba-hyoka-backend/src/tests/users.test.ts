import { Elysia } from 'elysia';

// ── Mock Database Robust Helper ──────────────────────────────
const mockUsers = [
  { id: 'user-uuid-1', fullName: 'Administrator', email: 'admin@genba.com', isActive: true, phoneNo: null, address: null, gender: null, createdAt: new Date(), companyProfileId: null, companyProfile: null, roles: [] },
];

const createMockChain = (value: any) => {
  const chain: any = {
    from: () => chain,
    limit: () => chain,
    offset: () => chain,
    orderBy: () => chain,
    asc: () => chain,
    desc: () => chain,
    where: () => chain,

    innerJoin: () => chain,
    leftJoin: () => chain,
    values: () => chain,
    returning: () => chain,
    then: (resolve: any) => Promise.resolve(value).then(resolve),
    [Symbol.asyncIterator]: async function* () {
        if (Array.isArray(value)) yield* value;
        else yield value;
    }
  };
  return chain;
};

// ── JWT Helper ───────────────────────────────────────────────
import { jwt as elysiaJwt } from '@elysiajs/jwt';

async function getTestToken(): Promise<string> {
  const app = new Elysia().use(elysiaJwt({ name: 'jwt', secret: process.env.JWT_SECRET ?? 'test-secret' }));
  let token = '';
  await app
    .get('/token', async ({ jwt }) => {
      token = await jwt.sign({
        sub: 'admin-uuid-1',
        email: 'admin@genba.com',
        prm: { USR: 15 },
      });
      return token;
    })
    .handle(new Request('http://localhost/token'));
  return token;
}

// ── Mock Database ───────────────────────────────────────────
mock.module("../db", () => ({
  db: {
    select: (fields: any) => {
        if (fields && fields.count) return createMockChain([{ count: 1 }]);
        if (fields && fields.roleId) return createMockChain([{ userId: 'user-uuid-1', roleId: 'role-1', roleName: 'Admin' }]);
        // Default return empty for POST uniqueness checks
        return createMockChain([]); 
    },

    insert: () => createMockChain([mockUsers[0]]),
    update: () => createMockChain([mockUsers[0]]),
    delete: () => createMockChain([]),
    transaction: async (fn: Function) => fn({
        insert: () => createMockChain([mockUsers[0]]),
        select: (fields: any) => {
          if (fields && fields.roleId) return createMockChain([{ roleId: 'role-super' }]);
          return createMockChain([{ id: 'user-uuid-1' }]);
        },
        innerJoin: () => createMockChain([{ roleId: 'role-super', type: 'super_admin' }]),
        update: () => createMockChain([mockUsers[0]]),
        delete: () => createMockChain([]),
    }),
  },
  checkConnection: () => Promise.resolve(true)
}));

import { describe, expect, it, mock, spyOn } from "bun:test";
import { db } from "../db";

// ── Import Modules ───────────────────────────────────────────
import { usersModule } from '../modules/user-management/users';
import { errorHandler } from '../middlewares/errorHandler';

const app = new Elysia().use(errorHandler).use(usersModule);

// ── Tests ────────────────────────────────────────────────────
describe('Users Module - Unit Test /v1/users', () => {
  it('Harus mengembalikan daftar users (200)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('Harus berhasil mendaftarkan user baru dengan roleIds (201)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
            fullName: 'User Baru', 
            email: 'baru@genba.com', 
            password: 'password123',
            roleIds: ['00000000-0000-0000-0000-000000000000']
        }),
      })
    );
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('POST /v1/users > Harus berhasil daftar meskipun roleIds kosong (201)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fullName: 'No Role User',
          email: 'norole@test.com',
          password: 'Password123!',
          roleIds: [] // Kosong
        }),
      })
    );
    expect(response.status).toBe(201);
  });

  it('PUT /v1/users/:id > Harus blokir jika user terhubung ke role super_admin (403)', async () => {
    // Mock existence check to return user
    const selectSpy = spyOn(db, 'select');
    selectSpy.mockImplementation((() => createMockChain([{ id: 'user-super' }])) as any);

    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users/user-super', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName: 'Update Name' }),
      })
    );
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.message).toBe('Akun Master Sistem tidak dapat dimodifikasi atau dihapus');
    selectSpy.mockRestore();
  });

  it('DELETE /v1/users/:id > Harus blokir jika user terhubung ke role super_admin (403)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users/user-super', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.message).toBe('Akun Master Sistem tidak dapat dimodifikasi atau dihapus');
  });
});
