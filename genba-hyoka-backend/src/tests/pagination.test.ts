import { Elysia } from 'elysia';

// ── Mock Database Robust Helper ──────────────────────────────
const mockUsers = [
  { id: '1', fullName: 'Alice Smith', email: 'alice@example.com', isActive: true, phoneNo: null, address: null, gender: null, photoProfile: null, companyProfileId: null },
  { id: '2', fullName: 'Bob Jones', email: 'bob@example.com', isActive: true, phoneNo: null, address: null, gender: null, photoProfile: null, companyProfileId: null },
];

const createMockChain = (value: any) => {
  const chain: any = {
    from: () => chain,
    limit: () => chain,
    offset: () => chain,
    orderBy: () => chain,
    where: () => chain,
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
        prm: { 
          USR: 15,
          ROL: 15,
          CPY: 15
        },
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
        users: {
            findMany: async (options: any) => mockUsers,
            findFirst: async () => mockUsers[0],
        },
        roles: {
            findMany: async (options: any) => [{ id: 'role-1', code: 'ADM', name: 'Admin', type: 'admin', description: 'Administrator' }],
            findFirst: async () => ({ id: 'role-1', code: 'ADM', name: 'Admin', type: 'admin', description: 'Administrator' }),
        },
        companyProfiles: {
            findMany: async (options: any) => [{ 
              id: 'comp-1', name: 'Company', email: 'comp@test.com', phoneNo: '123', 
              address: 'Street', desc: 'Description', logo: null 
            }],
            findFirst: async () => ({ 
              id: 'comp-1', name: 'Company', email: 'comp@test.com', phoneNo: '123', 
              address: 'Street', desc: 'Description', logo: null 
            }),
        }
    },
    select: (fields: any) => {
      if (fields && fields.count) return createMockChain([{ count: 2 }]);
      return createMockChain([]);
    },
  },
  checkConnection: () => Promise.resolve(true)
}));

import { describe, expect, it, mock } from "bun:test";

// ── Import Modules ───────────────────────────────────────────
import { usersModule } from '../modules/user-management/users';
import { rolesModule } from '../modules/user-management/roles';
import { companyProfileModule } from '../modules/user-management/company-profile';
import { errorHandler } from '../middlewares/errorHandler';

const app = new Elysia()
  .use(errorHandler)
  .use(usersModule)
  .use(rolesModule)
  .use(companyProfileModule);

// ── Tests ────────────────────────────────────────────────────
describe('Pagination System Test - All Modules', () => {
  // ── Users ──
  it('GET /v1/users?page=1&limit=2 > Harus (Offset)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users?page=1&limit=2', {
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.meta.total).toBeDefined();
  });

  it('GET /v1/users/cursor?limit=2 > Harus (Cursor)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users/cursor?limit=2', {
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.meta.next_cursor).toBeDefined();
    expect(body.meta.total).toBeUndefined();
  });

  // ── Roles ──
  it('GET /v1/roles?page=1 > Harus (Offset)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/roles?page=1', {
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.meta.total).toBeDefined();
  });

  it('GET /v1/roles/cursor > Harus (Cursor)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/roles/cursor', {
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.meta.next_cursor).toBeDefined();
  });

  // ── Company Profiles ──
  it('GET /v1/company-profiles?page=1 > Harus (Offset)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/company-profiles?page=1', {
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.meta.total).toBeDefined();
  });

  it('GET /v1/company-profiles/cursor > Harus (Cursor)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/company-profiles/cursor', {
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.meta.next_cursor).toBeDefined();
  });
});
