import { describe, expect, it, mock } from "bun:test";
import { Elysia } from 'elysia';

// ── Mock Database Robust Chain ───────────────────────────────
const mockRoles = [
  { id: 'role-1', name: 'Admin', description: 'Administrator', createdAt: new Date(), deletedAt: null },
];

const createMockChain = (value: any) => {
  const chain: any = {
    from: () => chain,
    limit: () => chain,
    offset: () => chain,
    where: () => chain,
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

// ── Import Modules ───────────────────────────────────────────
import { rolesModule } from '../modules/user-management/roles';
import { errorHandler } from '../middlewares/errorHandler';

const app = new Elysia().use(errorHandler).use(rolesModule);

// ── Tests ────────────────────────────────────────────────────
describe('Roles Module - Unit Test /v1/roles', () => {
  it('GET /v1/roles > Harus mengembalikan daftar role (200)', async () => {
    mock.module("../db", () => ({
      db: {
        select: (fields: any) => {
            if (fields && fields.count) return createMockChain([{ count: 1 }]);
            if (fields && fields.permissionId) return createMockChain([{ roleId: 'role-1', permissionId: 'p-1', code: 'USR_C', entity: 'USR' }]);
            return createMockChain(mockRoles);
        },
      },
      checkConnection: () => Promise.resolve(true)
    }));

    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/roles', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data[0].permissions).toBeDefined();
  });

  it('POST /v1/roles > Harus berhasil buat role baru dengan permissions (201)', async () => {
    mock.module("../db", () => ({
      db: {
        select: () => createMockChain([]), // Email/Name conflict check empty
        transaction: async (fn: Function) => fn({
            insert: () => createMockChain([mockRoles[0]]),
            delete: () => createMockChain([]),
        }),
      },
      checkConnection: () => Promise.resolve(true)
    }));

    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
            name: 'New Role UNIQUE', 
            description: 'Test description',
            permissionIds: ['00000000-0000-0000-0000-000000000000']
        }),
      })
    );
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('POST /v1/roles > Harus berhasil buat role meskipun permissionIds kosong (201)', async () => {
    mock.module("../db", () => ({
      db: {
        select: () => createMockChain([]),
        transaction: async (fn: Function) => fn({
            insert: () => createMockChain([mockRoles[0]]),
            delete: () => createMockChain([]),
        }),
      },
      checkConnection: () => Promise.resolve(true)
    }));

    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
            name: 'Role Empty Permissions', 
            permissionIds: [] // Kosong
        }),
      })
    );
    expect(response.status).toBe(201);
  });
});
