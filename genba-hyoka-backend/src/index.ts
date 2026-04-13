import { Elysia } from 'elysia';
import { checkConnection } from './db';

import { errorHandler } from './middlewares/errorHandler';
import { authModule } from './modules/auth';
import { usersModule } from './modules/user-management/users';
import { rolesModule } from './modules/user-management/roles';
import { swagger } from '@elysiajs/swagger';

const app = new Elysia()
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
  .use(usersModule)
  .use(rolesModule)
  .onStart(async () => {
    const isConnected = await checkConnection();
    if (isConnected) {
      console.log('✅ GENBA-HYOKA Database: Connected successfully.');
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