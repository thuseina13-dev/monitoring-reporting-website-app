import { Elysia } from 'elysia';
import { describe, expect, it, mock } from "bun:test";
import { jwt as elysiaJwt } from '@elysiajs/jwt';

// ── Mock Data ───────────────────────────────────────────
const mockRoles = [
  { id: '8a1b2c3d-5678-1234-abcd-ef1234567890', code: 'adm', name: 'Admin', type: 'admin' },
  { id: '8a1b2c3d-5678-1234-abcd-ef1234567891', code: 'emp', name: 'Employee', type: 'employee' }
];

const mockTaskDefinitions = [
  { id: '8f8b83c2-1234-5678-abcd-ef1234567890', name: 'Inspeksi Panel Listrik Bulanan', isActive: true, deletedAt: null }
];

const mockRoleTasks = [
  {
    id: 'e5f6a7b8-1234-5678-abcd-ef1234567890',
    roleId: mockRoles[0].id,
    taskDefinitionId: mockTaskDefinitions[0].id,
    createdAt: new Date(),
    role: mockRoles[0],
    taskDefinition: mockTaskDefinitions[0]
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
    onConflictDoNothing: () => chain,
    then: (resolve: any) => Promise.resolve(value).then(resolve),
  };
  return chain;
};

// ── Mock Database Module ───────────────────────────────────────────
mock.module("../db", () => ({
  db: {
    query: {
      roles: {
        findFirst: async () => mockRoles[0],
      },
      taskDefinitions: {
        findMany: async () => mockTaskDefinitions,
        findFirst: async () => mockTaskDefinitions[0],
      },
      roleTasks: {
        findMany: async (options?: any) => {
          if (options && typeof options.where === 'function') {
            const dummyFields = {
              id: 'id',
              roleId: 'roleId',
              taskDefinitionId: 'taskDefinitionId'
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
          return mockRoleTasks;
        },
        findFirst: async () => mockRoleTasks[0],
      }
    },
    select: (fields?: any) => {
      // Mock count for pagination
      if (fields && fields.count) return createMockChain([{ count: 1 }]);
      return createMockChain(mockRoleTasks);
    },
    insert: () => createMockChain([mockRoleTasks[0]]),
    delete: () => createMockChain([]),
    transaction: async (fn: Function) => fn({
      insert: () => createMockChain([mockRoleTasks[0]]),
      delete: () => createMockChain([]),
      select: () => createMockChain([{ id: 'role-task-1' }]),
    })
  }
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
        prm: { RTS: 15 },
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
        prm: { RTS: 0 },
        roles: [{ code: 'emp', type: 'employee', name: 'Employee' }],
      });
      return token;
    })
    .handle(new Request('http://localhost/token'));
  return token;
}

// ── Import Modules AFTER DB Mock ─────────────────────────────
import { roleTasksModule } from '../modules/admin-management/role-tasks';
import { errorHandler } from '../middlewares/errorHandler';

const app = new Elysia().use(errorHandler).use(roleTasksModule);

// ── Test Cases ───────────────────────────────────────────────
describe('Role Tasks Module - Unit Test', () => {

  it('GET /v1/role-tasks > Harus berhasil mengambil semua penugasan jika peran Admin (200)', async () => {
    const token = await getAdminToken();
    const response = await app.handle(
      new Request('http://localhost/v1/role-tasks', {
        method: 'GET',
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data[0].task_name).toBe('Inspeksi Panel Listrik Bulanan');
  });

  it('GET /v1/role-tasks > Harus ditolak 403 Forbidden jika peran Employee', async () => {
    const token = await getEmployeeToken();
    const response = await app.handle(
      new Request('http://localhost/v1/role-tasks', {
        method: 'GET',
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.message).toContain('izin akses');
  });

  it('POST /v1/role-tasks > Harus berhasil menugaskan template tugas baru (201)', async () => {
    const token = await getAdminToken();
    const response = await app.handle(
      new Request('http://localhost/v1/role-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `access_token=${token}`
        },
        body: JSON.stringify({
          roleId: '8a1b2c3d-5678-1234-abcd-ef1234567890',
          taskDefinitionId: '8f8b83c2-1234-5678-abcd-ef1234567890'
        })
      })
    );
    const body = await response.json();
    console.log("Validation Body:", JSON.stringify(body, null, 2));
    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
  });

  it('DELETE /v1/role-tasks/:id > Harus berhasil menghapus penugasan (200)', async () => {
    const token = await getAdminToken();
    const response = await app.handle(
      new Request('http://localhost/v1/role-tasks/e5f6a7b8-1234-5678-abcd-ef1234567890', {
        method: 'DELETE',
        headers: { Cookie: `access_token=${token}` },
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('POST /v1/role-tasks/bulk > Harus berhasil bulk assign tugas (201)', async () => {
    const token = await getAdminToken();
    const response = await app.handle(
      new Request('http://localhost/v1/role-tasks/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `access_token=${token}`
        },
        body: JSON.stringify({
          roleId: '8a1b2c3d-5678-1234-abcd-ef1234567890',
          taskDefinitionIds: ['8f8b83c2-1234-5678-abcd-ef1234567890']
        })
      })
    );
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
  });

  it('PUT /v1/role-tasks/bulk > Harus berhasil bulk replace tugas (200)', async () => {
    const token = await getAdminToken();
    const response = await app.handle(
      new Request('http://localhost/v1/role-tasks/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `access_token=${token}`
        },
        body: JSON.stringify({
          roleId: '8a1b2c3d-5678-1234-abcd-ef1234567890',
          taskDefinitionIds: ['8f8b83c2-1234-5678-abcd-ef1234567890']
        })
      })
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
  });
});
