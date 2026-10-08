import { useState } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { DAFTAR_ENGINE, ENGINE_BAKU } from "../../lib/engineCatur.js";
import { gambar } from "../../lib/asets.js";
import { gunakanPreferensiKomentator } from "../../components/KartuKomentator.jsx";
import { IsiPengaturanPapan } from "./PopupPengaturan.jsx";
import PanelLayar from "../Analisa/komponen/nav/PanelLayar.jsx";
import SelectDaftar from "../Analisa/komponen/nav/SelectDaftar.jsx";
import Gambar from "../Analisa/komponen/Gambar.jsx";
import "../Analisa/analisa.css";

/**
 * Layar "Pengaturan" sidebar — khusus mode Analisa. Tata letak mengikuti
 * layar Deteksi Engine: PanelLayar + dua kotak berdampingan; kiri pengaturan
 * engine (SelectDaftar bergaya deteksi), kanan pengaturan papan (IsiPengaturan
 * dibagikan dengan PopupPengaturan). Menggantikan popup: tombol gear di
 * samping papan langsung membuka layar ini lewat onBukaPengaturan Workspace.
 */

function Pemisah({ teks }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-bold text-foregroundGrey">{teks}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export default function LayarPengaturan() {
  const { t } = useI18n();
  const preferensiKomentator = gunakanPreferensiKomentator();

  // Pengaturan papan — awal sama dengan default PapanInteraktif (layout
  // eksperimen: state lokal layar ini, bukan state papan).
  const [bidak, setSetBidak] = useState("alpha");
  const [suaraNyala, setSuaraNyala] = useState(true);
  const [tampilPanahMesin, setTampilPanahMesin] = useState(true);
  const [awanTampilanPenuh, setAwanTampilanPenuh] = useState(true);
  const [bantuanNyala, setBantuanNyala] = useState(false);
  const [warnaPapan, setWarnaPapan] = useState("metal");

  // Pengaturan engine analisa — BELUM terhubung ke engine (layout dulu).
  const [mesin, setMesin] = useState(ENGINE_BAKU);
  const mesinAktif = DAFTAR_ENGINE.find((e) => e.id === mesin);
  const labelMesin = mesinAktif?.label ?? mesin;
  const versiMesin = /\d+/.exec(labelMesin)?.[0] ?? "-";
  const namaBerkas = mesinAktif?.url.split("/").pop() ?? "-";
  const [kedalaman, setKedalaman] = useState(13);
  const [threads, setThreads] = useState(1);
  const [hashMb, setHashMb] = useState(16);
  const [multipv, setMultipv] = useState(1);
  const [skillLevel, setSkillLevel] = useState(20);

  return (
    <div className="analisa-root h-full min-h-0 w-full">
      <PanelLayar judul={t("papan.pengaturan")}>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto sm:gap-4 lg:flex-row lg:overflow-hidden">
          <div className="flex w-full shrink-0 flex-col lg:min-h-0 lg:flex-1">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.4rem] border border-border bg-backgroundBox">
              <div className="shrink-0 px-4 pt-4">
                <span className="block text-center text-xl font-bold text-foreground">{t("papan.pengaturanEngine")}</span>
              </div>
              <div className="flex flex-col gap-3 px-4 pb-4 pt-4 lg:min-h-0 lg:overflow-y-auto">
                <div className="flex items-center gap-3 rounded-borderRoundness border border-[#81b64c] bg-backgroundBoxBox p-3">
                  <Gambar
                    src={gambar("/images/stockfish.webp")}
                    alt="Stockfish"
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-[0.25rem] border border-border object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-bold text-foreground">{labelMesin}</span>
                    <span className="truncate text-xs text-foregroundGrey">{namaBerkas}</span>
                  </div>
                  <div className="flex shrink-0 flex-row gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold uppercase text-foregroundGrey">{t("papan.pengaturanVersi")}</span>
                      <span className="text-sm font-bold text-foreground">{versiMesin}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold uppercase text-foregroundGrey">{t("papan.pengaturanDepth")}</span>
                      <span className="text-sm font-bold text-foreground">{kedalaman}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Pemisah teks={t("papan.pengaturanUmum")} />
                  <div className="flex flex-row items-start gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-row gap-2">
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="text-xs font-bold text-foregroundGrey">{t("papan.pengaturanNama")}</span>
                          <SelectDaftar
                            labelTeks={t("papan.pengaturanNama")}
                            dataUji="pengaturan-nama"
                            nilai={mesin}
                            opsi={DAFTAR_ENGINE.map((e) => ({ nilai: e.id, label: e.label }))}
                            onPilih={setMesin}
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="text-xs font-bold text-foregroundGrey">{t("papan.pengaturanVersi")}</span>
                          <div className="rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground">{versiMesin}</div>
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <label htmlFor="pengaturan-depth" className="text-xs font-bold text-foregroundGrey">{t("papan.pengaturanDepth")}</label>
                          <input
                            id="pengaturan-depth"
                            type="number"
                            min={6}
                            max={15}
                            value={kedalaman}
                            onChange={(e) => setKedalaman(Number(e.target.value))}
                            className="rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    <Gambar
                      src={gambar("/images/stockfish.webp")}
                      alt="Stockfish"
                      width={128}
                      height={128}
                      className="h-32 w-32 shrink-0 rounded-[0.4rem] border border-border object-cover"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Pemisah teks={t("papan.pengaturanLanjutan")} />
                  <div className="flex flex-row gap-2">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <label htmlFor="pengaturan-threads" className="text-xs font-bold text-foregroundGrey">{t("papan.pengaturanThreads")}</label>
                      <input
                        id="pengaturan-threads"
                        type="number"
                        min={1}
                        max={8}
                        value={threads}
                        onChange={(e) => setThreads(Number(e.target.value))}
                        className="rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground outline-none"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <label htmlFor="pengaturan-hash" className="text-xs font-bold text-foregroundGrey">{t("papan.pengaturanHash")}</label>
                      <input
                        id="pengaturan-hash"
                        type="number"
                        min={16}
                        max={128}
                        step={16}
                        value={hashMb}
                        onChange={(e) => setHashMb(Number(e.target.value))}
                        className="rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-row gap-2">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <label htmlFor="pengaturan-multipv" className="text-xs font-bold text-foregroundGrey">{t("papan.pengaturanMultiPv")}</label>
                      <input
                        id="pengaturan-multipv"
                        type="number"
                        min={1}
                        max={5}
                        value={multipv}
                        onChange={(e) => setMultipv(Number(e.target.value))}
                        className="rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground outline-none"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <label htmlFor="pengaturan-skill" className="text-xs font-bold text-foregroundGrey">{t("papan.pengaturanSkillLevel")}</label>
                      <input
                        id="pengaturan-skill"
                        type="number"
                        min={0}
                        max={20}
                        value={skillLevel}
                        onChange={(e) => setSkillLevel(Number(e.target.value))}
                        className="rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 w-full shrink-0 flex-col lg:min-h-0 lg:flex-1">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.4rem] border border-border bg-backgroundBox">
              <div className="shrink-0 px-4 pt-4">
                <span className="block text-center text-xl font-bold text-foreground">{t("papan.pengaturanPapan")}</span>
              </div>
              <div className="flex flex-col gap-3 px-4 pb-4 pt-4 lg:min-h-0 lg:overflow-y-auto">
                <IsiPengaturanPapan
                  t={t}
                  bidak={bidak}
                  setSetBidak={setSetBidak}
                  suaraNyala={suaraNyala}
                  setSuaraNyala={setSuaraNyala}
                  tampilPanahMesin={tampilPanahMesin}
                  setTampilPanahMesin={setTampilPanahMesin}
                  awanTampilanPenuh={awanTampilanPenuh}
                  setAwanTampilanPenuh={setAwanTampilanPenuh}
                  bantuanNyala={bantuanNyala}
                  setBantuanNyala={setBantuanNyala}
                  warnaPapan={warnaPapan}
                  setWarnaPapan={setWarnaPapan}
                  kartuKomentator={{
                    nyala: preferensiKomentator.nyala,
                    setNyala: preferensiKomentator.setNyala,
                    gaya: preferensiKomentator.gaya,
                    setGaya: preferensiKomentator.setGaya,
                    t,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </PanelLayar>
    </div>
  );
}
