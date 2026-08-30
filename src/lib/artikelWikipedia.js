/**
 * Referensi pembukaan untuk Penjelajah Pembukaan.
 *
 * Catatan: file ini tetap bernama `artikelWikipedia.js` agar jejak impor lama
 * tidak perlu diubah banyak, tetapi sumber artikelnya sekarang memakai
 * Wikibooks "Chess Opening Theory" sesuai kebutuhan halaman.
 *
 * Strategi pengambilan artikel:
 * 1) utamakan subhalaman Wikibooks yang persis mengikuti urutan langkah SAN
 *    saat ini, mis. `Chess Opening Theory/1. e4/1...c5/2. Nf3`;
 * 2) bila subhalaman terdalam belum ada, naik ke induk terdekat;
 * 3) bila konteks langkah tidak tersedia / tidak cocok, jatuh ke pencarian
 *    judul berdasarkan nama pembukaan di dalam buku yang sama.
 *
 * Hasil dicache per bahasa UI + konteks langkah agar undo/redo atau bolak-balik
 * variasi tidak memukul API berulang kali.
 */

const API_EN = "https://en.wikibooks.org/w/api.php";
const JUDUL_AKAR = "Chess Opening Theory";

/**
 * Terjemahan otomatis en → id lewat endpoint publik Google Translate
 * (client gtx). Tidak resmi, sehingga hanya menjadi penyempurna: bila
 * panggilannya gagal, artikel Inggris tetap tampil apa adanya.
 */
const PENERJEMAH =
  "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t";

/** Batas aman panjang teks yang diterjemahkan per artikel. */
const BATAS_TERJEMAH = 2800;

/** Skor minimum agar hasil pencarian dianggap cukup relevan. */
const AMBANG_KECOCOKAN = 0.9;

/** Alias nama yang sering berbeda antara buku Lichess dan Wikibooks. */
const ALIAS_NAMA_PEMBUKAAN = new Map([
  ["King's Pawn Game", ["King's Pawn Opening", "King's Pawn opening"]],
  ["Queen's Pawn Game", ["Queen's Pawn Opening", "Queen's Pawn opening"]],
]);

/** Cache sesi: "bahasa|konteks" → artikel (atau null bila tak ada). */
const CACHE = new Map();

/** Pecah teks menjadi kata-kata pembanding (huruf kecil, tanpa tanda baca,
 *  "Defence" disamakan dengan "Defense", posesif "'s" dibuang). */
export function tokenKata(teks) {
  return String(teks || "")
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/'s(?=\s|$)/g, "")
    .replace(/[–—−]/g, "-")
    .replace(/[^a-z0-9\u00c0-\u024f]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((kata) => (kata === "defence" ? "defense" : kata));
}

/** Bagi nama pembukaan menjadi token keluarga (sebelum ":") dan variasi
 *  (sesudah ":") — mis. "Sicilian Defense: Najdorf Variation". */
export function pecahNamaPembukaan(nama) {
  const [keluargaMentah, ...sisanya] = String(nama).split(":");
  const keluarga = tokenKata(keluargaMentah);
  const variasi = sisanya.length ? tokenKata(sisanya.join(":")) : [];
  if (!keluarga.length && !variasi.length) {
    return { keluarga: tokenKata(nama), variasi: [] };
  }
  return { keluarga, variasi };
}

/** Rasio kata `kata` yang ditemukan di himpunan `kumpulan`. */
function rasioKena(kumpulan, kata) {
  if (!kata.length) return 0;
  let kena = 0;
  for (const k of kata) if (kumpulan.has(k)) kena += 1;
  return kena / kata.length;
}

/**
 * Nilai kecocokan satu halaman dengan nama pembukaan.
 * Variasi (bagian setelah ":") diberi bobot terbesar — artikel keluarga
 * yang terlalu umum tidak boleh mengalahkan variasi spesifik.
 */
export function skorKandidat(halaman, bagian) {
  const judul = new Set(tokenKata(halaman.title));
  const isi = new Set(tokenKata(halaman.extract || ""));
  const { keluarga, variasi } = bagian;
  const keluargaDiJudul = rasioKena(judul, keluarga);
  const variasiDiJudul = rasioKena(judul, variasi);
  const variasiDiIsi = rasioKena(isi, variasi);
  const keluargaDiIsi = rasioKena(isi, keluarga);
  return (
    3 * variasiDiIsi +
    2 * keluargaDiIsi +
    1.2 * variasiDiJudul +
    0.8 * keluargaDiJudul
  );
}

/**
 * Pola kata yang menandai bahwa ringkasan memang membahas catur/pembukaan,
 * bukan halaman Wikibooks acak yang kebetulan namanya mirip.
 */
const POLA_CATUR =
  /\b(chess|opening|defen[cs]e|gambit|pawn|bishop|rook|knight|queen|king|castle|fianchetto|centre|center|checkmate|tempo|lichess|e4|d4|c4|nf3)\b/i;

/** Benarkah halaman ini (ringkasan intro-nya) membahas catur? */
export function adalahArtikelCatur(halaman) {
  if (adalahJudulDalamBuku(halaman?.title)) {
    return String(halaman?.extract || "").trim().length > 0;
  }
  return POLA_CATUR.test(String(halaman?.extract || ""));
}

function adalahJudulDalamBuku(judul) {
  return judul === JUDUL_AKAR || String(judul || "").startsWith(`${JUDUL_AKAR}/`);
}

/** Pilih halaman terbaik dari hasil pencarian (null bila tak ada yang cukup
 *  relevan). Hanya halaman di dalam buku "Chess Opening Theory" yang dihitung. */
export function pilihKandidat(daftarHalaman, nama) {
  const bagian = pecahNamaPembukaan(nama);
  const kandidat = [...daftarHalaman]
    .filter((halaman) => adalahJudulDalamBuku(halaman?.title))
    .sort((a, b) => (a.index ?? 99) - (b.index ?? 99));

  let terbaik = null;
  let skorTerbaik = 0;
  for (const halaman of kandidat) {
    if (!adalahArtikelCatur(halaman)) continue;
    const skor = skorKandidat(halaman, bagian);
    if (skor > skorTerbaik) {
      skorTerbaik = skor;
      terbaik = halaman;
    }
  }
  return skorTerbaik >= AMBANG_KECOCOKAN ? terbaik : null;
}

async function ambilJson(url, sinyal) {
  const respon = await fetch(url, {
    signal: sinyal,
    headers: { Accept: "application/json" },
  });
  if (!respon.ok) throw new Error(`HTTP ${respon.status}`);
  return respon.json();
}

/**
 * Terjemahkan teks en → id per paragraf (struktur paragraf terjaga).
 * Melempar galat bila respons tidak bisa dibaca — pemanggil menentukan
 * fallback-nya.
 */
export async function terjemahkanKeIndonesia(teks, sinyal) {
  const paragraf = String(teks || "").split(/\n+/).filter((p) => p.trim());
  const hasil = [];
  let panjang = 0;
  for (const p of paragraf) {
    if (panjang + p.length > BATAS_TERJEMAH) break;
    const respon = await fetch(PENERJEMAH, {
      method: "POST",
      signal: sinyal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ q: p }).toString(),
    });
    if (!respon.ok) throw new Error(`HTTP ${respon.status}`);
    const data = await respon.json();
    const segmen = Array.isArray(data?.[0])
      ? data[0].map((s) => (Array.isArray(s) ? s[0] ?? "" : "")).join("")
      : "";
    if (!segmen.trim()) throw new Error("terjemahan kosong");
    hasil.push(segmen);
    panjang += p.length;
  }
  if (!hasil.length) throw new Error("tidak ada teks untuk diterjemahkan");
  return hasil.join("\n");
}

/** Normalisasi masukan lama (string) dan baru (objek konteks). */
function normalkanKonteks(input) {
  if (typeof input === "string") {
    return {
      nama: String(input).trim() || null,
      langkahSan: [],
    };
  }
  const nama = String(input?.nama || "").trim() || null;
  const langkahSan = Array.isArray(input?.langkahSan)
    ? input.langkahSan.map((san) => String(san || "").trim()).filter(Boolean)
    : [];
  return { nama, langkahSan };
}

/** Format segmen judul Wikibooks dari langkah SAN ke-i. */
export function segmenJudulWikibooks(san, indeks) {
  const langkah = String(san || "").trim().replace(/\s+/g, " ");
  const nomor = Math.floor(indeks / 2) + 1;
  return indeks % 2 === 0 ? `${nomor}. ${langkah}` : `${nomor}...${langkah}`;
}

/** Daftar kandidat judul halaman berdasarkan riwayat SAN, dari terdalam ke akar. */
export function daftarJudulWikibooks(langkahSan = []) {
  const segmen = langkahSan.map((san, i) => segmenJudulWikibooks(san, i));
  const hasil = [];
  for (let i = segmen.length; i >= 1; i -= 1) {
    hasil.push(`${JUDUL_AKAR}/${segmen.slice(0, i).join("/")}`);
  }
  hasil.push(JUDUL_AKAR);
  return hasil;
}

function kunciCache(konteks, bahasaUi) {
  const langkah = konteks.langkahSan.join(" ");
  const penanda = langkah ? `langkah:${langkah}` : `nama:${konteks.nama || ""}`;
  return `${bahasaUi}|${penanda}`;
}

/** Nama alternatif untuk fallback pencarian di Wikibooks. */
export function daftarNamaAlternatifPembukaan(nama) {
  const asal = String(nama || "").trim();
  if (!asal) return [];

  const hasil = [asal];
  const tambah = (nilai) => {
    const bersih = String(nilai || "").trim();
    if (bersih && !hasil.includes(bersih)) hasil.push(bersih);
  };

  for (const [lama, daftar] of ALIAS_NAMA_PEMBUKAAN) {
    if (asal === lama) {
      for (const alias of daftar) tambah(alias);
      continue;
    }
    if (asal.startsWith(`${lama}:`)) {
      const sisa = asal.slice(lama.length);
      for (const alias of daftar) tambah(`${alias}${sisa}`);
    }
  }

  return hasil;
}

/** URL pencarian artikel + ringkasan + tautan + gambar mini. */
function susunUrlCari(nama) {
  const param = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: nama,
    gsrlimit: "8",
    gsrnamespace: "0",
    prop: "extracts|info|pageimages",
    inprop: "url",
    exintro: "1",
    explaintext: "1",
    exlimit: "max",
    piprops: "thumbnail",
    pithumbsize: "256",
    pilimit: "max",
  });
  return `${API_EN}?${param.toString()}`;
}

/** URL ringkasan satu judul artikel pada Wikibooks bahasa Inggris. */
function susunUrlJudul(judul, introSaja = true) {
  const param = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    titles: judul,
    prop: "extracts|info|pageimages",
    inprop: "url",
    redirects: "1",
    explaintext: "1",
    piprops: "thumbnail",
    pithumbsize: "256",
  });
  if (introSaja) param.set("exintro", "1");
  return `${API_EN}?${param.toString()}`;
}

/** Ambil satu halaman persis dari Wikibooks. */
async function ambilViaJudul(judul, sinyal) {
  const bacaHalaman = async (introSaja) => {
    const data = await ambilJson(susunUrlJudul(judul, introSaja), sinyal);
    const halaman = Object.values(data?.query?.pages || {});
    return (
      halaman.find(
        (p) => p.missing === undefined && adalahJudulDalamBuku(p.title)
      ) || null
    );
  };

  const ringkas = await bacaHalaman(true);
  if (ringkas?.extract?.trim()) return ringkas;

  // Beberapa halaman Wikibooks hampir tak punya lead paragraph sebelum
  // heading pertama (mis. halaman akar variasi tertentu). Jika intro kosong,
  // coba lagi tanpa `exintro` agar isi bagian utama tetap bisa ditampilkan.
  const penuh = await bacaHalaman(false);
  return penuh && penuh.extract ? penuh : ringkas;
}

function encodeJudulUntukUrl(judul) {
  return String(judul || "")
    .split("/")
    .map((bagian) => encodeURIComponent(bagian.replace(/ /g, "_")))
    .join("/");
}

function rapikanSegmenJudul(segmen) {
  return String(segmen || "")
    .replace(/^Chess Opening Theory\/?/, "")
    .replace(/^\s+|\s+$/g, "")
    .replace(/^(\d+)\.\.\.(\S)/, "$1... $2")
    .replace(/^(\d+\.)(\S)/, "$1 $2");
}

/** Susun objek artikel dari satu halaman hasil API. */
function artikelDariHalaman(konteks, halaman, bahasa) {
  return {
    nama: konteks.nama || rapikanSegmenJudul(halaman.title.split("/").at(-1)),
    judul:
      konteks.nama ||
      (halaman.title === JUDUL_AKAR
        ? JUDUL_AKAR
        : rapikanSegmenJudul(halaman.title.split("/").at(-1))),
    ringkasan: halaman.extract || "",
    url:
      halaman.fullurl ||
      `https://en.wikibooks.org/wiki/${encodeJudulUntukUrl(halaman.title)}`,
    bahasa,
    gambar: halaman.thumbnail?.source || null,
    terjemahanOtomatis: false,
  };
}

/** Hasil cache untuk konteks+bahasa (undefined bila belum pernah diambil). */
export function lihatArtikelTercache(input, bahasaUi) {
  const konteks = normalkanKonteks(input);
  const kunci = kunciCache(konteks, bahasaUi);
  return CACHE.has(kunci) ? CACHE.get(kunci) : undefined;
}

/**
 * Ambil artikel referensi pembukaan dari Wikibooks.
 *
 * `input` bisa berupa string nama pembukaan (kompatibilitas lama) atau objek:
 *   { nama: string | null, langkahSan: string[] }
 *
 * Mengembalikan { nama, judul, ringkasan, url, bahasa, gambar } atau null
 * bila tidak ada artikel yang cocok. Galat jaringan tidak disimpan ke cache
 * sehingga permintaan berikutnya bisa mencoba lagi.
 */
export async function ambilArtikelPembukaan(input, bahasaUi = "id", sinyal) {
  const konteks = normalkanKonteks(input);
  const kunci = kunciCache(konteks, bahasaUi);
  if (CACHE.has(kunci)) return CACHE.get(kunci);

  let hasil = null;
  try {
    let terbaik = null;

    // 1) Coba subhalaman Wikibooks sesuai urutan langkah saat ini.
    if (konteks.langkahSan.length) {
      const daftarJudul = daftarJudulWikibooks(konteks.langkahSan);
      for (const judul of daftarJudul) {
        try {
          const halaman = await ambilViaJudul(judul, sinyal);
          if (!halaman || !adalahArtikelCatur(halaman)) continue;
          terbaik = halaman;
          break;
        } catch (galat) {
          if (galat?.name === "AbortError") throw galat;
          /* jaringan/halaman tertentu: lanjut ke kandidat berikutnya */
        }
      }
    }

    // 2) Fallback: cari menurut nama pembukaan di dalam buku yang sama.
    //    Beberapa keluarga nama di buku Lichess memakai istilah "Game",
    //    sedangkan Wikibooks menuliskannya sebagai "opening".
    if (!terbaik && konteks.nama) {
      for (const kueri of daftarNamaAlternatifPembukaan(konteks.nama)) {
        const data = await ambilJson(susunUrlCari(kueri), sinyal);
        const halaman = Object.values(data?.query?.pages || {});
        terbaik = pilihKandidat(halaman, kueri);
        if (terbaik) break;
      }
    }

    if (!terbaik) {
      CACHE.set(kunci, null);
      return null;
    }

    hasil = artikelDariHalaman(konteks, terbaik, "en");

    // UI Indonesia → terjemahkan otomatis bila ada ringkasan Inggris.
    // Kegagalan menerjemahkan tidak fatal: artikel Inggris tetap tampil.
    if (bahasaUi === "id" && hasil.ringkasan) {
      try {
        const terjemahan = await terjemahkanKeIndonesia(hasil.ringkasan, sinyal);
        hasil = {
          ...hasil,
          ringkasan: terjemahan,
          bahasa: "id",
          terjemahanOtomatis: true,
        };
      } catch (galat) {
        if (galat?.name === "AbortError") throw galat;
        /* biarkan versi Inggris tampil */
      }
    }
  } catch (galat) {
    if (galat?.name === "AbortError") throw galat;
    return null; /* tanpa cache: kegagalan jaringan bisa dicoba lagi */
  }

  CACHE.set(kunci, hasil);
  return hasil;
}
