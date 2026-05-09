import { Elysia, t } from 'elysia';
import { jwtGuard } from '../../middlewares/jwtGuard';
import { StorageService } from './service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';
import { successResponse, errorResponses } from '../../utils/schema';

// Define the response data schema for Swagger
const uploadResponseSchema = t.Object({
  file_url: t.String({ description: 'The public URL to access the uploaded file' }),
  file_path: t.String({ description: 'The relative path of the file on the server' }),
  file_size: t.Number({ description: 'The size of the uploaded file in bytes' })
});

// Daftar model yang diizinkan sesuai dengan skema database/entitas sistem
const VALID_MODELS = [
  'users',
  'companies',
  'company_profiles',
  'task_assignment',
  'notifications',
  'roles'
] as const;

export const uploadModule = new Elysia({ prefix: '/v1/upload' })
  .use(jwtGuard)
  .post(
    '/',
    async ({ body, currentUser, request }) => {
      const { file, model_name, is_public } = body;

      // Validation for file size (5MB = 5 * 1024 * 1024)
      if (file.size > 5 * 1024 * 1024) {
        throw new AppError(400, 'File size exceeds the 5MB limit.');
      }

      const result = await StorageService.upload(file, currentUser.id, model_name, is_public === 'true' || is_public === true);
      
      // Construct Full URL
      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}`;
      const fileUrl = `${baseUrl}/uploads/${result.file_path}`;

      return sendSuccess({
        file_url: fileUrl,
        file_path: result.file_path,
        file_size: result.file_size
      }, 'File uploaded successfully.');
    },
    {
      body: t.Object({
        file: t.File({ 
          description: 'The file to upload',
        }),
        model_name: t.Union(
          VALID_MODELS.map(m => t.Literal(m)),
          { 
            description: `Target entity name. Allowed: ${VALID_MODELS.join(', ')}` 
          }
        ),
        is_public: t.Optional(t.Union([t.Boolean(), t.String()], {
          description: 'Jika "true", file disimpan di folder publik (common). Jika "false", disimpan di folder privat user_id.'
        }))
      }),
      response: {
        200: successResponse(uploadResponseSchema),
        ...errorResponses([400, 401, 500])
      },
      detail: {
        tags: ['Upload'],
        summary: 'Upload a file',
        description: 'Upload a file to the server. model_name must be a valid system entity.',
        security: [{ cookieAuth: [] }]
      }
    }
  );
