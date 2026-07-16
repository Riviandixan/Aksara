# AksaraAI

Platform belajar bahasa asing berbasis AI yang membuat jalur belajar personal secara otomatis. Dibangun dengan React, Node.js, dan MySQL.

## Fitur

- **AI Learning Path** — jalur belajar personal di-generate otomatis oleh AI berdasarkan bahasa dan level yang dipilih
- **Kuis Interaktif** — 3 tipe soal: pilihan ganda, terjemahan, dan susun kata
- **Battle Mode** — kuis real-time multiplayer menggunakan Socket.IO
- **Exam Mode** — ujian dengan soal dari quiz package
- **Quiz Packages** — buat dan bagikan paket soal kustom
- **Sistem XP & Streak** — poin pengalaman dan streak harian
- **Leaderboard** — papan peringkat antar pengguna
- **Analytics** — statistik belajar personal
- **Avatar Kustom** — pilih avatar dengan DiceBear

## Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS
- React Router DOM
- Axios
- Socket.IO Client
- Recharts

**Backend**
- Node.js + Express
- MySQL2
- Socket.IO
- JWT Authentication
- Groq AI SDK / Google Generative AI
- Bcryptjs, Helmet, Joi

## Struktur Project

```
AksaraAI/
├── backend/
│   ├── config/          # Konfigurasi DB & AI
│   ├── controllers/     # Request handlers
│   ├── database/        # Schema SQL & migration
│   ├── middlewares/     # Auth middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── socket/          # Socket.IO handlers
│   ├── utils/           # Helper functions
│   ├── validators/      # Request validation
│   └── index.js
└── frontend/
    └── src/
        ├── components/  # Reusable components
        ├── hooks/       # Custom hooks
        ├── pages/       # Halaman aplikasi
        └── services/    # API service calls
```

## Cara Menjalankan Lokal

### Prasyarat
- Node.js >= 18
- MySQL >= 8

### 1. Clone repository

```bash
git clone https://github.com/USERNAME/aksara-ai.git
cd aksara-ai
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

Isi file `.env` dengan konfigurasi kamu:

```env
PORT=6001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=db_aksara_ai
JWT_SECRET=your_secret_key
GROQ_API_KEY=your_groq_api_key
```

Import database schema:

```bash
mysql -u root -p < database/schema.sql
```

Jalankan backend:

```bash
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install
```

Buat file `.env` di folder frontend:

```env
VITE_API_URL=http://localhost:6001/api
VITE_SOCKET_URL=http://localhost:6001
```

Jalankan frontend:

```bash
npm run dev
```

Aplikasi berjalan di `http://localhost:5173`

## Environment Variables

### Backend

| Variable | Keterangan |
|---|---|
| `PORT` | Port server (default: 6001) |
| `DB_HOST` | Host database MySQL |
| `DB_PORT` | Port database MySQL |
| `DB_USER` | Username database |
| `DB_PASSWORD` | Password database |
| `DB_NAME` | Nama database |
| `JWT_SECRET` | Secret key untuk JWT |
| `JWT_EXPIRES_IN` | Masa berlaku token (default: 7d) |
| `GROQ_API_KEY` | API key dari [Groq](https://console.groq.com) |

### Frontend

| Variable | Keterangan |
|---|---|
| `VITE_API_URL` | URL base API backend |
| `VITE_SOCKET_URL` | URL Socket.IO backend |

## Bahasa yang Tersedia

🇬🇧 English · 🇯🇵 Japanese · 🇰🇷 Korean · 🇫🇷 French · 🇩🇪 German · 🇨🇳 Chinese · 🇷🇺 Russian · 🇪🇸 Spanish

## Lisensi

Riviandixan
