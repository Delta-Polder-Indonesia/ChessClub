/**
 * Layar "Wawasan" — dashboard profil pemain.
 *
 * Menampilkan ringkasan performa: KPI, grafik tren rating, distribusi
 * hasil, pembukaan teratas, dan ringkasan akurasi. Data diambil dari
 * IndexedDB partai tersimpan via `ambilDaftarPartai`.
 *
 * Adaptasi dari fitur Profile Insights ChessGameReviewer — semua logika
 * agregasi ada di `mesin/wawasan.js`, komponen ini hanya merender.
 */
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../../../lib/i18n.jsx";
import { hashPgn } from "../../../../lib/pgnRingan.js";
import { AnalyzeContext } from "../../konteks/analyzeKonteks.js";
import { ambilDaftarPartai, ambilSemuaKoleksi } from "../../basisData.js";
import { bacaDaftarAkun } from "../../akun/daftarAkun.js";
import DashboardAkun from "../../akun/DashboardAkun.jsx";
import { agregasiWawasan, filterPartaiWawasan, hitungPembukaanTeratas } from "../../mesin/wawasan.js";
import { ambilPetaAnalisis, langgananAnalisis } from "../../mesin/analisisTersimpan.js";
import PanelLayar from "./PanelLayar.jsx";
import SelectDaftar from "./SelectDaftar.jsx";
import KartuProfilWawasan from "./wawasan/kartuProfil.jsx";
import FilterBar from "./wawasan/filterBar.jsx";
import KpiGrid from "./wawasan/kpiGrid.jsx";
import GrafikTrenRating from "./wawasan/grafikTrenRating.jsx";
import DistribusiHasil from "./wawasan/distribusiHasil.jsx";
import KartuPembukaanTeratas from "./wawasan/kartuPembukaan.jsx";
import KartuAkurasiPartai from "./wawasan/kartuAkurasi.jsx";

const TAB_RINGKASAN_PERINGKAT_AKUN = ["overview", "ratings"];

export default function LayarWawasan() {
  const { t, bahasa: locale } = useI18n();
  const analyzeContext = useContext(AnalyzeContext);
  const [akun] = analyzeContext.akun;
  const platform = akun?.platform === "lichessOrg" ? "lichessOrg" : "chessCom";
  const username = String(akun?.username || "").trim();

  const [akunTersimpan] = useState(bacaDaftarAkun);
  const [koleksi, setKoleksi] = useState([]);
  const [semuaPartai, setSemuaPartai] = useState([]);
  const [filterWaktu, setFilterWaktu] = useState("all");
  const [filterWarna, setFilterWarna] = useState("all");
  const [filterTanggal, setFilterTanggal] = useState("all");
  const [muat, setMuat] = useState(false);
  const [galatMuat, setGalatMuat] = useState(false);
  const permintaanPartai = useRef(0);

  const partai = semuaPartai;

  useEffect(() => {
    let hidup = true;
    ambilSemuaKoleksi().then((list) => {
      if (hidup) setKoleksi(list);
    }).catch(() => {
      if (hidup) setKoleksi([]);
    });
    return () => { hidup = false; };
  }, []);

  const muatPartai = useCallback(async () => {
    const idPermintaan = ++permintaanPartai.current;
    if (!username) {
      setSemuaPartai([]);
      setGalatMuat(false);
      setMuat(false);
      return;
    }

    setMuat(true);
    setGalatMuat(false);
    try {
      const { partai: daftar } = await ambilDaftarPartai({
        koleksiId: `${platform}:${username.toLowerCase()}`,
        // Daily mencakup juga "correspondence" dari Lichess, jadi
        // kueri IndexedDB tidak boleh memangkasnya sebelum filter domain berjalan.
        timeClass: filterWaktu === "all" || filterWaktu === "daily" ? "" : filterWaktu,
        limit: 0,
        sertakanPgn: true,
        urut: "tanggal",
        arah: "desc",
      });
      if (idPermintaan === permintaanPartai.current) {
        setSemuaPartai(Array.isArray(daftar) ? daftar : []);
      }
    } catch {
      if (idPermintaan === permintaanPartai.current) setGalatMuat(true);
    } finally {
      if (idPermintaan === permintaanPartai.current) setMuat(false);
    }
  }, [username, platform, filterWaktu]);

  useEffect(() => {
    muatPartai();
  }, [muatPartai]);

  /*
   * Hasil analisis engine sesi ini (padanan prop `analysisMap` di acuan:
   * `analysisMap={state.analysis.resultsByGameId ?? {}}`). Peta di modul
   * `analisisTersimpan.js` dikunci dengan HASH TEKS PGN karena papan analisa
   * hanya menerima teks PGN, bukan id basis data; di sini kunci itu
   * diterjemahkan menjadi `p.id` supaya `hitungTaktikal` bisa memakai id
   * partai seperti acuan memakai `game.id`.
   *
   * `petaSesi` diisi ulang oleh langganan: menganalisis satu partai di papan
   * lalu kembali ke layar Wawasan harus langsung terlihat tanpa muat ulang.
   */
  const [petaSesi, setPetaSesi] = useState(ambilPetaAnalisis);
  useEffect(() => langgananAnalisis(() => setPetaSesi(ambilPetaAnalisis())), []);

  const petaAnalisis = useMemo(() => {
    if (Object.keys(petaSesi).length === 0) return {};
    const peta = {};
    for (const p of partai) {
      if (!p?.id || !p?.pgn) continue;
      const hasil = petaSesi[hashPgn(p.pgn)];
      if (hasil) peta[p.id] = hasil;
    }
    return peta;
  }, [partai, petaSesi]);

  const filter = useMemo(() => ({
    timeClass: filterWaktu,
    color: filterWarna,
    dateRange: filterTanggal,
  }), [filterWaktu, filterWarna, filterTanggal]);

  /* Label cadangan nama pembukaan diisi dari kamus, bukan hardcode: rantai
     `[Opening] → [ECOUrl] → Opening <ECO> → tidak diketahui` milik acuan
     memakai teks Inggris, di sini teksnya mengikuti bahasa antarmuka. */
  const labelPembukaan = useMemo(() => ({
    dariEco: (eco) => t("analisa.wawasan.pembukaan.dariEco", { eco }),
    tidakDiketahui: t("analisa.wawasan.pembukaan.tidakDiketahui"),
  }), [t]);

  const wawasan = useMemo(() => {
    if (!username || !partai.length) return null;
    return agregasiWawasan(partai, username, filter, petaAnalisis, labelPembukaan);
  }, [partai, username, filter, petaAnalisis, labelPembukaan]);

  /*
   * Seluruh partai akun tersimpan yang lolos filter Kecepatan + Rentang Wawasan.
   * Dipakai bersama oleh kartu Ringkasan & Peringkat (`DashboardAkun`) serta
   * Pembukaan Teratas (`KartuPembukaanTeratas`) agar seluruh kartu terintegrasi
   * dengan satu bilah filter Wawasan tanpa kontrol waktu/rentang terpisah.
   */
  const partaiAkunDifilter = useMemo(() => {
    if (!username || !semuaPartai.length) return [];
    return filterPartaiWawasan(semuaPartai, filter);
  }, [semuaPartai, username, filter]);

  const pembukaanAkun = useMemo(() => {
    if (!username || !partaiAkunDifilter.length) {
      return { rekapAkun: { putih: [], hitam: [] }, putih: [], hitam: [] };
    }

    const putih = hitungPembukaanTeratas(partaiAkunDifilter, username, "white", Infinity, labelPembukaan);
    const hitam = hitungPembukaanTeratas(partaiAkunDifilter, username, "black", Infinity, labelPembukaan);
    const keRekapAkun = (daftar) => {
      const total = daftar.reduce((jumlah, pembukaan) => jumlah + pembukaan.played, 0);
      return daftar.map((pembukaan) => ({
        nama: pembukaan.name,
        jumlah: pembukaan.played,
        persen: total > 0 ? Math.round((pembukaan.played / total) * 1000) / 10 : 0,
        w: pembukaan.wins,
        d: pembukaan.draws,
        l: pembukaan.losses,
      }));
    };

    return {
      rekapAkun: { putih: keRekapAkun(putih), hitam: keRekapAkun(hitam) },
      putih,
      hitam,
    };
  }, [partaiAkunDifilter, username, labelPembukaan]);

  /*
   * Cakupan filter warna memang terbatas pada KPI win rate + distribusi hasil.
   * Tren rating, akurasi/taktik, total partai, dan tab pembukaan tetap
   * memakai kedua warna. Label UI menyebut "Warna hasil" agar kontrol ini
   * tidak memberi kesan bahwa semua metrik ikut terfilter.
   */
  const wawasanTampil = useMemo(() => {
    if (!wawasan) return null;
    if (filterWarna === "all") return wawasan;
    return {
      ...wawasan,
      hasilUmum: filterWarna === "white" ? wawasan.sebagaiPutih : wawasan.sebagaiHitam,
      sebagaiPutih: filterWarna === "white" ? wawasan.sebagaiPutih : { wins: 0, losses: 0, draws: 0, total: 0, winRate: 0 },
      sebagaiHitam: filterWarna === "black" ? wawasan.sebagaiHitam : { wins: 0, losses: 0, draws: 0, total: 0, winRate: 0 },
    };
  }, [wawasan, filterWarna]);

  /*
   * Hanya kecepatan dan rentang tanggal yang bisa mengosongkan hasil —
   * filter warna tidak memotong daftar partai (lihat catatan wawasanTampil).
   * Dipakai untuk membedakan "belum ada partai tersimpan" dari "filter tidak
   * menemukan partai", persis dua keadaan kosong yang dibedakan acuan.
   */
  const filterMenyempit = filterWaktu !== "all" || filterTanggal !== "all";

  function aturUlangFilter() {
    setFilterWaktu("all");
    setFilterWarna("all");
    setFilterTanggal("all");
  }

  const daftarAkun = useMemo(() => {
    const unik = new Map();
    for (const a of [...akunTersimpan, ...koleksi, akun]) {
      const uname = String(a?.username || "").trim();
      if (!uname || !["chessCom", "lichessOrg"].includes(a?.platform)) continue;
      unik.set(`${a.platform}:${uname.toLowerCase()}`, { platform: a.platform, username: uname });
    }
    return [...unik.values()];
  }, [akunTersimpan, koleksi, akun]);

  const akunSitus = daftarAkun.filter((a) => a.platform === platform);

  function pilihSitus(situsBaru) {
    const pertama = daftarAkun.find((a) => a.platform === situsBaru);
    analyzeContext.akun[1]({ platform: situsBaru, username: pertama?.username || "" });
  }

  function pilihAkun(kunci) {
    const kunciKecil = String(kunci || "").toLowerCase();
    const pilihan = akunSitus.find((a) => a.username.toLowerCase() === kunciKecil);
    analyzeContext.akun[1]({ platform, username: pilihan?.username || "" });
  }

  return (
    <PanelLayar>
      <div className="flex min-h-0 w-full flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <span className="text-xl font-bold text-foreground">{t("analisa.wawasan.judul")}</span>
          <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.wawasan.deskripsi")}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-uji="wawasan-baris-akun">
          <div className="flex min-w-0 flex-col gap-1">
            <label className="text-xs font-bold text-foregroundGrey">{t("analisa.statistik.situs")}</label>
            <SelectDaftar
              labelTeks={t("analisa.statistik.situs")}
              dataUji="wawasan-situs"
              nilai={platform}
              opsi={[
                { nilai: "chessCom", label: "Chess.com" },
                { nilai: "lichessOrg", label: "Lichess.org" },
              ]}
              onPilih={pilihSitus}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <label className="text-xs font-bold text-foregroundGrey">{t("analisa.wawasan.pilihAkun")}</label>
            <SelectDaftar
              labelTeks={t("analisa.wawasan.pilihAkun")}
              dataUji="wawasan-akun"
              nilai={username}
              opsi={[
                { nilai: "", label: "—" },
                ...akunSitus.map((a) => ({ nilai: a.username, label: a.username })),
              ]}
              onPilih={pilihAkun}
            />
          </div>
        </div>

        {username ? (
          <KartuProfilWawasan
            key={`${platform}:${username.toLowerCase()}`}
            username={username}
            platform={platform}
            t={t}
            locale={locale}
          />
        ) : null}

        {!username ? (
          <div className="flex flex-col items-center gap-2 rounded-borderRoundness border border-dashed border-border bg-backgroundBox p-8">
            <p className="text-sm text-foregroundGrey">{t("analisa.wawasan.pilihAkunPetunjuk")}</p>
          </div>
        ) : muat ? (
          <div className="flex flex-col items-center gap-2 rounded-borderRoundness border border-border bg-backgroundBox p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-foregroundGrey border-t-backgroundBoxBoxHighlighted" />
            <p className="text-sm text-foregroundGrey">{t("analisa.wawasan.memuat")}</p>
          </div>
        ) : galatMuat ? (
          <div className="flex flex-col items-center gap-3 rounded-borderRoundness border border-dashed border-border bg-backgroundBox p-8" role="alert">
            <p className="text-sm text-foregroundGrey">{t("analisa.wawasan.galatMuatPartai")}</p>
            <button
              type="button"
              onClick={muatPartai}
              className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-backgroundBoxBoxHighlighted hover:text-foregroundBlackDark"
            >
              {t("analisa.wawasan.cobaMuatLagi")}
            </button>
          </div>
        ) : (
          <>
            {partai.length > 0 || filterMenyempit ? (
              <FilterBar
                filterWaktu={filterWaktu}
                filterWarna={filterWarna}
                filterTanggal={filterTanggal}
                onWaktu={setFilterWaktu}
                onWarna={setFilterWarna}
                onTanggal={setFilterTanggal}
                t={t}
              />
            ) : null}

            {!wawasanTampil || wawasanTampil.totalPartai === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-borderRoundness border border-dashed border-border bg-backgroundBox p-8">
                <p className="text-sm text-foregroundGrey">
                  {filterMenyempit
                    ? t("analisa.wawasan.tanpaHasilFilter")
                    : t("analisa.wawasan.tanpaPartai")}
                </p>
                {filterMenyempit ? (
                  <button
                    type="button"
                    onClick={aturUlangFilter}
                    className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-backgroundBoxBoxHighlighted hover:text-foregroundBlackDark"
                  >
                    {t("analisa.wawasan.aturUlangFilter")}
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                {/* KPI Grid */}
                <KpiGrid wawasan={wawasanTampil} t={t} />

                {/* Dashboard 2 kolom */}
                <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
                  <div className="flex min-h-0 min-w-0 flex-col gap-4">
                    <GrafikTrenRating points={wawasanTampil.trenRating} t={t} />
                    <DistribusiHasil
                      umum={wawasanTampil.hasilUmum}
                      putih={wawasanTampil.sebagaiPutih}
                      hitam={wawasanTampil.sebagaiHitam}
                      t={t}
                    />
                    <KartuAkurasiPartai moves={analyzeContext.game[0]} players={analyzeContext.players[0]} />
                  </div>
                  <div className="flex min-h-0 min-w-0 flex-col gap-4">
                    <DashboardAkun
                      platform={platform}
                      username={username}
                      daftarTab={TAB_RINGKASAN_PERINGKAT_AKUN}
                      sebagaiKartu
                      partaiLuar={partaiAkunDifilter}
                    />
                    <KartuPembukaanTeratas
                      rekapAkun={pembukaanAkun.rekapAkun}
                      putih={pembukaanAkun.putih}
                      hitam={pembukaanAkun.hitam}
                      t={t}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PanelLayar>
  );
}
