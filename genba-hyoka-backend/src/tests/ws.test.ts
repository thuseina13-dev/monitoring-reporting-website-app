import { Elysia } from 'elysia';
import { describe, expect, it, mock } from "bun:test";
import { jwt as elysiaJwt } from '@elysiajs/jwt';

// ── Mock Database ───────────────────────────────────────────
const mockTicket = { id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', userId: 'user-uuid-1', expiresAt: new Date() };

mock.module("../db", () => ({
  db: {
    insert: () => ({
      values: () => ({
        returning: async () => [mockTicket]
      })
    }),
    query: {
        wsTickets: {
            findFirst: async () => ({ ...mockTicket, user: { id: 'user-uuid-1', userRoles: [] } })
        }
    },
    delete: () => ({
        where: async () => []
    })
  },
  checkConnection: () => Promise.resolve(true)
}));

// ── JWT Helper ───────────────────────────────────────────────
async function getTestToken(): Promise<string> {
  const app = new Elysia().use(elysiaJwt({ name: 'jwt', secret: process.env.JWT_SECRET ?? 'test-secret' }));
  let token = '';
  await app
    .get('/token', async ({ jwt }) => {
      token = await jwt.sign({
        sub: 'user-uuid-1',
        email: 'test@genba.com',
      });
      return token;
    })
    .handle(new Request('http://localhost/token'));
  return token;
}

// ── Import Modules ───────────────────────────────────────────
import { wsModule } from '../modules/ws';
import { errorHandler } from '../middlewares/errorHandler';

const app = new Elysia().use(errorHandler).use(wsModule);

describe('WebSocket Module - Unit Test /v1/ws/ticket', () => {
  it('POST /v1/ws/ticket > Harus berhasil membuat tiket (201)', async () => {
    const token = await getTestToken();
    const response = await app.handle(
      new Request('http://localhost/v1/ws/ticket', {
        method: 'POST',
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    
    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.ticket_id).toBe('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');
  });

  it('POST /v1/ws/ticket > Harus gagal jika tanpa token (401)', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/ws/ticket', {
        method: 'POST',
      })
    );
    expect(response.status).toBe(401);
  });
});
