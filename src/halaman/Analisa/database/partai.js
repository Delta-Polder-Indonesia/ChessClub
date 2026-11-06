/**
 * CRUD + kueri partai (IndexedDB dengan cadangan memori/localStorage).
 *
 * Isi: pembentukan ID & normalisasi rekaman, penyimpanan massal, mesin kueri
 * (pemilihan indeks, penyaring, pengurutan, paginasi berbasis kursor), baca
 * satu partai, hapus partai, dan impor PGN.
 *
 * Dependensi: `./migrasi.js` (koneksi, konstanta store, cadangan) dan bus
 * revisi dari `./index.js`. Tidak ada perubahan perilaku dari `basisData.js`
 * lama — kode dipindahkan apa adanya.
 */
import { Chess } from "chess.js";
import { hashPgn, pecahMultiPgn } from "../../../lib/pgnRingan.js";
import {
  STORE_PARTAI,
  STORE_KOLEKSI,
  memoriPartai,
  memoriKoleksi,
  bukaDB,
  simpanFallbackKeStorage,
} from "./migrasi.js";
import { naikkanRevisi } from "./index.js";

export function buatIdPartai(p, platform = "chessCom", username = "") {
  if (p.id) return String(p.id);
  const plat = (p.platform || platform || "chessCom").toLowerCase();
  const user = (p.username || username || "").toLowerCase();
  if (p.url) {
    const akhir = String(p.url).trim().split("/").filter(Boolean).pop();
    if (akhir) return `${plat}:${user ? user + ":" : ""}${akhir}`;
  }
  const w = String(p.whiteName || "").trim().toLowerCase();
  const b = String(p.blackName || "").trim().toLowerCase();
  const t = Number(p.timestamp) || 0;
  const ply = Number(p.plyCount) || 0;
  return `${plat}:${user}:${w}_vs_${b}_${t}_${ply}`;
}

/**
 * Hasil partai → bentuk baku "white" | "black" | "draw".
 *
 * Menerima ejaan PGN ("1-0"), kata bahasa Inggris ("white"), dan bentuk
 * baku itu sendiri; NILAI LAIN — "1/2-1/2", "½-½", "draw", "*", string
 * kosong, `undefined`, sampah — semuanya berarti "bukan kemenangan siapa
 * pun" → "draw". Searah dengan tampilan tabel (`½ - ½` untuk selain
 * white/black) supaya nilai yang tersimpan tidak pernah "bocor" dari
 * ketiga bentuk ini dan filter hasil selalu bisa mencocokkannya.
 */
export function normalisasiHasil(hasil) {
  const h = String(hasil ?? "").trim().toLowerCase();
  if (h === "1-0" || h === "white") return "white";
  if (h === "0-1" || h === "black") return "black";
  return "draw";
}

/**
 * Normalisasi data partai agar formatnya seragam dan aman disimpan.
 */
export function normalisasiDataPartai(p, platform = "chessCom", username = "") {
  const plat = String(p.platform || platform || "chessCom").trim();
  const user = String(p.username || username || "").trim();
  const pgn = typeof p.pgn === "string" ? p.pgn : "";
  let plyCount = Number(p.plyCount) || 0;

  if (!plyCount && pgn) {
    try {
      const catur = new Chess();
      catur.loadPgn(pgn);
      plyCount = catur.history().length;
    } catch {
      plyCount = 0;
    }
  }

  const wName = String(p.whiteName ?? p.white?.username ?? "").trim();
  const bName = String(p.blackName ?? p.black?.username ?? "").trim();
  const wElo = Number(p.whiteElo ?? p.white?.rating) || 0;
  const bElo = Number(p.blackElo ?? p.black?.rating) || 0;

  // Header [Event]/[Site] diangkat ke metadata: tabel Database bisa
  // menampilkan kolom Event/Site tanpa harus memuat teks PGN.
  const event = String(p.event || /\[Event\s+"([^"]*)"\]/.exec(pgn)?.[1] || "").trim();
  const site = String(p.site || /\[Site\s+"([^"]*)"\]/.exec(pgn)?.[1] || "").trim();

  let hasil = p.result;
  if (!hasil) {
    if (p.white?.result === "win") hasil = "white";
    else if (p.black?.result === "win") hasil = "black";
    else hasil = "draw";
  }
  // Kunci tiga bentuk baku — nilai tak dikenal ("*", sampah API) menjadi
  // "draw", bukan tersimpan apa adanya lalu hilang dari semua filter.
  hasil = normalisasiHasil(hasil);

  const timestamp = Number(p.timestamp) || (p.end_time ? p.end_time * 1000 : Date.now());
  const id = buatIdPartai({ ...p, whiteName: wName, blackName: bName, timestamp, plyCount }, plat, user);

  return {
    id,
    koleksiId: `${plat}:${user.toLowerCase()}`,
    platform: plat,
    username: user,
    url: p.url || "",
    pgn,
    whiteName: wName,
    blackName: bName,
    whiteElo: wElo,
    blackElo: bElo,
    result: hasil,
    timestamp,
    timeClass: p.timeClass || p.time_class || "unknown",
    event,
    site,
    plyCount,
    // Panjang teks PGN disimpan sebagai metadata: panel Database bisa
    // menampilkan ukuran penyimpanan koleksi tanpa membuka teks PGN penuh
    // ribuan partai (yang dulu menumpuk di memori tiap popup dibuka).
    ukuranPgn: typeof pgn === "string" ? pgn.length : 0,
    /*
     * Akurasi terbitan platform (`{ white, black }`) — angka yang dikirim
     * chess.com/lichess bersama partainya, BUKAN hasil hitungan engine kita.
     * Disimpan apa adanya saat tarik data supaya layar Wawasan bisa langsung
     * menampilkan akurasi tanpa menganalisis ulang ribuan partai.
     *
     * Polanya menyalin repo acuan ChessGameReviewer
     * (`features/ingestion/ingestionService.ts`: `...(raw.accuracies ? {
     * accuracies: raw.accuracies } : {})`): field-nya HILANG bila tidak ada,
     * bukan diisi null — sehingga `p.accuracies` yang falsy berarti
     * "platform tidak mengirim angka", dan UI tidak boleh menampilkannya
     * sebagai 0%. Partai lama yang terlanjur tersimpan tanpa field ini tetap
     * terbaca normal (tambahan murni, tidak perlu naik versi DB).
     */
    ...(p.accuracies && typeof p.accuracies === "object"
      ? { accuracies: p.accuracies }
      : {}),
    disimpanPada: p.disimpanPada || Date.now(),
  };
}

/**
 * Simpan banyak partai sekaligus ke IndexedDB (dan update metadata koleksi).
 */
export async function simpanBanyakPartai(daftarPartai, { platform = "chessCom", username = "" } = {}) {
  if (!Array.isArray(daftarPartai) || daftarPartai.length === 0) {
    return { tersimpan: 0, total: 0 };
  }

  const plat = platform.trim();
  const user = username.trim();
  const koleksiId = `${plat}:${user.toLowerCase()}`;
  const daftarNormal = daftarPartai.map((p) => normalisasiDataPartai(p, plat, user)).filter((p) => p.pgn);

  const db = await bukaDB();
  if (!db) {
    // Fallback memori
    for (const p of daftarNormal) memoriPartai.set(p.id, p);
    const hitung = Array.from(memoriPartai.values()).filter((p) => p.koleksiId === koleksiId).length;
    memoriKoleksi.set(koleksiId, {
      id: koleksiId,
      platform: plat,
      username: user,
          label: user ? `${user} ${plat === "chessCom" ? "Chess.com" : plat === "lichessOrg" ? "Lichess.org" : plat}` : plat,
      jumlahPartai: hitung,
      terakhirDisinkronkan: Date.now(),
      dibuatPada: memoriKoleksi.get(koleksiId)?.dibuatPada || Date.now(),
    });
    simpanFallbackKeStorage();
    if (daftarNormal.length > 0) naikkanRevisi();
    return { tersimpan: daftarNormal.length, total: hitung };
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_PARTAI, STORE_KOLEKSI], "readwrite");
      const storePartai = tx.objectStore(STORE_PARTAI);
      const storeKoleksi = tx.objectStore(STORE_KOLEKSI);

      for (const p of daftarNormal) {
        storePartai.put(p);
      }

      /*
       * Hitung ulang isi koleksi lewat indeks `koleksiWaktu` (kunci
       * `koleksiId` yang sudah huruf kecil semua). Versi lama memakai
       * indeks [platform, username] dengan ejaan asli — meleset bila
       * akunnya ber-huruf besar, sehingga kartu koleksi menampilkan angka
       * yang salah. `dibuatPada` dipertahankan dari rekaman lama.
       */
      let totalKoleksi = daftarNormal.length;
      const tulisKoleksi = (total) => {
        totalKoleksi = total;
        const reqKol = storeKoleksi.get(koleksiId);
        const simpan = (lama) => {
          storeKoleksi.put({
            id: koleksiId,
            platform: plat,
            username: user,
            label: user ? `${user} ${plat === "chessCom" ? "Chess.com" : plat === "lichessOrg" ? "Lichess.org" : plat}` : plat,
            jumlahPartai: total,
            terakhirDisinkronkan: Date.now(),
            dibuatPada: lama?.dibuatPada || Date.now(),
          });
        };
        reqKol.onsuccess = () => simpan(reqKol.result);
        reqKol.onerror = () => simpan(null);
      };
      try {
        let reqCount;
        if (storePartai.indexNames.contains("koleksiWaktu")) {
          reqCount = storePartai
            .index("koleksiWaktu")
            .count(IDBKeyRange.bound([koleksiId, -Infinity], [koleksiId, Infinity]));
        } else {
          reqCount = storePartai.index("kombinasi").count(IDBKeyRange.only([plat, user]));
        }
        reqCount.onsuccess = () => tulisKoleksi(reqCount.result || daftarNormal.length);
        reqCount.onerror = () => tulisKoleksi(daftarNormal.length);
      } catch {
        tulisKoleksi(daftarNormal.length);
      }

      tx.oncomplete = () => {
        if (daftarNormal.length > 0) naikkanRevisi();
        resolve({ tersimpan: daftarNormal.length, total: totalKoleksi });
      };
      tx.onerror = () => {
        resolve({ tersimpan: 0, total: 0 });
      };
    } catch {
      resolve({ tersimpan: 0, total: 0 });
    }
  });
}

/* ── Lapisan kueri: paginasi berbasis kursor ───────────────────────── */

/**
 * Pilih indeks paling sempit yang tersedia untuk kombinasi filter pemilik,
 * lengkap dengan rentang kuncinya. Semua indeks di sini berakhiran
 * `timestamp` sehingga kursornya sudah urut waktu — tidak perlu memuat
 * seluruh partai hanya untuk mengurutkannya.
 */
function pilihIndeks(store, platform, username, koleksiId) {
  const punya = (nama) => {
    try {
      return store.indexNames.contains(nama);
    } catch {
      return false;
    }
  };
  const BAWAH = -Infinity;
  const ATAS = Infinity;

  /*
   * Koleksi didahulukan. Selain paling sering dipakai (pengguna memilih satu
   * akun di panel Database), ini juga menutup bug lama: `koleksiId` disimpan
   * dengan username huruf kecil, sedangkan field `username` menyimpan ejaan
   * asli. Mencocokkan lewat indeks [platform, username] karena itu meleset
   * untuk akun ber-huruf besar dan tabelnya tampak kosong.
   */
  if (koleksiId && punya("koleksiWaktu")) {
    return {
      sumber: store.index("koleksiWaktu"),
      rentang: IDBKeyRange.bound([koleksiId, BAWAH], [koleksiId, ATAS]),
      urutWaktu: true,
      pemilikTerpenuhi: true,
    };
  }

  if (platform && username && punya("kombinasiWaktu")) {
    return {
      sumber: store.index("kombinasiWaktu"),
      rentang: IDBKeyRange.bound([platform, username, BAWAH], [platform, username, ATAS]),
      urutWaktu: true,
      pemilikTerpenuhi: false,
    };
  }
  if (platform && !username && punya("platformWaktu")) {
    return {
      sumber: store.index("platformWaktu"),
      rentang: IDBKeyRange.bound([platform, BAWAH], [platform, ATAS]),
      urutWaktu: true,
      pemilikTerpenuhi: false,
    };
  }
  if (username && !platform && punya("usernameWaktu")) {
    return {
      sumber: store.index("usernameWaktu"),
      rentang: IDBKeyRange.bound([username, BAWAH], [username, ATAS]),
      urutWaktu: true,
      pemilikTerpenuhi: false,
    };
  }
  if (!platform && !username && punya("timestamp")) {
    return { sumber: store.index("timestamp"), rentang: null, urutWaktu: true, pemilikTerpenuhi: false };
  }

  /* Basis data lama (belum punya indeks gabungan berwaktu): tetap jalan,
     hanya tanpa keuntungan lompat-offset. */
  if (platform && username && punya("kombinasi")) {
    return { sumber: store.index("kombinasi"), rentang: IDBKeyRange.only([platform, username]), urutWaktu: false, pemilikTerpenuhi: false };
  }
  if (platform && punya("platform")) {
    return { sumber: store.index("platform"), rentang: IDBKeyRange.only(platform), urutWaktu: false, pemilikTerpenuhi: false };
  }
  if (username && punya("username")) {
    return { sumber: store.index("username"), rentang: IDBKeyRange.only(username), urutWaktu: false, pemilikTerpenuhi: false };
  }
  return { sumber: store, rentang: null, urutWaktu: false, pemilikTerpenuhi: false };
}

/** Buang teks PGN dari satu baris daftar (tabel hanya butuh metadatanya). */
function tanpaTeksPgn(partai) {
  if (!partai || typeof partai !== "object") return partai;
  const { pgn, ...sisa } = partai;
  return sisa;
}

/**
 * Penyaring sisi klien untuk hal-hal yang tidak bisa dilayani indeks:
 * koleksi, kata kunci, hasil, dan kelas waktu.
 */
function buatPenyaring({ koleksiId, cari, hasil, timeClass, username }) {
  const kata = cari && cari.trim() ? cari.trim().toLowerCase() : "";
  const kelas = timeClass && timeClass !== "all" ? timeClass.toLowerCase() : "";
  const nama = (username || "").toLowerCase();

  return (p) => {
    if (!p) return false;
    if (koleksiId && p.koleksiId !== koleksiId) return false;
    if (kata) {
      const cocok =
        p.whiteName?.toLowerCase().includes(kata) ||
        p.blackName?.toLowerCase().includes(kata) ||
        p.pgn?.toLowerCase().includes(kata);
      if (!cocok) return false;
    }
    if (hasil) {
      if (hasil === "white" || hasil === "black" || hasil === "draw") {
        if (p.result !== hasil) return false;
      } else if ((hasil === "win" || hasil === "loss") && !nama) {
        // Menang/kalah TANPA nama pembanding tidak bisa diartikan — tidak
        // ada baris yang cocok. Dulu cabang ini lolos (tak ada yang menolak)
        // sehingga "filter menang + username kosong" menampilkan SEMUA baris.
        return false;
      } else if (hasil === "win" && nama) {
        const menang =
          (p.result === "white" && p.whiteName?.toLowerCase() === nama) ||
          (p.result === "black" && p.blackName?.toLowerCase() === nama);
        if (!menang) return false;
      } else if (hasil === "loss" && nama) {
        const kalah =
          (p.result === "white" && p.whiteName?.toLowerCase() !== nama) ||
          (p.result === "black" && p.blackName?.toLowerCase() !== nama);
        if (!kalah) return false;
      }
    }
    if (kelas && p.timeClass?.toLowerCase() !== kelas) return false;
    return true;
  };
}

function bandingkan(urut, arah) {
  const pengali = arah === "asc" ? 1 : -1;
  return (a, b) => {
    if (urut === "langkah") return ((a.plyCount ?? 0) - (b.plyCount ?? 0)) * pengali;
    if (urut === "pemain") {
      const cmp = (a.whiteName || "").localeCompare(b.whiteName || "");
      return (cmp || (a.blackName || "").localeCompare(b.blackName || "")) * pengali;
    }
    if (urut === "hasil") {
      const nilai = (r) => (r === "white" ? 1 : r === "black" ? -1 : 0);
      return (nilai(a.result) - nilai(b.result)) * pengali;
    }
    return (a.timestamp - b.timestamp) * pengali;
  };
}

/** Jalankan kursor pada indeks terpilih; `pada(nilai)` boleh mengembalikan "stop". */
function telusuriKursor(sumber, rentang, arah, pada) {
  return new Promise((selesai) => {
    try {
      /*
       * Transaksi yang diaborsi (tab lain menaikkan versi, kuota penuh)
       * TIDAK selalu memicu `onerror` pada request — tanpa kait `onabort`
       * ini pemindaian menggantung selamanya dan tabel Database macet pada
       * status "memuat". Sumber (store/indeks) selalu membawa referensi
       * transaksinya, jadi tidak perlu mengubah tanda tangan fungsi.
       */
      try {
        const tx = sumber?.transaction;
        if (tx) tx.onabort = () => selesai(false);
      } catch {
        /* abaikan — onerror di bawah tetap jadi jaring pengaman */
      }
      const req = sumber.openCursor(rentang, arah);
      req.onsuccess = (e) => {
        const kursor = e.target.result;
        if (!kursor) {
          selesai(true);
          return;
        }
        const hasil = pada(kursor);
        if (hasil === "stop") {
          selesai(true);
          return;
        }
        if (hasil === "lanjut" || hasil === undefined) kursor.continue();
      };
      req.onerror = () => selesai(false);
    } catch {
      selesai(false);
    }
  });
}

/*
 * `null` = GAGAL menghitung (bukan "nol baris") — pemanggil wajib
 * membedakannya, jangan menjumlahkannya.
 */
function hitungCepat(sumber, rentang) {
  return new Promise((selesai) => {
    try {
      const req = sumber.count(rentang);
      req.onsuccess = () => selesai(req.result || 0);
      req.onerror = () => selesai(null);
    } catch {
      selesai(null);
    }
  });
}

/**
 * Ambil daftar partai dengan opsi penyaringan, pencarian, dan pengurutan.
 *
 * PENTING — hanya satu halaman yang dibaca dari IndexedDB.
 * Sebelumnya fungsi ini memanggil `store.getAll()`: seluruh partai (berikut
 * teks PGN masing-masing, ribuan baris) dimuat ke memori setiap kali tabel
 * berpindah halaman, lalu dipotong dengan `slice`. Sekarang:
 *
 *  - tanpa filter & urut tanggal → jumlah total diambil lewat `count()`,
 *    lalu kursor `advance(offset)` melompat langsung ke halaman yang diminta
 *    dan hanya membaca `limit` rekaman;
 *  - dengan filter → kursor tetap menelusuri (perlu untuk menghitung total),
 *    tetapi hanya baris di jendela halaman yang disimpan, sisanya dibuang;
 *  - `sertakanPgn: false` membuang teks PGN dari hasil — tabel hanya perlu
 *    metadata, dan PGN penuh diambil sesuai kebutuhan lewat `ambilPartai(id)`.
 *
 * @param {object} opsi
 * @param {boolean} [opsi.sertakanPgn=true] sertakan teks PGN pada tiap baris.
 * @returns {Promise<{partai: object[], total: number, galat?: boolean}>}
 * `galat: true` berarti "GAGAL DIBACA" — bedakan dari "kosong" (daftar
 * valid yang memang tidak berisi baris). Pemanggil yang menelan galat
 * menjadi `[]` menampilkan koleksi rusak sebagai koleksi kosong tanpa
 * kabar; selalu teruskan ke pemberitahuan (lihat layarDatabase.jsx).
 */
export async function ambilDaftarPartai(opsi = {}) {
  const {
    koleksiId = "",
    platform = "",
    username = "",
    cari = "", // cocokkan nama pemain atau isi PGN
    hasil = "", // "white" | "black" | "draw" | "win" | "loss"
    timeClass = "", // "blitz" | "rapid" | "bullet" | "classical"
    urut = "tanggal", // "tanggal" | "pemain" | "langkah" | "hasil"
    arah = "desc",
    limit = 0,
    offset = 0,
    sertakanPgn = true,
  } = opsi;

  const saringDasar = buatPenyaring({ koleksiId, cari, hasil, timeClass, username });
  const rapikan = (p) => (sertakanPgn ? p : tanpaTeksPgn(p));
  const db = await bukaDB();

  /* --- Cadangan memori (IndexedDB diblokir / lingkungan uji) --- */
  if (!db) {
    let semua = Array.from(memoriPartai.values());
    if (platform) semua = semua.filter((p) => p.platform?.toLowerCase() === platform.toLowerCase());
    if (username) semua = semua.filter((p) => p.username?.toLowerCase() === username.toLowerCase());
    semua = semua.filter(saringDasar);
    semua.sort(bandingkan(urut, arah));
    const total2 = semua.length;
    const potong = limit > 0 ? semua.slice(offset, offset + limit) : semua;
    return { partai: potong.map(rapikan), total: total2 };
  }

  let store;
  try {
    store = db.transaction([STORE_PARTAI], "readonly").objectStore(STORE_PARTAI);
  } catch {
    return { partai: [], total: 0, galat: true };
  }

  const { sumber, rentang, urutWaktu, pemilikTerpenuhi } = pilihIndeks(
    store,
    platform,
    username,
    koleksiId
  );
  // Bila indeksnya sudah dibatasi pada satu koleksi, penyaring koleksi tidak
  // perlu dijalankan lagi — dan itulah yang membuka jalur cepat.
  const saring = pemilikTerpenuhi
    ? buatPenyaring({ koleksiId: "", cari, hasil, timeClass, username })
    : saringDasar;
  const adaSaringan = Boolean((koleksiId && !pemilikTerpenuhi) || cari || hasil || timeClass);
  const arahKursor = arah === "asc" ? "next" : "prev";
  const bisaLompat = urutWaktu && !adaSaringan && urut === "tanggal";

  /* --- Jalur cepat: langsung lompat ke halaman yang diminta --- */
  if (bisaLompat) {
    const total = await hitungCepat(sumber, rentang);
    if (total === null) return { partai: [], total: 0, galat: true };
    if (limit <= 0) {
      // Pemanggil memang meminta semuanya (mis. ekspor PGN).
      const semua = [];
      const okSemua = await telusuriKursor(sumber, rentang, arahKursor, (kursor) => {
        semua.push(rapikan(kursor.value));
      });
      if (!okSemua) return { partai: [], total: 0, galat: true };
      return { partai: semua, total };
    }
    if (offset >= total) return { partai: [], total };

    const baris = [];
    let sudahLompat = offset <= 0;
    const okHalaman = await telusuriKursor(sumber, rentang, arahKursor, (kursor) => {
      if (!sudahLompat) {
        sudahLompat = true;
        kursor.advance(offset); // lompati offset tanpa membaca isinya
        return "tunggu";
      }
      baris.push(rapikan(kursor.value));
      return baris.length >= limit ? "stop" : "lanjut";
    });
    if (!okHalaman) return { partai: [], total: 0, galat: true };
    return { partai: baris, total };
  }

  /* --- Jalur bersaring: telusuri, tapi simpan seperlunya saja --- */
  const perluUrutUlang = urut !== "tanggal" || !urutWaktu;
  const kumpulan = [];
  const jendela = [];
  let cocok = 0;

  const okSaring = await telusuriKursor(sumber, rentang, arahKursor, (kursor) => {
    const nilai = kursor.value;
    if (!saring(nilai)) return "lanjut";
    if (perluUrutUlang) {
      // Perlu semua yang cocok untuk diurutkan — tapi tanpa teks PGN,
      // jadi memorinya tetap kecil meski partainya ribuan.
      kumpulan.push(tanpaTeksPgn(nilai));
      cocok++;
      return "lanjut";
    }
    if (cocok >= offset && (limit <= 0 || jendela.length < limit)) {
      jendela.push(rapikan(nilai));
    }
    cocok++;
    return "lanjut";
  });
  if (!okSaring) return { partai: [], total: 0, galat: true };

  if (!perluUrutUlang) return { partai: jendela, total: cocok };

  kumpulan.sort(bandingkan(urut, arah));
  const potong = limit > 0 ? kumpulan.slice(offset, offset + limit) : kumpulan;
  if (!sertakanPgn) return { partai: potong, total: kumpulan.length };

  // Hanya baris yang benar-benar tampil yang PGN-nya diambil kembali.
  const lengkap = await Promise.all(
    potong.map(async (p) => (p.pgn ? p : (await ambilPartai(p.id)) || p))
  );
  return { partai: lengkap, total: kumpulan.length };
}

/**
 * Ambil 1 partai berdasarkan ID.
 */
export async function ambilPartai(id) {
  if (!id) return null;
  const db = await bukaDB();
  if (!db) return memoriPartai.get(id) || null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_PARTAI], "readonly");
      const store = tx.objectStore(STORE_PARTAI);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Hapus 1 partai dari basis data.
 */
export async function hapusPartai(id) {
  if (!id) return false;
  const db = await bukaDB();
  if (!db) {
    const partai = memoriPartai.get(id);
    if (partai) {
      memoriPartai.delete(id);
      const kol = partai.koleksiId ? memoriKoleksi.get(partai.koleksiId) : null;
      if (kol) {
        memoriKoleksi.set(partai.koleksiId, {
          ...kol,
          jumlahPartai: Math.max(0, (Number(kol.jumlahPartai) || 1) - 1),
          terakhirDisinkronkan: Date.now(),
        });
      }
      simpanFallbackKeStorage();
      naikkanRevisi();
      return true;
    }
    return false;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_PARTAI, STORE_KOLEKSI], "readwrite");
      const store = tx.objectStore(STORE_PARTAI);
      const storeKoleksi = tx.objectStore(STORE_KOLEKSI);
      let ketemu = false;
      const reqGet = store.get(id);
      reqGet.onsuccess = () => {
        const partai = reqGet.result;
        if (!partai) return;
        ketemu = true;
        store.delete(id);
        if (partai.koleksiId) {
          const reqKol = storeKoleksi.get(partai.koleksiId);
          reqKol.onsuccess = () => {
            const kol = reqKol.result;
            if (kol) {
              storeKoleksi.put({
                ...kol,
                jumlahPartai: Math.max(0, (Number(kol.jumlahPartai) || 1) - 1),
                terakhirDisinkronkan: Date.now(),
              });
            }
          };
        }
      };
      reqGet.onerror = () => resolve(false);
      tx.oncomplete = () => {
        if (ketemu) naikkanRevisi();
        resolve(ketemu);
      };
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Pisahkan string PGN yang mungkin memuat beberapa partai sekaligus,
 * lalu simpan semuanya ke basis data di bawah koleksi "impor:default".
 */
export async function imporPgnKeBasisData(teksPgn, { label: _label = "Impor PGN" } = {}) {
  if (!teksPgn || !teksPgn.trim()) return { tersimpan: 0 };
  const raw = teksPgn.trim();

  // Pecah multi-partai lewat alat bersama (dipakai juga analisis di
  // `bacaPartaiPGN`): impor dan analisis sepakat soal batas antar-partai.
  const blokPartai = pecahMultiPgn(raw);

  const hasilPartai = [];
  for (const blok of blokPartai) {
    try {
      const catur = new Chess();
      catur.loadPgn(blok);
      const headers = catur.header ? catur.header() : {};
      const moves = catur.history();
      if (moves.length === 0 && !headers.FEN) continue;

      const wName = headers.White || "Putih";
      const bName = headers.Black || "Hitam";
      const wElo = Number(headers.WhiteElo) || 0;
      const bElo = Number(headers.BlackElo) || 0;
      // Tag Result tidak selalu ada (PGN tanpa header) — jatuhkan ke token
      // hasil di ujung movetext sebelum menyerah ke "draw".
      const tokenAkhir = /\b(1-0|0-1|1\/2-1\/2|\*)\s*$/.exec(blok)?.[1];
      const hasil = normalisasiHasil(headers.Result || tokenAkhir);

      hasilPartai.push({
        /*
         * ID dari HASH isi PGN (bukan acak): mengimpor berkas yang sama dua
         * kali menimpa baris yang sama (`put`), bukan menggandakan.
         * CATATAN MIGRASI: baris impor lama (`impor:<waktu>_<acak>`) tetap
         * valid dan tidak disentuh — duplikat yang telanjur ada dibiarkan
         * (menghapusnya berisiko menghilangkan data pengguna); hanya impor
         * BARU yang terdedup otomatis.
         */
        id: `impor:${hashPgn(blok)}`,
        platform: "impor",
        username: "impor",
        pgn: blok,
        whiteName: wName,
        blackName: bName,
        whiteElo: wElo,
        blackElo: bElo,
        result: hasil,
        timestamp: Date.now(),
        timeClass: headers.TimeControl ? "custom" : "unknown",
        plyCount: moves.length,
      });
    } catch {
      /* PGN rusak dilewati */
    }
  }

  if (hasilPartai.length === 0) {
    return { tersimpan: 0 };
  }

  return await simpanBanyakPartai(hasilPartai, { platform: "impor", username: "impor" });
}

/* Dipakai `./statistik.js` untuk menghitung ringkasan tanpa memuat PGN. */
export { telusuriKursor };
