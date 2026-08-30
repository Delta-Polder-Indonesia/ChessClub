# FILE INI = isi .github/workflows/deploy.yml (versi setelah perbaikan Git LFS).
# Alur penerapan dari lokal:
#   1) git pull
#   2) rename berkas ini menjadi .github/workflows/deploy.yml (hapus ekstensi .md)
#   3) git add .github/workflows/deploy.yml && git commit && git push
# (Berkas .md ini sengaja dibuat agar perubahan workflow bisa lewat dari
#  lingkungan yang token-nya tidak punya izin `workflows`.)

name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    # Alamat backend yang dipakai frontend saat di GitHub Pages. GitHub Pages
    # tidak bisa mem-proxy /api/*, jadi frontend harus memanggil backend
    # langsung. Ganti lewat repository variable KCI_API_URL bila backend
    # pindah alamat; bawaan mengikuti PANDUAN-DEPLOY.md.
    env:
      VITE_API_DASAR: ${{ vars.KCI_API_URL || 'https://kci-api.onrender.com' }}
      # Samakan dengan KCI_CHESS_KLUB di backend bila klub Chess.com berubah.
      # Repository variable ini opsional; nilai bawaan adalah klub saat ini.
      VITE_CHESS_KLUB: ${{ vars.KCI_CHESS_KLUB || 'blunder-skuad' }}
    steps:
      - name: Checkout
        # `lfs: true` WAJIB — e-book di public/ebooks/ disimpan lewat Git LFS.
        # Tanpa ini checkout hanya berisi pointer 132 byte, bukan PDF asli,
        # dan situs yang terbit akan menyajikan e-book rusak.
        uses: actions/checkout@v4
        with:
          lfs: true
      
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build -- --base=/${{ github.event.repository.name }}/
      
      - name: Verifikasi e-book PDF asli
        # Pengaman terakhir: kalau checkout LFS gagal/terlewat, dist/ berisi
        # pointer LFS teks — deploy harus berhenti, bukan menerbitkan situs
        # dengan tombol Baca/Unduh yang rusak.
        run: |
          BERKAS=(dist/ebooks/*.pdf)
          if [ ! -e "${BERKAS[0]}" ]; then
            echo "::error::Tidak ada e-book PDF di dist/ebooks/ — cek build/LFS."
            exit 1
          fi
          GAGAL=0
          for f in "${BERKAS[@]}"; do
            if [ "$(head -c 4 "$f")" != "%PDF" ]; then
              echo "::error::E-book bukan PDF asli: $f ($(wc -c < "$f") byte)"
              GAGAL=1
            fi
          done
          if [ "$GAGAL" = "1" ]; then exit 1; fi
          echo "Semua e-book PDF asli terverifikasi (${#BERKAS[@]} berkas)."
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
