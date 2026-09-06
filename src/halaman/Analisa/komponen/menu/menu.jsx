/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useContext, useEffect, useRef, useState } from "react";
import { AnalyzeContext } from "../../konteks/analyze.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";
import Loading from "./loading/loading.jsx";
import GameButtons from "./analysis/gameButtons.jsx";
import SelectChessComGame from "./analyze/selectChessCom.jsx";
import DashboardAkun from "../../akun/DashboardAkun.jsx";
import DaftarAkun from "../../akun/DaftarAkun.jsx";
import { bacaDaftarAkun, tambahKeDaftar, hapusDariDaftar } from "../../akun/daftarAkun.js";
import Star from "../svg/star.jsx";
import BoardIcon from "../svg/boardIcon.jsx";
import Summary from "./analysis/summary/summary.jsx";
import Moves from "./analysis/moves/moves.jsx";
import getOverallGameComment from "./analysis/moves/overallGameComment.jsx";
import SelectLichessOrgGame from "./analyze/selectLichessOrg.jsx";
import Profile from "../svg/profile.jsx";
import Files from "../svg/files.jsx";

/*
 * Panel samping hanyalah "etalase data":
 *  - saat belum ada apa-apa: ajakan memakai tombol Akun / Impor di bilah kiri;
 *  - setelah akun dipilih dari bilah kiri: tabel seluruh partai akun itu;
 *  - saat partai dimuat lewat Akun/Impor: Ringkasan / Langkah hasil analisis.
 * Tidak ada lagi form "Laporan Analisa" di panel ini — kedalaman analisis
 * dipindah ke Pengaturan (tombol roda gigi BoardMenu).
 */
function Menu() {
  const { t } = useI18n();
  const [overallGameComment, setOverallGameComment] = useState("");
  const analyzeContext = useContext(AnalyzeContext);
  const [username, setUsername] = analyzeContext.akun;
  const [tab, setTab] = analyzeContext.tab;
  const [pageState] = analyzeContext.pageState;
  const [data] = analyzeContext.data;
  const [game] = analyzeContext.game;
  const [players] = analyzeContext.players;
  const [result] = analyzeContext.result;
  const [moveNumber, setMoveNumber] = analyzeContext.moveNumber;
  const [analyzeController] = analyzeContext.analyzeController;
  const [analyzingMove] = analyzeContext.analyzingMove;
  const setAnimation = analyzeContext.animation[1];
  const setForward = analyzeContext.forward[1];
  const [customLine, setCustomLine] = analyzeContext.customLine;
  const [returnedToNormalGame] = analyzeContext.returnedToNormalGame;
  const menuRef = useRef(null);

  const modeAnalisis = pageState === "analyze" || pageState === "analyzeCustom";
  const sedangMemilih = pageState === "default" && Boolean(username?.username);
  const memuatPartai = pageState === "loading";
  const kosong = pageState === "default" && !username?.username;
  // Akun baru dipilih → tampilkan dashboard statistik dulu; pengguna bisa
  // berpindah ke tabel partai untuk memilih & menganalisis.
  const [tampilanAkun, setTampilanAkun] = useState("statistik");
  useEffect(() => {
    // Identitas akun berubah → selalu mulai dari dashboard statistik.
    setTampilanAkun("statistik");
  }, [username?.username, username?.platform]);

  // Daftar akun yang pernah dipakai (kolom kiri layar akun) — disimpan di
  // localStorage via penyimpanan.js sehingga tetap ada setelah reload.
  const [daftar, setDaftar] = useState(() => bacaDaftarAkun());
  const [muatUlang, setMuatUlang] = useState(0);

  useEffect(() => {
    // Saat identitas akun berubah (mis. lewat popup "Akun" di Nav yang juga
    // menyimpan ke daftar), baca ulang daftar agar kolom kiri selalu sinkron.
    const list = bacaDaftarAkun();
    if (username?.username) {
      const ada =
        list.some(
          (a) =>
            a.platform === username.platform &&
            String(a.username || "").toLowerCase() === String(username.username || "").toLowerCase(),
        );
      if (!ada) tambahKeDaftar({ platform: username.platform, username: username.username });
    }
    setDaftar(bacaDaftarAkun());
  }, [username?.username, username?.platform]);

  function tambahAkunHandler(platform, nama) {
    const list = tambahKeDaftar({ platform, username: nama });
    setDaftar(list);
    setAkun({ platform, username: nama });
    setTampilanAkun("statistik");
  }

  function hapusAkunHandler(platform, nama) {
    const list = hapusDariDaftar(platform, nama);
    setDaftar(list);
    if (
      String(username?.username || "").toLowerCase() === String(nama || "").toLowerCase() &&
      username?.platform === platform
    ) {
      const berikut = list[0];
      setAkun(berikut ? { platform: berikut.platform, username: berikut.username } : { platform: "", username: "" });
    }
  }

  /* Saat masuk mode analisis, buka tab Ringkasan lebih dulu. */
  useEffect(() => {
    if (pageState === "analyze") setTab("summary");
  }, [pageState, setTab]);

  /* Melompat ke langkah tertentu (dari grafik/dll) → tampilkan tab Langkah. */
  useEffect(() => {
    if (pageState !== "analyze") return;
    setTab("moves");
  }, [moveNumber, pageState, setTab]);

  useEffect(() => {
    const playerNames = players.map((player) => player.name);
    setOverallGameComment(getOverallGameComment(playerNames, result, t));
  }, [players, result, t]);

  function stopSelecting() {
    setUsername({ platform: "", username: "" });
  }

  const tabs = [
    { label: t("analisa.tab.ringkasan"), state: "summary", icon: (className) => <Star class={className} size={20} />, show: pageState === "analyze" },
    { label: t("analisa.tab.langkah"), state: "moves", icon: (className) => <BoardIcon class={className} size={20} />, show: modeAnalisis },
  ].filter((x) => x.show);

  return (
    <div ref={menuRef} className="vertical:h-full w-full max-w-[600px] pb-8 vertical:pb-0 vertical:min-h-0 min-h-[600px] select-text bg-backgroundBox rounded-borderRoundness flex-grow vertical:max-w-[600px] vertical:min-w-[400px] flex flex-col gap-4 overflow-hidden">
      {tabs.length > 0 ? (
        <menu className="flex flex-row relative select-none">
          {tabs.map((t2, i) => {
            const isSelected = tab === t2.state;
            return (
              <button
                role="tab"
                key={i}
                onClick={() => setTab(t2.state)}
                className={`w-full flex flex-row gap-2 group items-center justify-center py-2 text-sm outline-none ${isSelected ? "text-foreground" : "bg-backgroundBoxBoxDisabled text-foregroundGrey cursor-pointer transition-colors hover:text-foregroundHighlighted"}`}
              >
                {t2.icon(isSelected ? "fill-foreground" : "fill-foregroundGrey transition-colors group-hover:fill-foregroundHighlighted")}
                {t2.label}
              </button>
            );
          })}
        </menu>
      ) : null}

      <div className="overflow-y-auto h-full flex flex-col">
        {memuatPartai ? <Loading format={data?.format} analyzeController={analyzeController} /> : ""}

        {modeAnalisis && tab === "summary" ? (
          <Summary setAnimation={setAnimation} setForward={setForward} setMoveNumber={setMoveNumber} moveNumber={moveNumber} players={players} moves={game} container={menuRef.current} />
        ) : ""}
        {modeAnalisis && tab === "moves" && pageState === "analyze" ? (
          <Moves container={menuRef.current} moves={game} overallGameComment={overallGameComment} moveNumber={moveNumber} setMoveNumber={setMoveNumber} analyzingMove={analyzingMove} setAnimation={setAnimation} setForward={setForward} customLine={customLine} returnedToNormalGame={returnedToNormalGame} />
        ) : ""}
        {pageState === "analyzeCustom" && tab === "moves" ? (
          <Moves container={menuRef.current} moves={[game[0], ...customLine.moves]} overallGameComment={overallGameComment} moveNumber={customLine.moveNumber + 1} setMoveNumber={(moveNumber2) => setCustomLine((prev) => ({ ...prev, moveNumber: moveNumber2 - 1 }))} analyzingMove={analyzingMove} setAnimation={setAnimation} setForward={setForward} customLine={customLine} returnedToNormalGame={returnedToNormalGame} />
        ) : ""}

        {sedangMemilih && username.username ? (
          <div className="flex w-full flex-col gap-3 min-h-0 navTop:h-full navTop:flex-row">
            {/* Kolom kiri: daftar akun + tombol tambah akun */}
            <div className="w-full overflow-hidden navTop:w-[230px] navTop:shrink-0 navTop:min-h-0">
              <DaftarAkun
                daftar={daftar}
                aktif={username}
                onPilih={(p, u) => {
                  setDaftar(tambahKeDaftar({ platform: p, username: u }));
                  setAkun({ platform: p, username: u });
                  setTampilanAkun("statistik");
                }}
                onHapus={hapusAkunHandler}
                onTambah={tambahAkunHandler}
                onRefresh={() => setMuatUlang((x) => x + 1)}
              />
            </div>

            {/* Kolom kanan: statistik / tabel partai */}
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <div className="flex rounded-borderRoundness bg-backgroundBoxBox p-1">
                <button
                  type="button"
                  onClick={() => setTampilanAkun("statistik")}
                  className={`flex-1 cursor-pointer rounded-borderRoundness px-2 py-1.5 text-sm font-bold transition-colors ${tampilanAkun === "statistik" ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark" : "text-foregroundGrey hover:text-foregroundHighlighted"}`}
                >
                  {t("analisa.statistik.judul")}
                </button>
                <button
                  type="button"
                  onClick={() => setTampilanAkun("tabel")}
                  className={`flex-1 cursor-pointer rounded-borderRoundness px-2 py-1.5 text-sm font-bold transition-colors ${tampilanAkun === "tabel" ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark" : "text-foregroundGrey hover:text-foregroundHighlighted"}`}
                >
                  {t("analisa.tab.pilihPartai")}
                </button>
              </div>
              {tampilanAkun === "statistik" ? (
                <div className="min-h-0 flex-1">
                  <DashboardAkun platform={username.platform} username={username.username} muatUlang={muatUlang} onBukaTabel={() => setTampilanAkun("tabel")} />
                </div>
              ) : username.platform === "chessCom" ? (
                <SelectChessComGame stopSelecting={stopSelecting} username={username.username} depth={analyzeContext.depth[0]} />
              ) : (
                <SelectLichessOrgGame stopSelecting={stopSelecting} username={username.username} depth={analyzeContext.depth[0]} />
              )}
            </div>
          </div>
        ) : ""}

        {kosong ? (
          <div className="flex flex-col items-center justify-center gap-4 px-8 py-14 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-backgroundBoxBox">
              <Files className="scale-x-[-1] fill-backgroundBoxBoxHighlighted" size={32} />
            </div>
            <p className="text-base font-bold text-foreground">{t("analisa.panel.kosongJudul")}</p>
            <p className="max-w-xs text-sm leading-5 text-foregroundGrey">{t("analisa.panel.kosongIsi")}</p>
            <div className="flex flex-row items-center gap-2 text-xs text-foregroundGrey">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-backgroundBoxBox px-2.5 py-1">
                <Profile width={13} height={13} class="fill-foregroundGrey" />
                {t("analisa.nav.akun")}
              </span>
              <span>{t("analisa.panel.atau")}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-backgroundBoxBox px-2.5 py-1">
                {t("analisa.nav.impor")}
              </span>
            </div>
          </div>
        ) : ""}
      </div>

      {modeAnalisis ? (
        <div className="flex-col gap-1 pb-1 items-center hidden vertical:flex">
          <hr className="border-neutral-600 w-[85%]" />
          <GameButtons />
        </div>
      ) : ""}
    </div>
  );
}
export {
  Menu as default
};
