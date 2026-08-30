#!/usr/bin/env python3
"""Buat public/data/teka-teki.json dari basis data puzzle Lichess.

Sumber: basis data puzzle Lichess (lisensi CC0, domain publik), dipadukan
dengan informasi partai aslinya. Skrip ini mengalirkan berkas NDJSON hasil
ekstrak gabungan puzzle+partai, menyaring puzzle skakmat berkualitas tinggi,
memverifikasi setiap langkah lewat python-chess, lalu menuliskannya dalam
skema yang dipakai halaman /teka-teki.

Skema keluaran (kompatibel dengan TekaTeki.jsx):
  problemid  : nomor urut 1..N (wajib sama dengan posisi array + 1,
               karena dipakai parameter URL ?id= dan form nomor soal)
  first      : "White to Move" | "Black to Move"
  type       : "Mate in One" | "Mate in Two" | "Mate in Three"
  fen        : posisi awal SETELAH langkah persiapan pihak lawan
  moves      : "e2-e4;d7-d5;..." — langkah pemain & balasan lawan bergantian,
               dipisah ";", promosi ditulis menempel (c7-c8q)
  + metadata tambahan: rating, tema, sumberId, linkPartai, pemain/elo, pembukaan

Pemakaian:
  pip install chess
  python3 scripts/buat-teka-teki.py <berkas.ndjson> [berkas.ndjson.lain ...]

Catatan penyaringan (kualitas ala liga NACCL):
  - tema mateIn1/mateIn2/mateIn3 lalu diverifikasi ulang lewat replay
  - Popularity >= 80, RatingDeviation <= 90, NbPlays >= 100
"""

import json
import re
import subprocess
import sys

import chess

# Ambang kualitas per tipe (bisa dilonggarkan untuk mateIn3 yang langka).
AMBANG = {
    1: dict(pop=80, rd=90, plays=100),
    2: dict(pop=80, rd=90, plays=100),
    3: dict(pop=75, rd=100, plays=50),
}

TIPE_TEKS = {1: "Mate in One", 2: "Mate in Two", 3: "Mate in Three"}
TEMA_MATE = {"mateIn1", "mateIn2", "mateIn3"}

_HDR = {
    "putih": re.compile(r'\[White "([^"]*)"\]'),
    "hitam": re.compile(r'\[Black "([^"]*)"\]'),
    "eloPutih": re.compile(r'\[WhiteElo "([^"]*)"\]'),
    "eloHitam": re.compile(r'\[BlackElo "([^"]*)"\]'),
    "pembukaan": re.compile(r'\[Opening "([^"]*)"\]'),
}


def format_uci(uci: str) -> str:
    """'e7e8q' -> 'e7-e8q' (format dipakai parseLangkah di TekaTeki.jsx)."""
    promo = uci[4] if len(uci) == 5 else ""
    return f"{uci[:2]}-{uci[2:4]}{promo}"


def olah_baris(baris: str):
    """Kembalikan dict puzzle siap pakai, atau None bila tidak lolos saringan."""
    try:
        data = json.loads(baris)
        p, g = data["puzzle"], data.get("game") or {}
    except Exception:
        return None

    tema = p["Themes"].split()
    if not (set(tema) & TEMA_MATE):
        return None

    # Replay: langkah pertama milik lawan (posisi persiapan), sisanya solusi.
    try:
        papan = chess.Board(p["FEN"])
    except ValueError:
        return None

    uci = p["Moves"].split()
    if len(uci) < 2:
        return None
    try:
        papan.push_uci(uci[0])  # langkah persiapan lawan
        for m in uci[1:]:
            papan.push_uci(m)
    except ValueError:
        return None
    if not papan.is_checkmate():
        return None

    langkah_pemain = len(uci) - 1  # 1, 3, atau 5 ply milik pemain
    jumlah = (langkah_pemain + 1) // 2  # mate-in-N
    if jumlah not in TIPE_TEKS:
        return None

    ambang = AMBANG[jumlah]
    if (
        int(p["Popularity"]) < ambang["pop"]
        or int(p["RatingDeviation"]) > ambang["rd"]
        or int(p["NbPlays"]) < ambang["plays"]
    ):
        return None

    # Posisi awal soal = setelah langkah persiapan lawan.
    awal = chess.Board(p["FEN"])
    awal.push_uci(uci[0])

    pgn = g.get("pgn", "")
    meta = {k: (rx.search(pgn).group(1) if rx.search(pgn) else "")
            for k, rx in _HDR.items()}

    return {
        "first": "White to Move" if awal.turn == chess.WHITE else "Black to Move",
        "type": TIPE_TEKS[jumlah],
        "fen": awal.fen(),
        "moves": ";".join(format_uci(m) for m in uci[1:]),
        "rating": int(p["Rating"]),
        "tema": " ".join(tema),
        "sumberId": p["PuzzleId"],
        "linkPartai": p.get("GameUrl", ""),
        "pemainPutih": meta["putih"],
        "pemainHitam": meta["hitam"],
        "eloPutih": int(meta["eloPutih"]) if meta["eloPutih"].isdigit() else None,
        "eloHitam": int(meta["eloHitam"]) if meta["eloHitam"].isdigit() else None,
        "pembukaan": meta["pembukaan"] or p.get("OpeningFamily", ""),
    }


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("pemakaian: buat-teka-teki.py <berkas.ndjson> [...]")

    hasil, dilihat = [], set()
    for jalur in sys.argv[1:]:
        with open(jalur) as f:
            for baris in f:
                item = olah_baris(baris)
                if item and item["sumberId"] not in dilihat:
                    dilihat.add(item["sumberId"])
                    hasil.append(item)

    # Urut rating naik: mode "Semua" menjadi tanjakan kesulitan yang landai,
    # dan tiap filter tipe pun ikut terurut. problemid = posisi array + 1
    # (dipakai parameter URL ?id= dan form nomor soal).
    hasil.sort(key=lambda x: x["rating"])
    hasil = [{"problemid": i, **item} for i, item in enumerate(hasil, 1)]

    keluaran = {"problems": hasil}
    tujuan = "public/data/teka-teki.json"
    with open(tujuan, "w") as f:
        json.dump(keluaran, f, ensure_ascii=False, indent=1)
        f.write("\n")

    # Rapikan nama pembukaan agar konsisten dengan opening explorer.
    subprocess.run(["node", "scripts/standarkan-nama-teka-teki.mjs"], check=True)

    dari_tipe = {}
    dari_giliran = {"White to Move": 0, "Black to Move": 0}
    for item in hasil:
        dari_tipe[item["type"]] = dari_tipe.get(item["type"], 0) + 1
        dari_giliran[item["first"]] += 1
    print(f"total: {len(hasil)} | per tipe: {dari_tipe} | giliran: {dari_giliran}")
    print(f"ditulis: {tujuan}")


if __name__ == "__main__":
    # problemid disisipkan setelah urut supaya = posisi array + 1.
    main()
