/**
 * Kerangka tata letak halaman Teka-Teki: sidebar, area papan, dan panel kanan.
 *
 * Dulu ini `LayoutTekaTeki` dengan **89 prop**. Setelah pemecahan, komponen ini
 * hanya menerima tiga kelompok:
 *   - `papan` / `bilahEvaluasi`: slot elemen dari halaman;
 *   - `kol`: objek filter koleksi & nomor soal (satu objek, bukan 19 prop);
 *   - `masalah`: data soal aktif — panel kanan membaca bidangnya sendiri.
 * Sisanya adalah preferensi tampilan, dan itu pun dikelompokkan (`tampilan`).
 */
import { useI18n } from "../../../lib/i18n.jsx";
import SidebarTekaTeki from "./SidebarTekaTeki.jsx";
import AreaPapan from "./AreaPapan.jsx";
import PanelTab from "./PanelTab.jsx";
import PanelUtama from "./PanelUtama.jsx";
import PanelVideo from "./PanelVideo.jsx";
import PanelPengaturan from "./PanelPengaturan.jsx";
import KontrolMesin from "./KontrolMesin.jsx";
import KontrolLangkah from "./KontrolLangkah.jsx";
import StatusTekaTeki from "./StatusTekaTeki.jsx";

export default function TekaTekiShell({
  // data
  masalah = null,
  pesan = null,
  memuat = false,
  memuatKoleksi = false,
  gagal = false,
  kosong = false,
  semuaTerpecahkan = false,
  selesai = false,
  // slot
  papan = null,
  bilahEvaluasi = null,
  // filter & nomor soal
  kol = {},
  // preferensi tampilan
  tampilan = {},
  // tab
  tabPanelAktif = "main",
  onGantiTabPanel = null,
  videoGagal = false,
  onGalatVideo = null,
  onPutarVideo = null,
  onBukaKoleksiVideo = null,
  // mesin
  mesin = {},
  // navigasi + aksi
  navigasi = {},
  aksi = {},
}) {
  const { t } = useI18n();

  if (gagal) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#262421] px-6 py-10">
        <p
          role="alert"
          className="max-w-md rounded-md border border-red-900 bg-red-950/40 px-4 py-3 text-sm leading-6 text-red-300"
        >
          {t("tekaTeki.gagalMuat")}
        </p>
        <button
          type="button"
          onClick={aksi.onCobaLagi}
          className="rounded-full border border-red-800 px-5 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-950/60"
        >
          {t("common.cobaLagi")}
        </button>
      </div>
    );
  }

  if (kosong) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#262421] px-6 py-10">
        <p
          role="status"
          className="max-w-md rounded-md border border-amber-900 bg-amber-950/40 px-4 py-3 text-sm leading-6 text-amber-300"
        >
          {semuaTerpecahkan ? t("tekaTeki.semuaTerpecahkan") : t("tekaTeki.tidakAdaSoal")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen lg:h-screen overflow-hidden bg-[#262421] text-gray-200 font-sans select-none">
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        <SidebarTekaTeki kol={kol} />

        {/*
         * Pembungkus ini hanya memegang lebar; `overflow-hidden` memastikan
         * tidak ada isi area papan yang bisa menimpa panel kanan.
         *
         * Pesan permainan TIDAK lagi tampil sebagai chip di atas papan: satu-
         * satunya penanda tuntas adalah sorotan petak, suara, dan papan yang
         * sudah selesai. Pesannya tetap diumumkan ke pembaca layar lewat
         * wilayah `aria-live` yang disembunyikan secara visual (`sr-only`),
         * jadi tidak ada teks yang muncul di layar.
         */}
        <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="sr-only">
            <StatusTekaTeki pesan={pesan} melayang={false} />
          </div>
          <AreaPapan
            papan={papan}
            bilahEvaluasi={bilahEvaluasi}
            orientasi={tampilan.orientasi}
            memuat={memuat}
            teksTingkat={tampilan.teksTingkat}
            eloSoal={tampilan.eloSoal}
            namaHitam={tampilan.namaHitam}
            eloHitam={tampilan.eloHitam}
            tangkapanHitam={tampilan.tangkapanHitam}
            namaPutih={tampilan.namaPutih}
            eloPutih={tampilan.eloPutih}
            tangkapanPutih={tampilan.tangkapanPutih}
          />
        </div>

        {/*
         * Lebar panel kanan mengikuti sisa ruang, bukan angka mati 480px.
         *
         * Sebelumnya `lg:w-[480px]`: pada 1024–1279px sidebar (220px) + panel
         * (480px) memakan 700px, sehingga kolom papan hanya sisa 324px dan
         * papan menyusut sampai 232px (petak 29px) — baris profil yang
         * lebarnya mengikuti papan pun kehabisan ruang (nama pemain 0px,
         * "(1787)" menimpa label "Rating Soal").
         *
         * `clamp(300px, 70vw - 416px, 480px)` membuat panel menyusut bersama
         * viewport: 301px @1024, 390px @1152, 479px @1279 — lalu tetap 480px
         * mulai 1280px, jadi tata letak ≥1280 (1280/1366/1440/1920) sama
         * persis seperti sebelumnya.
         */}
        <aside
          data-panel="kanan"
          className="w-full lg:w-[clamp(300px,calc(70vw_-_416px),480px)] h-full bg-[#211f1c] border-t lg:border-t-0 lg:border-l border-[#312e2b] flex flex-col flex-shrink-0 min-h-0"
        >
          <PanelTab aktif={tabPanelAktif} onGanti={onGantiTabPanel} />

          {tabPanelAktif === "main" && (
            <div
              role="tabpanel"
              id="panel-teka-teki-main"
              aria-labelledby="tab-teka-teki-main"
              data-panel="main"
              className="flex min-h-0 flex-1 flex-col"
            >
              <PanelUtama
                memuat={memuat}
                memuatKoleksi={memuatKoleksi}
                giliran={tampilan.giliran}
                teksTingkat={tampilan.teksTingkat}
                eloSoal={tampilan.eloSoal}
                selesai={selesai}
                teksPembukaan={masalah?.pembukaan || ""}
                catatanLangkah={masalah?.catatanLangkah || null}
                jumlahVariasi={masalah?.jumlahVariasi || 0}
                simbolNag={masalah?.simbolNag || ""}
                nilaiSetBidak={tampilan.nilaiSetBidak}
                komentatorNyala={tampilan.komentatorNyala}
                kartu={tampilan.kartuKomentator}
              />
            </div>
          )}

          {tabPanelAktif === "video" && (
            <PanelVideo
              masalah={masalah}
              selesai={selesai}
              memuat={memuat}
              memuatKoleksi={memuatKoleksi}
              videoGagal={videoGagal}
              nilaiKoleksi={kol.nilai}
              onPutarVideo={onPutarVideo}
              onGalatVideo={onGalatVideo}
              onBukaKoleksiVideo={onBukaKoleksiVideo}
            />
          )}

          {tabPanelAktif === "pengaturan" && (
            <PanelPengaturan
              daftarSet={tampilan.daftarSet}
              nilaiSetBidak={tampilan.nilaiSetBidak}
              onGantiSetBidak={tampilan.onGantiSetBidak}
              nilaiSuara={tampilan.nilaiSuara}
              onGantiSuara={tampilan.onGantiSuara}
              engineNyala={mesin.engineNyala}
              onGantiEngine={mesin.onGantiEngine}
              tampilPanahMesin={mesin.tampilPanahMesin}
              onGantiPanahMesin={mesin.onGantiPanahMesin}
              labelPanahMesin={mesin.teksPanahMesin}
              nilaiIngatPosisi={tampilan.nilaiIngatPosisi}
              onGantiIngatPosisi={tampilan.onGantiIngatPosisi}
              teksPosisiTersimpan={tampilan.teksPosisiTersimpan}
              teksIngatNonaktif={tampilan.teksIngatNonaktif}
              kartu={tampilan.kartuKomentator}
              pilihanWarnaPapan={tampilan.pilihanWarnaPapan}
              nilaiWarnaPapan={tampilan.nilaiWarnaPapan}
              onGantiWarnaPapan={tampilan.onGantiWarnaPapan}
            />
          )}

          <KontrolMesin
            engineNyala={mesin.engineNyala}
            kecepatanEngine={mesin.kecepatanEngine}
            opsiKecepatan={mesin.opsiKecepatan}
            onGantiKecepatan={mesin.onGantiKecepatan}
            pvSanEngine={mesin.pvSanEngine}
            onMainkanSaran={mesin.onMainkanSaran}
          />

          <KontrolLangkah
            onKeAwal={navigasi.onKeAwal}
            onMundur={navigasi.onMundur}
            onMaju={navigasi.onMaju}
            onKeAkhir={navigasi.onKeAkhir}
            bisaMundur={navigasi.bisaMundur}
            bisaMaju={navigasi.bisaMaju}
            onFlip={aksi.onFlip}
            nilaiSuara={tampilan.nilaiSuara}
            onGantiSuara={tampilan.onGantiSuara}
            nilaiOtomatis={tampilan.nilaiOtomatis}
            onGantiOtomatis={tampilan.onGantiOtomatis}
            onBukaAnalisa={aksi.onBukaAnalisa}
            onAcak={aksi.onAcak}
            onLewati={aksi.onLewati}
            teksCekmat={tampilan.teksCekmat}
            selesai={selesai}
            memuat={memuat}
            memuatKoleksi={memuatKoleksi}
          />
        </aside>
      </div>
    </div>
  );
}
