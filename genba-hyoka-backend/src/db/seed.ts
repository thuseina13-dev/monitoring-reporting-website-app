import { db } from './index';
import { roles, userRoles, users } from './schema';
import { sql } from 'drizzle-orm';

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;

async function validateEnv() {
    console.log('--- Validasi Konfigurasi Lingkungan (.env) ---');
    if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
        console.error('❌ ERROR: SUPER_ADMIN_EMAIL atau SUPER_ADMIN_PASSWORD tidak ditemukan di .env!');
        process.exit(1);
    }
    console.log('✅ Konfigurasi .env valid.');
}

async function seedRoles() {
    console.log('--- Sinkronisasi Roles ---');
    const roleList = [
        { name: 'Super Admin', type: 'super_admin', description: 'Pemegang akses penuh seluruh sistem' },
        { name: 'Administrator', type: 'admin', description: 'Administrator sistem' },
        { name: 'Manager', type: 'manager', description: 'Manager Area' },
        { name: 'Employee', type: 'employee', description: 'Operator Lapangan' },
    ];

    for (const r of roleList) {
        await db.insert(roles)
            .values(r as any)
            .onConflictDoUpdate({
                target: roles.name,
                set: {
                    type: r.type as any,
                    description: r.description
                }
            });
    }
    console.log('✅ Seeding Roles berhasil!');
}

async function syncSuperAdmin() {
    console.log('--- SINKRONISASI AKUN MASTER: SUPER ADMIN ---');

    try {
        await db.transaction(async (tx) => {
            // 1. Dapatkan Role Super Admin
            const [superAdminRole] = await tx.select().from(roles).where(sql`type = 'super_admin'`).limit(1);
            if (!superAdminRole) throw new Error('Role super_admin tidak ditemukan. Jalankan seedRoles dulu.');

            // 2. Sinkronisasi User
            const hashedPassword = await Bun.password.hash(SUPER_ADMIN_PASSWORD!);
            
            const [adminUser] = await tx.insert(users)
                .values({
                    fullName: 'Sistem Administrator',
                    email: SUPER_ADMIN_EMAIL!,
                    password: hashedPassword,
                    isActive: true
                })
                .onConflictDoUpdate({
                    target: users.email,
                    set: { 
                        password: hashedPassword,
                        fullName: 'Sistem Administrator'
                    }
                })
                .returning();

            // 3. Hubungkan User ke Role
            await tx.insert(userRoles)
                .values({
                    userId: adminUser.id,
                    roleId: superAdminRole.id
                })
                .onConflictDoNothing();

            console.log('✅ Sinkronisasi Super Admin berhasil!');
            console.log(`📧 Email: ${SUPER_ADMIN_EMAIL}`);
        });
    } catch (error: any) {
        console.error('❌ Sinkronisasi Super Admin gagal:', error.message);
        throw error;
    }
}

async function main() {
    try {
        await validateEnv();
        await seedRoles();
        await syncSuperAdmin();
        console.log('\n--- PROSES SEEDING SELESAI ---');
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

main();

