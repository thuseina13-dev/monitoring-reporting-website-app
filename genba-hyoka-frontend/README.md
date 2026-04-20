# Genba Hyoka Frontend 📱

Project frontend untuk sistem Monitoring & Reporting, dibangun menggunakan **React Native (Expo)** dengan **Tamagui** untuk UI framework.

## 🚀 Teknologi yang Digunakan

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **UI Framework**: [Tamagui](https://tamagui.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [React Query (TanStack Query)](https://tanstack.com/query/latest)
- **Logic & Type Safety**: TypeScript & Zod
- **API Client**: Axios

---

## 🛠️ Langkah Instalasi

Ikuti langkah-langkah di bawah ini untuk menjalankan project di perangkat lokal Anda:

### 1. Prasyarat
Pastikan Anda sudah menginstal:
- [Node.js](https://nodejs.org/) (Rekomendasi versi LTS)
- [npm](https://www.npmjs.com/) atau [Yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) di smartphone Anda (opsional, untuk testing di HP) atau Android Emulator/iOS Simulator.

### 2. Clone Repository
```bash
git clone <repository-url>
cd genba-hyoka-frontend
```

### 3. Instal Dependensi
Gunakan npm untuk menginstal semua library yang dibutuhkan:
```bash
npm install
```

---

## ⚙️ Konfigurasi Environment (`.env`)

Project ini menggunakan variabel environment untuk menghubungkan frontend dengan backend.

1. Duplikat file `.env.example` dan ubah namanya menjadi `.env`:
   ```bash
   cp .env.example .env
   ```

2. Buka file `.env` dan sesuaikan nilainya:

| Variabel | Deskripsi | Contoh Nilai |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_ENV` | Environment saat ini | `development` |
| `EXPO_PUBLIC_API_URL` | URL API Backend | `http://localhost:3000/v1` |
| `EXPO_PUBLIC_WS_URL` | URL WebSocket Backend | `ws://localhost:3000/ws` |
| `SUPER_ADMIN_EMAIL` | Email akun master | `admin@genba.com` |
| `SUPER_ADMIN_PASSWORD` | Password akun master | `ResetPwd999!` |

> [!IMPORTANT]
> **Catatan untuk Android Emulator:**
> Jika Anda menggunakan Android Emulator, gunakan IP `http://10.0.2.2:3000/v1` karena emulator menganggap `localhost` sebagai dirinya sendiri, bukan mesin host Anda.

---

## 🏃 Menjalankan Aplikasi

Setelah instalasi dan konfigurasi selesai, jalankan perintah berikut:

- **Mulai Expo Dev Server:**
  ```bash
  npm start
  ```
- **Menjalankan di Android:**
  ```bash
  npm run android
  ```
- **Menjalankan di iOS:**
  ```bash
  npm run ios
  ```
- **Menjalankan di Web:**
  ```bash
  npm run web
  ```

Setelah server berjalan, tekan `a` untuk Android, `i` untuk iOS, atau scan QR code yang muncul menggunakan aplikasi **Expo Go**.

---

## 🧪 Testing & Linting

- **Menjalankan Unit Test:**
  ```bash
  npm test
  ```
- **Cek Linting:**
  ```bash
  npm run lint
  ```

---

## 📁 Struktur Folder Utama

- `src/app/`: File-file routing (Expo Router).
- `src/components/`: Komponen UI reusable.
- `src/services/`: Logika API dan integrasi backend.
- `src/store/`: State management menggunakan Zustand.
- `src/hooks/`: Custom React hooks.
- `src/theme/`: Konfigurasi tema Tamagui.
