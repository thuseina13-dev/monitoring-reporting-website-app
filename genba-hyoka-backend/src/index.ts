import { Elysia } from 'elysia';
import { checkConnection } from './db';

import { errorHandler } from './middlewares/errorHandler';
import { authModule } from './modules/auth';
import { usersModule } from './modules/user-management/users';
import { rolesModule } from './modules/user-management/roles';
import { companyProfileModule } from './modules/user-management/company-profile';
import { swagger } from '@elysiajs/swagger';
import { errorSchema } from './utils/schema';

import { cors } from '@elysiajs/cors';

import { wsModule } from './modules/ws';
import { notificationsModule } from './modules/notifications';

const app = new Elysia({
  websocket: {
    idleTimeout: 60, // Sesuai spesifikasi untuk pembersihan memori
  }
})
  .use(cors())
  .model({
    ErrorResponse: errorSchema,
  })
  .use(swagger({
    path: '/docs',
    documentation: {
      info: {
        title: 'GENBA-HYOKA API Documentation',
        version: '1.0.0',
        description: 'API Documentation for Monitoring and Reporting System',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  }))
  .use(errorHandler)
  .use(authModule)
  .use(wsModule)
  .use(usersModule)
  .use(rolesModule)
  .use(companyProfileModule)
  .use(notificationsModule)
  .onStart(async () => {
    const isConnected = await checkConnection();
    if (isConnected) {
      console.log('✅ GENBA-HYOKA Database: Connected successfully.');

      // Pembersihan tiket kedaluwarsa berkala (Setiap 1 jam)
      setInterval(async () => {
        try {
          const { wsTickets } = await import('./db/schema');
          const { lt } = await import('drizzle-orm');
          const { db } = await import('./db');
          await db.delete(wsTickets).where(lt(wsTickets.expiresAt, new Date()));
          console.log('🧹 [Cleanup] Tiket WebSocket kedaluwarsa berhasil dibersihkan.');
        } catch (error) {
          console.error('❌ [Cleanup] Gagal membersihkan tiket:', error);
        }
      }, 3600 * 1000);

    } else {
      console.error('❌ GENBA-HYOKA Database: Connection failed. Shuting down...');
      process.exit(1);
    }
  })
  .get('/', () => ({
    projectName: "GENBA-HYOKA",
    status: "Online"
  }))
  .listen(3000);

console.log(`🚀 Server is running at ${app.server?.hostname}:${app.server?.port}`);