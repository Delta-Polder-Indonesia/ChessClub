/**
 * Kartu "Akurasi & Kesalahan Taktikal" untuk satu partai.
 *
 * Angka-angkanya datang dari `hitungTaktikal` (padanan `computeTacticalStats`
 * di repo acuan), jadi kartu ini tidak menghitung apa pun sendiri.
 */
import { useId, useMemo, useRef, useState } from "react";
import { useI18n } from "../../../../../lib/i18n.jsx";
import { akurasiMove, kerugianMove, pemainDariEntri, rataHarmonik, cpBaku, nilaiGrafikCp } from "../../../mesin/akurasi.js";

function KartuAkurasiPartai({ moves, players }) {
  const { t } = useI18n();
  const [mode, setMode] = useState("cp");
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);
  const idGrafik = useId().replace(/:/g, "");
  const data = useMemo(() => {
    const daftarMoves = Array.isArray(moves) ? moves : [];
    // Pertahankan satu slot per ply, termasuk posisi tanpa evaluasi. Ini
    // menjaga jarak pada sumbu X dan membuat garis terputus pada celah eval,
    // seperti EvalChart en-croissant (`connectNulls={false}`).
    const langkah = daftarMoves.slice(1).map((move, offset) => {
      const index = offset + 1;
      const color = pemainDariEntri(move, index);
      const san = move?.san || move?.move || "";
      const kosong = {
        index,
        color,
        cpPutih: null,
        skorCpPutih: null,
        tipeSkor: null,
        nilaiCpGrafik: null,
        wdlPutih: null,
        accuracy: null,
        acpl: null,
        san,
      };
      const evaluasi = move?.previousStaticEvals?.[0];
      if (!Array.isArray(evaluasi)) return kosong;
      const cp = cpBaku(evaluasi);
      if (!Number.isFinite(cp)) return kosong;

      // Evaluasi UCI dan WDL adalah dari sisi pemain yang sedang jalan pada
      // posisi setelah langkah. 'color' di entri parseMove adalah sisi lawan
      // yang akan jalan; konversi eksplisit ini menjaga orientasi Putih.
      const sisiJalan = move?.color === "w" || move?.color === "b"
        ? move.color
        : (index % 2 === 0 ? "w" : "b");
      const cpPutih = sisiJalan === "w" ? cp : -cp;
      const cpMentah = Number(evaluasi[1]);
      const cpMentahPutih = sisiJalan === "w" ? cpMentah : -cpMentah;
      // EvalChart upstream memetakan mate langsung ke ±Infinity (y = ±1),
      // sedangkan evaluasi CP memakai sigmoid 0.004, bukan CP/1000 linear.
      const cpUntukGrafik = evaluasi[0] === "mate"
        ? (cpPutih > 0 ? Infinity : -Infinity)
        : cpMentahPutih;
      const wdlMentah = move?.kandidat?.find((item) => item?.peringkat === 1)?.wdl
        ?? move?.kandidat?.[0]?.wdl;
      const wdlValid = Array.isArray(wdlMentah)
        && wdlMentah.length === 3
        && wdlMentah.every((nilai) => Number.isFinite(nilai) && nilai >= 0)
        && wdlMentah.reduce((jumlah, nilai) => jumlah + nilai, 0) > 0;
      const wdlPutih = wdlValid
        ? (sisiJalan === "w"
          ? wdlMentah
          : [wdlMentah[2], wdlMentah[1], wdlMentah[0]])
        : null;
      return {
        ...kosong,
        cpPutih: Math.max(-1000, Math.min(1000, cpPutih)),
        skorCpPutih: evaluasi[0] === "mate" ? (sisiJalan === "w" ? Number(evaluasi[1]) : -Number(evaluasi[1])) : cpMentahPutih,
        tipeSkor: evaluasi[0],
        nilaiCpGrafik: nilaiGrafikCp(cpUntukGrafik),
        wdlPutih,
        accuracy: akurasiMove(move),
        acpl: kerugianMove(move),
      };
    });
    return {
      langkah,
      putih: langkah.filter((item) => item.color === "w"),
      hitam: langkah.filter((item) => item.color === "b"),
    };
  }, [moves]);

  const points = data.langkah;
  const titikWdl = points.filter((p) => p.wdlPutih);
  const wdlTersedia = titikWdl.length >= 2;
  const rata = (daftar, kunci) => {
    const nilai = daftar.map((item) => item[kunci]).filter(Number.isFinite);
    return nilai.length ? nilai.reduce((jumlah, angka) => jumlah + angka, 0) / nilai.length : null;
  };
  const format = (nilai) => Number.isFinite(nilai) ? nilai.toFixed(1) : "—";
  const width = 720, height = 190, left = 8, right = 8, top = 8, bottom = 8;
  const plotW = width - left - right, plotH = height - top - bottom;
  const nilaiGrafik = points.map((p) => ({
    ...p,
    nilai: mode === "wdl"
      ? (p.wdlPutih
        ? ((p.wdlPutih[0] + p.wdlPutih[1] / 2) / p.wdlPutih.reduce((a, b) => a + b, 0) - 0.5) * 2
        : null)
      : p.nilaiCpGrafik,
  }));
  const coords = nilaiGrafik.map((p, i) => ({
    ...p,
    x: nilaiGrafik.length < 2 ? width / 2 : left + i / (nilaiGrafik.length - 1) * plotW,
    y: Number.isFinite(p.nilai)
      ? top + (1 - Math.max(-1, Math.min(1, p.nilai))) / 2 * plotH
      : null,
  }));
  // Jangan hubungkan melewati posisi tanpa eval/WDL: upstream mempertahankan
  // node pada sumbu X dan memutus kurva pada nilai yang tidak tersedia.
  const segmen = [];
  let segmenAktif = [];
  for (const point of coords) {
    if (!Number.isFinite(point.y)) {
      if (segmenAktif.length) segmen.push(segmenAktif);
      segmenAktif = [];
      continue;
    }
    segmenAktif.push(point);
  }
  if (segmenAktif.length) segmen.push(segmenAktif);
  const pathLine = segmen.map((bagian) => bagian
    .map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ")).join(" ");
  const zero = top + plotH / 2;
  const area = segmen.filter((bagian) => bagian.length >= 2).map((bagian) =>
    `M ${bagian[0].x.toFixed(2)} ${zero} ${bagian.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ")} L ${bagian[bagian.length - 1].x.toFixed(2)} ${zero} Z`
  ).join(" ");
  const coordsValid = coords.filter((p) => Number.isFinite(p.y));
  const jumlahEvaluasi = coords.filter((p) => Number.isFinite(p.nilaiCpGrafik)).length;
  const titikAktif = coordsValid.find((p) => p.index === hoverIndex) ?? null;
  const judulTitik = (point) => `${Math.ceil(point.index / 2)}.${point.index % 2 === 0 ? ".." : ""} ${point.san}`;
  const skorTitik = (point) => {
    const nilai = point.skorCpPutih;
    const tanda = nilai > 0 ? "+" : nilai < 0 ? "-" : "";
    if (point.tipeSkor === "mate") return `${tanda}M${Math.abs(nilai)}`;
    return `${tanda}${(Math.abs(nilai) / 100).toFixed(2)}`;
  };
  const wdlTitik = (point) => t("analisa.wawasan.grafikAkurasi.tooltipWdl", {
    putih: t("analisa.pemain.putih"),
    peluangPutih: point.wdlPutih[0] / 10,
    seri: t("analisa.wawasan.hasil.seri"),
    peluangSeri: point.wdlPutih[1] / 10,
    hitam: t("analisa.pemain.hitam"),
    peluangHitam: point.wdlPutih[2] / 10,
  });
  const pilihTitikDariPointer = (event) => {
    const svg = svgRef.current;
    const batas = svg?.getBoundingClientRect();
    if (!batas?.width || !batas?.height || coordsValid.length === 0) return null;
    const x = (event.clientX - batas.left) / batas.width * width;
    return coordsValid.reduce((terdekat, point) =>
      Math.abs(point.x - x) < Math.abs(terdekat.x - x) ? point : terdekat,
    ).index;
  };
  const perbaruiTitikPointer = (event) => {
    const index = pilihTitikDariPointer(event);
    if (index !== null) setHoverIndex(index);
  };

  return (
    <section className="wawasan-card flex flex-col gap-3" data-uji="wawasan-akurasi-partai">
      <h3 className="wawasan-card-title">{t("analisa.wawasan.akurasiJudul")}</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[
          { key: "w", name: players?.[0]?.name || t("analisa.pemain.putih"), stats: data.putih },
          { key: "b", name: players?.[1]?.name || t("analisa.pemain.hitam"), stats: data.hitam },
        ].map(({ key, name, stats }) => (
          <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-border bg-backgroundBox px-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-xs uppercase tracking-wide text-foregroundGrey">{name}</div>
              <div className="mt-1 font-mono text-xs tabular-nums text-foregroundGrey">{format(rata(stats, "acpl"))} ACPL</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xl font-medium leading-none tabular-nums text-foreground">{format(rataHarmonik(stats.map((item) => item.accuracy).filter(Number.isFinite)))}%</div>
              <div className="mt-1 text-xs text-foregroundGrey">{t("analisa.wawasan.akurasiJudul")}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-md border border-border bg-[#1b1c1e]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <div className="inline-flex items-center gap-0.5 rounded bg-black/40 p-0.5" role="group" aria-label={t("analisa.wawasan.grafikAkurasi.jenisEvaluasi")}>
            <button type="button" aria-pressed={mode === "cp"} onClick={() => setMode("cp")} className={`rounded px-2 py-1 text-[11px] font-semibold ${mode === "cp" ? "bg-[#383a3d] text-white" : "text-white/55 hover:text-white"}`}>CP</button>
            <button
              type="button"
              aria-pressed={mode === "wdl"}
              disabled={!wdlTersedia}
              title={t(wdlTersedia ? "analisa.wawasan.grafikAkurasi.tersediaWdl" : "analisa.wawasan.grafikAkurasi.belumWdl")}
              onClick={() => setMode("wdl")}
              className={`rounded px-2 py-1 text-[11px] font-semibold ${mode === "wdl" ? "bg-[#383a3d] text-white" : wdlTersedia ? "text-white/55 hover:text-white" : "cursor-not-allowed text-white/30"}`}
            >WDL</button>
          </div>
          <span className="text-[10px] tabular-nums text-white/45">
            {mode === "wdl"
              ? t("analisa.wawasan.grafikAkurasi.jumlahWdl", { n: titikWdl.length })
              : t("analisa.wawasan.grafikAkurasi.jumlahEvaluasi", { n: jumlahEvaluasi })}
          </span>
        </div>
        {coordsValid.length >= 2 ? (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={t(mode === "wdl" ? "analisa.wawasan.grafikAkurasi.judulWdl" : "analisa.wawasan.grafikAkurasi.judulCp")}
            onPointerMove={perbaruiTitikPointer}
            onPointerDown={perbaruiTitikPointer}
            onPointerLeave={(event) => {
              if (event.pointerType !== "touch") setHoverIndex(null);
            }}
            className="block h-auto w-full"
          >
            <defs>
              <clipPath id={`${idGrafik}-atas`}><rect x={left} y={top} width={plotW} height={plotH / 2} /></clipPath>
              <clipPath id={`${idGrafik}-bawah`}><rect x={left} y={zero} width={plotW} height={plotH / 2} /></clipPath>
            </defs>
            <rect x={left} y={top} width={plotW} height={plotH} fill="transparent" pointerEvents="all" />
            {[0, .5, 1].map((r) => <line key={r} x1={left} y1={top + plotH * r} x2={width-right} y2={top + plotH * r} stroke="#85898d" strokeOpacity={r === .5 ? .35 : .12} strokeDasharray={r === .5 ? "3 4" : "none"} />)}
            <path d={area} fill="#e5e7eb" fillOpacity=".88" clipPath={`url(#${idGrafik}-atas)`} />
            <path d={area} fill="#34383d" fillOpacity=".96" clipPath={`url(#${idGrafik}-bawah)`} />
            <path d={pathLine} fill="none" stroke="#b9bdc2" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
            {coordsValid.map((p) => (
              <circle
                key={p.index}
                cx={p.x}
                cy={p.y}
                r="14"
                fill="transparent"
                stroke="transparent"
                pointerEvents="all"
                tabIndex={0}
                role="img"
                aria-label={`${judulTitik(p)} · ${mode === "wdl" ? wdlTitik(p) : t("analisa.wawasan.grafikAkurasi.tooltipKeunggulan", { skor: skorTitik(p) })}`}
                onMouseEnter={() => setHoverIndex(p.index)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(p.index)}
                onBlur={() => setHoverIndex(null)}
              >
                <title>{`${judulTitik(p)} · ${mode === "wdl" ? wdlTitik(p) : t("analisa.wawasan.grafikAkurasi.tooltipKeunggulan", { skor: skorTitik(p) })}`}</title>
              </circle>
            ))}
          </svg>
        ) : (
          <div className="flex h-36 items-center justify-center px-4 text-center text-xs text-white/55">
            {t(mode === "wdl" ? "analisa.wawasan.grafikAkurasi.kosongWdl" : "analisa.wawasan.grafikAkurasi.kosongCp")}
          </div>
        )}
        {titikAktif && (
          <div role="tooltip" className="pointer-events-none absolute left-3 top-12 z-20 max-w-[calc(100%-1.5rem)] rounded-md border border-white/15 bg-[#111315]/95 px-3 py-2 text-xs text-white shadow-lg">
            <div className="font-semibold">{judulTitik(titikAktif)}</div>
            <div className="mt-1 whitespace-pre-line text-white/75">
              {mode === "wdl"
                ? wdlTitik(titikAktif)
                : t("analisa.wawasan.grafikAkurasi.tooltipKeunggulan", { skor: skorTitik(titikAktif) })}
            </div>
          </div>
        )}
        <div className="flex justify-between border-t border-white/10 px-3 py-1.5 text-[10px] text-white/45">
          <span>{t(mode === "wdl" ? "analisa.wawasan.grafikAkurasi.peluangPutih" : "analisa.wawasan.grafikAkurasi.keunggulanPutih")}</span>
          <span>{t(mode === "wdl" ? "analisa.wawasan.grafikAkurasi.peluangHitam" : "analisa.wawasan.grafikAkurasi.keunggulanHitam")}</span>
        </div>
      </div>
    </section>
  );
}

export default KartuAkurasiPartai;
