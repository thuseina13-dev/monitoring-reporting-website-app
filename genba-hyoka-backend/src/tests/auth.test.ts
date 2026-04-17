import { describe, expect, it, mock } from "bun:test";
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
        // Mock and logic based on table fields
        if (fields && fields.code) return createMockChain([{ code: 'USR_CREATE', bitValue: 1 }]);
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

const app = new Elysia().use(errorHandler).use(authModule);

// ── Tests ────────────────────────────────────────────────────
describe('Auth Module - Unit Test /v1/auth', () => {
  it('POST /v1/auth/login > Berhasil login dan dapat accessToken & refreshToken', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com', password: 'secret123' }),
      })
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();
    expect(body.data.user.fullName).toBe('John Doe');
  });

  it('GET /v1/auth/me > Berhasil verifikasi token (Status 200)', async () => {
    // Ambil token dari login dulu
    const loginRes = await app.handle(
      new Request('http://localhost/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com', password: 'secret123' }),
      })
    );
    const { data } = await loginRes.json();

    const response = await app.handle(
      new Request('http://localhost/v1/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${data.accessToken}` },
      })
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.sub).toBe('user-uuid-1');
    expect(body.data.prm.USR).toBe(1); // bitmask flatten check
  });
});
