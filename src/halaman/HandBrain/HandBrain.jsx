import { useMemo, useState } from "react";
import PapanTekaTeki from "../TekaTeki/PapanTekaTeki.jsx";
import { BarisProfil } from "../PapanInteraktif/bersama/BarisProfil.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { PENGATURAN_AWAL, usePengaturanPapan } from "../PapanInteraktif/bersama/gunakanPengaturanPapan.js";
import { usePengaturanBersama } from "../PapanInteraktif/bersama/PengaturanKonteks.jsx";
import {
  buatPartai,
  langkahDiizinkan,
  mainkanLangkah,
  papanDariLangkah,
} from "./handBrainLogika.js";
import { useTandaBantu } from "../../lib/tandaBantu.js";

/** Pola petak papan yang sah (a1–h8). */
const POLA_PETAK = /^[a-h][1-8]$/;

/** Nama jenis bidak lewat kunci literal (dipindai uji-i18n). */
function namaJenis(t, jenis) {
  switch (jenis) {
    case "p":
      return t("papan.hbJenis.p");
    case "n":
      return t("papan.hbJenis.n");
    case "b":
      return t("papan.hbJenis.b");
    case "r":
      return t("papan.hbJenis.r");
    case "q":
      return t("papan.hbJenis.q");
    case "k":
      return t("papan.hbJenis.k");
    default:
      return jenis ?? "";
  }
}

/**
 * Mode Hand & Brain (varian lokal, dua pemain di satu perangkat).
 * Aturan lengkap ada di handBrainLogika.js. Komponen ini hanya mengurus
 * interaksi papan dan tampilan; seluruh keputusan aturan dibuat di sana.
 */
export default function HandBrain({ pengaturan = null }) {
  const { t } = useI18n();
  const pengaturanLokal = usePengaturanPapan();
  const pengaturanBersama = usePengaturanBersama();
  const pp = (pengaturan ?? pengaturanBersama ?? pengaturanLokal).nilai ?? PENGATURAN_AWAL;

  const [partai, setPartai] = useState(() => buatPartai());
  const [terpilih, setTerpilih] = useState(null);
  const [sasaran, setSasaran] = useState([]);
  const [pesan, setPesan] = useState("");
  const { tanda, tandaPetak, tandaPanah, hapusSemuaTanda } = useTandaBantu();

  const papan = useMemo(() => papanDariLangkah(partai.langkah), [partai.langkah]);
  const fen = papan.fen();
  const giliran = papan.turn();
  const selesai = partai.jenis === null;
  const riwayat = useMemo(() => papan.history(), [papan]);
  const langkahAkhir = useMemo(() => {
    const verbose = papan.history({ verbose: true });
    const terakhir = verbose.at(-1);
    return terakhir ? { from: terakhir.from, to: terakhir.to } : null;
  }, [papan]);

  const namaWarna = (warna) => (warna === "w" ? t("papan.hbPutih") : t("papan.hbHitam"));

  function bersihkanPilihan() {
    setTerpilih(null);
    setSasaran([]);
  }

  function pilihPetak(square) {
    if (selesai || !POLA_PETAK.test(square)) {
      bersihkanPilihan();
      return;
    }
    if (terpilih === square) {
      bersihkanPilihan();
      return;
    }
    const bidak = papan.get(square);
    if (!bidak || bidak.color !== giliran) {
      bersihkanPilihan();
      return;
    }
    if (bidak.type !== partai.jenis) {
      setPesan(t("papan.hbSalahJenis", { jenis: namaJenis(t, partai.jenis) }));
      bersihkanPilihan();
      return;
    }
    setPesan("");
    setTerpilih(square);
    setSasaran(
      langkahDiizinkan(partai)
        .filter((m) => m.from === square)
        .map((m) => m.to)
    );
  }

  function jalankan(dari, ke) {
    if (selesai || !POLA_PETAK.test(dari) || !POLA_PETAK.test(ke)) return;
    const hasil = mainkanLangkah(partai, dari, ke);
    bersihkanPilihan();
    if (!hasil.ok) {
      if (hasil.alasan === "jenis") {
        setPesan(t("papan.hbSalahJenis", { jenis: namaJenis(t, partai.jenis) }));
      } else if (hasil.alasan === "tidak-legal") {
        setPesan(t("papan.hbTidakLegal"));
      }
      return;
    }
    setPesan("");
    setPartai(hasil.partai);
  }

  function onKlik(square) {
    if (terpilih && sasaran.includes(square)) jalankan(terpilih, square);
    else pilihPetak(square);
  }

  /**
   * Pelepasan setelah menekan bidak sendiri. Saat menekan bidak milik giliran,
   * papan memulai mode seret dan menangkap pointer, sehingga event `click`
   * tidak sampai ke petak (lihat PapanTekaTeki.padaLepas). Jadi klik biasa pada
   * bidak juga masuk lewat sini: tanpa berpindah = pilih/batal pilih bidak,
   * berpindah = coba jalankan langkah.
   */
  function onSelesaiSeret(dari, tujuan) {
    if (tujuan === dari) pilihPetak(dari);
    else jalankan(dari, tujuan);
  }

  function partaiBaru() {
    setPartai(buatPartai());
    bersihkanPilihan();
    setPesan("");
    hapusSemuaTanda();
  }

  // Skakmat: pihak yang sedang bergiliran adalah yang di-mat, jadi pemenangnya lawannya.
  const statusTeks = !selesai
    ? null
    : papan.isCheckmate()
      ? t("papan.hbMenang", { warna: namaWarna(giliran === "w" ? "b" : "w") })
      : t("papan.hbSeri");

  return (
    // Ukuran papan mengikuti mode Manusia vs Mesin: konten dibatasi 1280px dan
    // kolom papan maksimal 520px, sehingga panel kanan selalu lebarnya sama.
    <section
      aria-label={t("papan.menuHandBrain")}
      className="mx-auto grid h-full min-h-0 w-full max-w-[1280px] grid-cols-1 gap-3 overflow-x-hidden overflow-y-auto p-2 sm:gap-4 sm:p-4 md:px-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:overflow-hidden"
    >
      <div className="mx-auto flex w-full max-w-[520px] min-w-0 flex-col sm:my-auto lg:w-[min(520px,calc(100dvh-140px),calc(100vw-634px))]">
        <h1 className="mb-2 text-xl font-bold text-white">{t("papan.hbJudul")}</h1>
        {/* Spacer selebar bilah evaluasi (w-9 + gap-1.5) di Manusia vs Mesin:
            papan di sini berukuran sama persis dengan mode yang sudah berjalan. */}
        <BarisProfil
          nama={giliran === "w" ? t("papan.pveHitam") : t("papan.pvePutih")}
          putih={giliran === "b"}
          tangkapan={[]}
          setBidak={pp.bidak}
          className="mb-2"
        />
        <div className="flex w-full items-stretch justify-center gap-1.5">
          <div aria-hidden="true" className="w-9 shrink-0" />
          <div className="aspect-square min-w-0 flex-1">
          <div className="relative h-full w-full">
          <PapanTekaTeki
            fen={fen}
            orientasi={giliran}
            terpilih={terpilih}
            sasaran={sasaran}
            langkahAkhir={langkahAkhir}
            terkunci={selesai}
            membeku={false}
            tanda={tanda}
            setBidak={pp.bidak}
            tema={pp.warnaPapan}
            onKlik={onKlik}
            onSelesaiSeret={onSelesaiSeret}
            onTandaPetak={tandaPetak}
            onTandaPanah={tandaPanah}
            onHapusTanda={hapusSemuaTanda}
          />
          </div>
          </div>
        </div>
        <BarisProfil
          nama={t("papan.pveAnda")}
          putih={giliran === "w"}
          tangkapan={[]}
          setBidak={pp.bidak}
          namaDiBawah
          className="mt-3"
        />
      </div>

      <aside className="flex min-h-0 flex-col gap-3 self-stretch rounded-lg border border-[#312e2b] bg-[#211f1c] p-4 text-sm text-gray-200">
          {selesai ? (
            <p className="font-semibold text-white" role="status">
              {statusTeks}
            </p>
          ) : (
            <>
              <p className="font-semibold text-white" role="status">
                {t("papan.hbGiliran", { warna: namaWarna(giliran) })}
              </p>
              <p className="rounded bg-[#312e2b] px-3 py-2">
                {t("papan.hbUndian", { jenis: namaJenis(t, partai.jenis) })}
              </p>
            </>
          )}

          {pesan && (
            <p className="text-xs text-amber-300" role="alert">
              {pesan}
            </p>
          )}

          <p className="text-[11px] leading-relaxed text-gray-500">{t("papan.hbDeskripsi")}</p>

          <button
            type="button"
            onClick={partaiBaru}
            className="rounded-md bg-[#81b64c] px-3 py-2 text-sm font-bold text-[#1e1c18] transition hover:bg-[#91c45a]"
          >
            {t("papan.hbBaru")}
          </button>

          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t("papan.hbRiwayat")}
            </h2>
            {riwayat.length === 0 ? (
              <p className="text-xs text-gray-500">{t("papan.hbKosong")}</p>
            ) : (
              <ol className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-xs text-gray-300">
                {riwayat.map((san, indeks) => (
                  <li key={`${indeks}-${san}`}>
                    {indeks % 2 === 0 ? `${Math.floor(indeks / 2) + 1}. ` : ""}
                    {san}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
    </section>
  );
}
