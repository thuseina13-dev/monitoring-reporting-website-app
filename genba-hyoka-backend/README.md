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

**Integrasi:** Anda dapat menggabungkan `search` dengan filter spesifik. Contoh: `GET /v1/users?search=alex&isActive=true` akan mencari user dengan nama/email mengandung "alex" DAN statusnya aktif.

### 4. Advanced Nested Filtering (Level 3)
Sistem mendukung logika bertingkat (**Nested AND/OR**) tanpa batas menggunakan format objek kueri.

**Skenario:** Cari user yang [(**Aktif** DAN **Laki-Laki**) OR (**Tidak Aktif** DAN **Perempuan**)]
- **URL:** 
  `?or[0][and][isActive]=true&or[0][and][gender]=male&or[1][and][isActive]=false&or[1][and][gender]=female`

**Skenario:** Cari user yang **Aktif** DAN (**Nama mengandung 'alex'** OR **Email mengandung 'admin'**)
- **URL:** 
  `?isActive=true&or[fullName]=alex&or[email]=admin`

**Kombinasi:**
Anda bisa menggabungkan semua filter di atas secara rekursif sesuai kebutuhan logika bisnis frontend.

---


