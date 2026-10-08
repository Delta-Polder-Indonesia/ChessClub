/**
 * Deteksi riwayat memakai panel Analisa dan engine bersama. Membuka layar ini
 * tidak memulai analisis atau mengubah data/kedalaman papan yang masih terpasang.
 */
import { useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { useI18n } from "../../../../lib/i18n.jsx";
import { AnalyzeContext } from "../../konteks/analyze.jsx";
import { gunakanMesin } from "../../konteks/mesin.jsx";
import { ambilDaftarPartai, ambilSemuaKoleksi } from "../../basisData.js";
import { bacaDaftarAkun } from "../../akun/daftarAkun.js";
import { analisisRiwayatAntiCheat, BATAS_PARTAI, batasPartaiDariInput, KEDALAMAN_AGGREGAT } from "../../akun/antiCheatRiwayat.js";
import { KEDALAMAN } from "../../konstanta.js";
import { MULTI_PV } from "../../mesin/engine.js";
import { unduhLaporanPeninjauan } from "../../mesin/laporanPeninjauan.js";
import PanelLayar from "./PanelLayar.jsx";
import RingkasanAntiCheat from "./ringkasanAntiCheat.jsx";

function gabungkanAkun(daftar) {
  const unik = new Map();
  for (const akun of daftar) {
    const username = String(akun?.username || "").trim();
    if (!username || !["chessCom", "lichessOrg"].includes(akun?.platform)) continue;
    unik.set(`${akun.platform}:${username.toLowerCase()}`, { platform: akun.platform, username });
  }
  return [...unik.values()];
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
  const [akun, setAkun] = analyzeContext.akun;
  const platform = akun?.platform === "lichessOrg" ? "lichessOrg" : "chessCom";
  const username = String(akun?.username || "").trim();
  const papanSibuk = analyzeContext.pageState[0] === "loading" || analyzeContext.analyzingMove[0];
  const [akunTersimpan] = useState(bacaDaftarAkun);
  const [koleksi, setKoleksi] = useState([]);
  const [waktu, setWaktu] = useState("any");
  const [kedalaman, setKedalaman] = useState(KEDALAMAN_AGGREGAT);
  const jumlahId = useId();
  const ac = gunakanDeteksiRiwayat({ platform, username, waktu, kedalaman, papanSibuk });
  const daftar = gabungkanAkun([...akunTersimpan, ...koleksi, akun]);
  const akunSitus = daftar.filter((a) => a.platform === platform);
  const adaHasil = ac.hasil?.agregat.jumlahPartai > 0;
  const jumlah = ac.batas ?? BATAS_PARTAI;

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

  return (
    <PanelLayar judul={t("analisa.antiCheat.judul")}>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto sm:gap-4 lg:flex-row lg:overflow-hidden">
        <div className="flex w-full shrink-0 flex-col lg:min-h-0 lg:w-1/3">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.4rem] border border-border bg-backgroundBox">
            <div className="shrink-0 px-4 pt-4">
              <span className="block text-center text-xl font-bold text-foreground">{t("analisa.antiCheat.riwayat.pengaturan")}</span>
            </div>
            <div className="flex flex-col gap-3 px-4 pb-4 pt-4 lg:min-h-0 lg:overflow-y-auto">
              <label className="flex flex-col gap-1 text-xs font-bold text-foregroundGrey">
                {t("analisa.statistik.situs")}
                <select value={platform} onChange={(e) => pilihSitus(e.target.value)} disabled={ac.berjalan} data-uji="deteksi-situs" className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-2 py-1 text-sm text-foreground outline-none">
                  <option value="chessCom">Chess.com</option>
                  <option value="lichessOrg">Lichess.org</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-foregroundGrey">
                {t("analisa.nav.akun")}
                <select value={username.toLowerCase()} onChange={(e) => pilihAkun(e.target.value)} disabled={ac.berjalan || !akunSitus.length} data-uji="deteksi-akun" className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-2 py-1 text-sm text-foreground outline-none">
                  <option value="">{t("analisa.antiCheat.riwayat.pilihAkun")}</option>
                  {akunSitus.map((a) => <option key={a.username.toLowerCase()} value={a.username.toLowerCase()}>{a.username}</option>)}
                </select>
              </label>
              {!akunSitus.length ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.pilihAkunPetunjuk")}</p>
                  <button type="button" onClick={onBukaAkun} className="w-fit cursor-pointer rounded-borderRoundness border border-border bg-backgroundBoxBox px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-backgroundBoxBoxHighlighted">
                    {t("analisa.akun.tambahBaru")}
                  </button>
                </div>
              ) : null}
              <label className="flex flex-col gap-1 text-xs font-bold text-foregroundGrey">
                {t("analisa.kedalaman.judul")}
                <select value={kedalaman} onChange={(e) => setKedalaman(Number(e.target.value))} disabled={ac.berjalan} data-uji="deteksi-kedalaman" className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-2 py-1 text-sm text-foreground outline-none">
                  <option value={KEDALAMAN_AGGREGAT}>{t("analisa.antiCheat.riwayat.kedalamanBawaan", { n: KEDALAMAN_AGGREGAT })}</option>
                  {KEDALAMAN.map((opsi) => <option key={opsi.kunci} value={opsi.ply}>{t(`analisa.kedalaman.${opsi.kunci}`)} · {opsi.ply}</option>)}
                </select>
              </label>
              <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.kedalamanPetunjuk")}</p>
              <div className="flex flex-col gap-1">
                <label htmlFor={jumlahId} className="text-xs font-bold text-foregroundGrey">{t("analisa.antiCheat.riwayat.jumlahPartai")}</label>
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
                  className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-2 py-1 text-sm text-foreground outline-none"
                />
                <p id={`${jumlahId}-petunjuk`} className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.jumlahPetunjuk", { n: BATAS_PARTAI })}</p>
                {ac.batas === null ? <p id={`${jumlahId}-galat`} role="alert" className="text-xs leading-4 text-warning">{t("analisa.antiCheat.riwayat.jumlahTidakValid")}</p> : null}
              </div>
              <label className="flex flex-col gap-1 text-xs font-bold text-foregroundGrey">
                {t("analisa.statistik.waktu")}
                <select value={waktu} onChange={(e) => setWaktu(e.target.value)} disabled={ac.berjalan} data-uji="deteksi-waktu" className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-2 py-1 text-sm text-foreground outline-none">
                  <option value="any">{t("analisa.statistik.semuaWaktu")}</option>
                  {["bullet", "blitz", "rapid", "classical", "daily", "correspondence"].map((kelas) => <option key={kelas} value={kelas}>{kelas}</option>)}
                </select>
              </label>
              {username ? <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.batas", { n: jumlah, user: username })}</p> : null}
              <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.kedalaman", { n: kedalaman })}</p>
              <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.multipv", { n: MULTI_PV })}</p>
              <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.cache")}</p>
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
            <div className="flex flex-col gap-3 px-4 pb-4 pt-4 lg:min-h-0 lg:overflow-y-auto">
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
    </PanelLayar>
  );
}
