# Versioning API

Semua rute yang sudah ada tetap hidup di `/api/*` (klien lama tidak pecah).

Mulai sekarang prefiks **`/api/v1/`** adalah alias kanonik ke rute yang sama:

| Klien lama | Klien baru | Perilaku |
| ---------- | ---------- | -------- |
| `GET /api/kesehatan` | `GET /api/v1/kesehatan` | identik |
| `GET /api/anggota` | `GET /api/v1/anggota` | identik |
| `POST /api/auth/login` | `POST /api/v1/auth/login` | identik |

Pemetaan dilakukan di `server/src/jalur-api.js` **sebelum** router mencari
handler, jadi tidak ada duplikasi definisi rute.

Respons `GET /api/kesehatan` menyertakan `versiApi: "v1"`.

## Aturan ke depan

1. **v1 dipertahankan** selama klien produksi masih memakainya.
2. Breaking change → tambah `/api/v2/…`, jangan menimpa v1.
3. Catat breaking change di `CHANGELOG` (bila ada) dengan nomor versi API.
4. Masa deprecation: umumkan dulu, beri header peringatan, baru matikan
   jalur lama setelah klien sempat pindah.

Frontend Vite mem-proxy `/api` apa adanya; tidak perlu env khusus. Klien
baru boleh memanggil `/api/v1/...` langsung.
