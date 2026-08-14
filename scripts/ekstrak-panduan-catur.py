#!/usr/bin/env python3
"""
Mengubah DokumenHistory/index.html (Panduan Mudah Bermain Catur) menjadi
data terstruktur yang dipakai halaman React `src/halaman/ProgramKami/CaraBermainCatur.jsx`.

Keluaran : src/data/panduanCatur.js  (module ES: `export const PANDUAN_CATUR = {...}`)
Jalankan : python3 scripts/ekstrak-panduan-catur.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUMBER = ROOT / "DokumenHistory" / "index.html"
KELUARAN = ROOT / "src" / "data" / "panduanCatur.js"

# Pembagian bab untuk StickyMenu & daftar isi (rentang nomor bagian).
BAB = [
    {"id": "bab-bidak", "mulai": 1, "sampai": 7},      # 1–7
    {"id": "bab-dasar", "mulai": 8, "sampai": 12},     # 8–12
    {"id": "bab-pemula", "mulai": 13, "sampai": 14},   # 13–14
    {"id": "bab-menengah", "mulai": 15, "sampai": 28}, # 15–28
    {"id": "bab-strategi", "mulai": 29, "sampai": 38}, # 29–38
    {"id": "bab-lanjut", "mulai": 39, "sampai": 53},   # 39–53
    {"id": "bab-master", "mulai": 54, "sampai": 70},   # 54–70
]

TAG_DIV_MULAI = re.compile(r"<div\b")
TAG_DIV_SELESAI = re.compile(r"</div>")


def token_div(html: str):
    """Menghasilkan (posisi, 'mulai'|'selesai') untuk setiap tag div, berurutan."""
    for m in TAG_DIV_MULAI.finditer(html):
        yield m.start(), "mulai"
    # marker tak terpakai agar gabungan di bawah tetap urut
    yield len(html) + 1, "batas"
    for m in TAG_DIV_SELESAI.finditer(html):
        yield m.start(), "selesai"


def petakan_div(html: str):
    """Memetakan setiap <div> ke rentang [mulai, selesai] berdasarkan kedalaman."""
    mulai = [m.start() for m in TAG_DIV_MULAI.finditer(html)]
    selesai = [m.start() for m in TAG_DIV_SELESAI.finditer(html)]
    daftar = sorted([(p, "m", i) for i, p in enumerate(mulai)] + [(p, "t", i) for i, p in enumerate(selesai)])
    tumpukan = []
    peta = {}
    for pos, jenis, idx in daftar:
        if jenis == "m":
            tumpukan.append((pos, idx))
        else:
            if not tumpukan:
                continue
            pos_mulai, _ = tumpukan.pop()
            peta[pos_mulai] = (pos, html[pos_mulai:pos])
    return peta


def ambil_atribut(tag_awal: str):
    """Mengembalikan (class, style) dari tag pembuka <div ...>."""
    kelas = ""
    gaya = ""
    m = re.search(r'class="([^"]*)"', tag_awal)
    if m:
        kelas = m.group(1)
    m = re.search(r'style="([^"]*)"', tag_awal)
    if m:
        gaya = m.group(1)
    return kelas, gaya


def potong_inner(html: str, span: tuple):
    """Inner HTML dari rentang [mulai, selesai] (tanpa tag pembuka/penutup)."""
    mulai, selesai = span
    tag_awal = html[mulai:html.find(">", mulai) + 1]
    return html[html.find(">", mulai) + 1:selesai]


def pecah_div_tingkat_atas(html: str):
    """Memecah html menjadi daftar div tingkat-atas (string lengkap, komentar diabaikan)."""
    hasil = []
    i = 0
    kedalaman = 0
    mulai_div = None
    n = len(html)
    while i < n:
        if html.startswith("<!--", i):
            akhir = html.find("-->", i)
            i = akhir + 3 if akhir != -1 else n
            continue
        if html.startswith("<div", i) and (i + 4 >= n or not html[i + 4].isalnum()):
            if kedalaman == 0:
                mulai_div = i
            kedalaman += 1
            i += 4
        elif html.startswith("</div>", i):
            kedalaman -= 1
            if kedalaman == 0 and mulai_div is not None:
                hasil.append(html[mulai_div : i + 6])
                mulai_div = None
            i += 6
        else:
            i += 1
    return hasil


def main():
    html = SUMBER.read_text(encoding="utf-8")
    peta = petakan_div(html)

    mulai_main = html.find("<main")
    akhir_main = html.find("</main>")

    # --- 1. Kumpulkan semua div section-block di dalam <main> ---
    bagian_span = []
    for pos_mulai, (selesai, tag_awal) in peta.items():
        if not (mulai_main <= pos_mulai <= akhir_main):
            continue
        kelas, _ = ambil_atribut(tag_awal)
        if "section-block" in kelas.split():
            bagian_span.append((pos_mulai, selesai))
    bagian_span.sort()

    # --- 2. Untuk tiap bagian: header, deskripsi, dan baris konten ---
    bagian = []
    for i, (pos_mulai, pos_selesai) in enumerate(bagian_span):
        blok = html[pos_mulai:pos_selesai]

        m_nomor = re.search(r'class="section-number text-3xl">(.*?)</span>', blok, re.S)
        m_judul = re.search(r'<h3 class="text-2xl font-extrabold text-chess-green uppercase leading-tight">(.*?)</h3>', blok, re.S)
        nomor = re.sub(r"\s+", " ", m_nomor.group(1)).strip() if m_nomor else str(i + 1)
        judul = re.sub(r"\s+", " ", m_judul.group(1)).strip() if m_judul else ""

        # Akhir header: </h3> diikuti penutup div pembungkusnya.
        pos_konten = 0
        if m_judul:
            pos_h3 = blok.find("</h3>", m_judul.start()) + len("</h3>")
            pos_tutup = blok.find("</div>", pos_h3)
            pos_konten = pos_tutup + len("</div>") if pos_tutup != -1 else pos_h3

        # Deskripsi: paragraf pertama setelah header.
        deskripsi = ""
        m_desk = re.search(
            r'<p class="text-gray-600 mb-6 leading-snug">(.*?)</p>', blok[pos_konten:], re.S
        )
        if m_desk:
            deskripsi = m_desk.group(1).strip()
            pos_konten += m_desk.end()

        # Sisa blok: div tingkat-atas menjadi "baris" konten.
        baris = []
        for div in pecah_div_tingkat_atas(blok[pos_konten:]):
            _, gaya = ambil_atribut(div[: div.find(">") + 1])
            baris.append({"sub": "dashed" in gaya, "html": div.strip()})

        bagian.append(
            {
                "nomor": nomor,
                "judul": judul,
                "deskripsi": deskripsi,
                "baris": baris,
            }
        )

    if not bagian:
        print("GALAT: tidak ada bagian yang berhasil diekstrak.", file=sys.stderr)
        sys.exit(1)

    # --- 3. Susun struktur akhir (bab + bagian) ---
    bagian_final = []
    for i, b in enumerate(bagian):
        nomor_angka = int(b["nomor"]) if b["nomor"].isdigit() else None
        bab_id = "bab-penutup"
        for bab in BAB:
            if nomor_angka is not None and bab["mulai"] <= nomor_angka <= bab["sampai"]:
                bab_id = bab["id"]
                break
        id_bagian = f"panduan-{nomor_angka}" if nomor_angka is not None else "panduan-penutup"
        bagian_final.append(
            {
                "id": id_bagian,
                "bab": bab_id,
                **b,
            }
        )

    hasil = {
        "judul": "Panduan Mudah Bermain Catur",
        "bab": BAB + [{"id": "bab-penutup", "mulai": 0, "sampai": 0}],
        "bagian": bagian_final,
    }

    # --- 4. Tulis modul ES ---
    KELUARAN.parent.mkdir(parents=True, exist_ok=True)
    with KELUARAN.open("w", encoding="utf-8") as f:
        f.write(
            "// DIHASILKAN OTOMATIS oleh scripts/ekstrak-panduan-catur.py\n"
            "// Sumber: DokumenHistory/index.html — jangan edit manual.\n"
            "export const PANDUAN_CATUR = "
        )
        json.dump(hasil, f, ensure_ascii=False)
        f.write(";\n")

    ukuran = KELUARAN.stat().st_size / 1024
    print(f"OK: {len(bagian_final)} bagian -> {KELUARAN.relative_to(ROOT)} ({ukuran:.0f} KB)")


if __name__ == "__main__":
    main()
