# Jalur migrasi JSON → PostgreSQL

> **Jalur cepat (tidak perlu mengubah skema):** aplikasi sudah mendukung
> penyimpanan key-value `kci_storage` di Supabase. Jalankan
> `db/supabase-schema.sql`, isi `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
> di Vercel, redeploy. Lihat `PANDUAN-DEPLOY-FULL-VERCEL.md` Bagian 9.
> Bagian di bawah ini menggambarkan migrasi ke skema relasional penuh bagi
> yang ingin tabel per-entitas.

Penyimpanan sekarang adalah berkas JSON atomik (`server/src/simpanan.js`).
Cocok sampai ribuan anggota. Pertimbangkan pindah ke PostgreSQL ketika:

- anggota klub **> 5.000**, atau
- tulis bersamaan (pendaftaran + hasil turnamen) mulai antri terasa lambat, atau
- FULL VERCEL tidak lagi memadai karena `/tmp` ephemeral.

## Skema usulan

```sql
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  username VARCHAR(25) UNIQUE NOT NULL,
  player_id BIGINT,
  panggilan VARCHAR(30),
  kota VARCHAR(60),
  klub VARCHAR(60),
  elo_rating INT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE member_contacts (
  username VARCHAR(25) PRIMARY KEY REFERENCES members (username),
  nama_lengkap VARCHAR(80) NOT NULL,
  hp VARCHAR(20),
  dana VARCHAR(20),
  email VARCHAR(120),
  tanggal_lahir DATE
);

CREATE TABLE blacklist (
  username VARCHAR(25) PRIMARY KEY,
  alasan VARCHAR(80),
  keterangan TEXT,
  sumber VARCHAR(20),
  blocked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tournaments (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(60) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE results (
  id SERIAL PRIMARY KEY,
  tournament_id TEXT REFERENCES tournaments (id),
  round INT NOT NULL,
  white_player VARCHAR(25) NOT NULL,
  black_player VARCHAR(25) NOT NULL,
  score VARCHAR(7) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_members_username ON members (username);
CREATE INDEX idx_results_tournament ON results (tournament_id);
```

Hash identitas (`identitas`, `sidikPepper`) tetap di kolom terpisah yang
**tidak** ikut SELECT publik.

## Transformasi data

1. Baca `data/anggota.json`, `data/daftar-hitam.json`, `data/turnamen.json`,
   `data/rahasia/kontak.json`.
2. Sisipkan dalam **satu transaksi**.
3. Validasi jumlah baris = jumlah entri JSON.
4. Simpan arsip tar.gz (lihat `scripts/backup-data.mjs`) sebelum cutover.

## Zero-downtime (garis besar)

1. Backend baru menulis ke Postgres, masih bisa baca JSON sebagai fallback.
2. Dual-run 1–2 hari; bandingkan jumlah anggota/hasil.
3. Matikan jalur JSON.
4. Rollback: hidupkan lagi proses lama + restore tar.gz. Jangan hapus JSON
   sampai retensi 14 hari terlewati.

## Hosting

Neon, Supabase, Railway, atau Postgres di Render. Set `DATABASE_URL` di env;
jangan commit kredensial.
