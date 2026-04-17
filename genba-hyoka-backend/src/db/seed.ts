import { db } from './index';
import { permissions, rolePermissions, roles, userRoles, users } from './schema';

async function seed() {
    console.log('--- Memulai Seeding Klaster Akses GENBA-HYOKA ---');

    try {
        // 1. Seed Permissions (Locked Data)
        // Sesuai Dokumen: READ=1, CREATE=2, UPDATE=4, DELETE=8
        const permissionData = [
            { code: 'USR', entityName: 'Module Users - GET (Read)', method: 'GET', bitValue: 1 },
            { code: 'USR', entityName: 'Module Users - POST (Create)', method: 'POST', bitValue: 2 },
            { code: 'USR', entityName: 'Module Users - PUT (Update)', method: 'PUT', bitValue: 4 },
            { code: 'USR', entityName: 'Module Users - DELETE (Delete)', method: 'DELETE', bitValue: 8 },

            { code: 'ROL', entityName: 'Module Roles - GET (Read)', method: 'GET', bitValue: 1 },
            { code: 'ROL', entityName: 'Module Roles - POST (Create)', method: 'POST', bitValue: 2 },
            { code: 'ROL', entityName: 'Module Roles - PUT (Update)', method: 'PUT', bitValue: 4 },
            { code: 'ROL', entityName: 'Module Roles - DELETE (Delete)', method: 'DELETE', bitValue: 8 },

            { code: 'PRM', entityName: 'Module Permissions - GET (Read)', method: 'GET', bitValue: 1 },

            { code: 'CPY', entityName: 'Module Company Profile - GET (Read)', method: 'GET', bitValue: 1 },
            { code: 'CPY', entityName: 'Module Company Profile - POST (Create)', method: 'POST', bitValue: 2 },
            { code: 'CPY', entityName: 'Module Company Profile - PUT (Update)', method: 'PUT', bitValue: 4 },
            { code: 'CPY', entityName: 'Module Company Profile - DELETE (Delete)', method: 'DELETE', bitValue: 8 },

            { code: 'AUD', entityName: 'Module Audit Logs - GET (Read)', method: 'GET', bitValue: 1 },

            { code: 'NTF', entityName: 'Module Notifications - GET (Read)', method: 'GET', bitValue: 1 },
            { code: 'NTF', entityName: 'Module Notifications - POST (Create)', method: 'POST', bitValue: 2 },
            { code: 'NTF', entityName: 'Module Notifications - PUT (Update)', method: 'PUT', bitValue: 4 },
            { code: 'NTF', entityName: 'Module Notifications - DELETE (Delete)', method: 'DELETE', bitValue: 8 },

            // Klaster 2 & 3: Task & Field Execution [cite: 186, 235, 255, 267, 378, 381, 384, 390]
            { code: 'TDF', entityName: 'Module Task Definitions - GET (Read)', method: 'GET', bitValue: 1 },
            { code: 'TDF', entityName: 'Module Task Definitions - POST (Create)', method: 'POST', bitValue: 2 },
            { code: 'TDF', entityName: 'Module Task Definitions - PUT (Update)', method: 'PUT', bitValue: 4 },
            { code: 'TDF', entityName: 'Module Task Definitions - DELETE (Delete)', method: 'DELETE', bitValue: 8 },

            { code: 'TAS', entityName: 'Module Task Assignments - GET (Read)', method: 'GET', bitValue: 1 },
            { code: 'TAS', entityName: 'Module Task Assignments - POST (Create)', method: 'POST', bitValue: 2 },
            { code: 'TAS', entityName: 'Module Task Assignments - PUT (Update)', method: 'PUT', bitValue: 4 },
            { code: 'TAS', entityName: 'Module Task Assignments - DELETE (Delete)', method: 'DELETE', bitValue: 8 },

            { code: 'SUB', entityName: 'Module Submission Tasks - GET (Read)', method: 'GET', bitValue: 1 },
            { code: 'SUB', entityName: 'Module Submission Tasks - POST (Create)', method: 'POST', bitValue: 2 },
            { code: 'SUB', entityName: 'Module Submission Tasks - PUT (Update)', method: 'PUT', bitValue: 4 },
            { code: 'SUB', entityName: 'Module Submission Tasks - DELETE (Delete)', method: 'DELETE', bitValue: 8 },

            { code: 'PRB', entityName: 'Module Problem Reports - GET (Read)', method: 'GET', bitValue: 1 },
            { code: 'PRB', entityName: 'Module Problem Reports - POST (Create)', method: 'POST', bitValue: 2 },
            { code: 'PRB', entityName: 'Module Problem Reports - PUT (Update)', method: 'PUT', bitValue: 4 },
            { code: 'PRB', entityName: 'Module Problem Reports - DELETE (Delete)', method: 'DELETE', bitValue: 8 },

            // Klaster 4: Evaluation & Review [cite: 155, 165, 248, 346, 358, 387]
            { code: 'REV', entityName: 'Module Manager Reviews - GET (Read)', method: 'GET', bitValue: 1 },
            { code: 'REV', entityName: 'Module Manager Reviews - POST (Create)', method: 'POST', bitValue: 2 },
            { code: 'REV', entityName: 'Module Manager Reviews - PUT (Update)', method: 'PUT', bitValue: 4 },
            { code: 'REV', entityName: 'Module Manager Reviews - POST (Delete)', method: 'DELETE', bitValue: 8 },

            { code: 'TMP', entityName: 'Module Report Templates - GET (Read)', method: 'GET', bitValue: 1 },
            { code: 'TMP', entityName: 'Module Report Templates - POST (Create)', method: 'POST', bitValue: 2 },
            { code: 'TMP', entityName: 'Module Report Templates - PUT (Update)', method: 'PUT', bitValue: 4 },
            { code: 'TMP', entityName: 'Module Report Templates - DELETE (Delete)', method: 'DELETE', bitValue: 8 },

            { code: 'EVL', entityName: 'Module Evaluation Reports - GET (Read)', method: 'GET', bitValue: 1 },
            { code: 'EVL', entityName: 'Module Evaluation Reports - POST (Create)', method: 'POST', bitValue: 2 },
            { code: 'EVL', entityName: 'Module Evaluation Reports - PUT (UPDATE)', method: 'PUT', bitValue: 4 },
            { code: 'EVL', entityName: 'Module Evaluation Reports - DELETE (Delete)', method: 'DELETE', bitValue: 8 },
        ] as const;

        console.log('Inserting permissions...');
        for (const p of permissionData) {
            await db.insert(permissions).values(p).onConflictDoNothing();
        }

        console.log('✅ Seeding Klaster Akses berhasil!');
    } catch (error) {
        console.error('❌ Seeding gagal:', error);
    }
}


async function seedSuperAdmin() {
    console.log('--- MENCETAK KUNCI MASTER: SUPER ADMIN ---');

    try {
        await db.transaction(async (tx) => {
            // 1. Pastikan Role Super Admin ada
            const [superAdminRole] = await tx.insert(roles)
                .values({
                    name: 'Super Admin',
                    description: 'Pemegang akses penuh seluruh sistem'
                })
                .onConflictDoUpdate({
                    target: roles.name,
                    set: { description: 'Pemegang akses penuh seluruh sistem' }
                })
                .returning();

            // 2. Buat Akun User (Gunakan email & password saja sesuai koreksi sebelumnya)
            const hashedPassword = await Bun.password.hash('Admin123!'); // Ganti dengan password aman
            const [adminUser] = await tx.insert(users)
                .values({
                    fullName: 'Sistem Administrator',
                    email: 'admin@genba.com',
                    password: hashedPassword,
                    isActive: true
                })
                .onConflictDoUpdate({
                    target: users.email,
                    set: { fullName: 'Sistem Administrator' }
                })
                .returning();

            // 3. Hubungkan User ke Role
            await tx.insert(userRoles)
                .values({
                    userId: adminUser.id,
                    roleId: superAdminRole.id
                })
                .onConflictDoNothing();

            // 4. BERIKAN SEMUA HAK AKSES
            // Ambil semua permission yang tersedia di DB
            const allPermissions = await tx.select({ id: permissions.id }).from(permissions);

            if (allPermissions.length > 0) {
                const rolePermsData = allPermissions.map((p) => ({
                    roleId: superAdminRole.id,
                    permissionId: p.id
                }));

                // Masukkan semua relasi secara bulk
                await tx.insert(rolePermissions)
                    .values(rolePermsData)
                    .onConflictDoNothing();
            }

            console.log('✅ Super Admin berhasil dikonfigurasi!');
            console.log('📧 Email: admin@genba.com');
            console.log('🔑 Password: Admin123!');
        });
    } catch (error) {
        console.error('❌ Gagal membuat Super Admin:', error);
    }
}

async function main() {
    await seed();
    await seedSuperAdmin();
    process.exit(0);
}

main();
