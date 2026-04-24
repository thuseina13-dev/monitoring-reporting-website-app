# Elysia with Bun runtime

## Getting Started
To get started with this template, simply paste this command into your terminal:
```bash
bun create elysia ./elysia-example
```

## Development
To start the development server run:
```bash
bun run dev
```

## exmaple .env

# development
## Postgres connection

DB_USER= <!-- DB USERNAME  -->
DB_HOST= <!-- DB HOST URL  -->
DB_PORT= <!-- DB PORT  -->
DB_NAME= <!-- DB USERNAME  -->
DB_PASS= <!-- DB PASS  -->

## JWT configuration
JWT_SECRET= <!-- JWT SECRET  -->
JWT_EXPIRES_IN= <!-- JWT EXPIRES IN  -->
JWT_REFRESH_EXPIRES_IN= <!-- JWT REFRESH EXPIRES IN  -->
JWT_REFRESH_SECRET= <!-- JWT REFRESH SECRET  -->

Open http://localhost:3000/ with your browser to see the result.

---

## 🚀 API Standards: Pagination & Filtering

Proyek ini menggunakan standar respon dan sistem filtering terpusat untuk mempermudah integrasi dengan frontend.

### 1. Paginasi (Pagination)
Sistem mendukung dua model paginasi yang **saling bertentangan** (tidak bisa digunakan bersamaan):

#### A. Traditional (Offset-based)
Cocok untuk navigasi nomor halaman (Halaman 1, 2, 3).
- **Params:** `page` (Halaman), `limit`.
- **Response Meta:** Berisi `total`, `current_page`, `last_page`, dan `has_more`.
- **Contoh:** `GET /v1/users?page=1&limit=10`

#### B. Modern (Cursor-based)
Cocok untuk *Infinite Scroll*. Memberikan performa lebih stabil untuk data besar.
- **Params:** `cursor` (ID data terakhir), `limit`.
- **Response Meta:** Berisi `next_cursor` (ID untuk pemanggilan berikutnya) dan `has_more`.
- **Contoh:** `GET /v1/users?cursor=uuid-user-terakhir&limit=10`

> [!IMPORTANT]
> Mengirimkan parameter `page` dan `cursor` secara bersamaan akan menghasilkan **Error 400 Bad Request**.

---

### 2. Pencarian Global (Global Search)
Gunakan parameter `search` untuk melakukan pencarian di beberapa kolom sekaligus (seperti Name dan Email).
  - **Contoh:** `GET /v1/users?search=alex`
  - **Logika:** Mencari kata kunci "alex" di semua kolom teks yang diizinkan (misal: `fullName` dan `email`) menggunakan operator `OR`.

### 3. Filter Kolom Spesifik (Specific Attribute Filter)
Anda dapat memfilter data berdasarkan kolom tertentu yang terdaftar dalam *whitelist* di backend.
- **Teks (Partial Match):** `?address=jakarta` (Mencari yang mengandung kata "jakarta")
- **Boolean (Exact Match):** `?isActive=true`
- **Enum/UUID (Exact Match):** `?gender=male`

**Penting:** Sistem secara otomatis mendeteksi tipe data kolom di database untuk menentukan apakah harus menggunakan pencarian fleksibel (`LIKE`) atau tepat (`EQUALS`).

### 4. Optional Relation Loading (Include)
Frontend memiliki kendali penuh untuk memuat data relasi tambahan secara opsional guna mengoptimalkan performa.
- **Params:** `include` (comma separated).
- **Contoh:** `GET /v1/users?include=roles,company`
- **Tingkat Kedalaman**: Relasi akan dimuat secara *nested* dalam satu response JSON.
- **Efisiensi**: Jika `include` tidak dikirim, backend tidak akan melakukan query ke tabel relasi (Lazy Load).

---

## 🛠️ Backend Development: Drizzle RQB

Backend menggunakan **Drizzle Relational Query Builder (RQB)** untuk pengelolaan data yang lebih deklaratif dan bersih.

### 1. Mendefinisikan Relasi
Pastikan relasi sudah didefinisikan di file `schema.ts`:
```typescript
export const usersRelations = relations(users, ({ one, many }) => ({
  companyProfile: one(companyProfiles, { fields: [users.companyProfileId], references: [companyProfiles.id] }),
  userRoles: many(userRoles),
}));
```

### 2. Helper `buildRQBWhere`
Gunakan helper `buildRQBWhere` untuk menangani filtering otomatis di dalam query RQB.

```typescript
import { buildRQBWhere } from '../../../utils/filter';

// Di dalam handler GET
const filterOptions = {
  searchFields: ['fullName', 'email'], // Kolom untuk parameter ?search
  exactFields: ['isActive', 'companyProfileId'], // Kolom untuk filter EQUALS (ID/Boolean)
  excludeFields: ['password'], // Kolom yang tidak boleh difilter
  customConditions: [isNull(users.deletedAt)] // Kondisi tambahan tetap (opsional)
};

const list = await db.query.users.findMany({
  where: (fields, ops) => buildRQBWhere(fields, ops, query, filterOptions),
  with: {
    // Definisi relasi yang di-include
    ...(includeCompany && { companyProfile: { columns: { id: false, name: true } } }),
  }
});
```

### 3. Keunggulan RQB
- **Auto-Nesting**: Tidak perlu melakukan mapping manual `.map()` untuk data relasi.
- **Column Filtering**: Bisa melakukan *exclude* kolom (misal: `id: false` pada relasi) secara deklaratif.
- **Safe Pagination**: Terintegrasi otomatis dengan logic cursor pagination melalui parameter `cursor`.

---

## 5. Catatan Tambahan (Notes)
- **Case-Insensitive**: Semua pencarian teks (`search`, `address`, `fullName`, dll) bersifat tidak peka huruf besar/kecil.
- **Default Sorting**: Secara default, data diurutkan berdasarkan `ID` secara `ASC` untuk stabilitas paginasi cursor.
- **Audit Logs**: Setiap operasi Write (POST/PUT/DELETE) wajib menyertakan `createAuditLog` di dalam transaksi database.
