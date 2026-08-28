# Catatan cepat deploy Vercel dan akses dashboard pengurus

> File ini dibuat sebagai pintasan dari permintaan “varcel.md”. Panduan utama
> yang lengkap tetap ada di `PANDUAN-DEPLOY-FULL-VERCEL.md`.

## Akses dashboard pengurus

Dashboard ada di:

```text
https://<nama-proyek>.vercel.app/pengurus
```

Login memakai:

```text
Username: KCI_ADMIN_USER
Password: KCI_ADMIN_PASSWORD
```

Bawaan lokal adalah `admin / admin123`, tetapi untuk Vercel/produksi wajib
ganti password melalui Environment Variables lalu **Redeploy**.

## Environment Variables minimum di Vercel

Isi di **Vercel → Project → Settings → Environment Variables**:

| Key | Isi |
| --- | --- |
| `KCI_PEPPER` | rahasia hashing, minimal 16 karakter |
| `KCI_ADMIN_USER` | contoh: `admin` |
| `KCI_ADMIN_PASSWORD` | password kuat, bukan `admin123` |
| `KCI_ASAL_DIIZINKAN` | `https://<nama-proyek>.vercel.app` tanpa trailing slash |

Opsional: `KCI_TOKEN_ADMIN` bila masih ingin memakai token lama sebagai password
alternatif.

Untuk FULL VERCEL, kosongkan/hapus `VITE_API_DASAR` agar frontend memanggil
API di domain yang sama (`/api/...`).

## Setelah mengubah env

1. Buka tab **Deployments** di Vercel.
2. Pilih deployment terbaru.
3. Klik **Redeploy**.
4. Tes `https://<nama-proyek>.vercel.app/api/kesehatan`.
5. Buka `https://<nama-proyek>.vercel.app/pengurus` dan login.
