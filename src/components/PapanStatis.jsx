/**
 * Papan statis — hanya menggambar posisi, tanpa interaksi.
 *
 * Dipakai di dua tempat:
 *  - halaman isi `/program-kami/teka-teki` (papan pengantar soal Lichess), dan
 *  - widget "Teka-teki Hari Ini" di halaman Landing.
 *
 * Sengaja TIDAK memakai `PapanTekaTeki` (pemutar penuh): halaman isi dan
 * landing hanya butuh gambar, dan pemutar itu menarik chunk besar yang tidak
 * diperlukan di halaman yang tidak memainkan langkah.
 *
 * Warna petak mengikuti tema bawaan alat latihan ("hijau", lihat
 * `src/halaman/TekaTeki/temaPapan.js`): terang `#ebecd0`, gelap `#779556`.
 * Tanda langkah terakhir memakai tint kuning datar ala lichess — bukan pendar.
 */
import { useMemo } from "react";
import { Chess } from "chess.js";
import { ChessPiece } from "./chess/ChessPiece.jsx";
import { TEMA_PAPAN } from "../halaman/TekaTeki/temaPapan.js";

const FILE = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANK = ["8", "7", "6", "5", "4", "3", "2", "1"];

const TINTA_LANGKAH = "rgba(255, 213, 79, 0.55)";

const luminansiRelatif = (hex) => {
  const kanal = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = kanal.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const rasioKontras = (a, b) => {
  const la = luminansiRelatif(a);
  const lb = luminansiRelatif(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const warnaTeksKoordinat = (warnaLatar, warnaLawan) => {
  const kandidat = [warnaLawan, "#000000", "#ffffff"];
  const lolos = kandidat.find((w) => rasioKontras(w, warnaLatar) >= 4.5);
  if (lolos) return lolos;
  return rasioKontras("#000000", warnaLatar) >= rasioKontras("#ffffff", warnaLatar)
    ? "#000000"
    : "#ffffff";
};

export default function PapanStatis({
  fen,
  orientasi = "w",
  /** `{ from, to }` petak yang diberi tint (langkah terakhir). */
  terakhir = null,
  ariaLabel = "",
  setBidak = "merida",
  tema = "hijau",
  tampilKoordinat = "tepi",
  sorotLangkahAkhir = true,
  className = "",
}) {
  const palet = TEMA_PAPAN[tema] ?? TEMA_PAPAN.hijau;
  const teksTerang = warnaTeksKoordinat(palet.terang, palet.gelap);
  const teksGelap = warnaTeksKoordinat(palet.gelap, palet.terang);
  const papan = useMemo(() => {
    try {
      return new Chess(fen).board();
    } catch {
      return null;
    }
  }, [fen]);

  // `Chess().board()` selalu baris 8 → 1 dan lajur a → h. Untuk orientasi
  // hitam, keduanya dibalik supaya papan menghadap pihak yang melangkah.
  const barisUrut = useMemo(
    () => (orientasi === "b" ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]),
    [orientasi]
  );
  const lajurUrut = useMemo(
    () => (orientasi === "b" ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]),
    [orientasi]
  );

  if (!papan) return null;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`aspect-square w-full select-none ${className}`}
    >
      <div className="grid aspect-square w-full grid-cols-8 grid-rows-8 overflow-hidden rounded border border-slate-300">
        {barisUrut.map((baris, i) =>
          lajurUrut.map((kolom, j) => {
            const terang = (baris + kolom) % 2 === 0;
            const petak = `${FILE[kolom]}${RANK[baris]}`;
            const bidak = papan[baris][kolom];
            const ditandai =
              sorotLangkahAkhir &&
              terakhir &&
              (petak === terakhir.from || petak === terakhir.to);
            // Koordinat digambar pada tepi papan sesuai orientasi atau semua petak.
            const tampilLajur =
              tampilKoordinat === "semua" || (tampilKoordinat === "tepi" && i === 7);
            const tampilBaris =
              tampilKoordinat === "semua" || (tampilKoordinat === "tepi" && j === 0);
            return (
              <div
                key={petak}
                // `data-petak`/`data-bidak` dipakai uji (jsdom) untuk membaca
                // posisi tanpa bergantung pada gambar bidak; tidak mengubah
                // tampilan maupun nama aksesibel (papan dibacakan lewat
                // `role="img"` + `aria-label` di pembungkusnya).
                data-petak={petak}
                data-bidak={
                  bidak
                    ? bidak.color === "w"
                      ? bidak.type.toUpperCase()
                      : bidak.type
                    : ""
                }
                className="relative flex items-center justify-center"
                style={{ backgroundColor: terang ? palet.terang : palet.gelap }}
              >
                {ditandai && (
                  <span
                    className="absolute inset-0"
                    style={{ backgroundColor: TINTA_LANGKAH }}
                  />
                )}
                {tampilLajur && (
                  <span
                    className="absolute bottom-0.5 right-1 z-10 font-mono text-[8px] font-bold leading-none"
                    style={{ color: terang ? teksTerang : teksGelap }}
                  >
                    {FILE[kolom]}
                  </span>
                )}
                {tampilBaris && (
                  <span
                    className="absolute left-1 top-0.5 z-10 font-mono text-[8px] font-bold leading-none"
                    style={{ color: terang ? teksTerang : teksGelap }}
                  >
                    {RANK[baris]}
                  </span>
                )}
                {bidak && (
                  <div className="relative z-[1] flex h-[70%] w-[70%] items-center justify-center">
                    <ChessPiece
                      piece={
                        bidak.color === "w" ? bidak.type.toUpperCase() : bidak.type
                      }
                      set={setBidak}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
