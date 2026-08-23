/**
 * Halaman: Informasi Jadwal Turnamen Catur — upgraded total 100% referensi ligacatur.com/tournament#history
 *
 * Struktur 1:1 dengan ligacatur:
 *  - Quick actions (Mendaftar Anggota, Liga Utama, Turnamen Langsung, Kursi Empat, Hasil Sebelumnya)
 *  - Turnamen aktif (deskripsi periode, Lichess/Chess.com, WA Grup)
 *  - FAQ 12 bagian (Berapa kali main, Syarat, Verifikasi, Cara bermain, Skor, Kursi Empat, Winning Streak, Hadiah, Rating, Grup WA, Sponsor, Wasit)
 *  - Tabel Hasil Tournamen (#, Nama, Kategori, Tanggal Mulai, Tanggal Berakhir)
 *  - Pengumuman
 *
 * Tampilan di-upgrade total: premium cards, gradient, search/filter/pagination, sticky anchor, responsive.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BagianBeranda } from "./TataLetakBeranda.jsx";
import {
  ambilTurnamenPublik,
  ambilPengumumanPublik,
  jenisTurnamen,
} from "../../lib/api/index.js";
import { parseWaktuKomunitas } from "../../lib/waktu.js";
import LencanaStatus from "../../components/LencanaStatus.jsx";

// ---------- helpers ----------
function formatTanggal(nilai, opsi = {}) {
  if (!nilai) return "—";
  const d = parseWaktuKomunitas(nilai);
  if (!d) return nilai;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...opsi,
  });
}
function formatTanggalShort(nilai) {
  if (!nilai) return "—";
  const d = parseWaktuKomunitas(nilai);
  if (!d) return nilai;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ---------- icons (inline, no extra deps) ----------
const Ico = {
  Daftar: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" strokeLinecap="round" />
    </svg>
  ),
  Trophy: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v9a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  Live: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path d="M12 2a15 15 0 0 1 0 20" opacity="0.35" />
    </svg>
  ),
  Quad: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  History: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" />
      <path d="M9 2h6M3 7h2M19 7h2" strokeLinecap="round" />
    </svg>
  ),
  Info: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  ),
};

// ---------- static FAQ data (100% sama dengan ligacatur, bahasa diperhalus) ----------
const FAQ = [
  {
    id: "berapa-kali",
    tanya: "Berapa kali harus main?",
    jawab:
      "Tergantung jumlah peserta. Kami bisa menggunakan sistem Swiss atau Round Robin. Waktu main bebas selama periode turnamen — ini yang membedakan dengan turnamen online biasa, setting waktu juga fleksibel. Silakan gabung ke grup WA kami untuk koordinasi jadwal.",
  },
  {
    id: "syarat",
    tanya: "Apa syarat bermain?",
    jawab:
      "Anda bisa bermain catur dari awal sampai selesai, mendaftar menjadi anggota Komunitas Catur Indonesia, dan mendaftar turnamen jika masih terbuka. Anda wajib bergabung di grup WA kami. Syarat paling penting: tidak curang. Menggunakan engine adalah tindakan buruk dan kami melarang keras. Jika akun Chess.com/Lichess terkena pelanggaran, Anda akan dikeluarkan dan dilarang bergabung kembali.",
  },
  {
    id: "verifikasi",
    tanya: "Verifikasi pemain?",
    jawab:
      "Saat ini dengan bergabung di grup WA sudah cukup — Anda telah memberikan nomor telepon. Ke depan kami bisa meminta verifikasi via Zoom dan menunjukkan kartu identitas untuk menjaga integritas komunitas.",
  },
  {
    id: "cara-bermain",
    tanya: "Cara bermain?",
    jawab:
      "Ketika Anda mendapatkan lawan sesuai sistem, Anda diminta bermain melawan pemain tersebut kapan saja selama turnamen. Tekan link “Papan Komunikasi” di halaman lawan & skor. Pemain pegang Putih wajib membuat papan dan melangkah pertama. Ketika Hitam juga sudah melangkah pertama, papan resmi dan harus dihitung. Masih bisa dibatalkan jika salah setting atau lawan belum online. Setelah selesai, bantu Ambil Skor atau tunggu rekap periodik panitia.",
  },
  {
    id: "cara-skor",
    tanya: "Cara menghitung skor?",
    jawab:
      "Menang 1 poin, remis ½ poin, kalah 0. Jika papan tidak dimainkan, kedua pemain mendapat 0. Ke depan kami bereksperimen dengan variasi perhitungan: klub lawan klub, kelompok umur, dan lain-lain.",
  },
  {
    id: "kursi-empat",
    tanya: "Pertandingan Kursi Empat",
    jawab:
      "Kursi Empat (Quad) adalah pertandingan yang hanya melibatkan 4 pemain. Format: A vs B, C vs D, A vs C, B vs D, A vs D, dan B vs C. Warna diatur dan diacak. Pemain bermain 3 ronde pada hari/jam yang ditentukan dan menyelesaikannya. Untuk hadiah, tanyakan admin sebelum membuat kursi empat.",
  },
  {
    id: "streak",
    tanya: "Kemenangan Berturut",
    jawab:
      "Fitur Winning Streak (kemenangan beruntun) sedang dalam pengembangan. Akan ada lencana khusus dan papan peringkat streak bulanan.",
  },
  {
    id: "hadiah",
    tanya: "Hadiah Turnamen",
    jawab:
      "Pada akhir turnamen, pemain dengan skor tertinggi mendapat hadiah. Jika ada skor sama, hadiah dibagi rata. Hadiah ditransfer via online banking dengan biaya transfer ditanggung pemenang. Konversi kurs disesuaikan harga pasar.",
  },
  {
    id: "rating",
    tanya: "Rating dan peringkat",
    jawab:
      "Setiap permainan mempengaruhi rating/peringkat ELO internal kami. Rating awal 1000. Jika Anda punya rating FIDE/USCF yang sudah mapan, bisa dikonversi ke rating KCI. Rating Lichess/Chess.com tetap rated di platform masing-masing. Peringkat bukan nilai untuk hadiah, tapi untuk pembinaan.",
  },
  {
    id: "grup-wa",
    tanya: "Grup WA (WhatsApp) Liga Catur",
    jawab:
      "Untuk memudahkan komunikasi kami menggunakan WhatsApp. Silakan bergabung di grup WA resmi KCI. Koordinasi jadwal, pairing, dan pengumuman penting semua via WA.",
  },
  {
    id: "sponsor",
    tanya: "Sponsor",
    jawab:
      "Kami masih berkembang dan membutuhkan sponsor. Jika komunitas, lembaga, atau perusahaan Anda ingin mengadakan turnamen online, kami siap memfasilitasi. Sistem kami berpengalaman menjalankan turnamen dengan ratusan peserta.",
  },
  {
    id: "wasit",
    tanya: "Wasit Turnamen",
    jawab:
      "Walau tidak ada wasit resmi di setiap papan, kami memiliki beberapa pemain senior yang menjadi wasit untuk memutuskan jika ada perselisihan dan diselesaikan secara kekeluargaan.",
  },
];

export default function Beranda() {
  const [turnamen, setTurnamen] = useState(null);
  const [jenis, setJenis] = useState({});
  const [pengumuman, setPengumuman] = useState(null);
  const [gagal, setGagal] = useState(false);
  const [q, setQ] = useState("");
  const [kategori, setKategori] = useState("semua");
  const [hal, setHal] = useState(1);
  const perHal = 10;

  useEffect(() => {
    let hidup = true;
    Promise.all([
      ambilTurnamenPublik(),
      jenisTurnamen()
        .then((j) => j.jenis || {})
        .catch(() => ({})),
      ambilPengumumanPublik(),
    ])
      .then(([t, j, p]) => {
        if (!hidup) return;
        setTurnamen(t);
        setJenis(j);
        setPengumuman(p);
      })
      .catch(() => {
        if (hidup) setGagal(true);
      });
    return () => {
      hidup = false;
    };
  }, []);

  const turnamenAktif = useMemo(() => {
    if (!turnamen?.length) return null;
    return (
      turnamen.find((t) => t.status === "berlangsung") ||
      turnamen.find((t) => t.status === "pendaftaran") ||
      turnamen[0]
    );
  }, [turnamen]);

  const daftarKategori = useMemo(() => {
    const set = new Set();
    turnamen?.forEach((t) => {
      const label = jenis[t.jenis]?.label || t.jenis;
      if (label) set.add(label);
    });
    return ["semua", ...Array.from(set)];
  }, [turnamen, jenis]);

  const historyFiltered = useMemo(() => {
    if (!turnamen) return [];
    let list = [...turnamen];
    // sort terbaru dulu (mulai desc)
    list.sort((a, b) => {
      const da = parseWaktuKomunitas(a.mulai)?.getTime() || 0;
      const db = parseWaktuKomunitas(b.mulai)?.getTime() || 0;
      return db - da;
    });
    if (kategori !== "semua") {
      list = list.filter((t) => {
        const label = jenis[t.jenis]?.label || t.jenis;
        return label === kategori;
      });
    }
    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter((t) =>
        `${t.nama} ${t.jenis} ${jenis[t.jenis]?.label || ""}`.toLowerCase().includes(qq)
      );
    }
    return list;
  }, [turnamen, jenis, kategori, q]);

  const totalHal = Math.max(1, Math.ceil(historyFiltered.length / perHal));
  const historyPage = useMemo(() => {
    const start = (hal - 1) * perHal;
    return historyFiltered.slice(start, start + perHal);
  }, [historyFiltered, hal]);

  useEffect(() => {
    setHal(1);
  }, [q, kategori]);

  return (
    <BagianBeranda id="turnamen" title="Turnamen">
      {/* ---------- TOP QUICK ACTIONS — replika ligacatur sidebar tapi upgraded horizontal cards ---------- */}
      <div className="not-prose mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: "Mendaftar Anggota",
            desc: "Gabung KCI",
            href: "/pendaftaran-anggota",
            icon: Ico.Daftar,
            accent: "from-[#0B2F9F] to-[#4D7CF5]",
          },
          {
            label: "Liga Utama",
            desc: "Peringkat & skor",
            href: "/beranda/peringkat",
            icon: Ico.Trophy,
            accent: "from-amber-500 to-orange-600",
          },
          {
            label: "Turnamen Langsung",
            desc: "Live pairing",
            href: "/papan-interaktif",
            icon: Ico.Live,
            accent: "from-emerald-500 to-teal-600",
          },
          {
            label: "Kursi Empat",
            desc: "Quad match",
            href: "/turnamen/liga-musiman",
            icon: Ico.Quad,
            accent: "from-violet-500 to-purple-600",
          },
          {
            label: "Hasil Sebelumnya",
            desc: "#history",
            href: "#history",
            icon: Ico.History,
            accent: "from-slate-700 to-slate-900",
          },
        ].map((a) => (
          <Link
            key={a.label}
            to={a.href}
            className="group relative overflow-hidden rounded-[16px] border border-slate-200 bg-white p-[1px] transition-all hover:-translate-y-[2px] hover:shadow-xl"
          >
            <div className="relative flex h-full items-center gap-3 rounded-[15px] bg-white p-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${a.accent} text-white shadow-inner`}
              >
                <a.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold leading-4 text-slate-900 group-hover:text-[#0B2F9F]">
                  {a.label}
                </div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {a.desc}
                </div>
              </div>
              <div className="ml-auto text-slate-300 group-hover:text-[#0B2F9F]">↗</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ---------- ACTIVE TOURNAMENT — seperti “Turnamen Liga Catur Ketujuh” di ligacatur ---------- */}
      <div className="not-prose mb-10 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_8px_30px_-12px_rgba(11,47,159,0.25)]">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 md:p-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#0B2F9F] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /> Turnamen Aktif
              </span>
              {turnamenAktif && <LencanaStatus status={turnamenAktif.status} />}
              <span className="text-[11px] text-slate-500">
                Update: {formatTanggal(new Date().toISOString())}
              </span>
            </div>
            <h2 className="text-[26px] font-extrabold leading-[1.15] tracking-tight text-slate-900 md:text-[32px]">
              {turnamenAktif ? turnamenAktif.nama : "Turnamen Liga Catur KCI — Musim 2026"}
            </h2>
            <p className="mt-3 max-w-[60ch] text-[15px] leading-7 text-slate-600">
              {turnamenAktif?.deskripsi ||
                "Turnamen berlangsung fleksibel — permainan bisa dimainkan di Chess.com / Lichess kapan saja selama periode turnamen ketika Anda punya waktu luang. Unduh aplikasi Chess.com atau Lichess versi website/mobile dan segera bermain. Bergabung dengan WA Grup kami wajib — koordinasi tanpa grup sangat sulit."}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Periode</div>
                <div className="mt-1 text-[13px] font-semibold text-slate-900">
                  {turnamenAktif ? `${formatTanggalShort(turnamenAktif.mulai)} — ${formatTanggalShort(turnamenAktif.selesai)}` : "31 Agu — 14 Sep 2026"}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tempo</div>
                <div className="mt-1 text-[13px] font-semibold text-slate-900">
                  {turnamenAktif?.tempo || "15+10 • Bebas"}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sistem</div>
                <div className="mt-1 text-[13px] font-semibold text-slate-900">
                  {turnamenAktif?.sistem ? turnamenAktif.sistem.toUpperCase() : "SWISS / ROUND ROBIN"}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tempat</div>
                <div className="mt-1 text-[13px] font-semibold text-slate-900">
                  {turnamenAktif?.tempat || "Daring — Chess.com"}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                to="/pendaftaran-anggota"
                className="inline-flex items-center justify-center rounded-full bg-[#0B2F9F] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#092381]"
              >
                Daftar Turnamen
              </Link>
              <a
                href="https://www.chess.com/club/blunder-skuad"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Grup WA • Info
              </a>
              <Link
                to="/papan-interaktif"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Papan Live
              </Link>
            </div>
          </div>

          <div className="relative bg-[#0B2F9F] p-6 text-white md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(77,124,245,0.35),transparent_40%)]" />
            <div className="relative">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/70">Ringkasan Cepat</h3>
              <ul className="mt-4 space-y-3 text-[13px] leading-6">
                <li className="flex gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-white/70" />
                  <span>Main fleksibel selama turnamen, bebas atur waktu dengan lawan via “Papan Komunikasi”.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-white/70" />
                  <span>Putih buat papan, Hitam melangkah pertama = papan resmi. Bisa batal jika salah setting.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-white/70" />
                  <span>Skor: Menang 1, Remis ½, Kalah 0. Tidak main = 0 untuk keduanya.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-white/70" />
                  <span>Anti-cheat keras — akun terindikasi engine = dikeluarkan permanen.</span>
                </li>
              </ul>

              <div className="mt-8 rounded-xl bg-white/10 p-4 backdrop-blur">
                <div className="text-[11px] font-bold uppercase tracking-wider text-white/70">Butuh bantuan?</div>
                <div className="mt-1 text-sm font-semibold">Hubungi Admin • WA Grup KCI</div>
                <Link to="/beranda/hubungi-admin" className="mt-3 inline-flex text-xs font-semibold underline underline-offset-4">
                  Buka halaman Hubungi Admin →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- FAQ GRID — 12 bagian persis seperti ligacatur, upgraded jadi accordion cards ---------- */}
      <div className="not-prose mb-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-[22px] font-bold tracking-tight text-slate-900">Panduan Turnamen</h3>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            12 topik • referensi ligacatur.com
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {FAQ.map((f) => (
            <details
              key={f.id}
              className="group rounded-2xl border border-slate-200 bg-white p-5 open:border-[#0B2F9F]/30 open:shadow-[0_8px_24px_-12px_rgba(11,47,159,0.25)] transition-all"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white group-open:bg-[#0B2F9F]">
                    {FAQ.indexOf(f) + 1}
                  </div>
                  <div className="text-[14px] font-semibold leading-5 text-slate-900">{f.tanya}</div>
                </div>
                <span className="shrink-0 rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-500 group-open:rotate-180 transition-transform">
                  ⌄
                </span>
              </summary>
              <p className="mt-3 pl-10 text-[13.5px] leading-6 text-slate-600">{f.jawab}</p>
            </details>
          ))}
        </div>
      </div>

      {/* ---------- HISTORY TABLE — #history anchor, 100% kolom sama, tapi premium UI ---------- */}
      <div id="history" className="not-prose scroll-mt-[140px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[22px] font-bold tracking-tight text-slate-900">Hasil Tournamen</h3>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="hidden text-slate-500 md:inline">
              Menampilkan {historyFiltered.length} turnamen • Halaman {hal}/{totalHal}
            </span>
          </div>
        </div>

        {/* toolbar */}
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-[360px]">
            <Ico.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama turnamen, kategori..."
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-[13px] outline-none placeholder:text-slate-400 focus:border-[#0B2F9F] focus:ring-2 focus:ring-[#0B2F9F]/20"
            />
          </div>
          <div className="flex items-center gap-2 overflow-auto">
            <div className="flex items-center gap-1.5 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
              {daftarKategori.slice(0, 6).map((k) => (
                <button
                  key={k}
                  onClick={() => setKategori(k)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
                    kategori === k
                      ? "bg-[#0B2F9F] text-white shadow"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <div className="hidden h-6 w-px bg-slate-200 md:block" />
            <div className="text-[11px] font-medium text-slate-500">
              {gagal ? "Gagal memuat" : turnamen === null ? "Memuat…" : `${historyFiltered.length} hasil`}
            </div>
          </div>
        </div>

        {/* table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-widest text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 w-[64px] text-right">#</th>
                  <th className="border-b border-slate-200 px-4 py-3">Nama Turnamen</th>
                  <th className="border-b border-slate-200 px-4 py-3 w-[140px]">Kategori</th>
                  <th className="border-b border-slate-200 px-4 py-3 w-[150px]">Tanggal Mulai</th>
                  <th className="border-b border-slate-200 px-4 py-3 w-[150px]">Tanggal Berakhir</th>
                  <th className="border-b border-slate-200 px-4 py-3 w-[110px] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {gagal ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      Jadwal tidak dapat dimuat. Coba lagi nanti.
                    </td>
                  </tr>
                ) : turnamen === null ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      Memuat jadwal turnamen…
                    </td>
                  </tr>
                ) : historyPage.length ? (
                  historyPage.map((t, idx) => {
                    const globalIdx = (hal - 1) * perHal + idx + 1;
                    const label = jenis[t.jenis]?.label || t.jenis || "—";
                    const slug = jenis[t.jenis]?.slug || "";
                    const href = slug ? `/turnamen/${slug}` : "";
                    return (
                      <tr
                        key={t.id}
                        className="group border-b border-slate-100 last:border-0 hover:bg-[#F8FAFF]"
                      >
                        <td className="px-4 py-3 text-right font-mono text-[12px] text-slate-500">
                          {globalIdx}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white group-hover:bg-[#0B2F9F]">
                              {label.slice(0, 2).toUpperCase()}
                            </span>
                            {t.tautan ? (
                              <a
                                href={t.tautan}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-[#0B2F9F] hover:underline"
                                title={t.nama}
                              >
                                {t.nama} <span aria-hidden>↗</span>
                              </a>
                            ) : href ? (
                              <Link to={href} className="font-semibold text-slate-900 hover:text-[#0B2F9F] hover:underline">
                                {t.nama}
                              </Link>
                            ) : (
                              <span className="font-semibold text-slate-900">{t.nama}</span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <LencanaStatus status={t.status} />
                            <span className="text-[11px] text-slate-500">{t.tempo || "—"} • {t.tempat || "Daring"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            {label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{formatTanggalShort(t.mulai)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatTanggalShort(t.selesai || t.mulai)}</td>
                        <td className="px-4 py-3 text-center">
                          {href ? (
                            <Link
                              to={href}
                              className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#0B2F9F] hover:text-[#0B2F9F]"
                            >
                              Detail
                            </Link>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      Tidak ada turnamen untuk filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] text-slate-500">
              {historyFiltered.length > 0
                ? `Menampilkan ${(hal - 1) * perHal + 1}–${Math.min(hal * perHal, historyFiltered.length)} dari ${historyFiltered.length}`
                : "Tidak ada data"}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={hal <= 1}
                onClick={() => setHal((h) => Math.max(1, h - 1))}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold disabled:opacity-40"
              >
                ← Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalHal) }).map((_, i) => {
                  let pageNum;
                  if (totalHal <= 5) pageNum = i + 1;
                  else if (hal <= 3) pageNum = i + 1;
                  else if (hal >= totalHal - 2) pageNum = totalHal - 4 + i;
                  else pageNum = hal - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setHal(pageNum)}
                      className={`h-7 w-7 rounded-full text-[12px] font-bold ${
                        hal === pageNum ? "bg-[#0B2F9F] text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={hal >= totalHal}
                onClick={() => setHal((h) => Math.min(totalHal, h + 1))}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
          <Ico.Info className="h-4 w-4" />
          <span>
            Sumber: <code className="rounded bg-slate-100 px-1.5 py-0.5">/api/turnamen</code> • Kolom persis ligacatur.com (#, Nama, Kategori, Tanggal Mulai, Tanggal Berakhir) — di-upgrade dengan pencarian & filter.
          </span>
        </div>
      </div>

      {/* ---------- PENGUMUMAN — tetap ada, tapi dengan kartu modern ---------- */}
      <div className="not-prose mt-12">
        <h3 className="mb-4 text-[18px] font-bold text-slate-900">Pengumuman Resmi</h3>
        {gagal ? (
          <p className="text-sm text-slate-600">Pengumuman tidak dapat dimuat.</p>
        ) : pengumuman === null ? (
          <p className="text-sm text-slate-600">Memuat pengumuman…</p>
        ) : pengumuman.length ? (
          <div className="grid gap-3">
            {pengumuman.map((p) => (
              <article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">{p.judul}</h4>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    {p.tanggal}
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-6 text-slate-600">{p.isi}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">Belum ada pengumuman.</p>
        )}
      </div>

      {/* ---------- FOOTER NOTE ala ligacatur ---------- */}
      <div className="not-prose mt-10 rounded-2xl bg-[#0B2F9F] p-5 text-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-[13px] leading-6">
            <div className="font-bold">Komunitas Catur Indonesia • Terinspirasi ligacatur.com</div>
            <div className="text-white/80">
              Sistem kami berpengalaman menjalankan turnamen dengan ratusan peserta. Butuh sponsor / kolaborasi? Hubungi admin.
            </div>
          </div>
          <Link to="/beranda/hubungi-admin" className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0B2F9F] hover:bg-slate-100">
            Hubungi Admin
          </Link>
        </div>
      </div>
    </BagianBeranda>
  );
}
