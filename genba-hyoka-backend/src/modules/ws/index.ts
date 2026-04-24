import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { wsTickets, users, userRoles, roles } from '../../db/schema';
import { eq, and, gt, lt, sql } from 'drizzle-orm';
import { jwtGuard } from '../../middlewares/jwtGuard';
import { sendSuccess } from '../../utils/response';
import { createWsTicketDocs } from './docs';
import { AppError } from '../../utils/AppError';

/**
 * WebSocket Module
 * Menangani handshake tiket (OTT) dan koneksi WebSocket real-time.
 */
export const wsModule = new Elysia({ prefix: '/v1/ws' })
  // ── HTTP: Request Ticket ────────────────────────────────────
  .use(jwtGuard)
  .post(
    '/ticket',
    async ({ currentUser, set }) => {
      // Tiket valid selama 60 detik (Sesuai spesifikasi)
      const expiresAt = new Date(Date.now() + 60 * 1000);

      const [ticket] = await db
        .insert(wsTickets)
        .values({
          userId: currentUser.id,
          expiresAt: expiresAt,
        })
        .returning();

      set.status = 201;
      return sendSuccess(
        {
          ticket_id: ticket.id,
          expires_at: ticket.expiresAt.toISOString(),
        },
        'Tiket WebSocket berhasil dibuat'
      );
    },
    createWsTicketDocs
  )

  // ── WebSocket: Real-time Connection ──────────────────────────
  .ws('/connect', {
    query: t.Object({
      ticket: t.String({ description: 'Ticket ID for handshake' })
    }),

    async upgrade({ query }) {
      const ticketId = query.ticket;
      if (!ticketId) throw new AppError(401, 'Tiket WebSocket diperlukan');

      // 1. Validasi Tiket (Exist & Not Expired)
      const ticket = await db.query.wsTickets.findFirst({
        where: (t, { eq, and, gt }) => and(
          eq(t.id, ticketId),
          gt(t.expiresAt, new Date())
        ),
        with: {
          user: {
            with: {
              userRoles: {
                with: {
                  role: true
                }
              }
            }
          }
        }
      });

      if (!ticket || !ticket.user) {
        throw new AppError(401, 'Tiket tidak valid atau sudah kedaluwarsa');
      }

      const user = ticket.user;
      const roleCodes = user.userRoles.map(ur => ur.role.code);

      // 2. Hapus tiket segera setelah handshake (One-Time Ticket)
      await db.delete(wsTickets).where(eq(wsTickets.id, ticketId));

      // 3. Kembalikan data untuk disimpan di context WebSocket (ws.data)
      return {
        user: {
          id: user.id,
          roles: roleCodes
        }
      };
    },

    open(ws) {
      const { user } = ws.data as any;
      if (!user) return ws.close();

      // 4. Join Channels (Pub/Sub)
      // Channel User (Pesan khusus untuk individu ini)
      ws.subscribe(`user:${user.id}`);
      
      // Channel Roles (Broadcast berdasarkan peran, misal: semua 'admin')
      user.roles.forEach((roleCode: string) => {
        ws.subscribe(`role:${roleCode}`);
      });

      console.log(`[WS] User ${user.id} connected to [user:${user.id}] and roles: ${user.roles.join(', ')}`);

      ws.send({
        type: 'WELCOME',
        data: {
          message: 'Terhubung ke server real-time Genba-Hyoka',
          user_id: user.id,
          channels: [`user:${user.id}`, ...user.roles.map((r: string) => `role:${r}`)]
        }
      });
    },

    message(ws, message: any) {
      // 5. Heartbeat Ping-Pong (Sesuai spesifikasi Issue)
      if (message === 'ping') {
        ws.send('pong');
        return;
      }
      
      const { user } = ws.data as any;
      console.log(`[WS] Message from ${user?.id}:`, message);
    },

    close(ws) {
      const { user } = ws.data as any;
      console.log(`[WS] User ${user?.id} disconnected.`);
    }
  });
