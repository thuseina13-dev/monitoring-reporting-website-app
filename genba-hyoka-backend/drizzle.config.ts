import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Lokasi file skema utama yang mengekspor semua tabel akses kita 
  schema: './src/db/schema.ts',
  
  // Folder tempat menyimpan file migrasi SQL nantinya
  out: './drizzle',
  
  // Dialek database sesuai dokumen teknis 
  dialect: 'postgresql',
  
  // Kredensial database menggunakan variabel .env yang sudah kita buat
  dbCredentials: {
    host: process.env.DB_HOST || 'null',
    port: Number(process.env.DB_PORT) || 5542,
    user: process.env.DB_USER || '',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || '',
    ssl: false, // Set true jika menggunakan database cloud seperti Supabase/Neon
  },
  
  // Memastikan penamaan tabel di database tetap rapi
  verbose: true,
  strict: true,
});