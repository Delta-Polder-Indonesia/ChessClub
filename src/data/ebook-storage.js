/**
 * Konfigurasi legacy untuk mode lokal saja.
 *
 * Production TIDAK membaca EBOOK_BASE. API production hanya memakai
 * KCI_EBOOK_PRIVATE_BASE atau bucket privat Supabase `ebooks-private` dari
 * server/src/ebook-storage.js. Frontend juga tidak mengimpor nilai ini;
 * semua akses browser melewati /api/ebook-preview dengan tiket redemption.
 *
 * Nilai ini tetap tersedia untuk sumber cadangan mode dev/preview bila
 * pengembangan lokal memakai object storage yang dapat dijangkau.
 */
export const EBOOK_BASE = "";
