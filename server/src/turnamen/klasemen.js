/**
 * Perhitungan klasemen perorangan dan beregu.
 *
 * Untuk turnamen berstatus "selesai", hasil di-cache berdasarkan
 * id + diubahPada + jumlah hasil/peserta, sehingga fetch berulang
 * tidak mengulang sort O(n log n). Cache gugur otomatis saat data berubah.
 */
import { JENIS } from "./jenis.js";

const cacheSelesai = new Map();

function kunciCache(t) {
  return [
    t.id,
    t.status,
    t.diubahPada || "",
    (t.hasil || []).length,
    (t.peserta || []).length,
  ].join("|");
}

/**
 * Hitung klasemen dari daftar hasil partai.
 * Tie-break: 1) poin, 2) Sonneborn-Berger, 3) kemenangan, 4) nama.
 */
export function hitungKlasemen(t) {
  if (t?.status === "selesai" && t.id) {
    const kunci = kunciCache(t);
    const cached = cacheSelesai.get(t.id);
    if (cached && cached.kunci === kunci) return cached.klasemen;
    const klasemen = hitungKlasemenInti(t);
    cacheSelesai.set(t.id, { kunci, klasemen });
    return klasemen;
  }
  return hitungKlasemenInti(t);
}

/** Dipakai uji/operasi bila cache harus dibuang (mis. setelah hapus hasil). */
export function buangCacheKlasemen(id) {
  if (id) cacheSelesai.delete(id);
  else cacheSelesai.clear();
}

function hitungKlasemenInti(t) {
  const peserta = (t.peserta || []).filter((p) => !p.dianulir);
  if (!peserta.length) return [];

  const meja = new Map();
  for (const p of peserta) {
    meja.set(p.username, {
      username: p.username,
      panggilan: p.panggilan || p.username,
      tim: p.tim || null,
      main: 0,
      menang: 0,
      remis: 0,
      kalah: 0,
      poin: 0,
      sb: 0,
      lawan: [],
    });
  }

  const hasilSah = (t.hasil || []).filter(
    (h) => meja.has(h.putih) && meja.has(h.hitam)
  );

  for (const h of hasilSah) {
    const p = meja.get(h.putih);
    const hi = meja.get(h.hitam);
    p.main += 1;
    hi.main += 1;
    p.lawan.push(h.hitam);
    hi.lawan.push(h.putih);

    if (h.skor === "1-0") {
      p.menang += 1;
      p.poin += 1;
      hi.kalah += 1;
    } else if (h.skor === "0-1") {
      hi.menang += 1;
      hi.poin += 1;
      p.kalah += 1;
    } else {
      p.remis += 1;
      hi.remis += 1;
      p.poin += 0.5;
      hi.poin += 0.5;
    }
  }

  // Sonneborn-Berger: jumlah poin lawan yang dikalahkan + separuh poin lawan remis.
  for (const baris of meja.values()) {
    let sb = 0;
    for (const h of hasilSah) {
      if (h.putih === baris.username) {
        const l = meja.get(h.hitam);
        if (h.skor === "1-0") sb += l.poin;
        else if (h.skor === "0.5-0.5") sb += l.poin / 2;
      } else if (h.hitam === baris.username) {
        const l = meja.get(h.putih);
        if (h.skor === "0-1") sb += l.poin;
        else if (h.skor === "0.5-0.5") sb += l.poin / 2;
      }
    }
    baris.sb = Math.round(sb * 100) / 100;
  }

  const daftar = [...meja.values()];
  const minPartai = JENIS[t.jenis]?.minPartai ?? 0;

  daftar.sort((a, b) => {
    if (minPartai) {
      const aKurang = a.main < minPartai;
      const bKurang = b.main < minPartai;
      if (aKurang !== bKurang) return aKurang ? 1 : -1;
    }
    if (b.poin !== a.poin) return b.poin - a.poin;
    if (b.sb !== a.sb) return b.sb - a.sb;
    if (b.menang !== a.menang) return b.menang - a.menang;
    return a.panggilan.localeCompare(b.panggilan);
  });

  return daftar.map((b, i) => ({
    peringkat: i + 1,
    ...b,
    resmi: minPartai ? b.main >= minPartai : true,
    lawan: undefined,
  }));
}

/** Klasemen beregu — menjumlahkan poin pemain per tim. */
export function klasemenTim(t) {
  if (!JENIS[t.jenis]?.beregu) return [];
  const perorangan = hitungKlasemen(t);
  const tim = new Map();
  for (const p of perorangan) {
    if (!p.tim) continue;
    const data = tim.get(p.tim) || { tim: p.tim, poin: 0, pemain: 0, main: 0 };
    data.poin += p.poin;
    data.pemain += 1;
    data.main += p.main;
    tim.set(p.tim, data);
  }
  return [...tim.values()]
    .sort((a, b) => b.poin - a.poin)
    .map((x, i) => ({ peringkat: i + 1, ...x }));
}
