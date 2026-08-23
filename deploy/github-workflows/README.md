# Template GitHub Actions

Folder ini menyimpan workflow sebagai Markdown (`*.yml.md`) agar perubahan
kode dapat di-push oleh koneksi GitHub yang belum diberi izin `workflows`.
GitHub **tidak akan menjalankan** file di folder ini.

Setelah branch/PR ini sudah masuk ke repository, lakukan dari komputer lokal
dengan akun GitHub yang memiliki izin workflow write:

```bash
# Dari akar repository yang sudah terbaru.
mkdir -p .github/workflows
cp deploy/github-workflows/deploy.yml.md .github/workflows/deploy.yml
cp deploy/github-workflows/quality.yml.md .github/workflows/quality.yml
cp deploy/github-workflows/health.yml.md .github/workflows/health.yml

git add .github/workflows
git commit -m "ci: enable deployment, quality, and health workflows"
git push
```

Sebelum mengaktifkan `health.yml`, tambahkan repository variable `KCI_API_URL`
di GitHub. Lihat `CHECKLIST-IMPLEMENTASI-LOKAL.md` untuk daftar konfigurasi.
