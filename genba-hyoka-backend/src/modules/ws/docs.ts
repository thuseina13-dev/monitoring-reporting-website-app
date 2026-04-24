import { t } from 'elysia';
import { successResponse, errorResponses } from '../../utils/schema';

export const wsTicketResponseSchema = t.Object({
  ticket_id: t.String({ format: 'uuid' }),
  expires_at: t.String({ format: 'date-time' }),
});

export const createWsTicketDocs = {
  detail: {
    summary: 'Request WebSocket Handshake Ticket',
    description: 'Menghasilkan tiket satu kali pakai (OTT) untuk upgrade koneksi WebSocket. Tiket berlaku selama 60 detik. Membutuhkan autentikasi JWT.',
    tags: ['WebSocket'],
    security: [{ bearerAuth: [] }],
  },
  response: {
    201: successResponse(wsTicketResponseSchema),
    ...errorResponses([401, 500]),
  },
};
