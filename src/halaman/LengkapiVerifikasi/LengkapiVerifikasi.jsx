/**
 * Lengkapi Verifikasi — jalur bagi anggota yang SUDAH terdaftar.
 *
 * Mengapa halaman ini ada: pendaftaran menolak username yang sudah ada (409),
 * jadi anggota lama yang terlanjur `terverifikasi:false` tidak punya jalan
 * melengkapi bukti kepemilikan akun. Setelah mode `wajib` menjadi bawaan,
 * tanpa halaman ini mereka akan terkunci di luar kegiatan komunitas.
 *
 * Kontrak keamanan (sama dengan alur pendaftaran):
 *  - browser TIDAK pernah menentukan status terverifikasi;
 *  - yang dikirim ke server hanyalah tiket sekali pakai yang DITERBITKAN
 *    SERVER setelah kepemilikan akun terbukti (OAuth atau kode di profil);
 *  - tiket tidak disimpan di state setelah dipakai dan tidak ditampilkan;
 *  - server menolak bila username tiket tidak sama dengan target, bila akun
 *    ada di daftar larangan, atau bila profil Chess.com-nya kena ban.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { Button } from "../../components/ui/button.jsx";
import VerifikasiAkun from "../../components/VerifikasiAkun.jsx";
import {
  ambilCaraVerifikasi,
  lengkapiVerifikasiAnggota,
} from "../../lib/api/anggota.js";
import { bacaHasilOauth } from "../../lib/hasilOauth.js";
import { periksaUsername } from "../../lib/identitas.js";
import { useI18n } from "../../lib/i18n.jsx";

/** Tujuan kembali OAuth: harus halaman ini, bukan halaman pendaftaran. */
const RUTE_INI = "/lengkapi-verifikasi";

export default function LengkapiVerifikasi() {
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [usernameAktif, setUsernameAktif] = useState("");
  const [cara, setCara] = useState(null);
  const [verifikasi, setVerifikasi] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | menyimpan | sukses | gagal
  const [pesan, setPesan] = useState("");
  const [galatUsername, setGalatUsername] = useState("");

  const aktifRef = useRef(true);
  const kontrolRef = useRef(null);

  /* Bersihkan penanda pembatalan dan AbortController saat halaman dibongkar,
     supaya jawaban yang datang terlambat tidak menulis ke state yang mati. */
  useEffect(() => {
    aktifRef.current = true;
    return () => {
      aktifRef.current = false;
      kontrolRef.current?.abort();
      kontrolRef.current = null;
    };
  }, []);

  useEffect(() => {
    let hidup = true;
    ambilCaraVerifikasi()
      .then((c) => {
        if (hidup) setCara(c);
      })
      .catch(() => {
        /* Cara verifikasi tidak wajib untuk menampilkan jalur kode profil. */
        if (hidup) setCara(null);
      });
    return () => {
      hidup = false;
    };
  }, []);

  /** Serahkan tiket ke server. Hanya jawaban server yang mengubah status. */
  const kirimTiket = useCallback(
    async (uname, tiket) => {
      if (!uname || !tiket) return;
      setStatus("menyimpan");
      setPesan("");
      const kontrol = new AbortController();
      kontrolRef.current = kontrol;
      try {
        const hasil = await lengkapiVerifikasiAnggota(uname, tiket, {
          sinyal: kontrol.signal,
        });
        if (!aktifRef.current) return;
        if (hasil?.terverifikasi === true) {
          setStatus("sukses");
          setVerifikasi(null);
        } else {
          setStatus("gagal");
          setPesan(t("lengkapiVerifikasi.gagalUmum"));
        }
      } catch (e) {
        if (!aktifRef.current || e?.name === "AbortError") return;
        setStatus("gagal");
        setPesan(e?.message || t("lengkapiVerifikasi.gagalUmum"));
      } finally {
        if (kontrolRef.current === kontrol) kontrolRef.current = null;
      }
    },
    [t]
  );

  /* Hasil OAuth mendarat di sessionStorage lewat halaman perantara server.
     Isinya tetap bukan bukti: yang menentukan adalah tiket di dalamnya, dan
     tiket itu diverifikasi ulang oleh backend di `kirimTiket`. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { hasil, rusak } = bacaHasilOauth(window.sessionStorage);
    if (!hasil) {
      if (rusak) {
        setStatus("gagal");
        setPesan(t("lengkapiVerifikasi.gagalUmum"));
      }
      return;
    }
    if (hasil.sukses !== true) {
      setStatus("gagal");
      setPesan(t("lengkapiVerifikasi.gagalUmum"));
      return;
    }
    setUsername(hasil.username);
    setUsernameAktif(hasil.username);
    kirimTiket(hasil.username, hasil.tiket);
  }, [kirimTiket, t]);

  const lanjut = (e) => {
    e?.preventDefault?.();
    const diperiksa = periksaUsername(username);
    if (!diperiksa.sah) {
      setGalatUsername(t("lengkapiVerifikasi.galatUsername"));
      setUsernameAktif("");
      return;
    }
    setGalatUsername("");
    setPesan("");
    setStatus("idle");
    setVerifikasi(null);
    setUsernameAktif(diperiksa.username);
  };

  const ulang = () => {
    kontrolRef.current?.abort();
    setUsernameAktif("");
    setVerifikasi(null);
    setStatus("idle");
    setPesan("");
    setGalatUsername("");
  };

  return (
    <HalamanIsi
      title={t("lengkapiVerifikasi.judul")}
      parent={t("nav.keanggotaan")}
      parentPath="/pendaftaran-anggota"
      description={t("lengkapiVerifikasi.deskripsi")}
    >
      <section className="w-full relative bg-transparent pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-16 pt-12 md:pt-14 xl:pt-16">
        <div className="relative w-full mx-auto max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            {t("lengkapiVerifikasi.judul")}
          </h1>
          <p className="mt-3 text-sm md:text-base leading-relaxed text-gray-600">
            {t("lengkapiVerifikasi.pengantar")}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            {t("lengkapiVerifikasi.catatanKenapa")}
          </p>

          {status === "sukses" ? (
            <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    {t("lengkapiVerifikasi.berhasilJudul")}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-emerald-800">
                    {t("lengkapiVerifikasi.berhasilPesan", { username: usernameAktif })}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="outline" onClick={ulang}>
                  {t("lengkapiVerifikasi.tombolUbah")}
                </Button>
                <Link
                  to="/tentang-kami/struktur-grup-catur"
                  className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold text-blue-700 hover:underline"
                >
                  {t("lengkapiVerifikasi.keAnggota")}
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {!usernameAktif ? (
                <form onSubmit={lanjut} className="space-y-3">
                  <label
                    htmlFor="lv-username"
                    className="block text-sm font-semibold text-gray-900"
                  >
                    {t("lengkapiVerifikasi.labelUsername")}
                  </label>
                  <input
                    id="lv-username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t("lengkapiVerifikasi.phUsername")}
                    autoComplete="username"
                    className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {galatUsername && (
                    <p className="text-xs font-medium text-red-700">{galatUsername}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Button type="submit">{t("lengkapiVerifikasi.tombolLanjut")}</Button>
                    <Link
                      to="/pendaftaran-anggota"
                      className="text-xs font-semibold text-blue-700 hover:underline"
                    >
                      {t("lengkapiVerifikasi.kePendaftaran")}
                    </Link>
                  </div>
                </form>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-gray-900">
                      {t("lengkapiVerifikasi.judulVerifikasi")}
                    </h2>
                    <button
                      type="button"
                      onClick={ulang}
                      className="text-xs font-semibold text-blue-700 hover:underline"
                    >
                      {t("lengkapiVerifikasi.tombolUbah")}
                    </button>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {t("lengkapiVerifikasi.pengantarVerifikasi")}
                  </p>

                  <div className="mt-4">
                    <VerifikasiAkun
                      username={usernameAktif}
                      terverifikasi={false}
                      verifikasi={verifikasi}
                      cara={cara}
                      kembaliKe={RUTE_INI}
                      onTerverifikasi={(v) => {
                        setVerifikasi(v);
                        kirimTiket(usernameAktif, v?.tiket);
                      }}
                      onPengajuan={() => {
                        /* Pengajuan manual tidak menghasilkan tiket; pengurus
                           yang menetapkan status lewat dasbor. */
                        setStatus("idle");
                        setPesan("");
                      }}
                    />
                  </div>

                  {status === "menyimpan" && (
                    <p className="mt-4 text-xs font-medium text-gray-600">
                      {t("lengkapiVerifikasi.memproses")}
                    </p>
                  )}

                  {status === "gagal" && pesan && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
                      <div>
                        <p className="text-xs font-semibold text-red-900">
                          {t("lengkapiVerifikasi.gagalJudul")}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-red-800">{pesan}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </HalamanIsi>
  );
}
