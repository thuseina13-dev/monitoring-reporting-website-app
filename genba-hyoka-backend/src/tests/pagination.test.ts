import { Elysia } from 'elysia';

// ── Mock Database Robust Helper ──────────────────────────────
const mockUsers = [
  { id: '1', fullName: 'Alice Smith', email: 'alice@example.com', isActive: true, phoneNo: null, address: null, gender: null, companyProfileId: null },
  { id: '2', fullName: 'Bob Jones', email: 'bob@example.com', isActive: true, phoneNo: null, address: null, gender: null, companyProfileId: null },
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
    query: {
        users: {
            findMany: async (options: any) => {
                // If it's a function (RQB style), we just return mock data
                // In a real test we might want to evaluate it, but for unit test this is enough
                return mockUsers;
            },
            findFirst: async () => mockUsers[0],
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
import { errorHandler } from '../middlewares/errorHandler';

const app = new Elysia().use(errorHandler).use(usersModule);

// ── Tests ────────────────────────────────────────────────────
describe('Users Module - Pagination & Search Test', () => {
  it('GET /v1/users?page=1&limit=2 > Harus mengembalikan data terpaginasi', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users?page=1&limit=2', {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.meta.total).toBe(2);
    expect(body.meta.current_page).toBe(1);
  });

  it('GET /v1/users?search=alice > Harus mengembalikan format yang benar', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users?search=alice', {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
  });

  it('GET /v1/users?page=1&cursor=abc > Harus return error 400 (Saling Bertentangan)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users?page=1&cursor=abc', {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(response.status).toBe(400);
  });
});
