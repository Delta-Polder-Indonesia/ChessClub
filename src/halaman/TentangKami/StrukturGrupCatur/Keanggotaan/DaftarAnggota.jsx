/**
 * Tab Keanggotaan → Daftar Anggota.
 *
 * Fokus bagian ini adalah IDENTITAS pemain, bukan statistik (W/D/L,
 * rating, dan riwayat permainan sudah lengkap di halaman Peringkat).
 * Kolomnya sederhana:
 *
 *   No · Foto · Nama · Bergabung · Chess.com
 *
 * Klik nama membuka POPUP PROFIL dengan data publik akun dan, bila pemain
 * pernah melengkapi formulir, metadata tambahan seperti panggilan dan kota.
 * Nomor HP/DANA, email, dan tanggal lahir TIDAK pernah ditampilkan.
 *
 * Sumber data TETAP satu pintu: useAnggota() → GET /api/anggota. Server
 * mengambil roster publik klub BLUNDER SKUAD di Chess.com. Urutan baris:
 * anggota terbaru di atas (waktu bergabung ke klub menurun).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { CentangBiru, LencanaBan } from "../../../../components/Lencana.jsx";
import { useAnggota, kenaBan } from "../../../../lib/anggotaBersama.js";
import { useI18n } from "../../../../lib/i18n.jsx";

function sel(nilai) {
  return nilai === null || nilai === undefined || nilai === "" ? "—" : nilai;
}

/** Format tanggal ISO menjadi "13 Agustus 2026" mengikuti bahasa aktif. */
function formatTanggal(iso, bahasa) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(bahasa === "en" ? "en-US" : "id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function namaKlub(slug) {
  return String(slug || "Chess.com")
    .replace(/-/g, " ")
    .toUpperCase();
}

/** Popup profil anggota — data publik Chess.com + metadata bila tersedia. */
function PopupProfil({ a, tutup, bahasa }) {
  const { t } = useI18n();
  const refTombolTutup = useRef(null);

  useEffect(() => {
    refTombolTutup.current?.focus();
    const tangkapKunci = (e) => {
      if (e.key === "Escape") tutup();
    };
    const lebarSebelum = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", tangkapKunci);
    return () => {
      document.body.style.overflow = lebarSebelum;
      document.removeEventListener("keydown", tangkapKunci);
    };
  }, [tutup]);

  // Sesuai janji privasi formulir pendaftaran: nomor HP/WA, DANA, email,
  // dan tanggal lahir TIDAK ditampilkan di situs. Kontak hanya dapat
  // dilihat pengurus lewat endpoint khusus.
  const baris = [
    { label: t("keanggotaan.panggilan"), nilai: sel(a.panggilan) },
    { label: t("keanggotaan.kota"), nilai: sel(a.kota) },
    { label: t("keanggotaan.klub"), nilai: sel(a.klub) },
    { label: t("keanggotaan.kategoriUmur"), nilai: sel(a.kategoriUmur) },
    {
      label: t("keanggotaan.bergabung"),
      nilai: formatTanggal(a.daftarPada, bahasa),
    },
    ...(a.aktivitasKlub
      ? [
          {
            label: t("keanggotaan.aktivitasKlub"),
            nilai: t(`keanggotaan.aktivitas.${a.aktivitasKlub}`),
          },
        ]
      : []),
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profil-anggota-judul"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      onClick={tutup}
    >
      <div className="absolute inset-0 bg-slate-900/50" aria-hidden="true" />
      <div
        className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={refTombolTutup}
          type="button"
          onClick={tutup}
          aria-label={t("keanggotaan.tutup")}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <p
          id="profil-anggota-judul"
          className="break-words pr-8 text-lg font-bold leading-6 text-slate-900"
        >
          {a.nama || a.username}
          {a.terverifikasi && <CentangBiru />}
          {kenaBan(a) && <LencanaBan />}
          {a.panggilan && (
            <span className="ml-2 text-sm font-normal italic text-slate-500">
              “{a.panggilan}”
            </span>
          )}
        </p>

        <div className="mt-4 flex items-start gap-4">
          <div className="flex-none">
            <div className="mt-4">
              {a.foto ? (
                <img
                  src={a.foto}
                  alt={a.nama || a.username}
                  width="96"
                  height="128"
                  className="foto-ktp"
                />
              ) : (
                <span className="foto-ktp foto-anggota-kosong">
                  {(a.nama || a.username || "?").slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
              {baris.map((b) => (
                <div key={b.label}>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    {b.label}
                  </dt>
                  <dd className="break-words font-medium text-slate-800">
                    {b.nilai}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-3 border-t border-slate-100 pt-2 text-sm">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Chess.com
              </dt>
              <dd className="mt-0.5 break-words font-medium">
                {a.url ? (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[#0B2F9F] underline underline-offset-2 hover:text-primary"
                  >
                    {a.username}
                  </a>
                ) : (
                  a.username
                )}
              </dd>
            </div>
          </div>
        </div>

        {a.urlKlub && (
          <p className="mt-4 text-xs leading-5 text-slate-500">
            {t("keanggotaan.sumber")} {" "}
            <a
              href={a.urlKlub}
              target="_blank"
              rel="noreferrer noopener"
              className="font-semibold text-[#0B2F9F] underline underline-offset-2"
            >
              {namaKlub(a.klubChess)}
            </a>
          </p>
        )}

        {kenaBan(a) && (
          <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs leading-5 text-red-900">
            {a.peringatan || t("keanggotaan.terkenaBan")}
          </p>
        )}
        {a.hilang && (
          <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            {t("keanggotaan.akunHilang")}
          </p>
        )}
        {a.gagal && (
          <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            {t("keanggotaan.gagal")}
          </p>
        )}
      </div>
    </div>
  );
}

function BarisAnggota({ a, no, lihatProfil, bahasa }) {
  const { t } = useI18n();
  return (
    <tr>
      <td>{no}</td>
      <td>
        {a.foto ? (
          <img
            src={a.foto}
            alt={a.nama || a.username}
            width="40"
            height="40"
            loading="lazy"
            className="foto-anggota"
          />
        ) : (
          <span className="foto-anggota foto-anggota-kosong">
            {(a.nama || a.username || "?").slice(0, 1).toUpperCase()}
          </span>
        )}
      </td>
      <td>
        <button
          type="button"
          onClick={() => lihatProfil(a)}
          aria-label={`${t("keanggotaan.lihatProfil")}: ${a.nama || a.username}`}
          className="inline-flex items-center gap-0.5 text-left font-medium text-slate-900 underline decoration-slate-300 decoration-dotted underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
        >
          {a.nama || a.username}
          {a.terverifikasi && <CentangBiru />}
          {kenaBan(a) && <LencanaBan />}
        </button>
      </td>
      <td className="whitespace-nowrap">
        {formatTanggal(a.daftarPada, bahasa)}
      </td>
      <td>
        {a.url ? (
          <a href={a.url} target="_blank" rel="noreferrer noopener">
            {a.username}
          </a>
        ) : (
          a.username
        )}
      </td>
    </tr>
  );
}

function TabelAnggota({ baris, lihatProfil, bahasa }) {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto">
      <table className="tabel-kci">
        <thead>
          <tr>
            <th>{t("keanggotaan.no")}</th>
            <th>{t("keanggotaan.foto")}</th>
            <th>{t("keanggotaan.nama")}</th>
            <th>{t("keanggotaan.bergabung")}</th>
            <th>Chess.com</th>
          </tr>
        </thead>
        <tbody>
          {baris.map((a, i) => (
            <BarisAnggota
              key={a.username}
              a={a}
              no={i + 1}
              lihatProfil={lihatProfil}
              bahasa={bahasa}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DaftarAnggota() {
  const { t, bahasa } = useI18n();
  const [dipilih, setDipilih] = useState(null);

  // Satu pintu: sumber data yang sama dengan halaman Peringkat.
  const { anggota, status, pesan } = useAnggota();
  const sumberKlub = anggota.find(
    (a) => a.sumberAnggota === "chesscom-klub" && a.urlKlub
  );

  // Anggota terbaru di atas (urutan waktu gabung menurun).
  const tampil = useMemo(
    () =>
      [...anggota].sort((x, y) => {
        const tx = x.daftarPada ? new Date(x.daftarPada).getTime() : 0;
        const ty = y.daftarPada ? new Date(y.daftarPada).getTime() : 0;
        return ty - tx;
      }),
    [anggota]
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {t("keanggotaan.jumlah", { jumlah: anggota.length })}
          </p>
          {sumberKlub && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {t("keanggotaan.sumber")} {" "}
              <a
                href={sumberKlub.urlKlub}
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-[#0B2F9F] underline underline-offset-2"
              >
                {namaKlub(sumberKlub.klubChess)}
              </a>
              <span className="ml-1">{t("keanggotaan.sumberCatatan")}</span>
            </p>
          )}
        </div>
      </div>

      {status === "memuat" && <p>{t("keanggotaan.memuat")}</p>}
      {status === "gagal" && <p>{pesan}</p>}
      {status === "siap" && anggota.length === 0 && (
        <p>{t("keanggotaan.kosongKlub")}</p>
      )}
      {status === "siap" && anggota.length > 0 && (
        <TabelAnggota
          baris={tampil}
          lihatProfil={setDipilih}
          bahasa={bahasa}
        />
      )}

      {dipilih && (
        <PopupProfil
          a={dipilih}
          tutup={() => setDipilih(null)}
          bahasa={bahasa}
        />
      )}
    </>
  );
}
