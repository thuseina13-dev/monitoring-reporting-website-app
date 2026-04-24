import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { wsTickets } from '../../db/schema';
import { eq, gt } from 'drizzle-orm';
import { jwtGuard } from '../../middlewares/jwtGuard';
import { sendSuccess } from '../../utils/response';
import { createWsTicketDocs } from './docs';
import { AppError } from '../../utils/AppError';

/**
 * WebSocket Module
 * Menangani handshake tiket (OTT) dan koneksi WebSocket real-time.
 */
export const wsModule = new Elysia({ prefix: '/v1/ws' })
  // ── HTTP: Request Ticket ──────────────────
  .group('/ticket', (app) => 
    app
      .use(jwtGuard)
      .post(
        '',
        async ({ currentUser, set }) => {
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
  )

  // ── WebSocket: Real-time Connection ───────
  .ws('/connect', {
    query: t.Object({
      ticket: t.String({ description: 'Ticket ID for handshake' })
    }),

    async upgrade() {},

    async open(ws) {
      const ticketId = ws.data.query.ticket;

      try {
        // 1. Validasi Tiket
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
          return ws.close(1008, 'Authentication Failed');
        }

        // 2. Simpan data user ke dalam context
        const user = ticket.user;
        const roleCodes = user.userRoles.map(ur => ur.role.code);
        
        (ws.data as any).user = {
          id: user.id,
          roles: roleCodes
        };

        // 3. Hapus tiket (One-Time Ticket)
        await db.delete(wsTickets).where(eq(wsTickets.id, ticketId));

        // 4. Join Channels
        ws.subscribe(`user:${user.id}`);
        roleCodes.forEach((roleCode: string) => {
          ws.subscribe(`role:${roleCode}`);
        });

        ws.send({
          type: 'WELCOME',
          data: {
            message: 'Terhubung ke server real-time Genba-Hyoka',
            user_id: user.id,
            channels: [`user:${user.id}`, ...roleCodes.map((r: string) => `role:${r}`)]
          }
        });

      } catch (error) {
        console.error('[WS] Critical error during open event:', error);
        ws.close(1011, 'Internal Server Error');
      }
    },

    message(ws, message: any) {
      if (message === 'ping') {
        ws.send('pong');
        return;
      }
      
      const user = (ws.data as any).user;
      console.log(`[WS] Message from ${user?.id || 'unknown'}:`, message);
    },

    close(ws, code, message) {
      const user = (ws.data as any).user;
      console.log(`[WS] User ${user?.id || 'unknown'} disconnected. Code: ${code}`);
    }
  });
