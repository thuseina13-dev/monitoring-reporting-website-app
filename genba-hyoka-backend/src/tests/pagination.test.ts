import { describe, expect, it, mock } from "bun:test";
import { Elysia } from 'elysia';
import { jwt as elysiaJwt } from '@elysiajs/jwt';

// ── Mock Database ───────────────────────────────────────────
const mockUsers = [
  { id: '1', fullName: 'Alice Smith', email: 'alice@example.com', isActive: true, phoneNo: null, address: null, gender: null, companyProfileId: null, roles: [] },
  { id: '2', fullName: 'Bob Jones', email: 'bob@example.com', isActive: false, phoneNo: null, address: null, gender: null, companyProfileId: null, roles: [] },
  { id: '3', fullName: 'Charlie Brown', email: 'charlie@example.com', isActive: true, phoneNo: null, address: null, gender: null, companyProfileId: null, roles: [] },
];

const createMockChain = (value: any) => ({
  from: () => createMockChain(value),
  where: () => createMockChain(value),
  limit: () => createMockChain(value),
  offset: () => createMockChain(value),
  orderBy: () => createMockChain(value),
  innerJoin: () => createMockChain(value),
  leftJoin: () => createMockChain(value),
  then: (resolve: any) => Promise.resolve(value).then(resolve),
});


mock.module("../db", () => ({
  db: {
    select: (fields: any) => {
        if (fields && fields.count) return createMockChain([{ count: mockUsers.length }]);
        if (fields && fields.roleId) return createMockChain([]);
        return createMockChain(mockUsers);
    },
  },
  checkConnection: () => Promise.resolve(true)
}));

// ── JWT Helper ───────────────────────────────────────────────
async function getTestToken(): Promise<string> {
  // Gunakan secret dari environment yang sama dengan jwtGuard
  const secret = process.env.JWT_SECRET || 'test-secret';
  const app = new Elysia().use(elysiaJwt({ name: 'jwt', secret }));
  let token = '';
  await app
    .get('/token', async ({ jwt }) => {
      token = await jwt.sign({ 
        sub: 'admin-1', 
        email: 'admin@test.com',
        prm: { USR: 15 } 
      });
      return token;
    })
    .handle(new Request('http://localhost/token'));
  return token;
}

// ── Import Module ────────────────────────────────────────────
import { usersModule } from '../modules/user-management/users';
import { errorHandler } from '../middlewares/errorHandler';

const app = new Elysia().use(errorHandler).use(usersModule);

// ── Tests ────────────────────────────────────────────────────
describe('Users Module - Pagination & Search Test', () => {
  it('GET /v1/users?page=1&limit=2 > Harus mengembalikan data terpaginasi', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users?page=1&limit=2', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    const body = await response.json();
    expect(response.status).toBe(200);

    expect(body.success).toBe(true);
    expect(body.meta.limit).toBe(2);
  });

  it('GET /v1/users?search=alice > Harus mengembalikan format yang benar', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users?search=alice', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeArray();
  });

  it('GET /v1/users?page=1&cursor=abc > Harus return error 400 (Saling Bertentangan)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/users?page=1&cursor=abc', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.message).toBe('Paginasi page dan cursor tidak dapat digunakan secara bersamaan.');
  });
});
