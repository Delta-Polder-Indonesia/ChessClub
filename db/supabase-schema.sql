-- ============================================================================
-- Komunitas Catur Indonesia — penyimpanan persisten untuk FULL VERCEL
-- ============================================================================
-- Mengapa perlu dijalankan?
--   Pada mode FULL VERCEL, backend berjalan sebagai Serverless Function dan
--   menulis data ke /tmp yang bersifat sementara (hilang saat cold start /
--   redeploy). Karena itu pendaftaran anggota, hasil turnamen, berita, pesan,
--   dan data pengurus "hilang".
--
--   Tabel `kci_storage` ini menampung SELURUH data tersebut dalam PostgreSQL
--   (Supabase). Setiap "berkas" (anggota.json, turnamen.json, pesan.json,
--   rahasia/admins.json, rahasia/jejak-audit.jsonl, dst.) disimpan sebagai
--   SATU BARIS:
--       id   = kunci relatif (mis. "anggota.json", "rahasia/admins.json")
--       data = isi JSON / JSONL
--
--   Ya, ini penyimpanan "key-value per-berkas" — memang dirancang agar seluruh
--   logika aplikasi yang sudah ada (baca-ubah-tulis, antrean serial, dll.)
--   TIDAK PERLU diubah. Cukup jalankan skrip ini sekali, lalu set variabel
--   lingkungan di Vercel.
-- ============================================================================

-- Jalankan di Supabase: Project Settings → SQL Editor → New query → Run.
-- (Atau gunakan Supabase CLI: supabase db push)

create table if not exists public.kci_storage (
  id         text primary key,              -- kunci relatif berkas
  data       text not null default '',      -- isi JSON / JSONL
  updated_at timestamptz not null default now()
);

-- Mempermudah melihat data terbaru saat inspeksi dan pengurutan.
create index if not exists kci_storage_updated_at_idx
  on public.kci_storage (updated_at desc);

-- ----------------------------------------------------------------------------
-- Keamanan (Row Level Security)
-- ----------------------------------------------------------------------------
-- Backend memakai SERVICE ROLE KEY (SUPABASE_SERVICE_ROLE_KEY) untuk baca dan
-- tulis. Service role melewati RLS, jadi kita TIDAK boleh membuka akses
-- ke tabel ini untuk peran `anon` (publik) — kalau dibuka, siapa pun yang
-- memiliki anon key bisa membaca/menulis data termasuk admin & kontak pribadi.
alter table public.kci_storage enable row level security;

-- (Jangan tambahkan kebijakan peran anon! Hanya service role yang berhak.)

-- ----------------------------------------------------------------------------
-- Contoh memeriksa hasil:
--   select id, length(data) as ukuran, updated_at from public.kci_storage
--   order by updated_at desc limit 5;
--
-- Contoh menghapus satu berkas (mis. reset pesan):
--   delete from public.kci_storage where id = 'pesan.json';
-- ============================================================================
