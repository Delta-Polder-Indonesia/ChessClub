/**
 * Deteksi riwayat memakai panel Analisa dan engine bersama. Membuka layar ini
 * tidak memulai analisis atau mengubah data/kedalaman papan yang masih terpasang.
 */
import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { InfoIcon } from "lucide-react";
import { useI18n } from "../../../../lib/i18n.jsx";
import { gambar } from "../../../../lib/asets.js";
import { cariEngine, DAFTAR_ENGINE } from "../../../../lib/engineCatur.js";
import { AnalyzeContext } from "../../konteks/analyze.jsx";
import { gunakanMesin } from "../../konteks/mesin.jsx";
import { ambilDaftarPartai, ambilSemuaKoleksi } from "../../basisData.js";
import { bacaDaftarAkun } from "../../akun/daftarAkun.js";
import { analisisRiwayatAntiCheat, BATAS_PARTAI, batasPartaiDariInput, KEDALAMAN_AGGREGAT } from "../../akun/antiCheatRiwayat.js";
import { MULTI_PV } from "../../mesin/engine.js";
import { hashUntukEngine } from "../../mesin/cekWasm.js";
import { unduhLaporanPeninjauan } from "../../mesin/laporanPeninjauan.js";
import PanelLayar from "./PanelLayar.jsx";
import RingkasanAntiCheat from "./ringkasanAntiCheat.jsx";
import SelectDaftar from "./SelectDaftar.jsx";
import Gambar from "../Gambar.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/alert-dialog.jsx";

function gabungkanAkun(daftar) {
  const unik = new Map();
  for (const akun of daftar) {
    const username = String(akun?.username || "").trim();
    if (!username || !["chessCom", "lichessOrg"].includes(akun?.platform)) continue;
    unik.set(`${akun.platform}:${username.toLowerCase()}`, { platform: akun.platform, username });
  }
  return [...unik.values()];
}

function TombolInfo({ uji, judul, buka }) {
  return (
    <button
      type="button"
      data-uji={uji}
      onClick={buka}
      aria-label={judul}
      className="flex cursor-pointer items-center text-foregroundGrey transition-colors hover:text-foreground"
    >
      <InfoIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    </button>
  );
}

function gunakanDeteksiRiwayat({ platform, username, waktu, kedalaman, papanSibuk }) {
  const mesin = gunakanMesin();
  const [hasil, setHasil] = useState(null);
  const [status, setStatus] = useState("kosong");
  const [berjalan, setBerjalan] = useState(false);
  const [progres, setProgres] = useState({ ke: 0, total: 0 });
  const [pesan, setPesan] = useState("");
  const [jumlahPartai, setJumlahPartai] = useState("");
  const batas = batasPartaiDariInput(jumlahPartai);
  const controllerRef = useRef(null);

  const resetHasil = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setHasil(null);
    setStatus("kosong");
    setBerjalan(false);
    setProgres({ ke: 0, total: 0 });
    setPesan("");
  }, []);

  useEffect(() => {
    resetHasil();
    setJumlahPartai("");
  }, [platform, username, resetHasil]);

  useEffect(resetHasil, [waktu, kedalaman, resetHasil]);

  useEffect(() => () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  function batalkan() {
    const controller = controllerRef.current;
    if (!controller || controller.signal.aborted) return;
    controller.abort();
    mesin.setop();
    setStatus("batal");
  }

  async function jalankan() {
    if (!username || batas === null || papanSibuk || controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    const { signal } = controller;
    // Batal oleh pengguna boleh mengembalikan hasil parsial. Pergantian akun
    // atau unmount tidak boleh menerima hasil/progres dari run sebelumnya.
    const terkini = () => controllerRef.current === controller;
    setHasil(null);
    setStatus("jalan");
    setBerjalan(true);
    setPesan("");
    setProgres({ ke: 0, total: batas });
    let pesanGalat = "";

    try {
      // Filter diterapkan oleh kueri SEBELUM limit; jangan ambil N partai
      // semua waktu lalu menyaringnya, karena sampel bisa menjadi terlalu kecil.
      const daftar = (await ambilDaftarPartai({
        koleksiId: `${platform}:${username.toLowerCase()}`,
        timeClass: waktu === "any" ? "" : waktu,
        limit: batas,
        sertakanPgn: true,
        urut: "tanggal",
        arah: "desc",
      }))?.partai || [];
      if (!terkini() || signal.aborted) return;
      setProgres({ ke: 0, total: daftar.length });
      if (!daftar.length) {
        setStatus("tanpaPartai");
        return;
      }

      const mesinSiap = await mesin.siapkan();
      if (!terkini() || signal.aborted) return;
      const keluaran = await analisisRiwayatAntiCheat({
        partai: daftar,
        username,
        batas,
        kedalaman,
        mesin: mesinSiap,
        sinyal: signal,
        progres: ({ jenis, ke, total, pesan: galat }) => {
          if (!terkini() || signal.aborted) return;
          if (jenis === "galat") {
            pesanGalat ||= galat;
            setPesan(galat);
          }
          setProgres({ ke, total });
        },
      });
      if (!terkini()) return;
      setHasil(keluaran);
      setStatus(keluaran.dibatalkan ? "batal" : keluaran.agregat.jumlahPartai > 0 ? "selesai" : "galat");
      setPesan(pesanGalat || keluaran.galat[0]?.pesan || "");
    } catch (e) {
      if (!terkini() || signal.aborted) return;
      setStatus("galat");
      setPesan(e?.message ?? String(e));
    } finally {
      if (terkini()) {
        controllerRef.current = null;
        setBerjalan(false);
      }
    }
  }

  return { hasil, status, berjalan, progres, pesan, jumlahPartai, setJumlahPartai, batas, jalankan, batalkan };
}

export default function LayarDeteksiEngine({ onBukaAkun }) {
  const { t } = useI18n();
  const analyzeContext = useContext(AnalyzeContext);
  const mesin = gunakanMesin();
  const [akun, setAkun] = analyzeContext.akun;
  const platform = akun?.platform === "lichessOrg" ? "lichessOrg" : "chessCom";
  const username = String(akun?.username || "").trim();
  const papanSibuk = analyzeContext.pageState[0] === "loading" || analyzeContext.analyzingMove[0];
  const [akunTersimpan] = useState(bacaDaftarAkun);
  const [koleksi, setKoleksi] = useState([]);
  const [waktu, setWaktu] = useState("any");
  const [kedalaman, setKedalaman] = useState(KEDALAMAN_AGGREGAT);
  // Teks mentah saat mengetik: angka dijepit hanya saat melebihi batas atas
  // (ketik 20 → langsung 15), batas bawah dijepit saat kolom kehilangan fokus —
  // supaya angka dua digit seperti 10/15 masih bisa diketik utuh.
  const [teksKedalaman, setTeksKedalaman] = useState(String(KEDALAMAN_AGGREGAT));
  const [hashMb, setHashMb] = useState(() => mesin.opsi?.hash ?? hashUntukEngine());
  const [teksHash, setTeksHash] = useState(String(hashMb));
  const [threads, setThreads] = useState(() => mesin.opsi?.threads ?? 1);
  const jumlahId = useId();
  const kedalamanId = useId();
  const hashId = useId();
  const threadsId = useId();
  const [infoTerbuka, setInfoTerbuka] = useState(null);
  const wadahDialog = useMemo(() => document.querySelector?.(".analisa-root") || undefined, []);
  const ac = gunakanDeteksiRiwayat({ platform, username, waktu, kedalaman, papanSibuk });
  const daftar = gabungkanAkun([...akunTersimpan, ...koleksi, akun]);
  const engineAktif = cariEngine(mesin.idEngine);
  const versiEngine = /\d+/.exec(engineAktif.label)?.[0] ?? "-";
  const akunSitus = daftar.filter((a) => a.platform === platform);
  const adaHasil = ac.hasil?.agregat.jumlahPartai > 0;
  const jumlah = ac.batas ?? BATAS_PARTAI;
  const infoDialog =
    infoTerbuka === "jumlah"
      ? {
          judul: t("analisa.antiCheat.riwayat.jumlahPartai"),
          paragraf: [
            t("analisa.antiCheat.riwayat.jumlahPetunjuk", { n: BATAS_PARTAI }),
            ...(username ? [t("analisa.antiCheat.riwayat.batas", { n: jumlah, user: username })] : []),
          ],
        }
      : infoTerbuka === "kedalaman"
        ? {
            judul: t("analisa.antiCheat.riwayat.kedalamanAnalisis"),
            paragraf: [
              t("analisa.antiCheat.riwayat.kedalamanPetunjuk"),
              t("analisa.antiCheat.riwayat.kedalaman", { n: kedalaman }),
            ],
          }
        : infoTerbuka === "pengaturan"
          ? {
              judul: t("analisa.antiCheat.riwayat.pengaturanUmum"),
              paragraf: [
                t("analisa.antiCheat.riwayat.multipv", { n: MULTI_PV }),
                t("analisa.antiCheat.riwayat.cache"),
              ],
            }
          : null;

  useEffect(() => {
    let hidup = true;
    ambilSemuaKoleksi().then((list) => {
      if (hidup) setKoleksi(list);
    }).catch(() => {
      // Daftar lokal dan akun aktif tetap dapat dipilih bila metadata DB gagal.
      if (hidup) setKoleksi([]);
    });
    return () => { hidup = false; };
  }, []);

  function pilihSitus(situs) {
    const pertama = daftar.find((a) => a.platform === situs);
    setAkun({ platform: situs, username: pertama?.username || "" });
  }

  function pilihAkun(kunci) {
    const pilihan = akunSitus.find((a) => a.username.toLowerCase() === kunci);
    setAkun({ platform, username: pilihan?.username || "" });
  }

  function gantiHash(n) {
    setHashMb(n);
    mesin.ubahOpsi?.({ hash: n });
  }

  function gantiThreads(n) {
    setThreads(n);
    mesin.ubahOpsi?.({ threads: n });
  }

  /**
   * Input angka manual (Kedalaman & Hash): teks bebas diketik — angka yang
   * melewati batas atas langsung dijepit (ketik 20 → 15), kosong atau di
   * bawah batas bawah dijepit saat kolom kehilangan fokus. Jepit per ketikan
   * hanya pada batas atas supaya angka dua digit (10, 64, 100) bisa diketik utuh.
   */
  function ubahKedalamanInput(teks) {
    setTeksKedalaman(teks);
    if (String(teks).trim() === "") return;
    const n = Math.round(Number(teks));
    if (!Number.isFinite(n)) return;
    if (n > 15) {
      setKedalaman(15);
      setTeksKedalaman("15");
    } else if (n >= 6) {
      setKedalaman(n);
    }
  }

  function selesaikanKedalaman() {
    const n = Math.round(Number(teksKedalaman));
    const hasil =
      String(teksKedalaman).trim() === "" || !Number.isFinite(n) ? kedalaman : Math.min(15, Math.max(6, n));
    setKedalaman(hasil);
    setTeksKedalaman(String(hasil));
  }

  function ubahHashInput(teks) {
    setTeksHash(teks);
    if (String(teks).trim() === "") return;
    const n = Math.round(Number(teks));
    if (!Number.isFinite(n)) return;
    if (n > 128) {
      gantiHash(128);
      setTeksHash("128");
    } else if (n >= 16) {
      gantiHash(n);
    }
  }

  function selesaikanHash() {
    const n = Math.round(Number(teksHash));
    const hasil = String(teksHash).trim() === "" || !Number.isFinite(n) ? hashMb : Math.min(128, Math.max(16, n));
    gantiHash(hasil);
    setTeksHash(String(hasil));
  }

  function ubahThreadsInput(teks) {
    if (String(teks).trim() === "") return;
    const n = Math.round(Number(teks));
    if (!Number.isFinite(n)) return;
    gantiThreads(Math.min(1, Math.max(1, n)));
  }

  function pilihEngineDeteksi(id) {
    if (id === mesin.idEngine) return;
    mesin.gantiEngine?.(id);
  }

  return (
    <PanelLayar judul={t("analisa.antiCheat.judul")}>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto sm:gap-4 lg:flex-row lg:overflow-hidden">
        <div className="flex w-full shrink-0 flex-col lg:min-h-0 lg:flex-1">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.4rem] border border-border bg-backgroundBox">
            <div className="shrink-0 px-4 pt-4">
              <span className="block text-center text-xl font-bold text-foreground">{t("analisa.antiCheat.riwayat.pengaturan")}</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-4 lg:overflow-y-auto">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-px flex-1 bg-border" />
                  <span className="flex items-center gap-1 text-xs font-bold text-foregroundGrey">
                    {t("analisa.antiCheat.riwayat.pengaturanUmum")}
                    <TombolInfo uji="info-pengaturan" judul={t("analisa.antiCheat.riwayat.pengaturanUmum")} buka={() => setInfoTerbuka("pengaturan")} />
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="flex flex-row items-start gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-row gap-2">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-xs font-bold text-foregroundGrey">{t("analisa.antiCheat.riwayat.namaMesin")}</span>
                        <SelectDaftar
                          labelTeks={t("analisa.antiCheat.riwayat.namaMesin")}
                          dataUji="deteksi-engine"
                          nilai={mesin.idEngine}
                          opsi={DAFTAR_ENGINE.map((e) => ({ nilai: e.id, label: e.label }))}
                          onPilih={pilihEngineDeteksi}
                          disabled={ac.berjalan || papanSibuk}
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-xs font-bold text-foregroundGrey">{t("analisa.antiCheat.riwayat.versiMesin")}</span>
                        <div className="rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground">{versiEngine}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-xs font-bold text-foregroundGrey">
                        <label htmlFor={kedalamanId}>{t("analisa.antiCheat.riwayat.kedalamanAnalisis")}</label>
                        <TombolInfo uji="info-kedalaman" judul={t("analisa.antiCheat.riwayat.kedalamanAnalisis")} buka={() => setInfoTerbuka("kedalaman")} />
                      </div>
                      <input
                        id={kedalamanId}
                        type="number"
                        min={6}
                        max={15}
                        step={1}
                        inputMode="numeric"
                        data-uji="deteksi-kedalaman"
                        value={teksKedalaman}
                        onChange={(e) => ubahKedalamanInput(e.currentTarget.value)}
                        onBlur={selesaikanKedalaman}
                        disabled={ac.berjalan}
                        className="rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground outline-none"
                      />
                    </div>
                  </div>
                  <Gambar src={gambar("/images/stockfish.webp")} alt="Stockfish" width={128} height={128} className="h-32 w-32 shrink-0 rounded-[0.4rem] border border-border object-cover" />
                </div>
              </div>
              <div className="flex flex-row gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-bold text-foregroundGrey">
                  <span>{t("analisa.statistik.situs")}</span>
                  <SelectDaftar
                    labelTeks={t("analisa.statistik.situs")}
                    dataUji="deteksi-situs"
                    nilai={platform}
                    opsi={[{ nilai: "chessCom", label: "Chess.com" }, { nilai: "lichessOrg", label: "Lichess.org" }]}
                    onPilih={pilihSitus}
                    disabled={ac.berjalan}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-bold text-foregroundGrey">
                  <span>{t("analisa.nav.akun")}</span>
                  <SelectDaftar
                    labelTeks={t("analisa.nav.akun")}
                    dataUji="deteksi-akun"
                    nilai={username.toLowerCase()}
                    opsi={[{ nilai: "", label: t("analisa.antiCheat.riwayat.pilihAkun") }, ...akunSitus.map((a) => ({ nilai: a.username.toLowerCase(), label: a.username }))]}
                    onPilih={pilihAkun}
                    disabled={ac.berjalan || !akunSitus.length}
                  />
                </div>
              </div>
              {!akunSitus.length ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.pilihAkunPetunjuk")}</p>
                  <button type="button" onClick={onBukaAkun} className="w-fit cursor-pointer rounded-borderRoundness border border-border bg-backgroundBoxBox px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-backgroundBoxBoxHighlighted">
                    {t("analisa.akun.tambahBaru")}
                  </button>
                </div>
              ) : null}
              <div className="flex flex-row items-start gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <label htmlFor={jumlahId} className="text-xs font-bold text-foregroundGrey">{t("analisa.antiCheat.riwayat.jumlahPartai")}</label>
                    <TombolInfo uji="info-jumlah" judul={t("analisa.antiCheat.riwayat.jumlahPartai")} buka={() => setInfoTerbuka("jumlah")} />
                  </div>
                  <input
                    id={jumlahId}
                    data-uji="deteksi-jumlah"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={ac.jumlahPartai}
                    onChange={(e) => ac.setJumlahPartai(e.currentTarget.value)}
                    placeholder={String(BATAS_PARTAI)}
                    disabled={ac.berjalan}
                    aria-invalid={ac.batas === null}
                    aria-describedby={`${jumlahId}-petunjuk${ac.batas === null ? ` ${jumlahId}-galat` : ""}`}
                    className="rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground outline-none"
                  />
                  {ac.batas === null ? <p id={`${jumlahId}-galat`} role="alert" className="text-xs leading-4 text-warning">{t("analisa.antiCheat.riwayat.jumlahTidakValid")}</p> : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-bold text-foregroundGrey">
                  <span>{t("analisa.statistik.waktu")}</span>
                  <SelectDaftar
                    labelTeks={t("analisa.statistik.waktu")}
                    dataUji="deteksi-waktu"
                    nilai={waktu}
                    opsi={[
                      { nilai: "any", label: t("analisa.statistik.semuaWaktu") },
                      ...["bullet", "blitz", "rapid", "classical", "daily", "correspondence"].map((kelas) => ({ nilai: kelas, label: kelas })),
                    ]}
                    onPilih={setWaktu}
                    disabled={ac.berjalan}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs font-bold text-foregroundGrey">{t("analisa.antiCheat.riwayat.pengaturanLanjutan")}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="flex flex-row gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-bold text-foregroundGrey">
                    <label htmlFor={hashId}>{t("analisa.antiCheat.riwayat.hashMb")}</label>
                    <input
                      id={hashId}
                      type="number"
                      min={16}
                      max={128}
                      step={16}
                      inputMode="numeric"
                      data-uji="deteksi-hash"
                      value={teksHash}
                      onChange={(e) => ubahHashInput(e.currentTarget.value)}
                      onBlur={selesaikanHash}
                      disabled={ac.berjalan}
                      className="rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground outline-none"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-bold text-foregroundGrey">
                    <label htmlFor={threadsId}>{t("analisa.antiCheat.riwayat.threads")}</label>
                    <input
                      id={threadsId}
                      type="number"
                      min={1}
                      max={1}
                      step={1}
                      inputMode="numeric"
                      data-uji="deteksi-threads"
                      value={threads}
                      onChange={(e) => ubahThreadsInput(e.currentTarget.value)}
                      disabled={ac.berjalan}
                      className="rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground outline-none"
                    />
                  </div>
                </div>
              </div>
              {papanSibuk ? <p role="status" className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.papanSibuk")}</p> : null}
              {ac.berjalan ? (
                <button type="button" onClick={ac.batalkan} disabled={ac.status === "batal"} className="w-fit cursor-pointer rounded-borderRoundness border border-border bg-backgroundBoxBox px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-backgroundBoxBoxHighlighted disabled:cursor-not-allowed disabled:opacity-50">
                  {t("analisa.antiCheat.riwayat.batal")}
                </button>
              ) : (
                <button type="button" onClick={ac.jalankan} disabled={!username || ac.batas === null || papanSibuk} className="w-fit cursor-pointer rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-4 py-2 text-sm font-bold text-foregroundBlackDark transition-colors hover:bg-backgroundBoxBoxHighlightedHover disabled:cursor-not-allowed disabled:opacity-50">
                  {adaHasil ? t("analisa.antiCheat.riwayat.mulaiUlang", { n: jumlah }) : t("analisa.antiCheat.riwayat.mulai", { n: jumlah })}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex min-w-0 w-full shrink-0 flex-col lg:min-h-0 lg:flex-1">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.4rem] border border-border bg-backgroundBox">
            <div className="shrink-0 px-4 pt-4">
              <span className="block text-center text-xl font-bold text-foreground">{t("analisa.antiCheat.riwayat.hasil")}</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-4 lg:overflow-y-auto">
              <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.isi")}</p>
              {ac.berjalan ? (
                <div className="flex flex-col gap-2">
                  <p role="status" className="text-xs text-foregroundGrey">{t("analisa.antiCheat.riwayat.progres", ac.progres)}</p>
                  <div role="progressbar" aria-label={t("analisa.antiCheat.riwayat.progres", ac.progres)} aria-valuemin={0} aria-valuemax={Math.max(1, ac.progres.total)} aria-valuenow={ac.progres.ke} className="h-2 w-full overflow-hidden rounded-md bg-backgroundBoxBox">
                    <div className="h-full bg-backgroundBoxBoxHighlighted transition-[width] duration-200" style={{ width: `${ac.progres.total ? (ac.progres.ke / ac.progres.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ) : null}
              {ac.status === "batal" ? <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.dibatalkan")}</p> : null}
              {ac.status === "selesai" ? <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.selesai", { n: ac.hasil.agregat.jumlahPartai })}</p> : null}
              {ac.status === "galat" || ac.pesan ? <p role="alert" className="text-xs leading-4 text-warning">{t(adaHasil ? "analisa.antiCheat.riwayat.sebagianGagal" : "analisa.antiCheat.riwayat.gagal", { pesan: ac.pesan || "-" })}</p> : null}
              {ac.status === "tanpaPartai" ? <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.tanpaPartai")}</p> : null}
              {ac.status === "kosong" ? <p className="text-xs leading-4 text-foregroundGrey">{t(username ? "analisa.antiCheat.riwayat.hasilKosong" : "analisa.antiCheat.riwayat.pilihAkunPetunjuk")}</p> : null}
              {adaHasil ? <RingkasanAntiCheat agregat={ac.hasil.agregat} /> : null}
              {adaHasil && Number.isFinite(ac.hasil.durasi?.totalMs) ? (
                <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.waktu", { detik: Math.max(1, Math.round(ac.hasil.durasi.totalMs / 1000)), ms: ac.hasil.durasi.rataMs ?? 0 })}</p>
              ) : null}
              {adaHasil ? (
                <button type="button" onClick={() => unduhLaporanPeninjauan(ac.hasil.agregat, { username })} className="w-fit cursor-pointer rounded-borderRoundness border border-border bg-backgroundBoxBox px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-backgroundBoxBoxHighlighted">
                  {t("analisa.antiCheat.riwayat.unduh")}
                </button>
              ) : null}
              <p className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.disclaimer")}</p>
            </div>
          </div>
        </div>
      </div>
      {infoDialog ? (
        <AlertDialog open onOpenChange={(b) => { if (!b) setInfoTerbuka(null); }}>
          <AlertDialogContent container={wadahDialog} className="bg-[#1e1d1c] border-[#5d5d5d] text-[#dedede] shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">{infoDialog.judul}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div id={infoTerbuka === "jumlah" ? `${jumlahId}-petunjuk` : undefined} className="flex flex-col gap-2 text-[#939291]">
                  {infoDialog.paragraf.map((teks) => (
                    <p key={teks} className="text-sm leading-5">{teks}</p>
                  ))}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction className="bg-[#81b64c] hover:bg-[#8bc550] text-black font-bold">
                {t("analisa.antiCheat.riwayat.mengerti")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </PanelLayar>
  );
}
