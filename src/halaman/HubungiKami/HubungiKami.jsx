/*
 * Halaman Hubungi Kami (layar penuh, tanpa header/footer situs — lihat
 * PageLayout.jsx). Tampilan disalin dari template "modern-portfolio" (MIT,
 * Sanidhya Kumar Verma). Pengiriman pesan memakai jalur yang sudah berjalan
 * di ChessClub: kirimPesan() → /api/pesan → data/pesan.json atau Supabase,
 * dan terlihat di dashboard Pesan Masuk pengurus.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { BsArrowRight } from "react-icons/bs";

import MetaHalaman from "../../components/MetaHalaman.jsx";
import { kirimPesan } from "../../lib/api/index.js";
import { berkasPublik } from "../../lib/asets.js";
import { Kepala, Navigasi, SudutKiri, Transisi } from "./komponen/Kerangka.jsx";
import "./kontak.css";

const fadeIn = (direction, delay) => {
  return {
    hidden: {
      y: direction === "up" ? 80 : direction === "down" ? -80 : 0,
      opacity: 0,
      x: direction === "left" ? 80 : direction === "right" ? -80 : 0,
      transition: {
        type: "tween",
        duration: 1.5,
        delay: delay,
        ease: [0.25, 0.6, 0.3, 0.8],
      },
    },
    show: {
      y: 0,
      x: 0,
      opacity: 1,
      transition: {
        type: "tween",
        duration: 1.4,
        delay: delay,
        ease: [0.25, 0.25, 0.25, 0.75],
      },
    },
  };
};

/* Aturan validasi sama dengan referensi (lib/contact.ts). */
const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const validNama = (v) => v.trim().length >= 3 && v.trim().length <= 200;
const validEmail = (v) =>
  v.trim().length <= 100 && Boolean(v.trim().toLowerCase().match(EMAIL_REGEX));
const validSubjek = (v) => v.trim().length >= 3 && v.trim().length <= 200;
const validPesan = (v) => v.trim().length >= 5 && v.trim().length <= 500;

const VALIDATOR = {
  nama: validNama,
  email: validEmail,
  subjek: validSubjek,
  pesan: validPesan,
};

const KOSONG = { nama: "", email: "", subjek: "", pesan: "" };
const TANPA_GALAT = { nama: false, email: false, subjek: false, pesan: false };

function FormKontak() {
  const pesanRef = useRef(null);
  const sudahCoba = useRef(false);

  const [form, setForm] = useState(KOSONG);
  const [galat, setGalat] = useState(TANPA_GALAT);
  const [setuju, setSetuju] = useState(false);
  const [sedangKirim, setSedangKirim] = useState(false);

  // Tinggi textarea mengikuti isi, sama seperti referensi.
  useLayoutEffect(() => {
    const el = pesanRef.current;
    if (!el) return;

    el.style.overflowY = "hidden";
    el.style.height = "auto";

    const nextHeight = el.scrollHeight;
    const maxHeight = Number.parseFloat(getComputedStyle(el).maxHeight);

    if (Number.isFinite(maxHeight) && nextHeight >= maxHeight) {
      el.style.height = `${maxHeight}px`;
      el.style.overflowY = "auto";
      return;
    }

    el.style.height = `${nextHeight}px`;
  }, [form.pesan]);

  const ubah = (e) => {
    const field = e.target.name;
    const value = e.target.value;

    setForm((prev) => ({ ...prev, [field]: value }));

    if (!sudahCoba.current) return;

    const salah = !VALIDATOR[field](value);
    setGalat((prev) =>
      prev[field] === salah ? prev : { ...prev, [field]: salah },
    );
  };

  const kirim = async (e) => {
    e.preventDefault();
    sudahCoba.current = true;

    const hasilGalat = {
      nama: !validNama(form.nama),
      email: !validEmail(form.email),
      subjek: !validSubjek(form.subjek),
      pesan: !validPesan(form.pesan),
    };
    setGalat(hasilGalat);

    if (Object.values(hasilGalat).some(Boolean)) return;

    if (!setuju) {
      toast.error("Centang persetujuan syarat dan ketentuan terlebih dahulu.");
      return;
    }

    setSedangKirim(true);
    try {
      await kirimPesan({
        nama: form.nama.trim(),
        email: form.email.trim(),
        subjek: form.subjek.trim(),
        pesan: form.pesan.trim(),
      });

      toast.success("Pesan Anda berhasil dikirim!");
      setForm(KOSONG);
      setGalat(TANPA_GALAT);
      setSetuju(false);
      sudahCoba.current = false;
    } catch (error) {
      toast.error(error?.message || "Terjadi kesalahan, silakan coba lagi.");
    } finally {
      setSedangKirim(false);
    }
  };

  return (
    <motion.form
      variants={fadeIn("up", 0.4)}
      initial="hidden"
      animate="show"
      exit="hidden"
      className="flex-1 flex flex-col gap-6 w-full mx-auto"
      onSubmit={kirim}
      autoComplete="off"
      autoCapitalize="off"
      noValidate
    >
      <div className="flex gap-x-6 w-full">
        <div className="flex-1 min-w-0">
          <label htmlFor="kontak-nama" className="sr-only">
            Nama Lengkap
          </label>
          <input
            id="kontak-nama"
            type="text"
            name="nama"
            placeholder="Nama"
            className="h-13 w-full rounded-lg pl-6 bg-transparent outline-hidden focus:ring-1 focus:ring-[#f13024] border border-white/20 placeholder:text-white/30 placeholder:font-light"
            value={form.nama}
            onChange={ubah}
            disabled={sedangKirim}
            aria-disabled={sedangKirim}
            maxLength={200}
            aria-invalid={galat.nama}
            aria-describedby={galat.nama ? "nama-galat" : undefined}
          />
          {galat.nama && (
            <p id="nama-galat" className="mt-1 text-left text-sm text-[#f13024] font-light" role="alert">
              Nama tidak valid
            </p>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <label htmlFor="kontak-email" className="sr-only">
            Alamat Email
          </label>
          <input
            id="kontak-email"
            type="email"
            name="email"
            placeholder="E-mail"
            className="h-13 w-full rounded-lg pl-6 bg-transparent outline-hidden focus:ring-1 focus:ring-[#f13024] border border-white/20 placeholder:text-white/30 placeholder:font-light"
            value={form.email}
            onChange={ubah}
            disabled={sedangKirim}
            aria-disabled={sedangKirim}
            maxLength={100}
            aria-invalid={galat.email}
            aria-describedby={galat.email ? "email-galat" : undefined}
          />
          {galat.email && (
            <p id="email-galat" className="mt-1 text-left text-sm text-[#f13024] font-light" role="alert">
              E-mail tidak valid
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="kontak-subjek" className="sr-only">
          Subjek Pesan
        </label>
        <input
          id="kontak-subjek"
          type="text"
          name="subjek"
          placeholder="Subjek"
          className="h-13 w-full rounded-lg pl-6 bg-transparent outline-hidden focus:ring-1 focus:ring-[#f13024] border border-white/20 placeholder:text-white/30 placeholder:font-light"
          value={form.subjek}
          onChange={ubah}
          disabled={sedangKirim}
          aria-disabled={sedangKirim}
          maxLength={200}
          aria-invalid={galat.subjek}
          aria-describedby={galat.subjek ? "subjek-galat" : undefined}
        />
        {galat.subjek && (
          <p id="subjek-galat" className="mt-1 text-left text-sm text-[#f13024] font-light" role="alert">
            Subjek tidak valid
          </p>
        )}
      </div>

      <div>
        <label htmlFor="kontak-pesan" className="sr-only">
          Isi Pesan
        </label>
        <textarea
          id="kontak-pesan"
          ref={pesanRef}
          name="pesan"
          placeholder="Pesan..."
          className="w-full min-h-32 p-6 rounded-lg resize-none overflow-hidden max-h-60 bg-transparent outline-hidden focus:ring-1 focus:ring-[#f13024] border border-white/20 placeholder:text-white/30 placeholder:font-light"
          rows={4}
          value={form.pesan}
          onChange={ubah}
          disabled={sedangKirim}
          aria-disabled={sedangKirim}
          maxLength={500}
          aria-invalid={galat.pesan}
          aria-describedby={galat.pesan ? "pesan-galat" : undefined}
        />
        {galat.pesan && (
          <p id="pesan-galat" className="mt-1 text-left text-sm text-[#f13024] font-light" role="alert">
            Pesan tidak valid
          </p>
        )}
      </div>

      <div className="flex items-start gap-2">
        <input
          id="agreement"
          type="checkbox"
          name="agreement"
          required
          checked={setuju}
          onChange={(e) => setSetuju(e.target.checked)}
          className="mt-1 w-4 h-4 accent-[#f13024]"
        />
        <label htmlFor="agreement" className="text-sm font-light text-white/60">
          Saya setuju dengan syarat dan ketentuan.{" "}
          <Link
            to="/keberlanjutan/syarat-dan-ketentuan"
            className="text-[#f13024] font-bold no-underline"
          >
            Baca selengkapnya
          </Link>
        </label>
      </div>

      <button
        type="submit"
        className="btn h-13 rounded-full border border-white/50 max-w-42.5 px-8 transition-all duration-300 flex items-center justify-center overflow-hidden hover:border-[#f13024] group disabled:pointer-events-none"
        disabled={sedangKirim}
        aria-disabled={sedangKirim}
      >
        <span
          className={
            sedangKirim
              ? ""
              : "group-hover:translate-y-[-120%] group-hover:opacity-0 transition-all duration-500"
          }
        >
          {sedangKirim ? "Mengirim..." : "Kirim Pesan"}
        </span>

        {!sedangKirim && (
          <BsArrowRight
            className="translate-y-[-120%] opacity-0 group-hover:flex group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 absolute text-[22px]"
            aria-hidden
          />
        )}
      </button>
    </motion.form>
  );
}

export default function HubungiKami() {
  return (
    <div
      className="kontak-skin fixed inset-0 overflow-hidden bg-[#393a47] bg-cover bg-no-repeat text-white leading-relaxed"
      style={{ backgroundImage: `url(${berkasPublik("/images/kontak/site-bg.svg")})` }}
    >
      <MetaHalaman
        title="Hubungi Kami"
        description="Kirim pesan kepada pengurus Komunitas Catur Indonesia."
        path="/hubungi-kami"
      />

      <SudutKiri />
      <Navigasi />
      <Kepala />

      <div className="h-full">
        <Transisi />
        <section id="hubungi-kami" className="h-full bg-[#131424]/30 overflow-y-auto">
          <div className="mx-auto px-[15px] min-[640px]:!max-w-[640px] min-[768px]:!max-w-[768px] min-[960px]:!max-w-[960px] min-[1200px]:!max-w-[1200px] py-32 text-center min-[1200px]:text-left flex items-center justify-center h-full">
            <div className="flex flex-col w-full max-w-175">
              <motion.h2
                variants={fadeIn("up", 0.2)}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="text-[35px] leading-tight md:text-[54px] md:leading-[1.3] font-semibold text-center mb-12"
              >
                Mari <span className="text-[#f13024]">terhubung.</span>
              </motion.h2>

              <FormKontak />
            </div>
          </div>
        </section>
      </div>

      <aside>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#393a47",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            },
          }}
        />
      </aside>
    </div>
  );
}
