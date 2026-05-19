import { Elysia } from 'elysia';
import { describe, expect, it, mock, spyOn } from "bun:test";
import { jwt as elysiaJwt } from '@elysiajs/jwt';

// ── Mock Data ──────────────────────────────────────────────────
const mockUsers = [
  { id: 'user-uuid-1', fullName: 'Administrator', email: 'admin@genba.com', isActive: true, phoneNo: null, address: null, gender: null, photoProfile: null, createdAt: new Date(), companyProfileId: null, companyProfile: null, roles: [] },
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

// ── Mock Database Module ───────────────────────────────────────────
// IMPORTANT: mock.module MUST be called before importing app modules
mock.module("../db", () => ({
  db: {
    query: {
      users: {
        findMany: async () => mockUsers,
        findFirst: async () => mockUsers[0],
      }
    },
    select: (fields: any) => {
        if (fields && fields.count) return createMockChain([{ count: 1 }]);
        if (fields && fields.roleId) return createMockChain([{ userId: 'user-uuid-1', roleId: 'role-1', roleName: 'Admin' }]);
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

// ── Import Modules AFTER DB Mock ─────────────────────────────
import { usersModule } from '../modules/user-management/users';
import { errorHandler } from '../middlewares/errorHandler';
import { db } from '../db';

const app = new Elysia().use(errorHandler).use(usersModule);

// ── Tests ────────────────────────────────────────────────────
describe('Users Module - Unit Test /v1/users', () => {
  it('Harus mengembalikan daftar users (200)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users', {
        method: 'GET',
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.meta.total).toBeDefined(); // Offset-based harus ada total
  });

  it('Harus mengembalikan daftar users via CURSOR (200)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users/cursor', {
        method: 'GET',
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.meta.next_cursor).toBeDefined();
    expect(body.meta.total).toBeUndefined(); // Cursor-based tidak boleh ada total
  });

  it('Harus mengembalikan daftar users dengan parameter include relasi (200)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users?include=roles,company_partner', {
        method: 'GET',
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
  });

  it('Harus berhasil mendaftarkan user baru dengan roleIds (201)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: `access_token=${token}` },
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

  it('POST /v1/users/register > Harus berhasil daftar meskipun roleIds kosong (201)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: `access_token=${token}` },
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
    const selectSpy = spyOn(db, 'select');
    selectSpy.mockImplementation((() => createMockChain([{ id: 'user-super' }])) as any);

    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users/user-super', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: `access_token=${token}` },
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
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.message).toBe('Akun Master Sistem tidak dapat dimodifikasi atau dihapus');
  });
});
