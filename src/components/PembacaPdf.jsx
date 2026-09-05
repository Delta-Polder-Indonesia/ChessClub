import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { berkasPublik } from "../lib/asets.js";

/**
 * Pembaca PDF bawaan situs (berbasis pdf.js).
 *
 * Kenapa tidak <iframe> saja? Karena penampil PDF bawaan browser tidak selalu
 * ada: Chrome/Firefox di Android dan sebagian besar peramban dalam aplikasi
 * (Instagram/WhatsApp/Facebook) justru MENGUNDUH berkas ketika PDF dipasang
 * pada iframe. Dengan pdf.js, halaman digambar sendiri ke <canvas> sehingga
 * "Baca" benar-benar membaca di tempat — di ponsel maupun desktop.
 *
 * Komponen ini juga tahan sumber-mati: `sumber` boleh berisi beberapa URL
 * (proxy same-origin, berkas statis, object storage, GitHub Media) dan akan
 * dicoba berurutan sampai ada yang berhasil dimuat.
 */

/** Muat pustaka pdf.js sekali saja, hanya ketika pembaca dibuka. */
let janjiPdfjs = null;
function muatPdfjs() {
  if (!janjiPdfjs) {
    janjiPdfjs = (async () => {
      const [pdfjs, worker] = await Promise.all([
        import("pdfjs-dist"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
      ]);
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    })().catch((e) => {
      janjiPdfjs = null;
      throw e;
    });
  }
  return janjiPdfjs;
}

const ZOOM_MIN = 0.5;
const ZOOM_MAKS = 3;
const LANGKAH_ZOOM = 0.25;

function IkonSebelum() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 5L8 12L15 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IkonSesudah() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PembacaPdf({ sumber, judul, urlUnduh, padaSiap }) {
  const daftarSumber = useMemo(
    () => (Array.isArray(sumber) ? sumber.filter(Boolean) : [sumber].filter(Boolean)),
    [sumber]
  );

  const wadahRef = useRef(null);
  const kanvasRef = useRef(null);
  const dokumenRef = useRef(null);
  const tugasRenderRef = useRef(null);

  const [status, setStatus] = useState("memuat"); // memuat | siap | galat
  const [pesan, setPesan] = useState("");
  const [progres, setProgres] = useState(0);
  const [halaman, setHalaman] = useState(1);
  const [jumlah, setJumlah] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [lebarWadah, setLebarWadah] = useState(0);
  const [percobaan, setPercobaan] = useState(0);

  /* ------------------------------------------------ muat dokumen PDF ---- */
  useEffect(() => {
    let batal = false;
    let dokumenLokal = null;

    async function jalankan() {
      setStatus("memuat");
      setPesan("");
      setProgres(0);
      setHalaman(1);
      setJumlah(0);

      let pdfjs;
      try {
        pdfjs = await muatPdfjs();
      } catch {
        if (!batal) {
          setStatus("galat");
          setPesan("Pustaka pembaca PDF gagal dimuat. Periksa koneksi lalu coba lagi.");
        }
        return;
      }

      const galat = [];
      for (const url of daftarSumber) {
        if (batal) return;
        const tugas = pdfjs.getDocument({
          url,
          cMapUrl: berkasPublik("/vendor/pdfjs/cmaps/"),
          cMapPacked: true,
          standardFontDataUrl: berkasPublik("/vendor/pdfjs/standard_fonts/"),
          disableAutoFetch: false,
        });
        tugas.onProgress = ({ loaded, total }) => {
          if (!batal && total) setProgres(Math.min(100, Math.round((loaded / total) * 100)));
        };
        try {
          // eslint-disable-next-line no-await-in-loop -- sengaja berurutan: sumber cadangan.
          dokumenLokal = await tugas.promise;
          if (batal) {
            dokumenLokal.destroy();
            return;
          }
          dokumenRef.current = dokumenLokal;
          setJumlah(dokumenLokal.numPages);
          setStatus("siap");
          padaSiap?.(dokumenLokal.numPages);
          return;
        } catch (e) {
          galat.push(`${url}: ${e?.message || e}`);
          try {
            tugas.destroy();
          } catch {
            /* abaikan */
          }
        }
      }

      if (!batal) {
        setStatus("galat");
        setPesan(
          "Dokumen tidak dapat dimuat dari sumber mana pun. Coba unduh berkasnya atau buka lagi nanti."
        );
        if (galat.length) console.warn("[pembaca-pdf] semua sumber gagal:\n" + galat.join("\n"));
      }
    }

    jalankan();

    return () => {
      batal = true;
      if (tugasRenderRef.current) {
        try {
          tugasRenderRef.current.cancel();
        } catch {
          /* abaikan */
        }
        tugasRenderRef.current = null;
      }
      const dok = dokumenRef.current;
      dokumenRef.current = null;
      if (dok) {
        try {
          dok.destroy();
        } catch {
          /* abaikan */
        }
      }
    };
  }, [daftarSumber, percobaan, padaSiap]);

  /* --------------------------------------------- ukur lebar area baca ---- */
  useEffect(() => {
    const el = wadahRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const pengamat = new ResizeObserver((entri) => {
      const lebar = entri[0]?.contentRect?.width || 0;
      setLebarWadah(Math.round(lebar));
    });
    pengamat.observe(el);
    setLebarWadah(Math.round(el.clientWidth));
    return () => pengamat.disconnect();
  }, [status]);

  /* ------------------------------------------------- gambar halaman ----- */
  useEffect(() => {
    const dok = dokumenRef.current;
    const kanvas = kanvasRef.current;
    if (status !== "siap" || !dok || !kanvas || !lebarWadah) return undefined;

    let batal = false;

    (async () => {
      try {
        const muka = await dok.getPage(halaman);
        if (batal) return;

        const asli = muka.getViewport({ scale: 1 });
        const skalaLebar = (lebarWadah - 8) / asli.width;
        const skala = Math.max(0.1, skalaLebar * zoom);
        const rasio = Math.min(window.devicePixelRatio || 1, 2);
        const tampilan = muka.getViewport({ scale: skala });

        kanvas.width = Math.floor(tampilan.width * rasio);
        kanvas.height = Math.floor(tampilan.height * rasio);
        kanvas.style.width = `${Math.floor(tampilan.width)}px`;
        kanvas.style.height = `${Math.floor(tampilan.height)}px`;

        const konteks = kanvas.getContext("2d", { alpha: false });
        konteks.setTransform(rasio, 0, 0, rasio, 0, 0);
        konteks.fillStyle = "#ffffff";
        konteks.fillRect(0, 0, tampilan.width, tampilan.height);

        if (tugasRenderRef.current) {
          try {
            tugasRenderRef.current.cancel();
          } catch {
            /* abaikan */
          }
        }
        const tugas = muka.render({ canvasContext: konteks, viewport: tampilan });
        tugasRenderRef.current = tugas;
        await tugas.promise;
        tugasRenderRef.current = null;
      } catch (e) {
        if (!batal && e?.name !== "RenderingCancelledException") {
          console.warn("[pembaca-pdf] gagal menggambar halaman:", e?.message || e);
        }
      }
    })();

    return () => {
      batal = true;
    };
  }, [status, halaman, zoom, lebarWadah]);

  /* ------------------------------------------------------- navigasi ----- */
  const keHalaman = useCallback(
    (nomor) => {
      const target = Math.min(Math.max(1, Number(nomor) || 1), jumlah || 1);
      setHalaman(target);
    },
    [jumlah]
  );

  // Setiap ganti halaman, kembalikan pandangan ke sisi atas dokumen.
  useEffect(() => {
    const el = wadahRef.current;
    if (!el) return;
    if (typeof el.scrollTo === "function") el.scrollTo({ top: 0, behavior: "smooth" });
    else el.scrollTop = 0;
  }, [halaman]);

  useEffect(() => {
    if (status !== "siap") return undefined;
    const padaTombol = (e) => {
      const fokus = document.activeElement?.tagName;
      if (fokus === "INPUT" || fokus === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        keHalaman(halaman + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        keHalaman(halaman - 1);
      }
    };
    window.addEventListener("keydown", padaTombol);
    return () => window.removeEventListener("keydown", padaTombol);
  }, [status, halaman, keHalaman]);

  /* ----------------------------------------------------------- tampil --- */
  const tombolAlat =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-white/20 bg-white/10 px-2 text-[12px] font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-md bg-[#3a3d40]">
      {/* Area halaman */}
      <div ref={wadahRef} className="flex-1 overflow-auto bg-[#525659] p-1 md:p-3">
        {status === "memuat" && (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-white/80">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <p className="m-0 text-[12px]">
              Memuat dokumen{progres ? ` — ${progres}%` : "…"}
            </p>
          </div>
        )}

        {status === "galat" && (
          <div className="mx-auto flex h-full min-h-[240px] max-w-[420px] flex-col items-center justify-center gap-3 text-center text-white/85">
            <p className="m-0 text-[13px] font-semibold">Dokumen gagal dimuat</p>
            <p className="m-0 text-[12px] text-white/70">{pesan}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={() => setPercobaan((n) => n + 1)} className={tombolAlat}>
                Coba lagi
              </button>
              {daftarSumber[0] && (
                <a href={daftarSumber[0]} target="_blank" rel="noreferrer noopener" className={tombolAlat}>
                  Buka di tab baru
                </a>
              )}
              {urlUnduh && (
                <a href={urlUnduh} download className={tombolAlat}>
                  Unduh PDF
                </a>
              )}
            </div>
          </div>
        )}

        {status === "siap" && (
          <div className="flex w-full justify-center">
            <canvas
              ref={kanvasRef}
              className="max-w-none rounded-sm bg-white shadow-lg"
              aria-label={`${judul || "Dokumen"} — halaman ${halaman} dari ${jumlah}`}
              role="img"
            />
          </div>
        )}
      </div>

      {/* Bilah alat */}
      {status === "siap" && (
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 bg-[#3a3d40] px-2 py-2 md:justify-between md:px-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={tombolAlat}
              onClick={() => keHalaman(halaman - 1)}
              disabled={halaman <= 1}
              aria-label="Halaman sebelumnya"
            >
              <IkonSebelum />
            </button>
            <label className="flex items-center gap-1 text-[12px] text-white/80">
              <input
                type="number"
                min={1}
                max={jumlah}
                value={halaman}
                onChange={(e) => keHalaman(e.target.value)}
                className="h-8 w-14 rounded-md border border-white/20 bg-white/10 px-2 text-center text-[12px] text-white outline-none focus:border-white/50"
                aria-label="Nomor halaman"
              />
              <span>/ {jumlah}</span>
            </label>
            <button
              type="button"
              className={tombolAlat}
              onClick={() => keHalaman(halaman + 1)}
              disabled={halaman >= jumlah}
              aria-label="Halaman berikutnya"
            >
              <IkonSesudah />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={tombolAlat}
              onClick={() => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - LANGKAH_ZOOM) * 100) / 100))}
              disabled={zoom <= ZOOM_MIN}
              aria-label="Perkecil"
            >
              −
            </button>
            <button type="button" className={tombolAlat} onClick={() => setZoom(1)} aria-label="Sesuaikan lebar">
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              className={tombolAlat}
              onClick={() => setZoom((z) => Math.min(ZOOM_MAKS, Math.round((z + LANGKAH_ZOOM) * 100) / 100))}
              disabled={zoom >= ZOOM_MAKS}
              aria-label="Perbesar"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
