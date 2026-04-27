import { describe, expect, it, mock } from "bun:test";
import { Elysia } from 'elysia';
import { rbac } from '../middlewares/rbacGuard';
import { PERMISSION_BIT } from '../modules/auth/constants/permissions';
import { AppError } from '../utils/AppError';
import { errorHandler } from '../middlewares/errorHandler';

// ── Dummy App for Integration Testing ──────────────────────
const testApp = new Elysia()
  .use(errorHandler)
  // Mock jwt payload extraction (biasanya dilakukan jwtGuard)
  .derive(({ cookie: { access_token } }) => {
    const auth = access_token?.value;
    if (auth === 'sup-token') return { currentUser: { prm: { TAS: 15, USR: 15 }, roles: ['sup'] } };
    if (auth === 'man-token') return { currentUser: { prm: { TAS: 15, USR: 1 }, roles: ['man'] } };
    if (auth === 'emp-token') return { currentUser: { prm: { TAS: 1, USR: 1 }, roles: ['emp'] } };
    return { currentUser: null };
  })
  // Route Group: Tasks
  .group('/v1/tasks', (app) =>
    app
      .get('/', () => ({ message: 'OK' }), {
        beforeHandle: [rbac('TAS', PERMISSION_BIT.READ)]
      })
      .post('/', () => ({ message: 'Created' }), {
        beforeHandle: [rbac('TAS', PERMISSION_BIT.CREATE)]
      })
  )
  // Route Group: Users
  .group('/v1/users', (app) =>
    app
      .post('/', () => ({ message: 'User Created' }), {
        beforeHandle: [rbac('USR', PERMISSION_BIT.CREATE)]
      })
  );

describe('RBAC Integration Testing - Issue #33', () => {
  it('GET /v1/tasks > Harus 200 OK untuk semua role (min Read/1)', async () => {
    const roles = ['sup-token', 'man-token', 'emp-token'];
    for (const token of roles) {
      const res = await testApp.handle(
        new Request('http://localhost/v1/tasks', { headers: { Cookie: `access_token=${token}` } })
      );
      if (res.status !== 200) {
        const err = await res.json();
        console.log(`Failed for token ${token}:`, err);
      }
      expect(res.status).toBe(200);
    }
  });


  it('POST /v1/tasks > Harus 200 OK untuk sup & man, 403 untuk emp', async () => {
    // SUP
    const resSup = await testApp.handle(
      new Request('http://localhost/v1/tasks', { 
        method: 'POST', 
        headers: { Cookie: `access_token=sup-token` } 
      })
    );
    expect(resSup.status).toBe(200);

    // MAN
    const resMan = await testApp.handle(
      new Request('http://localhost/v1/tasks', { 
        method: 'POST', 
        headers: { Cookie: `access_token=man-token` } 
      })
    );
    expect(resMan.status).toBe(200);

    // EMP (Forbidden)
    const resEmp = await testApp.handle(
      new Request('http://localhost/v1/tasks', { 
        method: 'POST', 
        headers: { Cookie: `access_token=emp-token` } 
      })
    );
    expect(resEmp.status).toBe(403);
  });

  it('POST /v1/users > Harus 403 Forbidden untuk man & emp', async () => {
    // MAN (Forbidden)
    const resMan = await testApp.handle(
      new Request('http://localhost/v1/users', { 
        method: 'POST', 
        headers: { Cookie: `access_token=man-token` } 
      })
    );
    expect(resMan.status).toBe(403);

    // EMP (Forbidden)
    const resEmp = await testApp.handle(
      new Request('http://localhost/v1/users', { 
        method: 'POST', 
        headers: { Cookie: `access_token=emp-token` } 
      })
    );
    expect(resEmp.status).toBe(403);

    // SUP (Allowed)
    const resSup = await testApp.handle(
      new Request('http://localhost/v1/users', { 
        method: 'POST', 
        headers: { Cookie: `access_token=sup-token` } 
      })
    );
    expect(resSup.status).toBe(200);
  });
});
