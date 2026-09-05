#!/usr/bin/env bash
#
# Keluarkan e-book PDF dari Git LFS → simpan sebagai berkas biasa di Git.
#
# Kenapa perlu: Vercel TIDAK menarik objek Git LFS saat build, jadi berkas
# yang tersaji hanya *pointer* teks 132 byte. Dengan PDF disimpan biasa,
# `dist/ebooks/*.pdf` berisi PDF asli dan tombol Baca/Unduh bekerja tanpa
# bergantung pada kuota bandwidth LFS (gratis hanya 1 GiB/bulan).
#
# Skrip ini TIDAK menulis ulang riwayat dan TIDAK melakukan push. Commit lama
# tetap berisi pointer (tidak masalah); commit baru berisi PDF asli.
#
# Pakai:
#   bash scripts/keluar-dari-lfs.sh --periksa   # hanya memeriksa, tanpa ubah
#   bash scripts/keluar-dari-lfs.sh             # lakukan migrasi + commit
#
# Setelah selesai:
#   git push origin <nama-branch-anda>
#
set -euo pipefail

AKAR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$AKAR"

DIR_EBOOK="public/ebooks"
BATAS_TOLAK=$((100 * 1024 * 1024)) # GitHub menolak berkas ≥ 100 MB
BATAS_PERINGATAN=$((50 * 1024 * 1024))
PERIKSA_SAJA=0
[[ "${1:-}" == "--periksa" ]] && PERIKSA_SAJA=1

info() { printf '\033[1;34m•\033[0m %s\n' "$*"; }
oke() { printf '\033[1;32m✓\033[0m %s\n' "$*"; }
awas() { printf '\033[1;33m!\033[0m %s\n' "$*"; }
mati() {
  printf '\033[1;31m✗\033[0m %s\n' "$*" >&2
  exit 1
}

# ---------------------------------------------------------------- prasyarat --
command -v git >/dev/null || mati "git tidak ditemukan."
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || mati "bukan repositori Git."

if git lfs version >/dev/null 2>&1; then
  info "Menarik isi asli dari Git LFS (git lfs pull)…"
  git lfs install --skip-repo >/dev/null 2>&1 || true
  git lfs pull --include="$DIR_EBOOK/*" || awas "git lfs pull gagal — lanjut memeriksa berkas yang ada."
else
  awas "git-lfs tidak terpasang. Pasang dulu (https://git-lfs.com) agar isi asli bisa ditarik."
fi

# ------------------------------------------------------------- pemeriksaan --
info "Memeriksa $DIR_EBOOK …"
jumlah=0
total=0
rusak=()
kebesaran=()
raksasa=()

while IFS= read -r -d '' berkas; do
  jumlah=$((jumlah + 1))
  ukuran=$(wc -c <"$berkas")
  total=$((total + ukuran))
  awal=$(head -c 4 "$berkas")
  [[ "$awal" == "%PDF" ]] || rusak+=("$berkas")
  ((ukuran >= BATAS_TOLAK)) && raksasa+=("$berkas ($((ukuran / 1024 / 1024)) MB)")
  ((ukuran >= BATAS_PERINGATAN && ukuran < BATAS_TOLAK)) && kebesaran+=("$berkas ($((ukuran / 1024 / 1024)) MB)")
done < <(find "$DIR_EBOOK" -maxdepth 1 -type f -iname '*.pdf' -print0 | sort -z)

oke "$jumlah berkas PDF, total $((total / 1024 / 1024)) MB."

if ((${#rusak[@]})); then
  printf '\n'
  awas "Masih berupa pointer LFS / bukan PDF (${#rusak[@]} berkas):"
  printf '    %s\n' "${rusak[@]}"
  mati "Jalankan 'git lfs install && git lfs pull' di mesin yang punya akses LFS, lalu ulangi."
fi

if ((${#raksasa[@]})); then
  printf '\n'
  awas "Berkas ≥ 100 MB — GitHub akan MENOLAK push-nya:"
  printf '    %s\n' "${raksasa[@]}"
  mati "Kompres dulu (mis. Ghostscript) atau simpan berkas itu di object storage."
fi

if ((${#kebesaran[@]})); then
  awas "Berkas ≥ 50 MB (GitHub memberi peringatan, tetap diterima):"
  printf '    %s\n' "${kebesaran[@]}"
fi

if ((PERIKSA_SAJA)); then
  oke "Mode --periksa: tidak ada yang diubah. Semua siap dimigrasikan."
  exit 0
fi

# --------------------------------------------------------------- migrasi ----
info "Menghapus aturan LFS untuk *.pdf dari .gitattributes…"
if grep -q '^\*\.pdf filter=lfs' .gitattributes 2>/dev/null; then
  # Simpan cadangan supaya mudah dibatalkan.
  cp .gitattributes .gitattributes.bak
  grep -v '^\*\.pdf filter=lfs' .gitattributes >.gitattributes.baru
  mv .gitattributes.baru .gitattributes
  rm -f .gitattributes.bak
  oke "Aturan '*.pdf filter=lfs' dihapus."
else
  awas "Aturan *.pdf tidak ada di .gitattributes — mungkin sudah dimigrasikan."
fi

info "Menulis ulang isi berkas ke Git biasa (git add --renormalize)…"
git add --renormalize .gitattributes "$DIR_EBOOK"

if git diff --cached --quiet; then
  awas "Tidak ada perubahan yang perlu di-commit."
  exit 0
fi

git commit -m "chore(ebooks): simpan PDF sebagai berkas Git biasa (keluar dari LFS)

Vercel tidak menarik objek Git LFS saat build sehingga yang tersaji hanya
pointer 132 byte. Dengan PDF disimpan biasa, dist/ebooks/*.pdf berisi PDF
asli dan pratinjau tidak lagi bergantung pada kuota bandwidth LFS."

oke "Commit dibuat. Langkah terakhir:"
cat <<'PESAN'

    git push origin <nama-branch-anda>

  Setelah deploy selesai, pastikan berkas statisnya sudah PDF asli:

    curl -sI "https://<domain-anda>/ebooks/Problem%20Catur%20288.pdf" | head -3
    curl -s  "https://<domain-anda>/ebooks/Problem%20Catur%20288.pdf" | head -c 4   # harus %PDF

  Opsional (setelah semua aman):
    - hapus 'lfs: true' di deploy.yml & quality.yml,
    - jalankan 'git lfs uninstall' bila tidak memakai LFS untuk apa pun lagi.
PESAN
