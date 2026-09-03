Masalahnya ada di **parent container** panel kanan. Container `<aside>` sudah punya `flex flex-col`, tapi parent-nya (`.flex.flex-col.lg:flex-row`) tidak memberikan **tinggi penuh** ke `<aside>` secara konsisten, dan ada beberapa elemen yang tidak `flex-shrink-0`, sehingga area Syzygy tidak bisa `flex-1` dengan benar.

Berikut perbaikannya. Perubahan kunci:

1. **`<aside>` panel kanan** → tambahkan `h-full` supaya mengisi tinggi parent
2. **Semua section non-scrollable** (Tabs, Opening name, Indikator giliran, Navigation controls) → tambahkan `flex-shrink-0` agar tidak menyusut
3. **Area Syzygy** → sudah `flex-1 min-h-0 overflow-y-auto`, tapi butuh struktur dalam yang benar

Berikut bagian **PANEL KANAN** yang sudah diperbaiki (ganti seluruh `<aside>` panel kanan Anda dengan ini):

```jsx
{/* ═══════════════════════════════════════════════════════ */}
{/* PANEL KANAN                                            */}
{/* ═══════════════════════════════════════════════════════ */}
<aside className="w-full lg:w-[420px] h-full bg-[#211f1c] border-t lg:border-t-0 lg:border-l border-[#312e2b] flex flex-col flex-shrink-0 min-h-0">
  {/* Tabs — TIDAK menyusut */}
  <div className="flex-shrink-0 flex border-b border-[#312e2b] bg-[#1e1c18]">
    {TAB.map((label, i) => (
      <button
        key={label}
        className={`flex-1 py-3.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition
          ${i === 0
            ? "border-b-2 border-[#81b64c] text-white bg-[#262421]"
            : "border-b-2 border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#262421]"
          }`}
      >
        {label}
      </button>
    ))}
  </div>

  {/* Opening name — TIDAK menyusut */}
  <div className="flex-shrink-0 p-3.5 bg-[#262421] border-b border-[#312e2b] flex items-center justify-between">
    <div className="flex items-center gap-2.5 text-xs text-gray-300 font-medium">
      <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
      <span className="text-[13px]">Skak dalam {jumlahLangkah} langkah</span>
    </div>
    <button className="text-gray-500 hover:text-white text-lg transition">✎</button>
  </div>

  {/* Indikator giliran — TIDAK menyusut */}
  <div className="flex-shrink-0 px-4 py-2.5 text-xs font-bold text-gray-400 border-b border-[#312e2b] flex items-center justify-between bg-[#1e1c18] uppercase tracking-wider">
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-sm ${giliran === "putih" ? "bg-white border border-gray-400" : "bg-[#312e2b] border border-gray-600"}`}></div>
      <span className={giliran === "putih" ? "text-white" : "text-gray-500"}>{giliran === "putih" ? "Putih" : "Hitam"}</span>
      <span className="text-gray-600">melangkah</span>
    </div>
    <span className="text-gray-500 text-xs font-bold normal-case tracking-normal">{giliran}</span>
  </div>

  {/* Syzygy — MEMANJANG mengisi ruang tersisa & scrollable */}
  <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 text-sm">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{syzygyJudul}</span>
      <span className="text-[11px] text-gray-500">{syzygyDidukung}</span>
    </div>

    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          syzygy && PETA_KELAS_SYZYGY
            ? PETA_KELAS_SYZYGY[syzygy.category] || "bg-[#2c2926] text-gray-400"
            : "bg-[#2c2926] text-gray-400"
        }`}
      >
        {syzygy && teksKategoriSyzygy ? teksKategoriSyzygy(syzygy.category) : "—"}
      </span>
      <span className="text-xs text-gray-400">DTZ: {syzygy ? syzygy.dtz ?? "-" : "-"}</span>
      <span className="text-xs text-gray-400">DTM: {syzygy ? syzygy.dtm ?? "-" : "-"}</span>
      {syzygy && (
        <a
          href={`https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(fen)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs font-medium text-sky-400 hover:text-sky-300 hover:underline"
        >
          {syzygyDetail}
        </a>
      )}
    </div>

    {syzygy && Array.isArray(syzygy.moves) && syzygy.moves.length > 0 && (
      <ul className="divide-y divide-[#312e2b]">
        {syzygy.moves.map((m) => (
          <li key={m.san} className="flex items-center justify-between gap-2 py-1.5">
            <span className="font-mono text-xs font-semibold text-gray-300">
              {m.san}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                PETA_KELAS_SYZYGY && (PETA_KELAS_SYZYGY[m.category] || "bg-[#2c2926] text-gray-400")
              }`}
            >
              {teksKategoriSyzygy ? teksKategoriSyzygy(m.category) : m.category}
              {typeof m.dtz === "number" ? ` · DTZ ${m.dtz}` : ""}
            </span>
          </li>
        ))}
      </ul>
    )}

    <p className="text-[11px] leading-4 text-gray-500">{syzygyCatatan}</p>
  </div>

  {/* Navigation controls — TIDAK menyusut, MENEMPEL DI BAWAH */}
  <div className="flex-shrink-0 p-3 bg-[#1e1c18] border-t border-[#312e2b] space-y-3">
    <div className="flex items-center gap-1 bg-[#262421] p-1 rounded-lg border border-[#312e2b]">
      <button className="flex-1 py-2.5 flex justify-center items-center hover:bg-[#363431] rounded text-gray-400 hover:text-white transition text-lg font-bold">
        ⏮
      </button>
      <button className="flex-1 py-2.5 flex justify-center items-center hover:bg-[#363431] rounded text-gray-400 hover:text-white transition text-lg font-bold">
        ◀
      </button>
      <button className="flex-1 py-2.5 flex justify-center items-center hover:bg-[#363431] rounded text-gray-400 hover:text-white transition text-lg font-bold">
        ▶
      </button>
      <button className="flex-1 py-2.5 flex justify-center items-center hover:bg-[#363431] rounded text-gray-400 hover:text-white transition text-lg font-bold">
        ⏭
      </button>
    </div>

    <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-400">
      <button className="flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] hover:text-white rounded-lg transition border border-[#312e2b]">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>New</span>
      </button>
      <button className="flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] hover:text-white rounded-lg transition border border-[#312e2b]">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        <span>Save</span>
      </button>
      <button className="flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] hover:text-white rounded-lg transition border border-[#312e2b]">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        <span>Review</span>
      </button>
      <button className="flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] hover:text-white rounded-lg transition border border-[#312e2b]">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        <span>Share</span>
      </button>
    </div>
  </div>
</aside>
```

## 📌 Penjelasan singkat

**Konsep Flexbox untuk sticky footer / expand middle:**

```
Parent: flex flex-col + h-full/min-h-screen
├─ Header      → flex-shrink-0  (tinggi tetap)
├─ Middle      → flex-1 min-h-0 overflow-y-auto  (mengisi sisa, scroll jika penuh)
└─ Footer      → flex-shrink-0  (tinggi tetap, menempel bawah)
```

**Perubahan yang saya lakukan:**

| Section | Perubahan | Alasan |
|---------|-----------|--------|
| `<aside>` panel kanan | Tambah `h-full` | Agar mengisi tinggi parent penuh |
| Tabs | Tambah `flex-shrink-0` | Header tidak boleh menyusut |
| Opening name | Tambah `flex-shrink-0` | Sama |
| Indikator giliran | Tambah `flex-shrink-0` | Sama |
| **Syzygy area** | Hapus `max-h-[196px]` di `<ul>` | Biar dia stretch penuh |
| Navigation controls | Tambah `flex-shrink-0` | Footer nempel bawah |

**Kenapa `min-h-0` penting?** Default `min-height` flex item adalah `auto` (bukan `0`), sehingga `flex-1` + `overflow-y-auto` tidak bekerja tanpa `min-h-0`. Ini bug/quirk flexbox yang sering bikin bingung.

Sekarang panel Syzygy akan **memanjang mengisi ruang kosong** antara "Indikator giliran" dan "Navigation controls" secara otomatis. 🎯