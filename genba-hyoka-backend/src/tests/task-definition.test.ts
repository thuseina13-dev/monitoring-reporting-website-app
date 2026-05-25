import { Elysia } from 'elysia';
import { describe, expect, it, mock } from "bun:test";
import { jwt as elysiaJwt } from '@elysiajs/jwt';

// ── Mock Database Helper ──────────────────────────────
const mockTaskDefinitions = [
  {
    id: 'task-def-1',
    name: 'Inspeksi Panel Listrik Bulanan',
    description: 'Pengecekan rutin komponen panel dan suhu sirkuit listrik.',
    procedures: {
      generation: { strategy: 'jit_backend', active_days: [1, 3, 5] },
      execution_policy: { instructions: 'Gunakan sarung tangan', start_at: '09:00', duration_hours: 2, start_time_ref: 'on_started', is_mandatory: true },
      workflow: { requires_review: true, approval_role: ['man'] }
    },
    formSchema: {
      type: 'object',
      properties: {
        suhu_panel: { type: 'number', title: 'Suhu Panel' },
        kondisi_sakelar: { type: 'string', enum: ['Baik', 'Rusak'] }
      },
      required: ['suhu_panel', 'kondisi_sakelar']
    },
    isActive: true,
    isMandatory: true,
    createdAt: new Date(),
    createdBy: 'admin-1',
    updatedAt: new Date(),
    updatedBy: null,
    deletedAt: null,
    deletedBy: null
  }
];

const createMockChain = (value: any) => {
  const chain: any = {
    from: () => chain,
    limit: () => chain,
    offset: () => chain,
    orderBy: () => chain,
    where: () => chain,
    set: () => chain,
    values: () => chain,
    returning: () => chain,
    then: (resolve: any) => Promise.resolve(value).then(resolve),
  };
  return chain;
};

// ── Mock Database Module ───────────────────────────────────────────
mock.module("../db", () => ({
  db: {
    query: {
      taskDefinitions: {
        findMany: async (options?: any) => {
          if (options && typeof options.where === 'function') {
            const dummyFields = {
              id: 'id',
              name: 'name',
              isActive: 'isActive',
              isMandatory: 'isMandatory',
              deletedAt: 'deletedAt'
            };
            const dummyOps = {
              and: (...args: any[]) => args,
              or: (...args: any[]) => args,
              eq: (a: any, b: any) => ({ operator: 'eq', a, b }),
              ne: (a: any, b: any) => ({ operator: 'ne', a, b }),
              ilike: (a: any, b: any) => ({ operator: 'ilike', a, b }),
              gt: (a: any, b: any) => ({ operator: 'gt', a, b }),
              isNull: (a: any) => ({ operator: 'isNull', a })
            };
            options.where(dummyFields, dummyOps);
          }
          return mockTaskDefinitions;
        },
        findFirst: async () => mockTaskDefinitions[0],
      }
    },
    select: (fields: any) => {
      if (fields && fields.count) return createMockChain([{ count: 1 }]);
      return createMockChain(mockTaskDefinitions);
    },
    insert: () => createMockChain([mockTaskDefinitions[0]]),
    update: () => createMockChain([mockTaskDefinitions[0]]),
    delete: () => createMockChain([]),
    transaction: async (fn: Function) => fn({
      insert: () => createMockChain([mockTaskDefinitions[0]]),
      update: () => createMockChain([mockTaskDefinitions[0]]),
      delete: () => createMockChain([]),
      select: () => createMockChain([{ id: 'task-def-1' }]),
    }),
  },
  checkConnection: () => Promise.resolve(true)
}));

// ── JWT Token Creators ───────────────────────────────────────────────
async function getAdminToken(): Promise<string> {
  const app = new Elysia().use(elysiaJwt({ name: 'jwt', secret: process.env.JWT_SECRET ?? 'test-secret' }));
  let token = '';
  await app
    .get('/token', async ({ jwt }) => {
      token = await jwt.sign({
        sub: 'admin-1',
        email: 'admin@genba.com',
        prm: { TDF: 15 },
        roles: [{ code: 'adm', type: 'admin', name: 'Admin' }],
      });
      return token;
    })
    .handle(new Request('http://localhost/token'));
  return token;
}

async function getEmployeeToken(): Promise<string> {
  const app = new Elysia().use(elysiaJwt({ name: 'jwt', secret: process.env.JWT_SECRET ?? 'test-secret' }));
  let token = '';
  await app
    .get('/token', async ({ jwt }) => {
      token = await jwt.sign({
        sub: 'emp-1',
        email: 'employee@genba.com',
        prm: { TDF: 0 },
        roles: [{ code: 'emp', type: 'employee', name: 'Employee' }],
      });
      return token;
    })
    .handle(new Request('http://localhost/token'));
  return token;
}

// ── Import Modules AFTER DB Mock ─────────────────────────────
import { taskDefinitionsModule } from '../modules/admin-management/task-definition';
import { errorHandler } from '../middlewares/errorHandler';

const app = new Elysia().use(errorHandler).use(taskDefinitionsModule);

// ── Test Cases ───────────────────────────────────────────────
describe('Task Definitions Module - Unit Test', () => {
  it('GET /v1/task-definitions > Harus berhasil mengambil semua template jika peran Admin (200)', async () => {
    const token = await getAdminToken();
    const response = await app.handle(
      new Request('http://localhost/v1/task-definitions', {
        method: 'GET',
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBe(1);
    expect(body.meta.total).toBe(1);
  });

  it('GET /v1/task-definitions/cursor > Harus berhasil mengambil template via cursor jika peran Admin (200)', async () => {
    const token = await getAdminToken();
    const response = await app.handle(
      new Request('http://localhost/v1/task-definitions/cursor?limit=2', {
        method: 'GET',
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.meta.limit).toBe(2);
    expect(body.meta).toHaveProperty('next_cursor');
  });

  it('GET /v1/task-definitions > Harus berhasil memfilter data berdasarkan query params (search, isActive, isMandatory)', async () => {
    const token = await getAdminToken();
    const response = await app.handle(
      new Request('http://localhost/v1/task-definitions?search=Panel&isActive=true&isMandatory=true', {
        method: 'GET',
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
  });

  it('GET /v1/task-definitions/cursor > Harus berhasil memfilter data kursor berdasarkan query params (search, isActive, isMandatory)', async () => {
    const token = await getAdminToken();
    const response = await app.handle(
      new Request('http://localhost/v1/task-definitions/cursor?search=Panel&isActive=true&isMandatory=true&cursor=task-def-1', {
        method: 'GET',
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
  });

  it('GET /v1/task-definitions > Harus ditolak 403 Forbidden jika peran Employee', async () => {
    const token = await getEmployeeToken();
    const response = await app.handle(
      new Request('http://localhost/v1/task-definitions', {
        method: 'GET',
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.message).toContain('izin akses');
  });

  it('GET /v1/task-definitions/:id > Harus berhasil mengambil detail template (200)', async () => {
    const token = await getAdminToken();
    const response = await app.handle(
      new Request('http://localhost/v1/task-definitions/task-def-1', {
        method: 'GET',
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Inspeksi Panel Listrik Bulanan');
  });

  it('POST /v1/task-definitions > Harus berhasil membuat template tugas baru (201)', async () => {
    const token = await getAdminToken();
    const response = await app.handle(
      new Request('http://localhost/v1/task-definitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `access_token=${token}`
        },
        body: JSON.stringify({
          name: 'Inspeksi AC Ruang Server',
          description: 'Pengecekan filter dan suhu AC.',
          procedures: {
            generation: { strategy: 'jit_backend', active_days: [1] },
            execution_policy: { instructions: 'Matikan AC', start_at: '10:00', duration_hours: 1, start_time_ref: 'on_started', is_mandatory: false },
            workflow: { requires_review: false, approval_role: [] }
          },
          formSchema: {
            type: 'object',
            properties: {
              suhu_ac: { type: 'number', title: 'Suhu AC' }
            },
            required: ['suhu_ac']
          },
          isActive: true,
          isMandatory: false
        })
      })
    );
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.name).toBe('Inspeksi Panel Listrik Bulanan'); // returns mock
  });

  it('POST /v1/task-definitions > Harus 422 Unprocessable Entity jika formSchema kosong', async () => {
    const token = await getAdminToken();
    const response = await app.handle(
      new Request('http://localhost/v1/task-definitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `access_token=${token}`
        },
        body: JSON.stringify({
          name: 'Inspeksi AC Ruang Server',
        })
      })
    );
    expect(response.status).toBe(422);
  });

  it('PATCH /v1/task-definitions/:id > Harus berhasil memperbarui template tugas (200)', async () => {
    const token = await getAdminToken();
    const response = await app.handle(
      new Request('http://localhost/v1/task-definitions/task-def-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `access_token=${token}`
        },
        body: JSON.stringify({
          name: 'Inspeksi Panel Listrik Bulanan V2',
          isActive: false
        })
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('DELETE /v1/task-definitions/:id > Harus berhasil menghapus template tugas (200)', async () => {
    const token = await getAdminToken();
    const response = await app.handle(
      new Request('http://localhost/v1/task-definitions/task-def-1', {
        method: 'DELETE',
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
