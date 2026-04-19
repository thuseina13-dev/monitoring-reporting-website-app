import { db } from './index';
import { permissions, rolePermissions, roles, userRoles, users } from './schema';
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

async function seedPermissions() {
    console.log('--- Memulai Seeding 52 Izin Modul GENBA-HYOKA ---');

    const modules = [
        { code: 'USR', name: 'Users' },
        { code: 'ROL', name: 'Roles' },
        { code: 'PRM', name: 'Permissions' },
        { code: 'CPY', name: 'Company Profile' },
        { code: 'AUD', name: 'Audit Logs' },
        { code: 'NTF', name: 'Notifications' },
        { code: 'TDF', name: 'Task Definitions' },
        { code: 'TAS', name: 'Task Assignments' },
        { code: 'SUB', name: 'Submission Tasks' },
        { code: 'PRB', name: 'Problem Reports' },
        { code: 'REV', name: 'Manager Reviews' },
        { code: 'TMP', name: 'Report Templates' },
        { code: 'EVL', name: 'Evaluation Reports' },
    ];

    const methods = [
        { method: 'GET', bit: 1, suffix: '(Read)' },
        { method: 'POST', bit: 2, suffix: '(Create)' },
        { method: 'PUT', bit: 4, suffix: '(Update)' },
        { method: 'DELETE', bit: 8, suffix: '(Delete)' },
    ] as const;

    try {
        const permissionData: any[] = [];
        
        for (const mod of modules) {
            for (const met of methods) {
                permissionData.push({
                    code: mod.code,
                    entityName: `${mod.name} - ${met.method} ${met.suffix}`,
                    method: met.method,
                    bitValue: met.bit,
                });
            }
        }

        console.log(`Inserting ${permissionData.length} permissions...`);
        for (const p of permissionData) {
            await db.insert(permissions)
                .values(p)
                .onConflictDoNothing({ target: [permissions.code, permissions.method] });
        }

        console.log('✅ Seeding Izin berhasil!');
    } catch (error) {
        console.error('❌ Seeding Izin gagal:', error);
        throw error;
    }
}

async function syncSuperAdmin() {
    console.log('--- SINKRONISASI AKUN MASTER: SUPER ADMIN ---');

    try {
        await db.transaction(async (tx) => {
            // 1. Pastikan Role Super Admin ada (Idempoten)
            const [superAdminRole] = await tx.insert(roles)
                .values({
                    name: 'Super Admin',
                    type: 'super_admin',
                    description: 'Pemegang akses penuh seluruh sistem'
                })
                .onConflictDoUpdate({
                    target: roles.name,
                    set: { 
                        type: 'super_admin',
                        description: 'Pemegang akses penuh seluruh sistem' 
                    }
                })
                .returning();

            // 2. Sinkronisasi User (Hanya Email & Password, Reset Password dari .env)
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
                        password: hashedPassword, // Emergency Reset Capability
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

            // 4. Sinkronisasi Seluruh Hak Akses (Bulk)
            const allPermissions = await tx.select({ id: permissions.id }).from(permissions);
            
            if (allPermissions.length > 0) {
                const rolePermsData = allPermissions.map((p) => ({
                    roleId: superAdminRole.id,
                    permissionId: p.id
                }));

                await tx.insert(rolePermissions)
                    .values(rolePermsData)
                    .onConflictDoNothing();
            }

            console.log('✅ Sinkronisasi Super Admin berhasil!');
            console.log(`📧 Email: ${SUPER_ADMIN_EMAIL}`);
            console.log('🔑 Password: (Dikonfigurasi di .env)');
        });
    } catch (error) {
        console.error('❌ Sinkronisasi Super Admin gagal:', error);
        throw error;
    }
}

async function main() {
    try {
        await validateEnv();
        await seedPermissions();
        await syncSuperAdmin();
        console.log('\n--- PROSES SEEDING SELESAI ---');
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

main();
