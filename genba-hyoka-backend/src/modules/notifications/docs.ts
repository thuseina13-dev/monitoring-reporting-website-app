import { t } from 'elysia';
import { successResponse, paginatedResponse, errorResponses } from '../../utils/schema';

const notificationResponseSchema = t.Object({
  id: t.String(),
  userId: t.String(),
  title: t.String(),
  content: t.String(),
  type: t.String(),
  isRead: t.Boolean(),
  referenceId: t.Union([t.String(), t.Null()]),
  referenceType: t.Union([t.String(), t.Null()]),
  createdAt: t.Date(),
});

export const listNotificationsDocs = {
  detail: {
    summary: 'Daftar Notifikasi',
    description: 'Mengambil daftar notifikasi milik user yang sedang login.',
    tags: ['Notifications'],
    security: [{ bearerAuth: [] }],
  },
  query: t.Object({
    page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
    isRead: t.Optional(t.String({ description: 'Filter status dibaca (true/false)' })),
  }),
  response: {
    200: paginatedResponse(notificationResponseSchema),
    ...errorResponses([401, 403, 500]),
  },
};

export const markAsReadDocs = {
  detail: {
    summary: 'Tandai Notifikasi Dibaca',
    description: 'Mengubah status is_read menjadi true untuk notifikasi tertentu.',
    tags: ['Notifications'],
    security: [{ bearerAuth: [] }],
  },
  response: {
    200: successResponse(t.Object({
      id: t.String(),
      isRead: t.Boolean(),
    })),
    ...errorResponses([401, 403, 404, 500]),
  },
};
