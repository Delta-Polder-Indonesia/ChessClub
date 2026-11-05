/**
 * Tab "Video": panggung media (GIF latar selama video belum siap), status
 * terkunci/gagal/kosong, serta tautan sumber Chess.com.
 */
import { useEffect, useState } from "react";
import { Clapperboard, ExternalLink, MonitorPlay } from "lucide-react";
import { useI18n } from "../../../lib/i18n.jsx";
import { tanggalVideoSah, tautanSumberVideo, urlVideoSah } from "../services/videoAman.js";

export default function PanelVideo({
  masalah = null,
  selesai = false,
  memuat = false,
  memuatKoleksi = false,
  videoGagal = false,
  nilaiKoleksi = "lichess",
  onPutarVideo = null,
  onGalatVideo = null,
  onBukaKoleksiVideo = null,
}) {
  const { t } = useI18n();
  const videoUrl = masalah?.video || "";
  const videoPelatih = masalah?.pelatih || "";
  const videoJudulSoal = masalah?.judulSoal || "";
  const videoTurnamen = masalah?.turnamen || "";
  const videoTanggal = masalah?.tanggal || "";

  const videoUrlAman = urlVideoSah(videoUrl);
  const videoTerkunci = Boolean(videoUrlAman && !selesai && !memuat && !memuatKoleksi);
  const [videoSiap, setVideoSiap] = useState(false);
  useEffect(
    () => setVideoSiap(false),
    [videoUrlAman, selesai, memuat, memuatKoleksi]
  );
  // GIF latar tetap tampil selama belum ada bingkai video yang siap — termasuk
  // saat soal tidak punya video sama sekali — supaya panggung media tidak
  // pernah kosong/hitam.
  const tampilkanPlaceholderVideo = !videoSiap || !videoUrlAman;
  const placeholderVideoDiDepan =
    Boolean(videoUrlAman && selesai && !videoGagal && !memuat && !memuatKoleksi);
  const kelasLapisanPlaceholder = placeholderVideoDiDepan ? "z-20" : "z-0";
  // Tanpa video, GIF jadi latar dekoratif (bukan penutup) → lebih redup.
  const kelasOpasitasPlaceholder = videoTerkunci
    ? "opacity-80"
    : videoUrlAman
      ? "opacity-35"
      : "opacity-50";
  const videoTanggalAman = tanggalVideoSah(videoTanggal);
  const tautanVideo = tautanSumberVideo(videoTanggal);
  return (
    <div role="tabpanel" id="panel-teka-teki-video" aria-labelledby="tab-teka-teki-video" data-panel="video" className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <MonitorPlay className="size-6 shrink-0 text-[#e3e3e3]" aria-hidden="true" />
                      <span className="text-xs font-bold text-gray-200 uppercase tracking-wider truncate">
                        {t("tekaTeki.videoJudul")}
                      </span>
                    </div>
                    {videoPelatih && (
                      <span className="text-xs font-medium text-gray-300 truncate">
                        {t("tekaTeki.videoOleh", { pelatih: videoPelatih })}
                      </span>
                    )}
                  </div>

                  {(videoJudulSoal || videoTurnamen) && (
                    <div className="rounded-md border border-[#312e2b] bg-[#1e1c18] px-3 py-2 space-y-0.5">
                      {videoJudulSoal && (
                        <p className="text-xs font-semibold text-white truncate" title={videoJudulSoal}>
                          {videoJudulSoal}
                        </p>
                      )}
                      {videoTurnamen && (
                        <p className="text-xs text-gray-400 truncate" title={videoTurnamen}>
                          {videoTurnamen}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Area media terpisah agar GIF tidak bertumpuk dengan judul dan metadata. */}
                  <div
                    data-video-stage="true"
                    className="relative isolate mx-auto flex aspect-square w-full max-w-[288px] items-center justify-center overflow-hidden rounded-lg border border-[#312e2b] bg-[#171614]"
                  >
                    {tampilkanPlaceholderVideo && (
                      <>
                        <img
                          data-video-placeholder="true"
                          src={`${import.meta.env.BASE_URL}images/ProgramKami/DirrTemplet.gif`}
                          alt=""
                          aria-hidden="true"
                          className={`pointer-events-none absolute inset-0 ${kelasLapisanPlaceholder} h-full w-full object-cover ${kelasOpasitasPlaceholder}`}
                        />
                        {!videoTerkunci && (
                          <div
                            data-video-placeholder-shade="true"
                            className={`pointer-events-none absolute inset-0 ${kelasLapisanPlaceholder} ${videoUrlAman ? "bg-black/35" : "bg-black/45"}`}
                            aria-hidden="true"
                          />
                        )}
                      </>
                    )}

                    {/* Penguncian antarmuka (UI anti-spoiler): URL MP4 berasal dari
                        dataset publik data/teka-teki-video.json. */}
                    {memuat || memuatKoleksi ? (
                      <p data-status-video="memuat" className="relative z-10 rounded-md bg-[#1e1c18]/90 px-4 py-3 text-center text-xs font-medium text-gray-200 shadow-lg">
                        {t("tekaTeki.videoMemuatKoleksi")}
                      </p>
                    ) : videoUrlAman && !selesai ? (
                      <div
                        data-status-video="terkunci"
                        className="relative z-10 mx-3 flex flex-col items-center gap-3 px-3 py-4 text-center"
                      >
                        <Clapperboard
                          className="size-[60px] shrink-0 text-[#e3e3e3]"
                          style={{ filter: "drop-shadow(0 2px 5px rgba(0, 0, 0, 0.9))" }}
                          aria-hidden="true"
                        />
                        <p
                          className="max-w-[15rem] text-sm font-semibold leading-6 text-white"
                          style={{ textShadow: "0 1px 3px rgba(0, 0, 0, 0.95), 0 0 8px rgba(0, 0, 0, 0.8)" }}
                        >
                          {t("tekaTeki.videoTerkunci")}
                        </p>
                      </div>
                    ) : videoUrlAman && selesai && videoGagal ? (
                      <div
                        data-status-video="gagal"
                        className="relative z-10 mx-3 space-y-2 rounded-md border border-[#49443b] bg-[#1e1c18]/95 p-3 shadow-lg"
                      >
                        <p className="text-xs leading-5 text-gray-200">
                          {t("tekaTeki.videoGagal")}
                        </p>
                        <a
                          href={tautanVideo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a3d168] hover:underline"
                        >
                          {t("tekaTeki.videoBukaSumber")}
                          <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    ) : videoUrlAman && selesai ? (
                      <video
                        key={videoUrlAman}
                        controls
                        preload="none"
                        playsInline
                        src={videoUrlAman}
                        onPlay={onPutarVideo || undefined}
                        onCanPlay={() => setVideoSiap(true)}
                        onError={(event) => {
                          setVideoSiap(false);
                          onGalatVideo?.(event);
                        }}
                        className="relative z-10 h-full w-full bg-transparent object-contain select-auto"
                      />
                    ) : (
                      <div
                        data-status-video="kosong"
                        className="relative z-10 mx-3 space-y-3 rounded-md border border-[#49443b] bg-[#1e1c18]/95 p-3 text-center shadow-lg"
                      >
                        <p className="text-xs leading-5 text-gray-200">
                          {t("tekaTeki.videoTidakTersedia")}
                        </p>
                        {nilaiKoleksi !== "video" && onBukaKoleksiVideo && (
                          <button
                            type="button"
                            onClick={onBukaKoleksiVideo}
                            className="w-full rounded-md bg-[#363431] hover:bg-[#45423e] px-3 py-2 text-xs font-semibold text-white transition cursor-pointer"
                          >
                            {t("tekaTeki.videoBukaKoleksi")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {videoUrlAman && selesai && !videoGagal && (
                    <div className="mx-auto flex w-full max-w-[288px] items-center justify-between gap-2 pt-0.5">
                      <a
                        href={tautanVideo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 hover:underline"
                      >
                        {t("tekaTeki.videoSumber")}
                        <ExternalLink className="size-3" aria-hidden="true" />
                      </a>
                      {videoTanggalAman && (
                        <span className="font-mono text-xs text-gray-400">{videoTanggalAman}</span>
                      )}
                    </div>
                  )}
                </div>
  );
}
