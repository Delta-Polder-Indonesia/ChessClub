import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import PapanTekaTeki from "../../TekaTeki/PapanTekaTeki.jsx";
import { useI18n } from "../../../lib/i18n.jsx";
import {
  buatKartuDariJalur,
  idJalurPembukaan,
  indeksJalurPembukaan,
  jadwalkanKartu,
  kartuBerikutnya,
} from "./repertoarLogika.js";
import {
  bacaKartuRepertoar,
  hapusJalurRepertoar,
  simpanKartuRepertoar,
} from "./repertoarStorage.js";

const FEN_AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function uciDariPindahan(pindah) {
  return `${pindah.from}${pindah.to}${pindah.promotion || ""}`;
}

function tanggalRingkas(timestamp, bahasa) {
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat(bahasa === "en" ? "en-US" : "id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

export default function LatihanRepertoar({ onJelajahBuku }) {
  const { t, bahasa } = useI18n();
  const [kartu, setKartu] = useState([]);
  const [memuatKartu, setMemuatKartu] = useState(true);
  const [tampilan, setTampilan] = useState("koleksi");
  const [jalurBuku, setJalurBuku] = useState([]);
  const [bukuSiap, setBukuSiap] = useState(false);
  const [memuatBuku, setMemuatBuku] = useState(false);
  const [galatBuku, setGalatBuku] = useState(false);
  const [pencarian, setPencarian] = useState("");
  const [jalurTerpilih, setJalurTerpilih] = useState(null);
  const [warnaLatihan, setWarnaLatihan] = useState("w");
  const [pesan, setPesan] = useState("");
  const [sekarang, setSekarang] = useState(Date.now());
  const [jalurAktif, setJalurAktif] = useState(null);
  const [kartuAktif, setKartuAktif] = useState(null);
  const [fen, setFen] = useState(FEN_AWAL);
  const [langkahAkhir, setLangkahAkhir] = useState(null);
  const [terpilih, setTerpilih] = useState(null);
  const [sasaran, setSasaran] = useState([]);
  const [statusLatihan, setStatusLatihan] = useState("menunggu");
  const [langkahSalah, setLangkahSalah] = useState(null);

  useEffect(() => {
    let aktif = true;
    bacaKartuRepertoar()
      .then((data) => {
        if (aktif) setKartu(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (aktif) setMemuatKartu(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  async function muatBuku() {
    if (bukuSiap || memuatBuku) return;
    setMemuatBuku(true);
    setGalatBuku(false);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/buku-pembukaan.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setJalurBuku(indeksJalurPembukaan(data));
      setBukuSiap(true);
    } catch {
      setGalatBuku(true);
    } finally {
      setMemuatBuku(false);
    }
  }

  function bukaTambah() {
    setTampilan("tambah");
    setPesan("");
    void muatBuku();
  }

  const jalurTersaring = useMemo(() => {
    const term = pencarian.trim().toLowerCase();
    if (!term) return jalurBuku.slice(0, 60);
    return jalurBuku
      .filter((jalur) => `${jalur.eco} ${jalur.nama}`.toLowerCase().includes(term)
      )
      .slice(0, 60);
  }, [jalurBuku, pencarian]);

  const daftarRepertoar = useMemo(() => {
    const map = new Map();
    for (const item of kartu) {
      let jalur = map.get(item.lineId);
      if (!jalur) {
        jalur = {
          lineId: item.lineId,
          eco: item.eco,
          nama: item.nama,
          warna: item.warna,
          jumlah: 0,
          jatuhTempo: 0,
          berikutnya: Infinity,
        };
        map.set(item.lineId, jalur);
      }
      jalur.jumlah += 1;
      if (Number(item.dueAt) <= sekarang) jalur.jatuhTempo += 1;
      jalur.berikutnya = Math.min(jalur.berikutnya, Number(item.dueAt) || 0);
    }
    return [...map.values()].sort((a, b) => a.nama.localeCompare(b.nama));
  }, [kartu, sekarang]);

  async function tambahJalur() {
    if (!jalurTerpilih) return;
    const lineId = idJalurPembukaan({
      eco: jalurTerpilih.eco,
      nama: jalurTerpilih.nama,
      warna: warnaLatihan,
    });
    if (kartu.some((item) => item.lineId === lineId)) {
      setPesan(t("papan.repertoarSudahAda"));
      return;
    }
    const baru = buatKartuDariJalur(jalurTerpilih, warnaLatihan);
    if (!baru.length) {
      setPesan(t("papan.repertoarJalurKosong"));
      return;
    }
    await simpanKartuRepertoar(baru);
    setKartu((lama) => [...lama, ...baru]);
    setSekarang(Date.now());
    setPesan(t("papan.repertoarBerhasilTambah", { jumlah: baru.length }));
    setTampilan("koleksi");
  }

  function mulaiLatihan(lineId) {
    const berikutnya = kartuBerikutnya(kartu, lineId, Date.now());
    if (!berikutnya) {
      setPesan(t("papan.repertoarBelumJatuhTempo"));
      return;
    }
    setJalurAktif(lineId);
    setKartuAktif(berikutnya);
    setFen(berikutnya.fen);
    setLangkahAkhir(null);
    setTerpilih(null);
    setSasaran([]);
    setLangkahSalah(null);
    setStatusLatihan("menunggu");
    setTampilan("latihan");
    setPesan("");
  }

  function pilihPetak(square) {
    if (statusLatihan !== "menunggu" || !kartuAktif) return;
    if (terpilih === square) {
      setTerpilih(null);
      setSasaran([]);
      return;
    }
    try {
      const game = new Chess(fen);
      const piece = game.get(square);
      if (piece && piece.color === kartuAktif.warna && game.turn() === kartuAktif.warna) {
        setTerpilih(square);
        setSasaran(game.moves({ square, verbose: true }).map((move) => move.to));
      } else {
        setTerpilih(null);
        setSasaran([]);
      }
    } catch {
      setTerpilih(null);
      setSasaran([]);
    }
  }

  function jawabLangkah(from, to) {
    if (statusLatihan !== "menunggu" || !kartuAktif) return;
    const game = new Chess(fen);
    let pindah = null;
    const piece = game.get(from);
    const promotion = piece?.type === "p" && (to.endsWith("1") || to.endsWith("8")) ? "q" : undefined;
    try {
      pindah = game.move({ from, to, ...(promotion ? { promotion } : {}) });
    } catch {
      pindah = null;
    }
    if (!pindah) return;

    setTerpilih(null);
    setSasaran([]);
    setLangkahSalah(null);
    if (uciDariPindahan(pindah) === kartuAktif.expectedUci) {
      setFen(game.fen());
      setLangkahAkhir({ from: pindah.from, to: pindah.to });
      setStatusLatihan("benar");
    } else {
      setLangkahSalah(pindah.san);
      setStatusLatihan("salah");
    }
  }

  async function nilaiKartu(nilai) {
    if (!kartuAktif || !jalurAktif) return;
    const waktu = Date.now();
    const diperbarui = jadwalkanKartu(kartuAktif, nilai, waktu);
    await simpanKartuRepertoar([diperbarui]);
    const daftarBaru = kartu.map((item) => (item.id === diperbarui.id ? diperbarui : item));
    setKartu(daftarBaru);
    setSekarang(waktu);
    const berikutnya = kartuBerikutnya(daftarBaru, jalurAktif, waktu);
    setKartuAktif(berikutnya);
    setLangkahSalah(null);
    setTerpilih(null);
    setSasaran([]);
    if (berikutnya) {
      setFen(berikutnya.fen);
      setLangkahAkhir(null);
      setStatusLatihan("menunggu");
    } else {
      setStatusLatihan("selesai");
    }
  }

  async function hapusJalur(lineId) {
    await hapusJalurRepertoar(lineId);
    setKartu((lama) => lama.filter((item) => item.lineId !== lineId));
    setPesan("");
  }

  const jumlahJatuhTempo = kartu.filter((item) => Number(item.dueAt) <= sekarang).length;

  if (tampilan === "latihan") {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-y-auto p-4">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#312e2b] pb-3">
          <div>
            <h1 className="text-xl font-bold text-white">{t("papan.repertoarJudul")}</h1>
            <p className="mt-1 text-sm text-gray-400">{kartuAktif?.nama || t("papan.repertoarSesi")}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTampilan("koleksi");
              setKartuAktif(null);
              setJalurAktif(null);
            }}
            className="rounded-md border border-[#363431] px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-[#312e2b]"
          >
            {t("papan.repertoarKembali")}
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="mx-auto flex w-full max-w-[620px] flex-col gap-3">
            <div aria-live="polite" className="rounded-md border border-[#363431] bg-[#211f1c] px-3 py-2 text-sm text-gray-200">
              {statusLatihan === "benar"
                ? t("papan.repertoarJawabanBenar")
                : statusLatihan === "salah"
                  ? t("papan.repertoarJawabanSalah")
                  : statusLatihan === "selesai"
                    ? t("papan.repertoarSesiSelesai")
                    : t("papan.repertoarInstruksi")}
              {statusLatihan === "salah" && (
                <p className="mt-1 text-xs text-amber-300">
                  {t("papan.repertoarJawaban", { san: kartuAktif?.expectedSan || "" })}
                  {langkahSalah ? ` (${langkahSalah})` : ""}
                </p>
              )}
            </div>
            {kartuAktif ? (
              <div className="relative mx-auto aspect-square w-full">
                <PapanTekaTeki
                  fen={fen}
                  orientasi={kartuAktif.warna}
                  terpilih={terpilih}
                  sasaran={sasaran}
                  langkahAkhir={langkahAkhir}
                  terkunci={statusLatihan !== "menunggu"}
                  membeku={statusLatihan !== "menunggu"}
                  setBidak="alpha"
                  tema="metal"
                  onKlik={(square) => {
                    if (terpilih && sasaran.includes(square)) jawabLangkah(terpilih, square);
                    else pilihPetak(square);
                  }}
                  onJatuh={jawabLangkah}
                />
              </div>
            ) : (
              <p className="rounded-md bg-[#211f1c] p-4 text-sm text-gray-400">{t("papan.repertoarSesiSelesai")}</p>
            )}
          </section>

          <aside className="flex min-h-0 flex-col gap-3 rounded-lg border border-[#312e2b] bg-[#211f1c] p-4">
            <div className="text-xs text-gray-400">
              {t("papan.repertoarPosisi")}: {kartuAktif ? kartuAktif.ply + 1 : "—"}
            </div>
            {statusLatihan === "benar" && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["again", "papan.repertoarLagi"],
                  ["hard", "papan.repertoarSulit"],
                  ["good", "papan.repertoarBaik"],
                  ["easy", "papan.repertoarMudah"],
                ].map(([nilai, label]) => (
                  <button
                    key={nilai}
                    type="button"
                    onClick={() => void nilaiKartu(nilai)}
                    className="rounded-md border border-[#363431] bg-[#262421] px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-[#81b64c] hover:text-white"
                  >
                    {t(label)}
                  </button>
                ))}
              </div>
            )}
            {statusLatihan === "salah" && (
              <button
                type="button"
                onClick={() => void nilaiKartu("again")}
                className="rounded-md bg-[#81b64c] px-3 py-2 text-sm font-bold text-[#1e1c18] hover:bg-[#91c45a]"
              >
                {t("papan.repertoarUlangi")}
              </button>
            )}
            {statusLatihan === "selesai" && (
              <button
                type="button"
                onClick={() => setTampilan("koleksi")}
                className="rounded-md bg-[#81b64c] px-3 py-2 text-sm font-bold text-[#1e1c18] hover:bg-[#91c45a]"
              >
                {t("papan.repertoarKembali")}
              </button>
            )}
            <p className="mt-auto border-t border-[#312e2b] pt-3 text-[11px] leading-relaxed text-gray-500">
              {t("papan.repertoarJadwalLokal")}
            </p>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-4">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#312e2b] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white">{t("papan.repertoarJudul")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-400">{t("papan.repertoarDeskripsi")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onJelajahBuku}
            className="rounded-md border border-[#363431] px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-[#312e2b] hover:text-white"
          >
            {t("papan.repertoarJelajahBuku")}
          </button>
          <button
            type="button"
            onClick={bukaTambah}
            className="rounded-md bg-[#81b64c] px-3 py-2 text-xs font-bold text-[#1e1c18] transition hover:bg-[#91c45a]"
          >
            {t("papan.repertoarTambahJalur")}
          </button>
        </div>
      </header>

      {pesan && <p role="status" className="mt-3 rounded-md border border-[#363431] bg-[#211f1c] px-3 py-2 text-xs text-gray-300">{pesan}</p>}

      {tampilan === "tambah" ? (
        <section className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
          <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-400">
              {t("papan.repertoarCari")}
              <input
                type="search"
                value={pencarian}
                onChange={(event) => setPencarian(event.target.value)}
                placeholder={t("papan.repertoarCariPlaceholder")}
                className="rounded-md border border-[#363431] bg-[#262421] px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#81b64c]"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-400">
              {t("papan.repertoarWarna")}
              <select
                value={warnaLatihan}
                onChange={(event) => setWarnaLatihan(event.target.value)}
                className="rounded-md border border-[#363431] bg-[#262421] px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#81b64c]"
              >
                <option value="w">{t("papan.pvePutih")}</option>
                <option value="b">{t("papan.pveHitam")}</option>
              </select>
            </label>
          </div>

          {memuatBuku ? (
            <p className="rounded-md bg-[#211f1c] p-4 text-sm text-gray-400">{t("papan.repertoarMemuatBuku")}</p>
          ) : galatBuku ? (
            <div className="rounded-md border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
              <p>{t("papan.repertoarGagalMuat")}</p>
              <button type="button" onClick={() => void muatBuku()} className="mt-2 underline">
                {t("common.cobaLagi")}
              </button>
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.8fr)]">
              <div className="min-h-[220px] overflow-y-auto rounded-md border border-[#312e2b] bg-[#211f1c]">
                {!bukuSiap ? null : jalurTersaring.length ? (
                  <ul>
                    {jalurTersaring.map((jalur) => (
                      <li key={jalur.id} className="border-b border-[#312e2b] last:border-0">
                        <button
                          type="button"
                          onClick={() => setJalurTerpilih(jalur)}
                          aria-pressed={jalurTerpilih?.id === jalur.id}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                            jalurTerpilih?.id === jalur.id
                              ? "bg-[#363431] text-white"
                              : "text-gray-300 hover:bg-[#2c2926]"
                          }`}
                        >
                          <span className="shrink-0 rounded bg-[#81b64c]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#a3d168]">{jalur.eco}</span>
                          <span className="min-w-0 flex-1 truncate text-xs" title={jalur.nama}>{jalur.nama}</span>
                          <span className="shrink-0 text-[10px] text-gray-500">{jalur.moves.length} ply</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-sm text-gray-400">{t("papan.repertoarTakAdaHasil")}</p>
                )}
              </div>

              <div className="flex min-h-[220px] flex-col gap-3 rounded-md border border-[#312e2b] bg-[#211f1c] p-4">
                {jalurTerpilih ? (
                  <>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#a3d168]">{jalurTerpilih.eco}</p>
                      <h2 className="mt-1 text-base font-bold text-white">{jalurTerpilih.nama}</h2>
                      <p className="mt-2 text-xs text-gray-500">{t("papan.repertoarPly", { jumlah: jalurTerpilih.moves.length })}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void tambahJalur()}
                      className="mt-auto rounded-md bg-[#81b64c] px-3 py-2.5 text-sm font-bold text-[#1e1c18] hover:bg-[#91c45a]"
                    >
                      {t("papan.repertoarSimpanJalur")}
                    </button>
                  </>
                ) : (
                  <p className="my-auto text-sm text-gray-500">{t("papan.repertoarPilihJalur")}</p>
                )}
                <button
                  type="button"
                  onClick={() => setTampilan("koleksi")}
                  className="rounded-md border border-[#363431] px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-[#2c2926]"
                >
                  {t("papan.repertoarKembali")}
                </button>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {memuatKartu ? (
            <p className="text-sm text-gray-400">{t("papan.repertoarMemuat")}</p>
          ) : daftarRepertoar.length ? (
            <>
              <div className="mb-3 flex flex-wrap gap-2 text-xs text-gray-400">
                <span className="rounded bg-[#211f1c] px-2 py-1">{t("papan.repertoarJumlahJalur", { jumlah: daftarRepertoar.length })}</span>
                <span className="rounded bg-[#211f1c] px-2 py-1">{t("papan.repertoarJumlahJatuhTempo", { jumlah: jumlahJatuhTempo })}</span>
              </div>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {daftarRepertoar.map((jalur) => (
                  <li key={jalur.lineId} className="flex flex-col gap-3 rounded-lg border border-[#312e2b] bg-[#211f1c] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#a3d168]">{jalur.eco} · {jalur.warna === "w" ? t("papan.pvePutih") : t("papan.pveHitam")}</p>
                        <h2 className="mt-1 text-sm font-bold text-white">{jalur.nama}</h2>
                      </div>
                      <span className="shrink-0 rounded bg-[#262421] px-2 py-1 text-[10px] text-gray-400">{t("papan.repertoarJumlahPosisi", { jumlah: jalur.jumlah })}</span>
                    </div>
                    <p className="text-xs text-gray-400">{t("papan.repertoarJatuhTempo", { jumlah: jalur.jatuhTempo })}</p>
                    <div className="mt-auto flex gap-2">
                      <button
                        type="button"
                        disabled={!jalur.jatuhTempo}
                        onClick={() => mulaiLatihan(jalur.lineId)}
                        className="flex-1 rounded-md bg-[#81b64c] px-3 py-2 text-xs font-bold text-[#1e1c18] hover:bg-[#91c45a] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {jalur.jatuhTempo ? t("papan.repertoarMulai") : t("papan.repertoarBelumJatuhTempo")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void hapusJalur(jalur.lineId)}
                        title={t("papan.repertoarHapus")}
                        className="rounded-md border border-[#363431] px-3 py-2 text-xs text-gray-400 hover:border-red-800 hover:text-red-300"
                      >
                        {t("papan.repertoarHapus")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-lg border border-dashed border-[#45423d] bg-[#211f1c] px-6 py-12 text-center">
              <h2 className="text-base font-bold text-white">{t("papan.repertoarKosong")}</h2>
              <p className="text-sm text-gray-400">{t("papan.repertoarKosongDeskripsi")}</p>
              <button
                type="button"
                onClick={bukaTambah}
                className="rounded-md bg-[#81b64c] px-4 py-2 text-sm font-bold text-[#1e1c18] hover:bg-[#91c45a]"
              >
                {t("papan.repertoarTambahJalur")}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
