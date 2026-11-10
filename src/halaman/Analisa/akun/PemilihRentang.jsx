/*
 * Pemilih rentang tanggal panel "Tinjau partai Anda".
 *
 * Polanya mengikuti blok kalender rentang yang lazim dipakai: daftar preset
 * di kiri, kalender di kanan, dan ujung rentang ditandai "pin" — balok kecil
 * yang keluar dari sel awal/akhir — sehingga awal dan akhir rentang langsung
 * terbaca tanpa harus menebak warna latarnya.
 *
 * Komponen ini dikendalikan penuh dari luar: ia hanya melaporkan
 * `{ preset, dari, sampai }` lewat `onPilih`. Panel tetap pemilik state
 * karena nilai itu juga dipakai tombol "Muat partai" dan pencarian tersimpan.
 *
 * Tanggal tidak boleh melewati hari ini: arsip akun tidak pernah berisi
 * partai besok, dan `muatPartaiAkun` akan membuang permintaan kosong.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../../lib/i18n.jsx";
import {
  bagianTanggal,
  formatTanggal,
  geserBulan,
  hariIniUTC,
  labelHari,
  msDariKunci,
  namaBulan,
  namaHariPendek,
  PRESET_RENTANG,
  rentangPreset,
  susunGridBulan,
} from "./rentangTanggal.js";

const BARIS_GRID = 6;
const KOLOM_GRID = 7;
const SEHARI = 86400000;

/** Awal minggu mengikuti kebiasaan tiap bahasa: Senin (id), Minggu (en). */
function awalMingguUntuk(bahasa) {
  return bahasa === "en" ? 0 : 1;
}

function lokalUntuk(bahasa) {
  return bahasa === "en" ? "en-US" : "id-ID";
}

/** Posisi sebuah hari dalam rentang: "awal", "tengah", "akhir", "tunggal". */
function posisiDalamRentang(kunci, dari, sampai) {
  if (!dari) return null;
  if (!sampai || dari === sampai) return kunci === dari ? "tunggal" : null;
  if (kunci === dari) return "awal";
  if (kunci === sampai) return "akhir";
  return kunci > dari && kunci < sampai ? "tengah" : null;
}

/*
 * Kelas latar sel. Pin diwujudkan dengan `after:` pada SEL, bukan pada
 * tombolnya: tombol diposisikan (`relative z-10`) sehingga angkanya selalu
 * di atas balok pin, sementara sel awal diberi `z-20` agar baloknya tidak
 * tertutup latar sel tengah yang datang kemudian.
 */
const KELAS_POSISI = {
  tunggal: "z-20 rounded-borderRoundness bg-backgroundBoxBoxHighlighted",
  awal: "z-20 rounded-l-borderRoundness bg-backgroundBoxBoxHighlighted after:absolute after:inset-y-0 after:right-0 after:w-3 after:bg-backgroundBoxBoxHighlighted/25",
  akhir: "z-10 rounded-r-borderRoundness bg-backgroundBoxBoxHighlighted after:absolute after:inset-y-0 after:left-0 after:w-3 after:bg-backgroundBoxBoxHighlighted/25",
  tengah: "z-0 bg-backgroundBoxBoxHighlighted/25",
};

const KELAS_ANGKA = {
  tunggal: "text-foregroundBlackDark",
  awal: "text-foregroundBlackDark",
  akhir: "text-foregroundBlackDark",
  tengah: "text-foreground",
};

export default function PemilihRentang({ preset, dari, sampai, onPilih }) {
  const { t, bahasa } = useI18n();
  const hariIni = hariIniUTC();
  const lokal = lokalUntuk(bahasa);
  const awalMinggu = awalMingguUntuk(bahasa);

  const jangkar = sampai || dari || hariIni;
  const [bulan, setBulan] = useState(() => {
    const { tahun, bulan: indeks } = bagianTanggal(jangkar);
    return { tahun, bulan: indeks };
  });
  const [fokus, setFokus] = useState(jangkar);
  const wadahRef = useRef(null);
  /*
   * Fokus tidak boleh dicuri saat panel baru dibuka: layar Akun sengaja
   * membawa fokus ke lapisannya sendiri (dan mengembalikannya saat ditutup).
   * Karena itu tombol hari hanya difokus bila pengguna memang sedang
   * memakai keyboard/klik di dalam kalender ini.
   */
  const paksaFokus = useRef(false);

  // Kalender mengikuti rentang yang sedang dipakai, termasuk saat panel
  // memuat ulang "pencarian tersimpan" atau menekan preset.
  useEffect(() => {
    const { tahun, bulan: indeks } = bagianTanggal(sampai || dari || hariIni);
    setBulan({ tahun, bulan: indeks });
    setFokus(sampai || dari || hariIni);
  }, [dari, sampai, hariIni]);

  // Roving tabindex: satu hari saja yang bisa difokus, lalu panah memindahkan
  // fokus ke tanggal lain tanpa harus memusing-mundurkan Tab.
  useEffect(() => {
    if (!fokus || !paksaFokus.current) return;
    paksaFokus.current = false;
    wadahRef.current?.querySelector(`button[data-tanggal="${fokus}"]`)?.focus();
  }, [fokus, bulan]);

  const sel = useMemo(
    () => susunGridBulan(bulan.tahun, bulan.bulan, awalMinggu),
    [bulan.tahun, bulan.bulan, awalMinggu],
  );
  const namaHari = useMemo(() => namaHariPendek(lokal, awalMinggu), [lokal, awalMinggu]);
  const pekan = useMemo(
    () =>
      Array.from({ length: BARIS_GRID }, (_, b) =>
        sel.slice(b * KOLOM_GRID, b * KOLOM_GRID + KOLOM_GRID),
      ),
    [sel],
  );

  function pilihPreset(nilai) {
    const rentang = rentangPreset(nilai, hariIni);
    if (!rentang) return;
    onPilih?.({ preset: nilai, ...rentang });
  }

  function pilihHari(kunci) {
    if (kunci > hariIni) return;
    // Belum ada awal, atau rentang sudah lengkap → mulai rentang baru.
    // Hari yang lebih awal dari `dari` juga memulai rentang baru, bukan
    // membuat rentang terbalik.
    if (!dari || sampai || kunci < dari) {
      onPilih?.({ preset: "kustom", dari: kunci, sampai: "" });
      return;
    }
    onPilih?.({ preset: "kustom", dari, sampai: kunci });
  }

  function pindahBulan(langkah) {
    setBulan((lama) => geserBulan(lama.tahun, lama.bulan, langkah));
  }

  function geserSatuBulan(kunci, arah) {
    if (arah === "mundur") {
      const { tahun, bulan: indeks } = bagianTanggal(kunci);
      const mundur = geserBulan(tahun, indeks, -1);
      const hari = bagianTanggal(kunci).hari;
      const jumHari = new Date(Date.UTC(mundur.tahun, mundur.bulan + 1, 0)).getUTCDate();
      return `${mundur.tahun}-${String(mundur.bulan + 1).padStart(2, "0")}-${String(Math.min(hari, jumHari)).padStart(2, "0")}`;
    }
    const { tahun, bulan: indeks } = bagianTanggal(kunci);
    const maju = geserBulan(tahun, indeks, 1);
    const hari = bagianTanggal(kunci).hari;
    const jumHari = new Date(Date.UTC(maju.tahun, maju.bulan + 1, 0)).getUTCDate();
    return `${maju.tahun}-${String(maju.bulan + 1).padStart(2, "0")}-${String(Math.min(hari, jumHari)).padStart(2, "0")}`;
  }

  function tekanTombol(acara, kunci) {
    const langkah = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    }[acara.key];

    if (langkah !== undefined) {
      acara.preventDefault();
      paksaFokus.current = true;
      const berikut = Math.min(msDariKunci(hariIni), msDariKunci(kunci) + langkah * SEHARI);
      const kunciBerikut = new Date(berikut).toISOString().slice(0, 10);
      setFokus(kunciBerikut);
      const { tahun, bulan: indeks } = bagianTanggal(kunciBerikut);
      setBulan((lama) => (lama.tahun === tahun && lama.bulan === indeks ? lama : { tahun, bulan: indeks }));
      return;
    }

    if (acara.key === "PageUp" || acara.key === "PageDown") {
      acara.preventDefault();
      paksaFokus.current = true;
      const kunciBerikut = geserSatuBulan(kunci, acara.key === "PageUp" ? "mundur" : "maju");
      setFokus(kunciBerikut);
      const { tahun, bulan: indeks } = bagianTanggal(kunciBerikut);
      setBulan({ tahun, bulan: indeks });
      return;
    }

    if (acara.key === "Home" || acara.key === "End") {
      acara.preventDefault();
      paksaFokus.current = true;
      const geser = (new Date(msDariKunci(kunci)).getUTCDay() - awalMinggu + 7) % 7;
      const geserKe = acara.key === "Home" ? -geser : 6 - geser;
      const berikut = Math.min(
        msDariKunci(hariIni),
        msDariKunci(kunci) + geserKe * SEHARI,
      );
      const kunciBerikut = new Date(berikut).toISOString().slice(0, 10);
      setFokus(kunciBerikut);
      return;
    }

    if (acara.key === "Enter" || acara.key === " ") {
      acara.preventDefault();
      pilihHari(kunci);
    }
  }

  const ringkasan =
    preset === "semua"
      ? t("analisa.akun.tarik.semuaArsip")
      : dari && sampai
        ? `${formatTanggal(lokal, dari)} – ${formatTanggal(lokal, sampai)}`
        : t("analisa.akun.tarik.pilihRentang");

  return (
    <div className="mt-2" data-uji="pemilih-rentang">
      {/*
        `basis-[15rem]` (bukan `flex-1`) dipakai agar keputusan membungkus
        didasarkan pada lebar yang benar-benar dibutuhkan kalender: bila kolom
        panel terlalu sempit, kalender pindah ke bawah mengisi lebar penuh
        daripada disempitkan sampai selnya sebesar kuku.
      */}
      <div className="flex flex-col overflow-hidden rounded-borderRoundness border border-border bg-backgroundBoxBox sm:flex-row sm:flex-wrap">
        <div className="flex shrink-0 flex-row flex-wrap gap-1 border-b border-border p-2 sm:w-32 sm:flex-col sm:flex-nowrap sm:gap-0.5 sm:border-b-0 sm:border-e sm:py-3">
          {PRESET_RENTANG.map((nilai) => (
            <button
              key={nilai}
              type="button"
              onClick={() => pilihPreset(nilai)}
              aria-pressed={preset === nilai}
              data-uji={`preset-${nilai}`}
              className={`cursor-pointer whitespace-nowrap rounded-borderRoundness px-2 py-1.5 text-left text-xs font-semibold transition-colors sm:w-full ${
                preset === nilai
                  ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark"
                  : "text-foregroundGrey hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted"
              }`}
            >
              {t(`analisa.akun.tarik.${nilai === "semua" ? "semuaArsip" : nilai}`)}
            </button>
          ))}
        </div>

        <div className="min-w-[13rem] grow basis-[15rem] p-2 sm:p-3" ref={wadahRef}>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => pindahBulan(-1)}
              aria-label={t("analisa.akun.tarik.bulanMundur")}
              data-uji="bulan-mundur"
              className="grid h-7 w-7 cursor-pointer place-items-center rounded-borderRoundness text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <p className="text-center text-xs font-bold text-foreground" data-uji="nama-bulan">
              {namaBulan(lokal, bulan.tahun, bulan.bulan)}
            </p>
            <button
              type="button"
              onClick={() => pindahBulan(1)}
              aria-label={t("analisa.akun.tarik.bulanMaju")}
              data-uji="bulan-maju"
              className="grid h-7 w-7 cursor-pointer place-items-center rounded-borderRoundness text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <div role="grid" aria-label={t("analisa.akun.tarik.rentang")} className="mt-2">
            <div role="row" className="grid grid-cols-7">
              {namaHari.map((nama) => (
                <div
                  key={nama}
                  role="columnheader"
                  aria-label={nama}
                  className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-foregroundGrey"
                >
                  {nama}
                </div>
              ))}
            </div>

            {pekan.map((baris, indeksBaris) => (
              <div role="row" key={indeksBaris} className="grid grid-cols-7">
                {baris.map((hari) => {
                  const posisi = posisiDalamRentang(hari.kunci, dari, sampai);
                  const lewat = hari.kunci > hariIni;
                  return (
                    <div
                      key={hari.kunci}
                      role="gridcell"
                      aria-selected={Boolean(posisi)}
                      data-uji="sel-hari"
                      data-tanggal={hari.kunci}
                      data-posisi={posisi ?? ""}
                      className={`relative ${posisi ? KELAS_POSISI[posisi] : ""}`}
                    >
                      {hari.luar ? (
                        <span className="block h-8" aria-hidden="true" />
                      ) : (
                        <button
                          type="button"
                          tabIndex={fokus === hari.kunci ? 0 : -1}
                          data-tanggal={hari.kunci}
                          data-uji="tombol-hari"
                          disabled={lewat}
                          aria-label={labelHari(lokal, hari.kunci)}
                          aria-current={hari.kunci === hariIni ? "date" : undefined}
                          onClick={() => {
                            paksaFokus.current = true;
                            setFokus(hari.kunci);
                            pilihHari(hari.kunci);
                          }}
                          onKeyDown={(acara) => tekanTombol(acara, hari.kunci)}
                          onFocus={() => setFokus(hari.kunci)}
                          className={`relative z-10 h-8 w-full cursor-pointer rounded-borderRoundness text-xs font-semibold tabular-nums transition-colors disabled:cursor-not-allowed disabled:text-foregroundGrey disabled:opacity-40 ${
                            posisi
                              ? KELAS_ANGKA[posisi]
                              : "text-foreground hover:bg-backgroundBoxBoxHover"
                          }`}
                        >
                          {hari.hari}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-1.5 text-[11px] text-foregroundGrey" data-uji="ringkasan-rentang">
        {ringkasan}
      </p>
    </div>
  );
}
