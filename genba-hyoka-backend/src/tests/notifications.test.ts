import { Elysia } from 'elysia';
import { jwt as elysiaJwt } from '@elysiajs/jwt';
import { describe, expect, it, mock } from "bun:test";

// ── Mock Helpers ─────────────────────────────────────────────
const mockNotifications = [
  { id: 'notif-1', userId: 'user-1', title: 'Test 1', content: 'Content 1', type: 'info', isRead: false, referenceId: null, referenceType: null, createdAt: new Date() },
  { id: 'notif-2', userId: 'user-1', title: 'Test 2', content: 'Content 2', type: 'urgent', isRead: true, referenceId: null, referenceType: null, createdAt: new Date() },
];

const createMockChain = (value: any) => {
  const chain: any = {
    from: () => chain,
    limit: () => chain,
    offset: () => chain,
    orderBy: () => chain,
    where: () => chain,
    set: () => chain,
    returning: () => chain,
    then: (resolve: any) => Promise.resolve(value).then(resolve),
  };
  return chain;
};

// ── Mock Database ───────────────────────────────────────────
mock.module("../db", () => ({
  db: {
    query: {
      notifications: {
        findMany: async () => mockNotifications,
        findFirst: async () => mockNotifications[0],
      }
    },
    select: (fields: any) => {
      if (fields && fields.count) return createMockChain([{ count: 2 }]);
      return createMockChain(mockNotifications);
    },
    update: () => createMockChain([{ id: 'notif-1', isRead: true }]),
  },
  checkConnection: () => Promise.resolve(true)
}));

// ── Import Modules AFTER Mock ────────────────────────────────
import { notificationsModule } from '../modules/notifications';
import { errorHandler } from '../middlewares/errorHandler';

const app = new Elysia().use(errorHandler).use(notificationsModule);

async function getTestToken(): Promise<string> {
  const testApp = new Elysia().use(elysiaJwt({ name: 'jwt', secret: process.env.JWT_SECRET ?? 'test-secret' }));
  let token = '';
  await testApp
    .get('/token', async ({ jwt }) => {
      token = await jwt.sign({
        sub: 'user-1',
        email: 'test@genba.com',
        prm: {},
        roles: []
      });
      return token;
    })
    .handle(new Request('http://localhost/token'));
  return token;
}

// ── Tests ────────────────────────────────────────────────────
describe('Notifications Module - Unit Test', () => {
  it('GET /v1/notifications > Harus mengembalikan daftar notifikasi (200)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/notifications', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBe(2);
  });

  it('PATCH /v1/notifications/:id/read > Harus berhasil menandai dibaca (200)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/notifications/notif-1/read', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isRead).toBe(true);
  });

  it('PATCH /v1/notifications/:id/read > Harus return 401 jika tanpa token', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/notifications/notif-1/read', {
        method: 'PATCH',
      })
    );
    expect(response.status).toBe(401);
  });
});
