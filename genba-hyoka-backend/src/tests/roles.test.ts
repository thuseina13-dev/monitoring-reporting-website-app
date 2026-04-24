import { Elysia } from 'elysia';

// ── Mock Database Robust Helper ──────────────────────────────
const mockRoles = [
  { id: 'role-1', code: 'ADM', name: 'Admin', type: 'admin', description: 'Administrator' },
];

const createMockChain = (value: any) => {
  const chain: any = {
    from: () => chain,
    limit: () => chain,
    offset: () => chain,
    orderBy: () => chain,
    where: () => chain,
    innerJoin: () => chain,
    values: () => chain,
    returning: () => chain,
    then: (resolve: any) => Promise.resolve(value).then(resolve),
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
        sub: 'admin-1',
        email: 'admin@genba.com',
        prm: { ROL: 15 },
      });
      return token;
    })
    .handle(new Request('http://localhost/token'));
  return token;
}

// ── Mock Database ───────────────────────────────────────────
mock.module("../db", () => ({
  db: {
    query: {
      roles: {
        findMany: async () => mockRoles,
        findFirst: async () => mockRoles[0],
      }
    },
    select: (fields: any) => {
      if (fields && fields.count) return createMockChain([{ count: 1 }]);
      return createMockChain([]);
    },
    insert: () => createMockChain([mockRoles[0]]),
    update: () => createMockChain([mockRoles[0]]),
    delete: () => createMockChain([]),
    transaction: async (fn: Function) => fn({
      insert: () => createMockChain([mockRoles[0]]),
      update: () => createMockChain([mockRoles[0]]),
      delete: () => createMockChain([]),
      select: () => createMockChain([{ id: 'role-1', type: 'admin' }]),
    }),
  },
  checkConnection: () => Promise.resolve(true)
}));

import { describe, expect, it, mock } from "bun:test";

// ── Import Modules ───────────────────────────────────────────
import { rolesModule } from '../modules/user-management/roles';
import { errorHandler } from '../middlewares/errorHandler';

const app = new Elysia().use(errorHandler).use(rolesModule);

// ── Tests ────────────────────────────────────────────────────
describe('Roles Module - Unit Test /v1/roles', () => {
  it('Harus mengembalikan daftar role (200)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/roles', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('Harus berhasil buat role baru (201)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          code: 'TST', 
          name: 'Test Role', 
          type: 'employee' 
        }),
      })
    );
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('PUT /v1/roles/:id > Harus blokir perubahan jika role tipe super_admin (403)', async () => {
    mock.module("../db", () => ({
      db: {
        select: () => createMockChain([{ id: 'role-super', type: 'super_admin' }]),
      },
      checkConnection: () => Promise.resolve(true)
    }));

    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/roles/role-super', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: 'Super Admin Updated' }),
      })
    );
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.message).toBe('Peran Sistem Induk bersifat Read-Only');
  });

  it('DELETE /v1/roles/:id > Harus blokir penghapusan jika role tipe super_admin (403)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/roles/role-super', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.message).toBe('Peran Sistem Induk bersifat Read-Only');
  });
});
