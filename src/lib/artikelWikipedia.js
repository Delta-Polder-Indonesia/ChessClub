/**
 * Artikel Wikipedia untuk sebuah pembukaan catur.
 *
 * Nama pembukaan dari buku Lichess (mis. "Sicilian Defense: Najdorf
 * Variation") dicari di Wikipedia bahasa Inggris lewat Action API dengan
 * generator=search + prop=extracts sehingga ringkasan artikelnya ikut
 * terambil sekali jalan. Pencarian mentah saja tidak cukup karena judul
 * Wikipedia memakai ejaan Inggris ("Sicilian Defence", "Caro–Kann
 * Defence"), terkadang nama artikelnya sama sekali berbeda
 * ("King's Pawn Game: Wayward Queen Attack" → artikel "Danvers
 * Opening"), dan ada kalanya nama pembukaan punya judul persis yang diarahkan
 * Wikipedia ke artikel keluarga ("King's Knight Opening" → "Open Game").
 * Karena itu dua jalur dipakai: (1) penyelesaian judul persis yang mengikuti
 * redirect — paling akurat untuk nama yang tak punya artikel sendiri; (2)
 * pencarian dengan beberapa kandidat yang dinilai kecocokannya dengan nama
 * pembukaan (bagian keluarga dan bagian variasi setelah titik dua). Hasil
 * yang jelas bukan artikel catur (mis. video game "King's Knight") dibuang
 * lebih dulu.
 *
 * Saat UI berbahasa Indonesia dan artikel yang terpilih punya versi
 * Indonesia (langlinks), ringkasan diambil dari id.wikipedia.org; kalau
 * tidak ada, dipakai versi Inggris. Hasil disimpan di cache sesi agar
 * bolak-balik langkah tidak memukul API berulang kali.
 */

const API_EN = "https://en.wikipedia.org/w/api.php";
const API_ID = "https://id.wikipedia.org/w/api.php";

/**
 * Terjemahan otomatis en → id lewat endpoint publik Google Translate
 * (client gtx). Tidak resmi, sehingga hanya menjadi penyempurna: bila
 * panggilannya gagal, artikel Inggris tetap tampil apa adanya.
 */
const PENERJEMAH =
  "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t";

/** Batas aman panjang teks yang diterjemahkan per artikel. */
const BATAS_TERJEMAH = 2800;

/** Skor minimum agar sebuah kandidat dianggap artikel yang tepat. */
const AMBANG_KECOCOKAN = 0.9;

/** Cache sesi: "bahasa|nama pembukaan" → artikel (atau null bila tak ada). */
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
 * Nilai kecocokan satu halaman Wikipedia dengan nama pembukaan.
 * Variasi (bagian setelah ":") diberi bobot terbesar — artikel keluarga
 * yang lebih umum ("Open Game") tidak boleh mengalahkan artikel variasi
 * yang persis ("Danvers Opening") meskipun kata keluarganya cocok.
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
    3 * variasiDiJudul +
    2.4 * variasiDiIsi +
    1.5 * keluargaDiJudul +
    0.4 * keluargaDiIsi
  );
}

/**
 * Pola kata yang menandai sebuah artikel benar-benar membahas catur —
 * dipakai untuk membuang hasil pencarian yang kebetulan namanya mirip
 * tetapi topiknya di luar catur (mis. video game "King's Knight").
 * Istilah seperti "king"/"queen"/"knight" sengaja tak dipakai karena bisa
 * muncul pada nama di luar catur ("King's Knight" adalah judul game);
 * kata-kata di bawah ini nyaris tidak ditemui di artikel semacam itu.
 */
const POLA_CATUR =
  /\b(chess|pawn|bishop|rook|gambit|castl(?:e|ing)?|checkmate|Sicilian|Najdorf)\b/i;

/** Benarkah halaman ini (ringkasan intro-nya) membahas catur? */
export function adalahArtikelCatur(halaman) {
  return POLA_CATUR.test(String(halaman?.extract || ""));
}

/** Pilih halaman terbaik dari hasil pencarian (null bila tak ada yang
 *  melampaui ambang kecocokan). Halaman yang jelas bukan artikel catur
 *  (mis. permainan video) dibuang lebih dulu. Urutan relevansi pencarian
 *  jadi pemecah seri bila skor sama. */
export function pilihKandidat(daftarHalaman, nama) {
  const bagian = pecahNamaPembukaan(nama);
  const kandidat = [...daftarHalaman].sort(
    (a, b) => (a.index ?? 99) - (b.index ?? 99)
  );
  let terbaik = null;
  let skorTerbaik = 0;
  for (const halaman of kandidat) {
    if (!adalahArtikelCatur(halaman)) continue; // buang artikel non-catur
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

/** URL pencarian artikel + ringkasan + tautan bahasa + gambar mini. */
function susunUrlCari(nama) {
  const param = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: nama,
    gsrlimit: "6",
    prop: "extracts|info|langlinks|pageimages",
    inprop: "url",
    exintro: "1",
    explaintext: "1",
    exlimit: "max",
    lllang: "id",
    lllimit: "1",
    piprops: "thumbnail",
    pithumbsize: "256",
    pilimit: "max",
  });
  return `${API_EN}?${param.toString()}`;
}

/** URL ringkasan satu judul artikel pada wiki bahasa tertentu. */
function susunUrlRingkasan(judul, api) {
  const param = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    titles: judul,
    prop: "extracts|info|pageimages",
    inprop: "url",
    exintro: "1",
    explaintext: "1",
    redirects: "1",
    piprops: "thumbnail",
    pithumbsize: "256",
  });
  return `${api}?${param.toString()}`;
}

/** URL penyelesaian satu judul persis (mengikuti redirect) pada wiki
 *  bahasa tertentu — termasuk langlinks & gambar mini agar hasilnya bisa
 *  langsung dipakai seperti hasil pencarian. */
function susunUrlJudul(judul, api) {
  const param = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    titles: judul,
    prop: "extracts|info|langlinks|pageimages",
    inprop: "url",
    exintro: "1",
    explaintext: "1",
    redirects: "1",
    lllang: "id",
    lllimit: "1",
    piprops: "thumbnail",
    pithumbsize: "256",
  });
  return `${api}?${param.toString()}`;
}

/**
 * Ambil halaman hasil penyelesaian judul persis, mengikuti redirect.
 * Banyak nama pembukaan yang tidak punya artikel sendiri justru diarahkan
 * Wikipedia ke artikel keluarga yang tepat — mis. "King's Knight Opening"
 * → "Open Game". Ini satu-satunya cara mencocokkan nama-nama seperti itu
 * (pencarian mentah salah menjawab karena judulnya kebetulan mirip dengan
 * hal lain). Mengembalikan halaman (null bila judul tidak ada / buang).
 */
async function ambilViaJudul(judul, sinyal) {
  const data = await ambilJson(susunUrlJudul(judul, API_EN), sinyal);
  const halaman = Object.values(data?.query?.pages || {});
  return halaman.find((p) => p.missing === undefined && p.extract) || null;
}

/** Susun objek artikel dari satu halaman hasil API. */
function artikelDariHalaman(nama, halaman, bahasa) {
  const basis =
    bahasa === "id"
      ? "https://id.wikipedia.org/wiki/"
      : "https://en.wikipedia.org/wiki/";
  return {
    nama,
    judul: halaman.title,
    ringkasan: halaman.extract || "",
    url:
      halaman.fullurl ||
      `${basis}${encodeURIComponent(String(halaman.title).replace(/ /g, "_"))}`,
    bahasa,
    gambar: halaman.thumbnail?.source || null,
    terjemahanOtomatis: false,
  };
}

/** Hasil cache untuk nama+bahasa (undefined bila belum pernah diambil). */
export function lihatArtikelTercache(nama, bahasaUi) {
  const kunci = `${bahasaUi}|${nama}`;
  return CACHE.has(kunci) ? CACHE.get(kunci) : undefined;
}

/**
 * Ambil artikel Wikipedia untuk sebuah nama pembukaan.
 *
 * Mengembalikan { nama, judul, ringkasan, url, bahasa, gambar } atau null
 * bila tidak ada artikel yang cocok. Galat jaringan tidak disimpan ke
 * cache sehingga permintaan berikutnya bisa mencoba lagi.
 */
export async function ambilArtikelPembukaan(nama, bahasaUi = "id", sinyal) {
  const kunci = `${bahasaUi}|${nama}`;
  if (CACHE.has(kunci)) return CACHE.get(kunci);

  let hasil = null;
  try {
    // 1) Judul persis (ikut redirect) lebih akurat untuk nama tanpa artikel
    //    sendiri tapi diarahkan Wikipedia ke artikel keluarga — mis.
    //    "King's Knight Opening" → "Open Game". Kalau gagal / bukan catur,
    //    jatuh ke pencarian di bawah.
    let terbaik = null;
    try {
      const dariJudul = await ambilViaJudul(nama, sinyal);
      if (dariJudul && adalahArtikelCatur(dariJudul)) terbaik = dariJudul;
    } catch (galat) {
      if (galat?.name === "AbortError") throw galat;
      /* jaringan/variasi: lanjut ke pencarian */
    }

    if (!terbaik) {
      const data = await ambilJson(susunUrlCari(nama), sinyal);
      const halaman = Object.values(data?.query?.pages || {});
      terbaik = pilihKandidat(halaman, nama);
      if (!terbaik) {
        CACHE.set(kunci, null);
        return null;
      }
    }
    hasil = artikelDariHalaman(nama, terbaik, "en");

    // UI Indonesia → pakai versi Indonesia bila tersedia…
    const judulId = terbaik.langlinks?.[0]?.["*"];
    if (bahasaUi === "id" && judulId) {
      try {
        const dataId = await ambilJson(susunUrlRingkasan(judulId, API_ID), sinyal);
        const hal = Object.values(dataId?.query?.pages || {})[0];
        if (hal && hal.missing === undefined && hal.extract) {
          const versiId = artikelDariHalaman(nama, hal, "id");
          hasil = { ...versiId, gambar: versiId.gambar || hasil.gambar };
        }
      } catch (galat) {
        if (galat?.name === "AbortError") throw galat;
        /* versi Indonesia gagal diambil — coba terjemahan otomatis */
      }
    }

    // …jika tidak ada, terjemahkan ringkasan Inggris secara otomatis.
    // Kegagalan menerjemahkan tidak fatal: artikel Inggris tetap tampil.
    if (bahasaUi === "id" && hasil.bahasa === "en" && hasil.ringkasan) {
      try {
        const terjemahan = await terjemahkanKeIndonesia(
          hasil.ringkasan,
          sinyal
        );
        hasil = { ...hasil, ringkasan: terjemahan, bahasa: "id", terjemahanOtomatis: true };
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
