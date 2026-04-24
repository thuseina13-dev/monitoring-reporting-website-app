import { describe, expect, it, mock, spyOn } from "bun:test";
import { Elysia } from 'elysia';

// ── Mock Database Robust Chain ───────────────────────────────
const mockRoles = [
  { id: 'role-1', code: 'adm', name: 'Admin', description: 'Administrator', createdAt: new Date(), deletedAt: null, users: [] },
];

const createMockChain = (value: any) => {
  const chain: any = {
    from: () => chain,
    limit: () => chain,
    offset: () => chain,
    where: () => chain,
    orderBy: () => chain,
    asc: () => chain,
    desc: () => chain,
    innerJoin: () => chain,
    leftJoin: () => chain,
    values: () => chain,
    returning: () => chain,
    set: () => chain,
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
    select: (fields: any) => {
        if (fields && fields.count) return createMockChain([{ count: 0 }]); // Default 0 usage
        // Default return empty for uniqueness checks
        return createMockChain([]);
    },

    transaction: async (fn: Function) => fn({
        insert: () => createMockChain([mockRoles[0]]),
        select: (fields: any) => {
            return createMockChain([{ id: 'role-1', code: 'adm', name: 'Admin', type: 'admin' }]);
        },
        delete: () => createMockChain([]),
        update: () => createMockChain([mockRoles[0]]),
    }),
    insert: () => createMockChain([mockRoles[0]]),
    update: () => createMockChain([mockRoles[0]]),
    delete: () => createMockChain([]),
  },
  checkConnection: () => Promise.resolve(true)
}));

// ── Import Modules ────────────────────────────────────────────
import { rolesModule } from '../modules/user-management/roles';
import { errorHandler } from '../middlewares/errorHandler';
import { db } from '../db';

const app = new Elysia().use(errorHandler).use(rolesModule);

// ── Tests ────────────────────────────────────────────────────
describe('Roles Module - Unit Test /v1/roles', () => {
  it('GET /v1/roles > Harus mengembalikan daftar role (200)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/roles', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
  });

  it('POST /v1/roles > Harus berhasil buat role baru (201)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
            code: 'NEW',
            name: 'New Role UNIQUE', 
            description: 'Test description'
        }),
      })
    );
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('PUT /v1/roles/:id > Harus blokir perubahan jika role tipe super_admin (403)', async () => {
    const selectSpy = spyOn(db, 'select');
    selectSpy.mockImplementation((() => createMockChain([{ id: 'role-super', name: 'Super Admin', type: 'super_admin' }])) as any);

    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/roles/role-super', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: 'Role Baru' }),
      })
    );
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.message).toBe('Peran Sistem Induk bersifat Read-Only');
    selectSpy.mockRestore();
  });

  it('DELETE /v1/roles/:id > Harus blokir penghapusan jika role tipe super_admin (403)', async () => {
    const selectSpy = spyOn(db, 'select');
    // Mock existence check outside transaction
    selectSpy.mockImplementation((() => createMockChain([{ id: 'role-super', name: 'Super Admin', type: 'super_admin' }])) as any);

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
    selectSpy.mockRestore();
  });
});
