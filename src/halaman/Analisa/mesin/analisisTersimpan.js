/**
 * Pendaftaran hasil analisis per partai — padanan `analysis.resultsByGameId`
 * milik repo acuan ChessGameReviewer.
 *
 * Di acuan, peta ini hidup di state workspace (`features/workspace/reducer.ts`):
 * setiap kali analisis satu partai selesai dengan status `complete`, hasilnya
 * disimpan `{ ...resultsByGameId, [gameId]: result }` (case `analysis/terminal`),
 * lalu diteruskan ke dashboard sebagai prop `analysisMap`
 * (`ChessWorkspace.tsx`: `analysisMap={state.analysis.resultsByGameId ?? {}}`).
 *
 * Repo ini tidak punya reducer workspace, jadi peta yang sama ditaruh di modul
 * ini dengan langganan (subscribe) supaya layar Wawasan ikut ter-render ulang
 * saat sebuah partai selesai dianalisis — perilaku yang di acuan didapat gratis
 * dari React state.
 *
 * Sama seperti acuan, isinya SESI SAJA (tidak dipersistenkan): menutup halaman
 * mengosongkannya lagi. Konsekuensinya kartu "Akurasi" hanya terisi oleh
 * partai yang sudah dianalisis pada sesi itu, atau oleh akurasi terbitan
 * platform yang ikut tersimpan saat tarik data (lihat `accuracies` di
 * ./wawasan.js).
 */

const hasilPerPartai = new Map();
const pendengar = new Set();

function beriKabar() {
  for (const cb of Array.from(pendengar)) {
    try {
      cb();
    } catch {
      /* pendengar tidak boleh merusak pencatatan */
    }
  }
}

/**
 * Simpan hasil analisis satu partai — case `analysis/terminal` acuan:
 * hanya status `complete` yang masuk peta.
 *
 * @param {string} idPartai kunci partai (lihat `kunciPetaAnalisis` di
 *   `komponen/nav/layarWawasan.jsx`)
 * @param {object} hasil keluaran `ringkasAnalisis` (./ringkasanAnalisis.js)
 */
export function catatAnalisis(idPartai, hasil) {
  const kunci = String(idPartai ?? "").trim();
  if (!kunci || !hasil || hasil.status !== "complete") return;
  hasilPerPartai.set(kunci, hasil);
  beriKabar();
}

/** Buang satu entri (mis. partai dihapus dari basis data). */
export function hapusAnalisis(idPartai) {
  const kunci = String(idPartai ?? "").trim();
  if (!kunci || !hasilPerPartai.has(kunci)) return;
  hasilPerPartai.delete(kunci);
  beriKabar();
}

/** Kosongkan seluruh peta (mis. papan dikosongkan lewat menu "Baru"). */
export function bersihkanAnalisis() {
  if (hasilPerPartai.size === 0) return;
  hasilPerPartai.clear();
  beriKabar();
}

/**
 * Snapshot siap pakai sebagai `analysisMap` — bentuknya `Record<id, hasil>`,
 * sama seperti prop yang diterima `aggregateAllInsights` di acuan.
 * Objek BARU setiap panggilan supaya `useMemo` pemanggil benar-benar melihat
 * perubahan (bukan referensi yang sama selamanya).
 */
export function ambilPetaAnalisis() {
  return Object.fromEntries(hasilPerPartai);
}

/** Jumlah entri saat ini — untuk teks "N partai dianalisis pada sesi ini". */
export function jumlahAnalisis() {
  return hasilPerPartai.size;
}

/**
 * Berlangganan perubahan peta.
 * @returns {Function} fungsi berhenti berlangganan.
 */
export function langgananAnalisis(cb) {
  if (typeof cb !== "function") return () => {};
  pendengar.add(cb);
  return () => {
    pendengar.delete(cb);
  };
}
