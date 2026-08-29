# Kebijakan keamanan — Komunitas Catur Indonesia

## Melaporkan celah

Kirim deskripsi, langkah reproduksi, dan dampak ke pengurus repositori
(GitHub Security Advisory lebih disukai daripada issue publik).

Kami menargetkan konfirmasi dalam 7 hari dan perbaikan atau mitigasi
dalam 90 hari (responsible disclosure). Jangan publikasikan exploit
sebelum patch tersedia.

Jangan kirim data pribadi anggota, password, atau dump `data/rahasia/`
lewat saluran tidak terenkripsi.

---

## Aset

| Aset | Mengapa penting |
| ---- | --------------- |
| Data pribadi anggota (HP, nama, email, DANA) | Privasi; disimpan terpisah di `data/rahasia/kontak.json` |
| Hash identitas + pepper | Mencegah akun-kecil / pendaftar berulang |
| Akun pengurus (JWT, password bcrypt) | Kendali daftar larangan, turnamen, konten |
| Hasil turnamen | Integritas kompetisi |

## Ancaman dan mitigasi

| Ancaman | Mitigasi |
| ------- | -------- |
| Injeksi / JSON rusak | Parser JSON ketat; tidak ada SQL; tidak ada `eval` |
| Brute-force login | Rate-limit + kunci IP setelah 5 gagal / 15 menit |
| CSRF | Token `X-CSRF-Token` wajib di POST (kecuali login yang sudah di-rate-limit) |
| XSS | CSP ketat pada JSON API; frontend React escape bawaan |
| CORS liar | `KCI_ASAL_DIIZINKAN` wajib di produksi |
| Spoof IP | `X-Forwarded-For` hanya dihormati jika `KCI_JUMLAH_PROXY` > 0 |
| Kredensial bocor | `.gitignore` untuk `.env`, `data/rahasia/`; scanner GitHub |
| Timing attack token | `crypto.timingSafeEqual` lewat hash SHA-256 |

## Arsitektur

- **Autentikasi pengurus:** JWT HS256 (24 jam) + kompatibilitas token/password legacy.
- **Otorisasi:** peran `master` / `pengurus`.
- **Identitas anggota:** hash ber-pepper (`KCI_PEPPER`) + bcrypt untuk password admin.
- **Transport:** HTTPS wajib di produksi (Vercel/Render menyediakan TLS).

## Checklist rutin

- [ ] Rahasia hanya di env vars platform, bukan di Git.
- [ ] `npm audit` di CI (`quality.yml`).
- [ ] Review PR yang menyentuh `server/src/http.js`, `keanggotaan.js`, `admin-file.js`.
- [ ] Setelah insiden: putar `KCI_JWT_SECRET` (mematikan sesi), **jangan** putar
      `KCI_PEPPER` kecuali siap membangun ulang daftar hitam identitas.

## Batasan yang diketahui

- Rate-limit dan token CSRF **ephemeral** di Vercel (lihat `VERCEL-LIMITATIONS.md`).
- `X-Forwarded-For` berbahaya jika `KCI_JUMLAH_PROXY` salah.
- Penyimpanan JSON tidak scale melewati ribuan anggota — lihat `DATABASE-MIGRATION.md`.
- Login admin tanpa CSRF: dilindungi brute-force, tetap wajib password kuat.

## Observabilitas (opsional)

Sentry belum diikat ke kode agar DSN tidak ikut repo. Bila diaktifkan:

- Backend: `@sentry/node` di `tangani` (hanya `Galat` 500).
- Frontend: `@sentry/react` + Error Boundary.
- Sample: 100% error, 10% transaksi.
- Jangan kirim body request, token, atau field `data/rahasia`.
