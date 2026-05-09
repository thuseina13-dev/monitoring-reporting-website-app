import { describe, expect, it, afterAll } from "bun:test";
import { Elysia, t } from 'elysia';
import { rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { StorageService } from '../modules/upload/service';
import { sendSuccess } from '../utils/response';
import { errorHandler } from '../middlewares/errorHandler';

describe('Upload Module Logic Test (Bypassed Auth)', () => {
  const uploadDir = join(process.cwd(), 'uploads');

  // Create a test app that mimics the uploadModule but with bypassed auth
  const testApp = new Elysia()
    .use(errorHandler)
    .derive({ as: 'scoped' }, () => ({
      currentUser: {
        id: 'test-user-id',
        email: 'test@example.com',
        prm: {},
        roles: []
      }
    }))
    .post('/v1/upload', async ({ body, currentUser, request }) => {
      const { file, model_name, is_public } = body as any;

      if (file.size > 5 * 1024 * 1024) {
        return { success: false, message: 'File size exceeds the 5MB limit.' };
      }

      const result = await StorageService.upload(file, currentUser.id, model_name, is_public === 'true' || is_public === true);
      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}`;

      return sendSuccess({
        file_url: `${baseUrl}/uploads/${result.file_path}`,
        file_path: result.file_path,
        file_size: result.file_size
      });
    }, {
      body: t.Object({
        file: t.File(),
        model_name: t.Union(
          ['users', 'companies', 'company_profiles', 'task_assignment', 'notifications', 'roles'].map(m => t.Literal(m))
        ),
        is_public: t.Optional(t.Union([t.Boolean(), t.String()]))
      })
    });

  afterAll(() => {
    if (existsSync(uploadDir)) {
      rmSync(uploadDir, { recursive: true, force: true });
    }
  });

  it('should upload a file successfully (Private)', async () => {
    const content = 'Test private content';
    const file = new File([content], 'private.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_name', 'companies');

    const response = await testApp.handle(
      new Request('http://localhost/v1/upload', {
        method: 'POST',
        body: formData,
      })
    );

    const body = await response.json() as any;
    expect(response.status).toBe(200);
    expect(body.data.file_path).toContain('test-user-id/companies/');
    expect(existsSync(join(uploadDir, body.data.file_path))).toBe(true);
  });

  it('should upload to "common" folder when is_public is true', async () => {
    const content = 'Public content';
    const file = new File([content], 'public.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_name', 'notifications');
    formData.append('is_public', 'true');

    const response = await testApp.handle(
      new Request('http://localhost/v1/upload', {
        method: 'POST',
        body: formData,
      })
    );

    const body = await response.json() as any;
    expect(response.status).toBe(200);
    expect(body.data.file_path).toContain('common/notifications/');
    expect(existsSync(join(uploadDir, body.data.file_path))).toBe(true);
  });

  it('should return error for file too large', async () => {
    const largeFile = new File(['a'.repeat(6 * 1024 * 1024)], 'large.txt');
    const formData = new FormData();
    formData.append('file', largeFile);
    formData.append('model_name', 'users');

    const response = await testApp.handle(
      new Request('http://localhost/v1/upload', {
        method: 'POST',
        body: formData,
      })
    );

    const body = await response.json() as any;
    expect(body.success).toBe(false);
    expect(body.message).toBe('File size exceeds the 5MB limit.');
  });

  it('should return 400 for unauthorized model_name', async () => {
    const file = new File(['test'], 'test.txt');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_name', 'unauthorized_folder');

    const response = await testApp.handle(
      new Request('http://localhost/v1/upload', {
        method: 'POST',
        body: formData,
      })
    );

    // Elysia returns 422 for validation errors by default
    expect(response.status).toBe(422);
  });
});

describe('StorageService Unit Test', () => {
  it('should save file to user-specific directory (Private)', async () => {
    const file = new File(['private'], 'p.txt');
    const result = await StorageService.upload(file, 'user-1', 'users', false);
    expect(result.file_path).toContain('user-1/users/');
    expect(existsSync(join(process.cwd(), 'uploads', result.file_path))).toBe(true);
  });

  it('should save file to "common" directory (Public)', async () => {
    const file = new File(['public'], 'pub.txt');
    const result = await StorageService.upload(file, 'user-1', 'roles', true);
    expect(result.file_path).toContain('common/roles/');
    expect(existsSync(join(process.cwd(), 'uploads', result.file_path))).toBe(true);
  });
});
