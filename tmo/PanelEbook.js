import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { apiPengurus } from "../../lib/api/index.js";
import { Tombol, Modal, KotakGalatMuat } from "./ui.jsx";
import {
  Alert,
  Alertjudul,
  AlertKeterangan
} from "../../components/ui/alert.jsx";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "../../components/ui/alert-dialog.jsx";
function formatWaktu(iso) {
  if (!iso) return "\u2014";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
function sisaMenit(isoKedaluwarsa, kini) {
  return Math.max(0, Math.ceil((new Date(isoKedaluwarsa).getTime() - kini) / 6e4));
}
function PanelEbook({ beriTahu }) {
  const [kode, setKode] = useState([]);
  const [unduhan, setUnduhan] = useState([]);
  const [minta, setMinta] = useState([]);
  const [cariMinta, setCariMinta] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState(false);
  const [panggilan, setPanggilan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [salahPanggilan, setSalahPanggilan] = useState(false);
  const [kodeBaru, setKodeBaru] = useState(null);
  const [targetHapus, setTargetHapus] = useState(null);
  const [kini, setKini] = useState(() => Date.now());
  const [dialogTerbit, setDialogTerbit] = useState(false);
  const [hasilTerbit, setHasilTerbit] = useState(null);
  const muat = useCallback(async () => {
    setMemuat(true);
    setGalat(false);
    try {
      const [daftarKode, jejak, pengajuan] = await Promise.all([
        apiPengurus("/ebook/kode"),
        apiPengurus("/ebook/unduhan"),
        apiPengurus("/ebook/minta")
      ]);
      setKode(Array.isArray(daftarKode) ? daftarKode : []);
      setUnduhan(Array.isArray(jejak) ? jejak : []);
      setMinta(Array.isArray(pengajuan) ? pengajuan : []);
    } catch (e) {
      beriTahu(e.message, "galat");
      setGalat(true);
    } finally {
      setMemuat(false);
    }
  }, [beriTahu]);
  useEffect(() => {
    muat();
  }, [muat]);
  useEffect(() => {
    const jam = setInterval(() => setKini(Date.now()), 3e4);
    return () => clearInterval(jam);
  }, []);
  async function terbit() {
    const siapa = panggilan.trim();
    if (!siapa) {
      setSalahPanggilan(true);
      setHasilTerbit({ status: "gagal", pesan: "Nama panggilan harus diisi dulu." });
      return;
    }
    setSalahPanggilan(false);
    setHasilTerbit(null);
    setSibuk(true);
    try {
      const hasil = await apiPengurus("/ebook/kode", {
        metode: "POST",
        bodi: { panggilan: siapa, catatan: catatan.trim() }
      });
      setKodeBaru(hasil);
      setPanggilan("");
      setCatatan("");
      setHasilTerbit({
        status: "sukses",
        kode: hasil.kode,
        panggilan: hasil.panggilan
      });
      beriTahu(`Kode ${hasil.kode} untuk ${hasil.panggilan} terbit (berlaku 1 jam).`);
      await muat();
    } catch (e2) {
      setHasilTerbit({ status: "gagal", pesan: e2.message });
      beriTahu(e2.message, "galat");
    } finally {
      setSibuk(false);
    }
  }
  function kirim(e) {
    e.preventDefault();
    setDialogTerbit(true);
  }
  async function hapus() {
    if (!targetHapus) return;
    setSibuk(true);
    try {
      await apiPengurus("/ebook/kode/hapus", {
        metode: "POST",
        bodi: { kode: targetHapus.kode }
      });
      beriTahu(`Kode ${targetHapus.kode} dihapus.`);
      setTargetHapus(null);
      await muat();
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setSibuk(false);
    }
  }
  async function setujui(m) {
    setSibuk(true);
    try {
      const kodeHasil = await apiPengurus(`/ebook/minta/${m.id}/terbitkan`, {
        metode: "POST"
      });
      setKodeBaru(kodeHasil);
      beriTahu(`Kode ${kodeHasil.kode} terbit untuk ${kodeHasil.panggilan} \u2014 sampaikan lewat WA/grup.`);
      await muat();
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setSibuk(false);
    }
  }
  async function tolak(m) {
    setSibuk(true);
    try {
      await apiPengurus(`/ebook/minta/${m.id}/tolak`, { metode: "POST" });
      beriTahu(`Permintaan ${m.nama} ditolak.`);
      await muat();
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setSibuk(false);
    }
  }
  function salin(kodeTeks) {
    const papan = navigator.clipboard;
    if (papan?.writeText) {
      papan.writeText(kodeTeks).then(
        () => beriTahu(`Kode ${kodeTeks} disalin.`),
        () => salinManual(kodeTeks)
      );
    } else {
      salinManual(kodeTeks);
    }
  }
  function salinManual(kodeTeks) {
    try {
      const ta = document.createElement("textarea");
      ta.value = kodeTeks;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) {
        beriTahu(`Kode ${kodeTeks} disalin.`);
      } else {
        beriTahu("Gagal menyalin \u2014 salin manual dari tabel.", "galat");
      }
    } catch {
      beriTahu("Gagal menyalin \u2014 salin manual dari tabel.", "galat");
    }
  }
  function tautanAkun(akun) {
    const id = (akun || "").trim();
    if (!id) return /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "\u2014" });
    return /* @__PURE__ */ jsxs(
      "a",
      {
        href: `https://www.chess.com/member/${encodeURIComponent(id)}`,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "text-primary hover:underline",
        children: [
          "@",
          id
        ]
      }
    );
  }
  const aktif = kode.filter((k) => !k.kadaluarsa);
  const mintaTersaring = minta.filter((m) => {
    const kunci = cariMinta.trim().toLowerCase();
    if (!kunci) return true;
    return m.nama?.toLowerCase().includes(kunci) || m.akunChess?.toLowerCase().includes(kunci);
  });
  const headerKolom = (teks) => /* @__PURE__ */ jsx("th", { scope: "col", children: teks });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "border-b border-slate-200 pb-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-slate-900", children: "Kode E-Book" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-0.5 text-sm text-slate-500", children: [
        "Gerbang unduh e-book model perpustakaan: ",
        minta.filter((m) => m.status === "menunggu").length,
        " ",
        "permintaan menunggu, ",
        aktif.length,
        " kode aktif, ",
        unduhan.length,
        " ",
        "unduhan tercatat"
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      "form",
      {
        onSubmit: kirim,
        noValidate: true,
        className: "flex flex-wrap items-end gap-3 rounded border border-slate-200 bg-white p-4",
        children: [
          /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-700", children: [
            "Panggilan peminjam",
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "panggilan",
                value: panggilan,
                onChange: (e) => {
                  setPanggilan(e.target.value);
                  setSalahPanggilan(false);
                },
                placeholder: "cth. Budi",
                maxLength: 30,
                autoComplete: "off",
                className: `w-52 rounded border px-2.5 py-1.5 text-sm outline-none ${salahPanggilan ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-primary"}`
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-700", children: [
            "Catatan (opsional)",
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "catatan",
                value: catatan,
                onChange: (e) => setCatatan(e.target.value),
                placeholder: "cth. anggota baru, latihan rutin",
                maxLength: 120,
                autoComplete: "off",
                className: "w-72 rounded border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            AlertDialog,
            {
              open: dialogTerbit,
              onOpenChange: (terbuka) => {
                setDialogTerbit(terbuka);
                if (!terbuka) setHasilTerbit(null);
              },
              children: [
                /* @__PURE__ */ jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "rounded-md bg-[#0B2F9F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0a2a8e] disabled:opacity-40",
                    children: "Buka"
                  }
                ) }),
                /* @__PURE__ */ jsx(AlertDialogContent, { children: hasilTerbit ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(AlertDialogHeader, { children: /* @__PURE__ */ jsx(AlertDialogTitle, { children: hasilTerbit.status === "sukses" ? "Kode berhasil diterbitkan" : "Gagal menerbitkan kode" }) }),
                  hasilTerbit.status === "sukses" ? /* @__PURE__ */ jsxs(Alert, { variasi: "sukses", children: [
                    /* @__PURE__ */ jsx(CheckCircle2Icon, {}),
                    /* @__PURE__ */ jsxs(Alertjudul, { children: [
                      "Kode ",
                      hasilTerbit.kode,
                      " untuk ",
                      hasilTerbit.panggilan
                    ] }),
                    /* @__PURE__ */ jsx(AlertKeterangan, { children: "Kode aktif 1 jam dan sudah terkirim lewat WA/grup. Sampaikan ke peminjam: isi nama asli, akun Chess.com, dan kode ini pada popup unduh." })
                  ] }) : /* @__PURE__ */ jsxs(Alert, { variasi: "gagal", children: [
                    /* @__PURE__ */ jsx(AlertCircleIcon, {}),
                    /* @__PURE__ */ jsx(Alertjudul, { children: hasilTerbit.pesan }),
                    /* @__PURE__ */ jsx(AlertKeterangan, { children: "Periksa isi nama peminjam atau bagian yang ditolak, lalu coba terbitkan lagi." })
                  ] }),
                  /* @__PURE__ */ jsx(AlertDialogFooter, { children: /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Tutup" }) })
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
                    /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Yakin menerbitkan kode?" }),
                    /* @__PURE__ */ jsxs(AlertDialogDescription, { children: [
                      "Kode akan dibuat untuk ",
                      panggilan.trim() || "peminjam",
                      " ",
                      "dan dikirim lewat WA/grup. Batas akses 1 jam dihitung setelah menekan tombol Lanjut. Setelah terbit, kode langsung aktif sampai masa berlakunya habis."
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
                    /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Batal" }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        disabled: sibuk,
                        onClick: terbit,
                        className: "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#0B2F9F] px-4 text-sm font-semibold text-white hover:bg-[#0a2a8e] disabled:opacity-40",
                        children: sibuk ? "Memproses\u2026" : "Lanjut"
                      }
                    )
                  ] })
                ] }) })
              ]
            }
          )
        ]
      }
    ),
    galat && !memuat && /* @__PURE__ */ jsx(
      KotakGalatMuat,
      {
        pesan: "Data e-book gagal dimuat. Periksa koneksi lalu coba lagi.",
        onCobaLagi: muat
      }
    ),
    kodeBaru && /* @__PURE__ */ jsxs(
      "div",
      {
        role: "status",
        "aria-live": "polite",
        className: "flex flex-wrap items-center gap-3 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-emerald-800", children: [
              "Kode untuk ",
              /* @__PURE__ */ jsx("span", { className: "font-semibold", children: kodeBaru.panggilan }),
              ":",
              /* @__PURE__ */ jsx("span", { className: "ml-2 rounded bg-white px-2 py-0.5 font-mono font-bold tracking-wide text-emerald-900 ring-1 ring-emerald-300", children: kodeBaru.kode })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "mt-0.5 text-xs text-emerald-700", children: [
              "Berlaku sampai ",
              formatWaktu(kodeBaru.kedaluwarsa),
              " WIB. Sampaikan ke peminjam, lalu dia mengisi nama asli + akun Chess.com + kode ini pada popup unduh."
            ] })
          ] }),
          /* @__PURE__ */ jsx(Tombol, { kecil: true, onClick: () => salin(kodeBaru.kode), disabled: sibuk, children: "Salin kode" }),
          /* @__PURE__ */ jsx(
            Tombol,
            {
              kecil: true,
              onClick: () => setKodeBaru(null),
              "aria-label": "Tutup notifikasi kode terbit",
              children: "Tutup"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "section",
      {
        "aria-labelledby": "permintaan-kode-judul",
        className: "rounded border border-slate-200 bg-white",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { id: "permintaan-kode-judul", className: "text-sm font-semibold text-slate-900", children: "Permintaan kode" }),
              /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-slate-500", children: "Orang yang mengajukan lewat popup unduh. Cari namanya, lalu terbitkan kodenya dan kirimkan lewat WA/grup." })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "search",
                value: cariMinta,
                onChange: (e) => setCariMinta(e.target.value),
                placeholder: "Cari nama / akun\u2026",
                "aria-label": "Cari permintaan",
                className: "w-56 rounded border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
              }
            )
          ] }),
          memuat ? /* @__PURE__ */ jsx("p", { className: "px-4 py-8 text-center text-sm text-slate-500", children: "Memuat\u2026" }) : mintaTersaring.length === 0 ? /* @__PURE__ */ jsx("p", { className: "px-4 py-8 text-center text-sm text-slate-500", children: cariMinta.trim() ? "Tidak ada permintaan yang cocok dengan pencarian." : "Belum ada permintaan kode." }) : /* @__PURE__ */ jsx("div", { className: "overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "tabel-kci", "aria-describedby": "permintaan-kode-judul", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              headerKolom("Waktu"),
              headerKolom("Nama asli"),
              headerKolom("Akun Chess.com"),
              headerKolom("Ingin mengunduh"),
              headerKolom("Status"),
              headerKolom("Aksi")
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: mintaTersaring.map((m, i) => /* @__PURE__ */ jsxs("tr", { className: i % 2 === 1 ? "bg-slate-50" : "", children: [
              /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap text-xs", children: formatWaktu(m.waktu) }),
              /* @__PURE__ */ jsx("td", { className: "font-medium text-slate-900", children: m.nama }),
              /* @__PURE__ */ jsx("td", { children: tautanAkun(m.akunChess) }),
              /* @__PURE__ */ jsx("td", { className: "max-w-[200px] truncate text-xs text-slate-500", title: m.judul || "", children: m.judul || "\u2014" }),
              /* @__PURE__ */ jsx("td", { children: m.status === "menunggu" ? /* @__PURE__ */ jsx("span", { className: "inline-flex rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700", children: "Menunggu" }) : m.status === "diterbitkan" ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700", children: [
                "Diterbitkan",
                /* @__PURE__ */ jsx("span", { className: "font-mono font-bold", children: m.kode })
              ] }) : /* @__PURE__ */ jsx("span", { className: "inline-flex rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600", children: "Ditolak" }) }),
              /* @__PURE__ */ jsx("td", { children: m.status === "menunggu" ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    disabled: sibuk,
                    onClick: () => setujui(m),
                    className: "text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-40",
                    children: "Terbitkan kode"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    disabled: sibuk,
                    onClick: () => tolak(m),
                    className: "text-xs font-medium text-red-600 hover:underline disabled:opacity-40",
                    children: "Tolak"
                  }
                )
              ] }) : /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: formatWaktu(m.diputus) }) })
            ] }, m.id || i)) })
          ] }) })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "section",
      {
        "aria-labelledby": "daftar-kode-judul",
        className: "rounded border border-slate-200 bg-white",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-200 px-4 py-3", children: [
            /* @__PURE__ */ jsx("h3", { id: "daftar-kode-judul", className: "text-sm font-semibold text-slate-900", children: "Daftar kode akses" }),
            /* @__PURE__ */ jsx(Tombol, { kecil: true, onClick: muat, disabled: memuat || sibuk, children: "Segarkan" })
          ] }),
          memuat ? /* @__PURE__ */ jsx("p", { className: "px-4 py-8 text-center text-sm text-slate-500", children: "Memuat\u2026" }) : kode.length === 0 ? /* @__PURE__ */ jsx("p", { className: "px-4 py-8 text-center text-sm text-slate-500", children: "Belum ada kode. Terbitkan kode pertama lewat formulir di atas." }) : /* @__PURE__ */ jsx("div", { className: "overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "tabel-kci", "aria-describedby": "daftar-kode-judul", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              headerKolom("Panggilan"),
              headerKolom("Kode"),
              headerKolom("Status"),
              headerKolom("Diterbitkan"),
              headerKolom("Kedaluwarsa"),
              headerKolom("Unduhan"),
              headerKolom("Catatan"),
              headerKolom("Aksi")
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: kode.map((k, i) => /* @__PURE__ */ jsxs("tr", { className: i % 2 === 1 ? "bg-slate-50" : "", children: [
              /* @__PURE__ */ jsx("td", { className: "font-medium text-slate-900", children: k.panggilan }),
              /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-slate-800", children: k.kode }) }),
              /* @__PURE__ */ jsx("td", { children: k.kadaluarsa ? /* @__PURE__ */ jsx("span", { className: "inline-flex rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600", children: "Kedaluwarsa" }) : /* @__PURE__ */ jsxs(
                "span",
                {
                  className: "inline-flex rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700",
                  title: `Sisa ${sisaMenit(k.kedaluwarsa, kini)} menit lagi`,
                  children: [
                    "Aktif \xB7 ",
                    sisaMenit(k.kedaluwarsa, kini),
                    " mnt"
                  ]
                }
              ) }),
              /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap text-xs", children: formatWaktu(k.dibuat) }),
              /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap text-xs", children: formatWaktu(k.kedaluwarsa) }),
              /* @__PURE__ */ jsxs("td", { className: "text-center text-xs", children: [
                k.jumlahUnduhan || 0,
                "\xD7"
              ] }),
              /* @__PURE__ */ jsx("td", { className: "max-w-[180px] truncate text-xs text-slate-500", title: k.catatan || "", children: k.catatan || "\u2014" }),
              /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => salin(k.kode),
                    disabled: sibuk,
                    className: "text-xs font-medium text-primary hover:underline disabled:opacity-40",
                    children: "Salin"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setTargetHapus(k),
                    disabled: sibuk,
                    className: "text-xs font-medium text-red-600 hover:underline disabled:opacity-40",
                    children: "Hapus"
                  }
                )
              ] }) })
            ] }, k.kode)) })
          ] }) })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "section",
      {
        "aria-labelledby": "jejak-unduhan-judul",
        className: "rounded border border-slate-200 bg-white",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "border-b border-slate-200 px-4 py-3", children: [
            /* @__PURE__ */ jsx("h3", { id: "jejak-unduhan-judul", className: "text-sm font-semibold text-slate-900", children: "Jejak unduhan" }),
            /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-slate-500", children: "Siapa yang mengunduh, memakai kode siapa, dan buku apa \u2014 terbaru di atas (maksimal 1000 catatan terakhir)." })
          ] }),
          memuat ? /* @__PURE__ */ jsx("p", { className: "px-4 py-8 text-center text-sm text-slate-500", children: "Memuat\u2026" }) : unduhan.length === 0 ? /* @__PURE__ */ jsx("p", { className: "px-4 py-8 text-center text-sm text-slate-500", children: "Belum ada unduhan yang tercatat." }) : /* @__PURE__ */ jsx("div", { className: "overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "tabel-kci", "aria-describedby": "jejak-unduhan-judul", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              headerKolom("Waktu"),
              headerKolom("Nama asli"),
              headerKolom("Akun Chess.com"),
              headerKolom("Kode"),
              headerKolom("Buku")
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: unduhan.map((u, i) => /* @__PURE__ */ jsxs("tr", { className: i % 2 === 1 ? "bg-slate-50" : "", children: [
              /* @__PURE__ */ jsx("td", { className: "whitespace-nowrap text-xs", children: formatWaktu(u.waktu) }),
              /* @__PURE__ */ jsx("td", { className: "font-medium text-slate-900", children: u.nama }),
              /* @__PURE__ */ jsx("td", { children: tautanAkun(u.akunChess) }),
              /* @__PURE__ */ jsxs("td", { className: "whitespace-nowrap text-xs", children: [
                /* @__PURE__ */ jsx("span", { className: "font-mono", children: u.kode }),
                /* @__PURE__ */ jsxs("span", { className: "ml-1 text-slate-500", children: [
                  "(",
                  u.panggilan,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "td",
                {
                  className: "max-w-[280px] truncate text-xs",
                  title: u.judul || "",
                  children: u.judul || "\u2014"
                }
              )
            ] }, u.id || i)) })
          ] }) })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      Modal,
      {
        terbuka: !!targetHapus,
        judul: "Hapus kode akses?",
        anak: targetHapus && /* @__PURE__ */ jsxs("p", { children: [
          "Kode ",
          /* @__PURE__ */ jsx("span", { className: "font-mono font-bold", children: targetHapus.kode }),
          " atas nama ",
          /* @__PURE__ */ jsx("strong", { children: targetHapus.panggilan }),
          " tidak bisa dipakai lagi setelah dihapus. Jejak unduhan yang sudah tercatat tetap tersimpan."
        ] }),
        labelKonfirmasi: "Hapus",
        jenisKonfirmasi: "bahaya",
        sibuk,
        onKonfirmasi: hapus,
        onBatal: () => setTargetHapus(null)
      }
    )
  ] });
}
export {
  PanelEbook as default
};
