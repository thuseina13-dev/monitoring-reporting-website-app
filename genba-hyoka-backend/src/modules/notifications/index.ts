import { Elysia } from 'elysia';
import { db } from '../../db';
import { notifications } from '../../db/schema';
import { eq, and, count, desc, isNull } from 'drizzle-orm';

import { AppError } from '../../utils/AppError';
import { sendSuccess, sendSuccessPagination } from '../../utils/response';
import { jwtGuard } from '../../middlewares/jwtGuard';

import {
  listNotificationsDocs,
  markAsReadDocs,
} from './docs';

export const notificationsModule = new Elysia({ prefix: '/v1/notifications' })
  .use(jwtGuard)

  // ── GET /notifications (Daftar Notifikasi) ──────────────────
  .get(
    '/',
    async ({ query, currentUser }) => {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const offset = (page - 1) * limit;

      const whereClause = [eq(notifications.userId, currentUser.id!)];

      if (query.isRead !== undefined) {
        whereClause.push(eq(notifications.isRead, query.isRead === 'true'));
      }

      const notificationList = await db.query.notifications.findMany({
        where: and(...whereClause),
        orderBy: [desc(notifications.createdAt)],
        limit: limit,
        offset: offset,
      });

      const [totalCount] = await db
        .select({ count: count() })
        .from(notifications)
        .where(and(...whereClause));

      const total = Number(totalCount.count);
      const meta = {
        total,
        limit,
        current_page: page,
        last_page: Math.ceil(total / limit),
        has_more: page < Math.ceil(total / limit),
      };

      return sendSuccessPagination(notificationList, meta, 'Notifikasi berhasil diambil');
    },
    {
      ...listNotificationsDocs,
    }
  )

  // ── PATCH /notifications/:id/read (Tandai Dibaca) ───────────
  .patch(
    '/:id/read',
    async ({ params, currentUser }) => {
      const [existing] = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.id, params.id), eq(notifications.userId, currentUser.id!)))
        .limit(1);

      if (!existing) throw new AppError(404, 'Notifikasi tidak ditemukan');

      const [updated] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, params.id))
        .returning({ id: notifications.id, isRead: notifications.isRead });

      return sendSuccess(updated, 'Notifikasi ditandai sebagai sudah dibaca');
    },
    {
      ...markAsReadDocs,
    }
  );
