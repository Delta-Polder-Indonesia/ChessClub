import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import {
  daftarDenganChessCom,
  normalisasiUsernameKanonik,
  normalisasiNama,
  hpValid,
  periksaUsername,
  periksaTanggalLahir,
} from "../../lib/api/index.js";
import { ambilCaraVerifikasi } from "../../lib/api/anggota.js";
import { segarkanAnggota } from "../../lib/anggotaBersama.js";
import { useI18n } from "../../lib/i18n.jsx";
import TampilanPendaftaran from "./TampilanPendaftaran.jsx";
import { URL_KLUB } from "./komponen/pendaftaran.js";

const AWAL = {
  username: "",
  namaLengkap: "",
  panggilan: "",
  hp: "",
  dana: "",
  kota: "",
  tanggalLahir: "",
  email: "",
  klub: "",
  setuju: false,
};

/** Kunci sessionStorage tempat halaman perantara OAuth menulis hasilnya. */
const KUNCI_HASIL_OAUTH = "kci-hasil-verifikasi";

/**
 * Penyebab kegagalan OAuth yang dikenal server. Pesan dibangun dari kamus
 * (bukan dari teks exception server) supaya pengguna tidak pernah melihat
 * detail teknis token, dan kunci yang tidak dikenal tidak menampilkan nama
 * kuncinya sendiri di layar.
 */
const SEBAB_OAUTH = [
  "konfigurasi",
  "state",
  "state-kedaluwarsa",
  "chesscom",
  "token",
  "username",
  "penandatangan",
];

/**
 * Hasil OAuth mengalir lewat sessionStorage karena Chess.com mengembalikan
 * pengguna ke URL server, bukan langsung ke komponen ini. Isinya TIDAK
 * dipercaya begitu saja:
 *  - dibaca dalam try/catch, DAN dibersihkan HANYA setelah JSON-nya terurai
 *    (rusak -> bersihkan + laporkan, tanpa crash dan tanpa data hilang);
 *  - struktur dan tipe field divalidasi lebih dulu;
 *  - tetap bukan bukti keamanan apa pun: status "terverifikasi" hanya lahir
 *    bila ada `tiket` yang diterbitkan server (tiket itulah yang diverifikasi
 *    ulang oleh backend saat formulir dikirim).
 */
function bacaHasilOauth(session) {
  let mentah = null;
  try {
    mentah = session?.getItem?.(KUNCI_HASIL_OAUTH) ?? null;
  } catch {
    return { hasil: null, rusak: false };
  }
  if (!mentah) return { hasil: null, rusak: false };

  let data = null;
  try {
    data = JSON.parse(mentah);
  } catch {
    // Hanya buang setelah diketahui isinya memang tidak dapat diurai.
    try {
      session.removeItem(KUNCI_HASIL_OAUTH);
    } catch {
      /* mode privat */
    }
    return { hasil: null, rusak: true };
  }

  try {
    session.removeItem(KUNCI_HASIL_OAUTH);
  } catch {
    /* mode privat */
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { hasil: null, rusak: true };
  }
  if (data.sukses === true) {
    const ok =
      typeof data.username === "string" &&
      data.username.length > 0 &&
      typeof data.tiket === "string" &&
      data.tiket.length > 0;
    // Tanpa tiket, "sukses" dari browser tidak berarti apa-apa.
    if (!ok) return { hasil: null, rusak: true };
    return {
      hasil: {
        sukses: true,
        username: data.username,
        tiket: data.tiket,
        cara: typeof data.cara === "string" ? data.cara : "oauth",
        berlakuDetik: Number(data.berlakuDetik) || 0,
      },
      rusak: false,
    };
  }
  if (data.sukses === false) {
    return {
      hasil: {
        sukses: false,
        // Sebab sudah dipetakan ke kode aman di server (rute.js).
        sebab: typeof data.sebab === "string" ? data.sebab : "token",
      },
      rusak: false,
    };
  }
  return { hasil: null, rusak: true };
}

export default function PendaftaranAnggota() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { username: usernamePath } = useParams();
  const [form, setForm] = useState(() => ({
    ...AWAL,
    username: normalisasiUsernameKanonik(usernamePath),
  }));
  const [status, setStatus] = useState("idle");
  const [pesan, setPesan] = useState("");
  const [galatBidang, setGalatBidang] = useState({});
  const [verifikasi, setVerifikasi] = useState(null);
  const [statusVerifikasi, setStatusVerifikasi] = useState("idle");
  const [cara, setCara] = useState(null);
  /* Sebab galat OAuth disimpan mentah, bukan kalimat jadi — pesannya
     diterjemahkan saat render agar mengikuti bahasa aktif (kamus EN
     dimuat malas; kalimat yang disimpan saat mount terkunci di ID). */
  const [sebabOauth, setSebabOauth] = useState(null);
  const PESAN_SEBAB_OAUTH = Object.fromEntries(
    SEBAB_OAUTH.map((k) => [k, t(`verifikasi.sebabOauth.${k}`)])
  );

  /* Pengiriman berjalan: dijaga lewat ref (bukan hanya state) agar dua klik
     dalam render yang sama tidak mengirim dua permintaan. */
  const sedangKirim = useRef(false);
  const timerNavigasi = useRef(null);
  const hidup = useRef(true);

  useEffect(() => {
    hidup.current = true;
    return () => {
      hidup.current = false;
      if (timerNavigasi.current) clearTimeout(timerNavigasi.current);
      timerNavigasi.current = null;
    };
  }, []);

  /* Konfigurasi mode dibaca dari server — UI tidak boleh menebak sendiri
     apakah verifikasi wajib atau tidak. */
  useEffect(() => {
    const kendali = new AbortController();
    ambilCaraVerifikasi()
      .then((data) => {
        if (hidup.current) setCara(data);
      })
      .catch(() => {
        /* Server tidak terjangkau: biarkan `cara` null. Formulir tetap bisa
           diisi; backend yang memutuskan, dan pesan galat dari server yang
           akan tampil. */
      });
    return () => kendali.abort();
  }, []);

  useEffect(() => {
    const { hasil, rusak } = bacaHasilOauth(
      typeof sessionStorage === "undefined" ? null : sessionStorage
    );
    if (rusak) {
      setStatus("gagal");
      setPesan(t("verifikasi.hasilOauthRusak"));
      return;
    }
    if (!hasil) return;
    if (hasil.sukses) {
      setVerifikasi({
        username: normalisasiUsernameKanonik(hasil.username),
        tiket: hasil.tiket,
        cara: hasil.cara,
        berlakuDetik: hasil.berlakuDetik,
      });
      setForm((f) => ({ ...f, username: normalisasiUsernameKanonik(hasil.username) }));
      setStatusVerifikasi("success");
      return;
    }
    setSebabOauth(SEBAB_OAUTH.includes(hasil.sebab) ? hasil.sebab : "token");
    setStatus("gagal");
    setStatusVerifikasi("error");
  }, [t]);

  const ubah = (nama, nilai) => {
    setForm((f) => ({ ...f, [nama]: nilai }));
    if (nama === "username") setGalatBidang((g) => ({ ...g, username: undefined }));
    if (
      nama === "username" &&
      normalisasiUsernameKanonik(nilai) !== verifikasi?.username
    ) {
      /* Tiket terikat username. Begitu username bergeser ke akun lain, bukti
         itu tidak berlaku lagi dan harus diminta ulang. */
      setVerifikasi(null);
      setStatusVerifikasi("idle");
    }
  };

  const validasiLokal = useCallback(
    (data = form) => {
      const g = {};
      const usia = periksaTanggalLahir(data.tanggalLahir);
      const diperiksa = periksaUsername(data.username);
      if (!diperiksa.sah) g.username = t(`pendaftaran.galatUsername.${diperiksa.sebab}`);
      if (normalisasiNama(data.namaLengkap).split(" ").filter(Boolean).length < 2)
        g.namaLengkap = t("pendaftaran.galatNama");
      if (!data.panggilan.trim()) g.panggilan = t("pendaftaran.galatPanggilan");
      if (!hpValid(data.hp)) g.hp = t("pendaftaran.galatHp");
      if (data.dana.trim() && !hpValid(data.dana))
        g.dana = t("pendaftaran.galatDana");
      if (!data.kota.trim()) g.kota = t("pendaftaran.galatKota");
      if (!usia.sah) g.tanggalLahir = t(`pendaftaran.galatLahir.${usia.sebab}`);
      if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email))
        g.email = t("pendaftaran.galatEmail");
      if (!data.setuju) g.setuju = t("pendaftaran.galatSetuju");
      return g;
    },
    [form, t]
  );

  const kirim = async () => {
    if (sedangKirim.current) return false; // klik ganda: abaikan, jangan kirim dua kali
    setPesan("");
    const data = form;
    const galat = validasiLokal(data);
    setGalatBidang(galat);
    if (Object.keys(galat).length) {
      setStatus("gagal");
      setPesan(Object.values(galat)[0] || t("pendaftaran.periksaIsian"));
      return false;
    }
    /* Mode `wajib`: jangan mengirim formulir yang pasti ditolak server.
       Pesan penolakan server tetap menjadi penjaga sebenarnya. */
    const username = normalisasiUsernameKanonik(data.username);
    const tiket = verifikasi?.username === username ? verifikasi.tiket : undefined;
    if (cara?.wajib && !tiket) {
      setStatus("gagal");
      setPesan(t("pendaftaran.galatVerifikasiWajib"));
      setStatusVerifikasi("error");
      return false;
    }

    setStatus("mengirim");
    sedangKirim.current = true;
    try {
      await daftarDenganChessCom({
        ...data,
        username,
        // Hanya tiket terbitan server yang dikirim. Field tampilan seperti
        // `mode`/`sumber`/`kode`/`profil` tidak pernah dikirim lagi karena
        // server juga tidak pernah membacanya.
        ...(tiket ? { tiketVerifikasi: tiket } : {}),
      });
      setStatus("sukses");
      segarkanAnggota().catch(() => {});
      // Setelah berhasil, tunda perpindahan dan izinkan pembatalan saat
      // komponen dibongkar (pengguna menekan tautan lain lebih dulu).
      timerNavigasi.current = window.setTimeout(() => {
        timerNavigasi.current = null;
        if (hidup.current) navigate("/tentang-kami/struktur-grup-catur#keanggotaan");
      }, 900);
      return true;
    } catch (err) {
      setStatus("gagal");
      setGalatBidang(err?.galat || {});
      const perluVerifikasi = Boolean(err?.perluVerifikasi);
      if (perluVerifikasi) {
        /* Tiket tidak sah (kedaluwarsa / sudah dipakai / username berbeda):
           bukti dibuang, pengguna diminta mengulang verifikasi. Isian form
           TIDAK dihapus agar ia tidak perlu mengetik ulang semuanya. */
        setVerifikasi(null);
        setStatusVerifikasi("kedaluwarsa");
        setPesan(err.message || t("verifikasi.tiketKedaluwarsa"));
      } else {
        setPesan(err.message || t("pendaftaran.periksaIsian"));
      }
      return false;
    } finally {
      sedangKirim.current = false;
    }
  };

  const reset = () => {
    setForm(AWAL);
    setVerifikasi(null);
    setStatusVerifikasi("idle");
    setStatus("idle");
    setPesan("");
    setGalatBidang({});
    setSebabOauth(null);
  };

  return (
    <HalamanIsi
      title={t("pendaftaran.judul")}
      parent={t("nav.tentangKami")}
      parentPath="/tentang-kami"
      description={t("pendaftaran.deskripsi")}
      next={{
        to: "/tentang-kami/struktur-grup-catur#keanggotaan",
        judul: t("pendaftaran.nextJudul"),
      }}
    >
      <TampilanPendaftaran
        form={form}
        status={status}
        pesan={
          pesan ||
          (sebabOauth
            ? t("verifikasi.oauthGagal", { sebab: PESAN_SEBAB_OAUTH[sebabOauth] || "" })
            : "")
        }
        verifikasi={verifikasi}
        statusVerifikasi={statusVerifikasi}
        cara={cara}
        teksSetuju={t("pendaftaran.setuju")}
        onUbah={ubah}
        onTerverifikasi={(hasil) => {
          setVerifikasi({
            username: normalisasiUsernameKanonik(hasil.username),
            tiket: hasil.tiket,
            cara: hasil.cara || "kode-profil",
            berlakuDetik: hasil.berlakuDetik || 0,
          });
          setStatusVerifikasi("success");
          setForm((f) => ({
            ...f,
            username: normalisasiUsernameKanonik(hasil.username),
          }));
          setStatus("idle");
          setPesan("");
        }}
        onPengajuan={(hasil) => {
          setStatusVerifikasi("pengajuan");
          setPesan("");
          if (hasil?.username) {
            setForm((f) => ({ ...f, username: normalisasiUsernameKanonik(hasil.username) }));
          }
        }}
        onBatalVerifikasi={() => {
          setVerifikasi(null);
          setStatusVerifikasi("idle");
        }}
        onUlangiVerifikasi={() => {
          setVerifikasi(null);
          setStatusVerifikasi("idle");
          setStatus("idle");
          setPesan("");
        }}
        onKirim={kirim}
        onReset={reset}
        validasiLokal={validasiLokal}
      >
        <footer className="z-10 w-full max-w-4xl pb-2">
          <div className="flex flex-col items-center gap-3 border-t border-gray-200 pt-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="order-2 text-[11px] leading-relaxed text-gray-600 sm:order-1">
              {t("pendaftaran.hakCipta", { tahun: new Date().getFullYear() })}
            </p>
            <nav className="order-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-medium text-gray-600 sm:order-2">
              <a
                href={URL_KLUB}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#0B2F9F] hover:underline"
              >
                {t("pendaftaran.tautanKlub")}
              </a>
              <Link to="/bantuan" className="hover:text-[#0B2F9F] hover:underline">
                {t("bantuan.judul")}
              </Link>
              <Link to="/privasi" className="hover:text-[#0B2F9F] hover:underline">
                {t("privasi.judul")}
              </Link>
              <Link to="/ketentuan" className="hover:text-[#0B2F9F] hover:underline">
                {t("ketentuan.judul")}
              </Link>
            </nav>
          </div>
        </footer>
      </TampilanPendaftaran>
    </HalamanIsi>
  );
}
