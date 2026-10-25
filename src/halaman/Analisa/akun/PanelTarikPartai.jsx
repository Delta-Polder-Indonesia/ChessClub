/*
 * Kartu kanan layar Akun: rentang tanggal, filter ringan, lalu tarik partai
 * akun aktif dengan mekanisme yang sama seperti panel "Tarik Data" di layar
 * Database (muatPartaiChessCom / muatPartaiLichess + progres + simpan lokal).
 * Menekan kartu akun di kolom kiri hanya memilih akun; tarikan berjalan saat
 * tombol "Muat partai" di panel ini ditekan.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "../../../lib/i18n.jsx";
import { bacaTeks, tulis } from "../penyimpanan.js";
import { muatPartaiChessCom, muatPartaiLichess } from "./muatPartaiAkun.js";

const KUNCI_TERSIMPAN = "tarik-terakhir";
const MAKS_BAWAAN = 500;
const BATAS_MAKS = 5000;
const SEHARI = 86400000;
const PRESET = ["30hari", "bulanIni", "semua", "kustom"];
const KELAS_WAKTU = ["bullet", "blitz", "rapid", "classical", "daily"];

function isoDariMs(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function awalHariIniUTC() {
  const n = new Date();
  return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
}

function rentangPreset(preset) {
  const akhir = awalHariIniUTC();
  if (preset === "30hari") {
    return { dari: isoDariMs(akhir - 29 * SEHARI), sampai: isoDariMs(akhir) };
  }
  if (preset === "bulanIni") {
    const d = new Date(akhir);
    return {
      dari: isoDariMs(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)),
      sampai: isoDariMs(akhir),
    };
  }
  if (preset === "semua") return { dari: "", sampai: "" };
  return null;
}

function tanggalSah(nilai) {
  const s = String(nilai || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
}

function bacaTersimpan() {
  try {
    const mentah = bacaTeks(KUNCI_TERSIMPAN, "");
    if (!mentah) return null;
    const obj = JSON.parse(mentah);
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

function TombolPreset({ aktif, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={`cursor-pointer rounded-borderRoundness border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
        aktif
          ? "border-backgroundBoxBoxHighlighted bg-backgroundBoxBoxHighlighted text-foregroundBlackDark"
          : "border-border bg-backgroundBoxBox text-foregroundGrey hover:border-borderHighlighted hover:text-foregroundHighlighted"
      }`}
    >
      {children}
    </button>
  );
}

export default function PanelTarikPartai({ akun, onSelesai }) {
  const { t } = useI18n();
  const akunAktif = akun?.platform && akun?.username ? akun : null;
  const awalPreset = rentangPreset("30hari");

  const [preset, setPreset] = useState("30hari");
  const [dari, setDari] = useState(awalPreset.dari);
  const [sampai, setSampai] = useState(awalPreset.sampai);
  const [bukaFilter, setBukaFilter] = useState(false);
  const [waktu, setWaktu] = useState([]);
  const [warna, setWarna] = useState("");
  const [status, setStatus] = useState("semua");
  const [maks, setMaks] = useState(String(MAKS_BAWAAN));
  const [sedang, setSedang] = useState(false);
  const [progres, setProgres] = useState(null);
  const [pesan, setPesan] = useState(null);
  const [perluKonfirmasi, setPerluKonfirmasi] = useState(false);
  const [tersimpan, setTersimpan] = useState(bacaTersimpan);

  const opsiRef = useRef(null);
  opsiRef.current = { preset, dari, sampai, maks, waktu, warna, status };
  const sedangRef = useRef(false);
  const abortRef = useRef(null);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const jalankan = useCallback(
    async ({ nilai, konfirmasi = false } = {}) => {
      if (!akunAktif) return;
      const opsi = nilai ?? opsiRef.current;
      const dariNilai = tanggalSah(opsi.dari);
      const sampaiNilai = tanggalSah(opsi.sampai);

      if (opsi.preset === "kustom") {
        if (!dariNilai || !sampaiNilai) {
          setPesan({ jenis: "info", teks: t("analisa.akun.tarik.tanggalWajib") });
          return;
        }
        if (dariNilai > sampaiNilai) {
          setPesan({ jenis: "info", teks: t("analisa.akun.tarik.tanggalTerbalik") });
          return;
        }
      }
      if (opsi.preset === "semua" && !konfirmasi) {
        setPerluKonfirmasi(true);
        setPesan({ jenis: "info", teks: t("analisa.akun.tarik.konfirmasiBesar") });
        return;
      }

      const maksAngka = Math.min(BATAS_MAKS, Math.max(1, Number(opsi.maks) || MAKS_BAWAAN));
      const kelasWaktu = Array.isArray(opsi.waktu) ? opsi.waktu : [];
      const warnaDipilih = opsi.warna ? [opsi.warna] : [];
      const statusDipilih = opsi.status === "rated" || opsi.status === "unrated" ? opsi.status : undefined;
      const muat = akunAktif.platform === "lichessOrg" ? muatPartaiLichess : muatPartaiChessCom;

      abortRef.current?.abort();
      const kendali = new AbortController();
      abortRef.current = kendali;
      sedangRef.current = true;
      setSedang(true);
      setPerluKonfirmasi(false);
      setProgres({ current: 0, total: 0, bulan: null });
      setPesan(null);

      try {
        const hasil = await muat(akunAktif.username, {
          dari: dariNilai || undefined,
          sampai: sampaiNilai || undefined,
          maks: maksAngka,
          waktu: kelasWaktu,
          warna: warnaDipilih,
          rated: statusDipilih,
          paksa: true,
          signal: kendali.signal,
          onProgress: (current, total, bulan) => setProgres({ current, total, bulan }),
        });
        if (kendali.signal.aborted) return;

        const namaSitus = t(`analisa.format.${akunAktif.platform}`);
        setPesan({
          jenis: "sukses",
          teks: t("analisa.akun.tarik.sukses", { n: hasil.length, situs: namaSitus }),
        });

        const simpan = {
          platform: akunAktif.platform,
          username: akunAktif.username,
          preset: opsi.preset,
          dari: dariNilai,
          sampai: sampaiNilai,
          maks: maksAngka,
          waktu: kelasWaktu,
          warna: opsi.warna || "",
          status: statusDipilih || "semua",
        };
        tulis(KUNCI_TERSIMPAN, JSON.stringify(simpan));
        setTersimpan(simpan);
        onSelesai?.(hasil.length);
      } catch (e) {
        if (e?.name === "AbortError" || kendali.signal.aborted) return;
        setPesan({
          jenis: "gagal",
          teks: e?.cooldown
            ? t("analisa.akun.tarik.cooldown")
            : t("analisa.akun.tarik.gagal", { pesan: e?.message || "unknown" }),
        });
      } finally {
        if (abortRef.current === kendali) {
          abortRef.current = null;
          sedangRef.current = false;
          setSedang(false);
          setProgres(null);
        }
      }
    },
    [akunAktif, onSelesai, t],
  );

  function pilihPreset(nilai) {
    setPreset(nilai);
    setPerluKonfirmasi(false);
    setPesan(null);
    const rentang = rentangPreset(nilai);
    if (rentang) {
      setDari(rentang.dari);
      setSampai(rentang.sampai);
    }
  }

  function ubahTanggal(nilai, setter) {
    setter(nilai);
    setPreset("kustom");
    setPerluKonfirmasi(false);
    setPesan(null);
  }

  function toggleWaktu(kelas) {
    setWaktu((lama) => (lama.includes(kelas) ? lama.filter((x) => x !== kelas) : [...lama, kelas]));
  }

  function pakaiTersimpan() {
    if (!tersimpan) return;
    const nilaiPreset = PRESET.includes(tersimpan.preset) ? tersimpan.preset : "kustom";
    const nilaiMaks = String(Math.min(BATAS_MAKS, Math.max(1, Number(tersimpan.maks) || MAKS_BAWAAN)));
    const nilaiWaktu = Array.isArray(tersimpan.waktu)
      ? tersimpan.waktu.filter((x) => KELAS_WAKTU.includes(x))
      : [];
    const nilaiWarna = tersimpan.warna === "putih" || tersimpan.warna === "hitam" ? tersimpan.warna : "";

    setPreset(nilaiPreset);
    setDari(tanggalSah(tersimpan.dari));
    setSampai(tanggalSah(tersimpan.sampai));
    setMaks(nilaiMaks);
    setWaktu(nilaiWaktu);
    setWarna(nilaiWarna);
    setStatus(tersimpan.status === "rated" || tersimpan.status === "unrated" ? tersimpan.status : "semua");
    setPesan(null);
    jalankan({
      nilai: {
        ...tersimpan,
        preset: nilaiPreset,
        dari: tanggalSah(tersimpan.dari),
        sampai: tanggalSah(tersimpan.sampai),
        maks: nilaiMaks,
        waktu: nilaiWaktu,
        warna: nilaiWarna,
        status: tersimpan.status === "rated" || tersimpan.status === "unrated" ? tersimpan.status : "semua",
      },
      konfirmasi: true,
    });
  }

  const maksAngka = Math.min(BATAS_MAKS, Math.max(1, Number(maks) || MAKS_BAWAAN));
  const ringkas = [
    waktu.length
      ? waktu.map((k) => t(`analisa.akun.tarik.waktu_${k}`)).join(", ")
      : t("analisa.akun.tarik.semuaWaktu"),
    warna === "putih"
      ? t("analisa.akun.tarik.hanyaPutih")
      : warna === "hitam"
        ? t("analisa.akun.tarik.hanyaHitam")
        : t("analisa.akun.tarik.keduaWarna"),
    status === "rated"
      ? t("analisa.akun.tarik.hanyaRated")
      : status === "unrated"
        ? t("analisa.akun.tarik.hanyaUnrated")
        : t("analisa.akun.tarik.ratedDanUnrated"),
    t("analisa.akun.tarik.hinggaPartai", { n: maksAngka }),
  ].join("; ");

  const tersimpanCocok =
    tersimpan &&
    akunAktif &&
    tersimpan.platform === akunAktif.platform &&
    String(tersimpan.username || "").toLowerCase() === String(akunAktif.username || "").toLowerCase();

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto p-3 sm:p-4">
      <div>
        <h2 className="text-base font-extrabold text-foreground">{t("analisa.akun.tarik.judul")}</h2>
        <p className="mt-1 text-xs leading-5 text-foregroundGrey">{t("analisa.akun.tarik.isi")}</p>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2">
        <span className="min-w-0 truncate text-sm font-bold text-foreground">
          {akunAktif ? akunAktif.username : t("analisa.akun.tarik.pilihAkun")}
        </span>
        {akunAktif ? (
          <span className="shrink-0 text-[11px] uppercase tracking-wide text-foregroundGrey">
            {t(`analisa.format.${akunAktif.platform}`)}
          </span>
        ) : null}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
          {t("analisa.akun.tarik.rentang")}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESET.map((nilai) => (
            <TombolPreset key={nilai} aktif={preset === nilai} onClick={() => pilihPreset(nilai)}>
              {t(`analisa.akun.tarik.${nilai === "semua" ? "semuaArsip" : nilai}`)}
            </TombolPreset>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-foregroundGrey">
              {t("analisa.akun.tarik.dari")}
            </span>
            <input
              type="date"
              value={dari}
              onChange={(e) => ubahTanggal(e.currentTarget.value, setDari)}
              className="w-full rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs text-foreground outline-none transition-colors hover:border-borderHighlighted focus:border-borderHighlighted [color-scheme:dark]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-foregroundGrey">
              {t("analisa.akun.tarik.sampai")}
            </span>
            <input
              type="date"
              value={sampai}
              onChange={(e) => ubahTanggal(e.currentTarget.value, setSampai)}
              className="w-full rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs text-foreground outline-none transition-colors hover:border-borderHighlighted focus:border-borderHighlighted [color-scheme:dark]"
            />
          </label>
        </div>
        <p className="mt-1 text-[11px] text-foregroundGrey">{t("analisa.akun.tarik.utc")}</p>
      </div>

      <p className="text-[11px] leading-4 text-foregroundGrey">{ringkas}.</p>

      <div className="rounded-borderRoundness border border-border bg-backgroundBoxBox">
        <button
          type="button"
          onClick={() => setBukaFilter((x) => !x)}
          aria-expanded={bukaFilter}
          className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-backgroundBoxBoxHover"
        >
          <span>{t("analisa.akun.tarik.filter")}</span>
          <span aria-hidden="true" className="text-foregroundGrey">
            {bukaFilter ? "−" : "+"}
          </span>
        </button>
        {bukaFilter ? (
          <div className="flex flex-col gap-3 border-t border-border px-3 py-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wide text-foregroundGrey">
                {t("analisa.akun.tarik.maksPartai")}
              </span>
              <input
                type="number"
                min={1}
                max={BATAS_MAKS}
                step={50}
                value={maks}
                onChange={(e) => setMaks(e.currentTarget.value)}
                className="w-full rounded-borderRoundness border border-border bg-backgroundBox px-2.5 py-1.5 text-xs text-foreground outline-none transition-colors hover:border-borderHighlighted focus:border-borderHighlighted"
              />
            </label>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-foregroundGrey">
                {t("analisa.akun.tarik.waktu")}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {KELAS_WAKTU.map((kelas) => (
                  <button
                    key={kelas}
                    type="button"
                    onClick={() => toggleWaktu(kelas)}
                    aria-pressed={waktu.includes(kelas)}
                    className={`cursor-pointer rounded-borderRoundness border px-2 py-1 text-[11px] font-semibold transition-colors ${
                      waktu.includes(kelas)
                        ? "border-backgroundBoxBoxHighlighted bg-backgroundBoxBoxHighlighted text-foregroundBlackDark"
                        : "border-border bg-backgroundBox text-foregroundGrey hover:border-borderHighlighted hover:text-foregroundHighlighted"
                    }`}
                  >
                    {t(`analisa.akun.tarik.waktu_${kelas}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-foregroundGrey">
                {t("analisa.akun.tarik.warna")}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[
                  { nilai: "", label: t("analisa.akun.tarik.semua") },
                  { nilai: "putih", label: t("analisa.akun.tarik.putih") },
                  { nilai: "hitam", label: t("analisa.akun.tarik.hitam") },
                ].map((pilihan) => (
                  <button
                    key={pilihan.nilai || "semua"}
                    type="button"
                    onClick={() => setWarna(pilihan.nilai)}
                    aria-pressed={warna === pilihan.nilai}
                    className={`cursor-pointer rounded-borderRoundness border px-2 py-1 text-[11px] font-semibold transition-colors ${
                      warna === pilihan.nilai
                        ? "border-backgroundBoxBoxHighlighted bg-backgroundBoxBoxHighlighted text-foregroundBlackDark"
                        : "border-border bg-backgroundBox text-foregroundGrey hover:border-borderHighlighted hover:text-foregroundHighlighted"
                    }`}
                  >
                    {pilihan.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-foregroundGrey">
                {t("analisa.akun.tarik.status")}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[
                  { nilai: "semua", label: t("analisa.akun.tarik.semua") },
                  { nilai: "rated", label: t("analisa.akun.tarik.rated") },
                  { nilai: "unrated", label: t("analisa.akun.tarik.unrated") },
                ].map((pilihan) => (
                  <button
                    key={pilihan.nilai}
                    type="button"
                    onClick={() => setStatus(pilihan.nilai)}
                    aria-pressed={status === pilihan.nilai}
                    className={`cursor-pointer rounded-borderRoundness border px-2 py-1 text-[11px] font-semibold transition-colors ${
                      status === pilihan.nilai
                        ? "border-backgroundBoxBoxHighlighted bg-backgroundBoxBoxHighlighted text-foregroundBlackDark"
                        : "border-border bg-backgroundBox text-foregroundGrey hover:border-borderHighlighted hover:text-foregroundHighlighted"
                    }`}
                  >
                    {pilihan.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!akunAktif || sedang}
          onClick={() => {
            if (perluKonfirmasi) {
              setPerluKonfirmasi(false);
              jalankan({ konfirmasi: true });
            } else {
              jalankan();
            }
          }}
          className="cursor-pointer rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3.5 py-2.5 text-sm font-bold text-foregroundBlackDark transition-colors hover:bg-backgroundBoxBoxHighlightedHover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {perluKonfirmasi ? t("analisa.akun.tarik.muatLagi") : t("analisa.akun.tarik.muat")}
        </button>
        {tersimpanCocok ? (
          <button
            type="button"
            disabled={sedang}
            onClick={pakaiTersimpan}
            className="cursor-pointer rounded-borderRoundness border border-border bg-backgroundBoxBox px-3.5 py-2 text-xs font-semibold text-foregroundGrey transition-colors hover:border-borderHighlighted hover:text-foregroundHighlighted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("analisa.akun.tarik.muatTersimpan", { nama: tersimpan.username })}
          </button>
        ) : null}
      </div>

      {sedang ? (
        <div className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2">
          <p className="text-xs font-bold text-foreground">{t("analisa.akun.tarik.sedang")}</p>
          {progres?.total > 0 ? (
            <p className="text-xs tabular-nums text-foregroundGrey">
              {progres.current}/{progres.total}
              {progres.bulan ? ` ${progres.bulan.tahun}-${progres.bulan.bulan}` : ""}
            </p>
          ) : progres?.current > 0 ? (
            <p className="text-xs tabular-nums text-foregroundGrey">
              {t("analisa.akun.tarik.progresPartai", { n: progres.current })}
            </p>
          ) : null}
        </div>
      ) : null}

      {pesan ? (
        <p
          className={`text-xs leading-4 ${
            pesan.jenis === "gagal"
              ? "text-lossRed"
              : pesan.jenis === "sukses"
                ? "text-foreground"
                : "text-foregroundGrey"
          }`}
        >
          {pesan.teks}
        </p>
      ) : null}
    </div>
  );
}
