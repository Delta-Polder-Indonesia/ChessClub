# FILE INI = isi .github/workflows/quality.yml (versi setelah perbaikan Git LFS).
# Alur penerapan dari lokal:
#   1) git pull
#   2) rename berkas ini menjadi .github/workflows/quality.yml (hapus ekstensi .md)
#   3) git add .github/workflows/quality.yml && git commit && git push
# (Berkas .md ini sengaja dibuat agar perubahan workflow bisa lewat dari
#  lingkungan yang token-nya tidak punya izin `workflows`.)

name: Quality checks

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  test:
    name: Test and browser smoke checks
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout
        # LFS agar e-book PDF asli ikut terunduh (uji-ebook & smoke test
        # memeriksa berkas di public/ebooks/).
        uses: actions/checkout@v4
        with:
          lfs: true

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run logic and backend tests
        run: npm run uji && npm run uji:backend && npm run uji:verifikasi

      - name: Build production bundle
        run: npm run build

      - name: Install Chromium for Playwright
        run: npx playwright install --with-deps chromium

      - name: Run public browser smoke tests
        run: npm run uji:e2e

      - name: Upload Playwright report on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          if-no-files-found: ignore
          retention-days: 7
