/*
 * Kartu akun (kolom kiri layar akun) — meniru AccountCard.tsx pada
 * En Croissant: kartu ber-border dengan header (logo situs + nama + aksi
 * muat ulang/hapus), baris statistik Bullet/Blitz/Rapid, lalu bar "Games
 * terunduh / total" + progress + "Pembaruan terakhir". Kartu dapat di-klik
 * untuk memilih akun yang statistiknya ditampilkan di kanan.
 */
import { useEffect, useState } from "react";
import { useI18n } from "../../../lib/i18n.jsx";
import { useKartuPemain } from "../../../lib/pemainCatur.js";
import { ambilDaftarPartai } from "../basisData.js";
import Profile from "../komponen/svg/profile.jsx";
import Trash from "../komponen/svg/trash.jsx";
import Download from "../komponen/svg/download.jsx";
import Refresh from "../komponen/svg/refresh.jsx";
import LichessLogo from "../komponen/svg/LichessLogo.jsx";
import ChessComLogo from "../komponen/svg/ChessComLogo.jsx";

const BIRU = "#4a9dd9";

function formatRating(x) {
  return x == null ? "—" : String(x);
}

function Logo({ platform, className }) {
  return platform === "lichessOrg" ? <LichessLogo className={className} /> : <ChessComLogo className={className} />;
}

export default function KartuAkun({ platform, username, aktif = false, onPilih, onHapus, onRefresh }) {
  const { t, bahasa: locale } = useI18n();
  const user = String(username || "").trim();
  const koleksiId = `${platform}:${user.toLowerCase()}`;
  const kartu = useKartuPemain(user, !!user);
  const [info, setInfo] = useState({ games: 0, lastUpdate: null, galat: false });
  const [token, setToken] = useState(0);

  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        const db = await ambilDaftarPartai({ koleksiId, limit: 0, sertakanPgn: false });
        const daftar = db?.partai || [];
        const ts = daftar.reduce((m, p) => Math.max(m, Number(p.timestamp) || 0), 0);
        if (hidup) setInfo({ games: db?.total ?? daftar.length, lastUpdate: ts, galat: false });
      } catch {
        if (hidup) setInfo({ games: 0, lastUpdate: null, galat: true });
      }
    })();
    return () => {
      hidup = false;
    };
  }, [koleksiId, token]);

  const total = kartu?.total ?? 0;
  const terunduh = info.games;
  const efektif = Math.max(total, terunduh);
  const persen = efektif ? (terunduh / efektif) * 100 : 0;

  const tanggal = (ts) => {
    if (!ts) return "—";
    try {
      // Ikuti bahasa antarmuka, bukan locale yang di-hardcode.
      return new Intl.DateTimeFormat(locale, { day: "numeric", month: "numeric", year: "numeric" }).format(new Date(ts));
    } catch {
      return new Date(ts).toLocaleDateString();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPilih}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPilih();
        }
      }}
      data-uji="kartu-akun"
      aria-pressed={aktif}
      className={`flex w-full cursor-pointer flex-col overflow-hidden rounded-[0.4rem] border bg-backgroundBox text-left transition-colors ${
        aktif ? "border-[var(--analisa-backgroundBoxBoxHighlighted)] ring-1 ring-[var(--analisa-backgroundBoxBoxHighlighted)]" : "border-border hover:border-borderHighlighted"
      }`}
    >
      {/* Header: logo situs + nama + aksi */}
      <div className="flex items-center gap-3 border-b border-border px-3 py-2.5">
        <span className={`grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-md ${platform === "chessCom" ? "bg-backgroundProfileWhite" : "bg-backgroundProfileBlack"}`}>
          {kartu?.avatar ? (
            <img className="h-full w-full object-cover" src={kartu.avatar} alt="" loading="lazy" referrerPolicy="no-referrer" />
          ) : (
            <Profile width={16} height={16} class={platform === "chessCom" ? "fill-foregroundProfileWhite" : "fill-foregroundProfileBlack"} />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{user}</span>
        <Logo platform={platform} className="h-[50px] w-[50px] shrink-0 fill-current text-foregroundGrey" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            title={t("analisa.statistik.refresh")}
            onClick={(e) => {
              e.stopPropagation();
              setToken((x) => x + 1);
            }}
            className="grid h-6 w-6 cursor-pointer place-items-center rounded-borderRoundness text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted"
          >
            <Refresh className="h-[15px] w-[15px]" />
          </button>
          <button
            type="button"
            title={t("analisa.statistik.tarik")}
            onClick={(e) => {
              e.stopPropagation();
              onRefresh?.();
            }}
            className="grid h-6 w-6 cursor-pointer place-items-center rounded-borderRoundness text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted"
          >
            <Download className="h-[15px] w-[15px]" />
          </button>
          <button
            type="button"
            title={t("analisa.akun.batal")}
            onClick={(e) => {
              e.stopPropagation();
              onHapus?.();
            }}
            className="grid h-6 w-6 cursor-pointer place-items-center rounded-borderRoundness text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-lossRed"
          >
            <Trash className="h-[15px] w-[15px]" />
          </button>
        </div>
      </div>

      {/* Baris statistik Bullet/Blitz/Rapid */}
      <div className="px-3 py-2.5">
        {["bullet", "blitz", "rapid"].map((k) => (
          <div key={k} className="flex items-center justify-between py-0.5">
            <span className="text-[0.7rem] font-bold uppercase tracking-wide text-foregroundGrey">{k}</span>
            <span className="text-sm font-bold tabular-nums text-foreground">{formatRating(kartu?.ratings?.[k])}</span>
          </div>
        ))}
      </div>

      {/* Games terunduh / total + progress + last update */}
      <div className="px-3 pb-3">
        <div className="flex items-center justify-between pb-1">
          <span className="text-[0.7rem] text-foregroundGrey">{t("analisa.statistik.games")}</span>
          <span className="text-[0.7rem] font-bold tabular-nums text-foreground">
            {terunduh} / {efektif}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-backgroundBoxBox">
          <div className="h-full rounded-full" style={{ width: `${persen}%`, backgroundColor: BIRU }} />
        </div>
        <div className="pt-1.5 text-[0.7rem] text-foregroundGrey">
          {t("analisa.statistik.terakhir")} {tanggal(info.lastUpdate)}
        </div>
      </div>
    </div>
  );
}
