import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { apiPengurus } from "../../lib/api/index.js";
import { Tombol, Bidang, Modal, KotakGalatMuat } from "./ui.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../components/ui/table.jsx";
const STATUS = {
  draf: { teks: "Draf", kelas: "bg-slate-100 text-slate-700" },
  publik: { teks: "Publik", kelas: "bg-emerald-50 text-emerald-700" }
};
function Lencana({ status }) {
  const s = STATUS[status] || STATUS.draf;
  return /* @__PURE__ */ jsx("span", { className: `rounded px-2 py-0.5 text-xs font-semibold ${s.kelas}`, children: s.teks });
}
function kompresGambar(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.match(/^image\/(jpeg|png|webp)$/)) {
      reject(new Error("Pilih berkas JPG, PNG, atau WebP."));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("Ukuran gambar asli maksimal 8 MB."));
      return;
    }
    const pembaca = new FileReader();
    pembaca.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
    pembaca.onload = () => {
      const gambar = new Image();
      gambar.onerror = () => reject(new Error("Format gambar tidak dapat diproses."));
      gambar.onload = () => {
        const batas = 1600;
        const skala = Math.min(1, batas / Math.max(gambar.width, gambar.height));
        const kanvas = document.createElement("canvas");
        kanvas.width = Math.max(1, Math.round(gambar.width * skala));
        kanvas.height = Math.max(1, Math.round(gambar.height * skala));
        kanvas.getContext("2d").drawImage(gambar, 0, 0, kanvas.width, kanvas.height);
        const hasil = kanvas.toDataURL("image/webp", 0.82);
        if (hasil.length > 19e5) {
          reject(new Error("Gambar masih terlalu besar. Pilih gambar lain yang lebih kecil."));
          return;
        }
        resolve(hasil);
      };
      gambar.src = pembaca.result;
    };
    pembaca.readAsDataURL(file);
  });
}
function FormulirKonten({ konfig, item, onSimpan, onBatal }) {
  const [data, setData] = useState({
    judul: item?.judul || "",
    tanggal: item?.tanggal || "",
    ringkasan: item?.ringkasan || "",
    isi: item?.isi || "",
    gambar: item?.gambar || "",
    altGambar: item?.altGambar || item?.judul || "",
    status: item?.status || "publik"
  });
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [memprosesGambar, setMemprosesGambar] = useState(false);
  const ubah = (k, v) => {
    setData((d) => ({ ...d, [k]: v }));
    setPesan("");
  };
  const pilihGambar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMemprosesGambar(true);
    setPesan("");
    try {
      const gambar = await kompresGambar(file);
      setData((d) => ({
        ...d,
        gambar,
        altGambar: d.altGambar || d.judul || file.name.replace(/\.[^.]+$/, "")
      }));
    } catch (err) {
      setPesan(err.message || "Gagal memproses gambar.");
    } finally {
      setMemprosesGambar(false);
      e.target.value = "";
    }
  };
  const kirim = async (e) => {
    e.preventDefault();
    setSibuk(true);
    setPesan("");
    try {
      await onSimpan(data);
    } catch (err) {
      setPesan(err.message || "Gagal menyimpan.");
    } finally {
      setSibuk(false);
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: kirim, className: "mb-6 space-y-3", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-900", children: item ? `Ubah ${konfig.label}` : `${konfig.label} Baru` }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
      /* @__PURE__ */ jsx(
        Bidang,
        {
          label: "Judul",
          value: data.judul,
          onChange: (e) => ubah("judul", e.target.value),
          placeholder: `contoh: ${konfig.contohJudul}`
        }
      ),
      /* @__PURE__ */ jsx(
        Bidang,
        {
          label: "Tanggal",
          type: "date",
          value: data.tanggal,
          onChange: (e) => ubah("tanggal", e.target.value)
        }
      )
    ] }),
    konfig.punyaRingkasan && /* @__PURE__ */ jsx(
      Bidang,
      {
        label: "Ringkasan",
        value: data.ringkasan,
        onChange: (e) => ubah("ringkasan", e.target.value),
        placeholder: "Cuplikan pendek yang tampil di bawah judul"
      }
    ),
    /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-700", children: [
      "Isi",
      /* @__PURE__ */ jsx(
        "textarea",
        {
          rows: 6,
          value: data.isi,
          onChange: (e) => ubah("isi", e.target.value),
          className: "rounded border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("fieldset", { className: "space-y-2 rounded border border-slate-200 p-3", children: [
      /* @__PURE__ */ jsxs("legend", { className: "px-1 text-xs font-semibold text-slate-700", children: [
        "Gambar ",
        /* @__PURE__ */ jsx("span", { className: "font-normal text-slate-500", children: "(opsional)" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs leading-5 text-slate-500", children: "Konten tanpa gambar tetap dapat diterbitkan. JPG, PNG, atau WebP sampai 8 MB; otomatis diperkecil. GIF animasi tidak didukung (animasinya hilang saat kompresi)." }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxs("label", { className: "cursor-pointer rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-blue-50", children: [
          memprosesGambar ? "Memproses\u2026" : data.gambar ? "Ganti gambar" : "Pilih gambar",
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "file",
              accept: "image/jpeg,image/png,image/webp",
              onChange: pilihGambar,
              disabled: memprosesGambar,
              className: "sr-only"
            }
          )
        ] }),
        data.gambar && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setData((d) => ({ ...d, gambar: "", altGambar: "" })),
            className: "text-xs font-semibold text-red-600 hover:underline",
            children: "Hapus gambar"
          }
        )
      ] }),
      data.gambar && /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-[180px_1fr]", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: data.gambar,
            alt: "Pratinjau gambar konten",
            className: "aspect-video w-full border border-slate-200 object-cover"
          }
        ),
        /* @__PURE__ */ jsx(
          Bidang,
          {
            label: "Teks alternatif gambar",
            value: data.altGambar,
            onChange: (e) => ubah("altGambar", e.target.value),
            placeholder: "Jelaskan isi gambar untuk pembaca layar"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1 text-xs font-medium text-slate-700", children: [
      "Status",
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: data.status,
          onChange: (e) => ubah("status", e.target.value),
          className: "rounded border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary",
          children: [
            /* @__PURE__ */ jsx("option", { value: "publik", children: "Publik \u2014 langsung tampil di situs" }),
            /* @__PURE__ */ jsx("option", { value: "draf", children: "Draf \u2014 hanya terlihat di dashboard" })
          ]
        }
      )
    ] }),
    pesan && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-600", children: pesan }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: sibuk || memprosesGambar || !data.judul.trim(),
          className: "rounded-full bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-40",
          children: sibuk ? "Menyimpan\u2026" : "Simpan"
        }
      ),
      /* @__PURE__ */ jsx(Tombol, { anak: "Batal", onClick: onBatal })
    ] })
  ] });
}
function MenuAksi({ onUbah, onHapus }) {
  const [terbuka, setTerbuka] = useState(false);
  const [posisi, setPosisi] = useState(null);
  const tombolRef = useRef(null);
  const menuRef = useRef(null);
  useLayoutEffect(() => {
    if (!terbuka) return;
    const el = tombolRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPosisi({
      top: r.bottom + 4,
      right: window.innerWidth - r.right
    });
  }, [terbuka]);
  useEffect(() => {
    if (!terbuka) return;
    function cekKlik(e) {
      if (tombolRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setTerbuka(false);
    }
    function cekEsc(e) {
      if (e.key === "Escape") setTerbuka(false);
    }
    document.addEventListener("mousedown", cekKlik);
    document.addEventListener("keydown", cekEsc);
    return () => {
      document.removeEventListener("mousedown", cekKlik);
      document.removeEventListener("keydown", cekEsc);
    };
  }, [terbuka]);
  return /* @__PURE__ */ jsxs("div", { ref: tombolRef, className: "inline-flex", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setTerbuka((t) => !t),
        "aria-haspopup": "menu",
        "aria-expanded": terbuka,
        "aria-label": "Menu aksi",
        className: "inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900",
        children: [
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Buka menu aksi" }),
          /* @__PURE__ */ jsx(MoreHorizontal, { className: "size-4" })
        ]
      }
    ),
    terbuka && posisi && createPortal(
      /* @__PURE__ */ jsxs(
        "div",
        {
          ref: menuRef,
          role: "menu",
          "aria-label": "Menu aksi",
          style: { top: posisi.top, right: posisi.right },
          className: "fixed z-50 min-w-[8rem] rounded-md border border-slate-200 bg-white p-1 shadow-lg",
          children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                role: "menuitem",
                onClick: () => {
                  setTerbuka(false);
                  onUbah();
                },
                className: "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50",
                children: [
                  /* @__PURE__ */ jsx(Pencil, { className: "size-4" }),
                  "Ubah"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                role: "menuitem",
                onClick: () => {
                  setTerbuka(false);
                  onHapus();
                },
                className: "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-600 hover:bg-red-50",
                children: [
                  /* @__PURE__ */ jsx(Trash2, { className: "size-4" }),
                  "Hapus"
                ]
              }
            )
          ]
        }
      ),
      document.body
    )
  ] });
}
function MenuStatus({ nilai, onPilih, labelBaru, onBuatBaru }) {
  const [terbuka, setTerbuka] = useState(false);
  const [posisi, setPosisi] = useState(null);
  const tombolRef = useRef(null);
  const menuRef = useRef(null);
  useLayoutEffect(() => {
    if (!terbuka) return;
    const el = tombolRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPosisi({
      top: r.bottom + 4,
      left: r.left
    });
  }, [terbuka]);
  useEffect(() => {
    if (!terbuka) return;
    function cekKlik(e) {
      if (tombolRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setTerbuka(false);
    }
    function cekEsc(e) {
      if (e.key === "Escape") setTerbuka(false);
    }
    document.addEventListener("mousedown", cekKlik);
    document.addEventListener("keydown", cekEsc);
    return () => {
      document.removeEventListener("mousedown", cekKlik);
      document.removeEventListener("keydown", cekEsc);
    };
  }, [terbuka]);
  const pilihan = [
    { nilai: "", label: "Semua" },
    { nilai: "draf", label: "Draf" },
    { nilai: "publik", label: "Publik" }
  ];
  const labelAktif = pilihan.find((p) => p.nilai === nilai)?.label || "Semua";
  return /* @__PURE__ */ jsxs("div", { ref: tombolRef, className: "inline-flex", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setTerbuka((t) => !t),
        "aria-haspopup": "menu",
        "aria-expanded": terbuka,
        className: "inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50",
        children: [
          /* @__PURE__ */ jsxs("span", { className: "sr-only", children: [
            "Status: ",
            labelAktif
          ] }),
          labelAktif,
          /* @__PURE__ */ jsx(ChevronDown, { className: "size-4" })
        ]
      }
    ),
    terbuka && posisi && createPortal(
      /* @__PURE__ */ jsxs(
        "div",
        {
          ref: menuRef,
          role: "menu",
          "aria-label": "Status dan tindakan",
          style: { top: posisi.top, left: posisi.left },
          className: "fixed z-50 min-w-[9rem] rounded-md border border-slate-200 bg-white p-1 shadow-lg",
          children: [
            pilihan.map((p) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                role: "menuitemradio",
                "aria-checked": p.nilai === nilai,
                onClick: () => {
                  setTerbuka(false);
                  onPilih(p.nilai);
                },
                className: `flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm ${p.nilai === nilai ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700 hover:bg-slate-50"}`,
                children: p.label
              },
              p.label
            )),
            /* @__PURE__ */ jsx("div", { className: "my-1 h-px bg-slate-100" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                role: "menuitem",
                onClick: () => {
                  setTerbuka(false);
                  onBuatBaru();
                },
                className: "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm font-semibold text-primary hover:bg-blue-50",
                children: [
                  "+ ",
                  labelBaru,
                  " baru"
                ]
              }
            )
          ]
        }
      ),
      document.body
    )
  ] });
}
function PanelKonten({ konfig, beriTahu, muatUlang }) {
  const [daftar, setDaftar] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState(false);
  const [formulir, setFormulir] = useState(null);
  const [saring, setSaring] = useState("");
  const [cari, setCari] = useState("");
  const [targetHapus, setTargetHapus] = useState(null);
  const muat = useCallback(async () => {
    setMemuat(true);
    setGalat(false);
    try {
      setDaftar(await apiPengurus(`/${konfig.jalur}`));
    } catch (e) {
      beriTahu(e.message, "galat");
      setGalat(true);
    } finally {
      setMemuat(false);
    }
  }, [konfig.jalur, beriTahu]);
  useEffect(() => {
    muat();
  }, [muat]);
  const simpan = async (data) => {
    const jalur = formulir?.item ? `/${konfig.jalur}/${formulir.item.id}/ubah` : `/${konfig.jalur}`;
    const hasil = await apiPengurus(jalur, { metode: "POST", bodi: data });
    beriTahu(
      formulir?.item ? `${konfig.label} "${hasil.judul}" diperbarui.` : `${konfig.label} "${hasil.judul}" dibuat.`,
      "sukses"
    );
    setFormulir(null);
    await muat();
    muatUlang?.();
  };
  const hapus = (x) => setTargetHapus(x);
  const konfirmasiHapus = async () => {
    const x = targetHapus;
    setTargetHapus(null);
    if (!x) return;
    try {
      await apiPengurus(`/${konfig.jalur}/${x.id}/hapus`, { metode: "POST" });
      beriTahu(`${konfig.label} dihapus.`, "sukses");
      if (formulir?.item?.id === x.id) setFormulir(null);
      await muat();
      muatUlang?.();
    } catch (e) {
      beriTahu(e.message, "galat");
    }
  };
  const tampil = daftar.filter((x) => {
    const cocokStatus = !saring || x.status === saring;
    const q = cari.trim().toLowerCase();
    const cocokCari = !q || (x.judul || "").toLowerCase().includes(q) || (x.ringkasan || "").toLowerCase().includes(q) || (x.tanggal || "").includes(q);
    return cocokStatus && cocokCari;
  });
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4 flex flex-wrap items-center gap-3", children: [
      /* @__PURE__ */ jsx(
        MenuStatus,
        {
          nilai: saring,
          onPilih: setSaring,
          labelBaru: konfig.label,
          onBuatBaru: () => setFormulir((f) => f ? null : { item: null })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx("span", { className: "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400", children: /* @__PURE__ */ jsx(
          "svg",
          {
            className: "size-4",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            viewBox: "0 0 24 24",
            "aria-hidden": "true",
            children: /* @__PURE__ */ jsx(
              "path",
              {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              }
            )
          }
        ) }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "search",
            value: cari,
            onChange: (e) => setCari(e.target.value),
            placeholder: `Cari judul ${konfig.label.toLowerCase()}\u2026`,
            "aria-label": `Cari ${konfig.label.toLowerCase()}`,
            className: "h-9 w-56 rounded-md border border-slate-200 bg-white pl-8 pr-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-primary"
          }
        )
      ] })
    ] }),
    formulir && /* @__PURE__ */ jsx(
      FormulirKonten,
      {
        konfig,
        item: formulir.item,
        onSimpan: simpan,
        onBatal: () => setFormulir(null)
      }
    ),
    memuat ? /* @__PURE__ */ jsx("p", { className: "py-8 text-center text-sm text-slate-500", children: "Memuat\u2026" }) : galat ? /* @__PURE__ */ jsx(
      KotakGalatMuat,
      {
        pesan: `${konfig.label} gagal dimuat. Periksa koneksi lalu coba lagi.`,
        onCobaLagi: muat
      }
    ) : /* @__PURE__ */ jsx("div", { className: "overflow-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Gambar" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Judul" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Tanggal" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
        /* @__PURE__ */ jsx(TableHead, { className: "w-24", children: "Aksi" })
      ] }) }),
      /* @__PURE__ */ jsxs(TableBody, { children: [
        tampil.map((x) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { children: x.gambar ? /* @__PURE__ */ jsx(
            "img",
            {
              src: x.gambar,
              alt: "",
              width: 64,
              height: 40,
              className: "h-10 w-16 rounded border border-slate-200 object-cover"
            }
          ) : /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: "Tanpa gambar" }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setFormulir({ item: x }),
              className: "text-left font-medium text-primary hover:underline",
              children: x.judul
            }
          ) }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-slate-600", children: x.tanggal || "\u2014" }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Lencana, { status: x.status }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "w-24", children: /* @__PURE__ */ jsx(
            MenuAksi,
            {
              onUbah: () => setFormulir({ item: x }),
              onHapus: () => hapus(x)
            }
          ) })
        ] }, x.id)),
        !tampil.length && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsxs(TableCell, { colSpan: 5, className: "py-8 text-center text-slate-500", children: [
          "Belum ada ",
          konfig.label.toLowerCase(),
          ". Tekan \u201C+",
          konfig.label,
          " baru\u201D untuk membuat."
        ] }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(
      Modal,
      {
        terbuka: Boolean(targetHapus),
        judul: `Hapus ${konfig.label.toLowerCase()}?`,
        labelKonfirmasi: "Hapus",
        jenisKonfirmasi: "bahaya",
        onBatal: () => setTargetHapus(null),
        onKonfirmasi: konfirmasiHapus,
        children: [
          '"',
          targetHapus?.judul,
          '" akan dihapus permanen.'
        ]
      }
    )
  ] });
}
function PanelBerita(props) {
  return /* @__PURE__ */ jsx(
    PanelKonten,
    {
      ...props,
      konfig: {
        jalur: "berita",
        label: "Berita",
        punyaRingkasan: true,
        contohJudul: "Coaching clinic struktur pion bersama pelatih tamu"
      }
    }
  );
}
function PanelPengumuman(props) {
  return /* @__PURE__ */ jsx(
    PanelKonten,
    {
      ...props,
      konfig: {
        jalur: "pengumuman",
        label: "Pengumuman",
        punyaRingkasan: false,
        contohJudul: "Pendaftaran Turnamen Bulanan September dibuka"
      }
    }
  );
}
export {
  PanelBerita,
  PanelPengumuman
};
