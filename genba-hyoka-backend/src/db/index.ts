import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Mengambil variabel dari process.env
const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

// Validasi sederhana agar tidak terjadi error saat runtime
if (!DB_HOST || !DB_USER || !DB_PASS || !DB_NAME) {
  throw new Error("Konfigurasi database di .env belum lengkap!");
}

// Menyusun Connection String
const connectionString = `postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT || 5432}/${DB_NAME}`;

// Inisialisasi client postgres.js
const client = postgres(connectionString, { 
  prepare: false // Disarankan untuk kompatibilitas yang lebih luas
});

// Export instance db untuk digunakan di seluruh aplikasi
export const db = drizzle(client);

// Helper function untuk cek koneksi (Sanity Check)
export const checkConnection = async () => {
  try {
    await client`SELECT 1`;
    return true;
  } catch (err) {
    console.error("Database connection failed:", err);
    return false;
  }
};