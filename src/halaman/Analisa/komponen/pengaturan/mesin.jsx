/* Bagian pengaturan fitur Analisa — ditulis untuk ChessClub (bukan port). */
import { useContext } from "react";
import { useI18n } from "../../../../lib/i18n.jsx";
import { DAFTAR_ENGINE, cariEngine } from "../../../../lib/engineCatur.js";
import { gambar } from "../../../../lib/asets.js";
import { gunakanMesin } from "../../konteks/mesin.jsx";
import { AnalyzeContext } from "../../konteks/analyze.jsx";

import { tulis } from "../../penyimpanan.js";
import SelectDaftar from "../nav/SelectDaftar.jsx";
import Gambar from "../Gambar.jsx";

/**
 * Pilihan engine + kedalaman analisis.
 *
 * Susunan mengikuti kartu Pengaturan Engine di Papan Interaktif: thumbnail
 * (foto + nama berkas + lencana versi/kedalaman), garis "Pengaturan umum",
 * baris Nama|Versi, lalu baris Kedalaman + foto 128px. Bagian status khas
 * Analisa (muat/coba lagi, tanpa wasm, memuat) tetap dipertahankan karena
 * engine di sini dimuat sebagai WebAssembly, berbeda dengan Papan.
 *
 * Engine yang dipakai SELALU milik ChessClub sendiri (EngineCatur + berkas
 * wasm di /public/engines). Bagian Brilliant-Chess yang membuat Worker
 * sendiri, membaca navigator.hardwareConcurrency, dan menawarkan opsi thread
 * sengaja tidak dipindah — itulah bagian yang bug. Di sini pengguna hanya
 * memilih build Stockfish lokal; unduhan pertamanya ditangguhkan sampai
 * pengguna menekan tombol atau benar-benar membutuhkan analisis.
 */

/** Jepit angka ke rentang [min, max]; kosong/bukan angka dibiarkan (batal). */
function terapkanAngka(teks, min, max, simpan) {
  if (String(teks).trim() === "") return;
  const n = Math.round(Number(teks));
  if (!Number.isFinite(n)) return;
  simpan(Math.min(max, Math.max(min, n)));
}

function PengaturanMesin() {
  const { t } = useI18n();
  const { idEngine, gantiEngine, status, galat, siapkan, setop, didukung } = gunakanMesin();
  const analyzeContext = useContext(AnalyzeContext);
  const [depth, setDepth] = analyzeContext.depth;

  const aktif = cariEngine(idEngine) ?? cariEngine(undefined);
  const siapDipakai = status === "siap";
  const labelMesin = aktif?.label ?? idEngine;
  const versiMesin = /\d+/.exec(labelMesin)?.[0] ?? "-";
  const namaBerkas = aktif?.url.split("/").pop() ?? "-";

  function pilihEngine(id) {
    if (id === idEngine) return;
    // Ganti engine = batalkan analisis yang sedang berjalan. Kalau tidak,
    // engine lama yang ditamat di tengah pencarian dianggap galat dan
    // memunculkan pesan "galat.engine" yang menyesatkan.
    const [kkontrol, setKontrol] = analyzeContext.analyzeController;
    kkontrol.abort();
    setKontrol(new AbortController());
    setop();
    gantiEngine(id);
  }

  function pilihKedalaman(ply) {
    setDepth(ply);
    tulis("kedalaman", ply);
  }

  return (
    <section>
      <div className="flex items-center gap-2">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-bold text-foregroundGrey">{t("analisa.pengaturan.mesin")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <p className="px-3 py-2 text-xs text-foregroundGrey">{t("analisa.mesin.petunjuk")}</p>
      {didukung ? null : (
        <p className="mx-3 mb-2 rounded-borderRoundness bg-backgroundBoxBox p-2 text-sm text-foregroundGrey">
          {t("analisa.status.tanpaWasm")}
        </p>
      )}

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
            <span className="text-[10px] font-bold uppercase text-foregroundGrey">{t("analisa.pengaturan.versiMesin")}</span>
            <span className="text-sm font-bold text-foreground">{versiMesin}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase text-foregroundGrey">{t("analisa.pengaturan.kedalaman")}</span>
            <span className="text-sm font-bold text-foreground">{depth}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-bold text-foregroundGrey">{t("analisa.pengaturan.umum")}</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="flex flex-row items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-row gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-bold text-foregroundGrey">{t("analisa.pengaturan.namaMesin")}</span>
                <SelectDaftar
                  labelTeks={t("analisa.pengaturan.namaMesin")}
                  dataUji="mesin-nama"
                  nilai={idEngine}
                  opsi={DAFTAR_ENGINE.map((e) => ({ nilai: e.id, label: e.label }))}
                  onPilih={pilihEngine}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-bold text-foregroundGrey">{t("analisa.pengaturan.versiMesin")}</span>
                <div className="rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground">{versiMesin}</div>
              </div>
            </div>

            {status === "mati" || status === "gagal" ? (
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    siapkan().catch(() => {
                      /* pesan galat sudah ditampilkan lewat status/galat */
                    });
                  }}
                  className="w-full h-9 rounded-borderRoundness bg-backgroundBoxBox hover:bg-backgroundBoxBoxHover font-bold text-sm transition-colors"
                >
                  {status === "gagal" ? t("analisa.status.cobaLagi") : t("analisa.status.muat")}
                </button>
                {status === "gagal" && galat ? <p className="text-xs text-highlightMiss break-words">{t("analisa.status.gagal")} — {aktif?.label}</p> : null}
              </div>
            ) : null}
            {!siapDipakai && status === "memuat" ? (
              <p className="text-xs text-foregroundGrey animate-[pulse_1.25s_cubic-bezier(0.4,_0,_0.6,_1)_infinite]">{t("analisa.status.memuat")}</p>
            ) : null}

            <div className="flex flex-row gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <label htmlFor="mesin-depth" className="text-xs font-bold text-foregroundGrey">{t("analisa.pengaturan.kedalaman")}</label>
                <input
                  id="mesin-depth"
                  type="number"
                  min={6}
                  max={20}
                  value={depth}
                  onChange={(e) => terapkanAngka(e.target.value, 6, 20, pilihKedalaman)}
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
        <p className="px-3 pb-2 text-xs text-foregroundGrey">{t("analisa.kedalaman.petunjuk")}</p>
      </div>
    </section>
  );
}

export { PengaturanMesin as default };
