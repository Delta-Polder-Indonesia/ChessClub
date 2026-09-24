/**
 * Cek koneksi basis data awan (Chess Cloud Database — chessdb.cn).
 *
 * Sandbox pengembangan/agen sering tanpa akses internet, jadi jalur ini hanya
 * bisa diuji dari mesin yang benar-benar tersambung ke jaringan. Skrip ini
 * memanggil klien SERVER yang sama dengan yang dipakai `/api/basisdata-awan`,
 * lalu mencetak hasilnya — termasuk penanganan `unknown` dan galatnya.
 *
 * Pakai:
 *   node scripts/cek-basisdata-awan.mjs
 *   node scripts/cek-basisdata-awan.mjs "rnbqkbnr/pppp1ppp/8/4p3/4P1P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2"
 */
import { GalatAwan, bersihkanFen, tanyaAwan } from "../server/src/basisDataAwan.js";

// Posisi sesudah 1.e4 e5 2.Nf3 Nc6 3.Bb5 — sudah di luar buku pembukaan lokal
// yang kecil, tapi pasti dikenal basis data awan.
const CONTOH = "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3";

const fen = process.argv[2] || CONTOH;
const posisi = bersihkanFen(fen);
if (!posisi) {
  console.error(`FEN tidak sah: ${fen}`);
  process.exit(1);
}

console.log(`Posisi : ${posisi}`);
console.log("Menanyakan https://www.chessdb.cn/cdb.php (action=queryall, learn=0) …\n");

try {
  const hasil = await tanyaAwan(posisi);
  if (!hasil.diketahui && !hasil.langkah.length) {
    console.log(
      hasil.akhir
        ? `Posisi sudah berakhir: ${hasil.akhir}.`
        : "Belum ada data untuk posisi ini (\"unknown\") — di UI pesannya \"Posisi ini belum ada di basis data awan\"."
    );
    process.exit(0);
  }
  if (!hasil.diketahui) {
    console.log(
      'Belum ada langkah BERNILAI — semua langkah masih "??" (belum dianalisis). ' +
        "Di UI: daftar abu-abu terlipat + tawaran menyalakan engine; cache pendek (5 menit)."
    );
  }
  console.log(`Sumber : ${hasil.sumber} (${hasil.diambilPada})`);
  console.log(`Dinilai: ${hasil.jumlahDinilai} bernilai + ${hasil.jumlahBelumDinilai} belum dinilai`);
  console.log("Langkah:");
  for (const l of hasil.langkah) {
    const skor = l.mat ? " mat " : l.skorCp === null ? "  —  " : `${(l.skorCp / 100).toFixed(2).padStart(6)}`;
    const wr = l.winrate === null ? " — " : `${l.winrate}%`;
    console.log(
      `  ${(l.san || l.uci).padEnd(8)} uci=${l.uci.padEnd(6)} skor=${skor} winrate=${wr.padEnd(7)} catatan=${l.catatan || "-"}${l.dinilai ? "" : " [belum dinilai]"}`
    );
  }
  console.log(
    "\nCatatan: skor (sentipion) dari sudut pandang pihak yang sedang jalan — positif = lebih baik."
  );
  console.log('Pemetaan ke UI: langkah bernilai → tabel tab "Partai"; "??" → lipatan abu-abu; langkah teratas bernilai → kalimat komentator.');
} catch (e) {
  if (e instanceof GalatAwan) {
    console.error(`GAGAL (status ${e.status}, kode ${e.sebab}): ${e.message}`);
    if (e.status === 503) {
      console.error("Periksa koneksi internet mesin ini, lalu coba lagi.");
    }
  } else {
    console.error("GAGAL:", e);
  }
  process.exit(1);
}
