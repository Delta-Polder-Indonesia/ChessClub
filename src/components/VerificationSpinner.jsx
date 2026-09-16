import { useI18n } from "../lib/i18n.jsx";
import { cn } from "../lib/utils";

/**
 * Indikator status verifikasi/pengiriman — port dari contoh chess-community-ui-component.
 * status: "idle" | "loading" | "success" | "error"
 */
const TAMPILAN = {
  idle: {
    lingkar: "#d1d5db",
    isi: "#9ca3af",
  },
  loading: {
    lingkar: "#0B2F9F",
    isi: "#0B2F9F",
  },
  success: {
    lingkar: "#059669",
    isi: "#059669",
  },
  error: {
    lingkar: "#dc2626",
    isi: "#dc2626",
  },
};

export default function VerificationSpinner({
  status = "idle",
  size = 72,
  loadingText,
  successText,
  errorText,
  idleText,
  className,
}) {
  const { t } = useI18n();
  /* Teks bawaan per status — hanya terpakai bila prop teks tidak diberikan. */
  const teksBawaan = {
    idle: "",
    loading: t("pendaftaran.spinnerMemproses"),
    success: t("pendaftaran.spinnerBerhasil"),
    error: t("pendaftaran.spinnerGagal"),
  };
  const tampil = TAMPILAN[status] || TAMPILAN.idle;
  const teks =
    (status === "loading" && loadingText) ||
    (status === "success" && successText) ||
    (status === "error" && errorText) ||
    (status === "idle" && idleText) ||
    teksBawaan[status] ||
    "";

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="status"
        aria-live="polite"
        aria-label={teks || t("pendaftaran.spinnerStatus")}
      >
        {/* lintasan latar */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#eef1f5"
          strokeWidth="7"
        />

        {status === "loading" && (
          <g className="anim-putar" style={{ transformOrigin: "50px 50px" }}>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={tampil.lingkar}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="52 212"
            />
          </g>
        )}

        {status === "idle" && (
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={tampil.lingkar}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="4 10"
          />
        )}

        {status === "success" && (
          <>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={tampil.lingkar}
              strokeWidth="7"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray="1"
              className="anim-garis"
            />
            <path
              d="M32 52l12 12 24-26"
              fill="none"
              stroke={tampil.isi}
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1"
              strokeDasharray="1"
              className="anim-garis anim-tunda"
            />
          </>
        )}

        {status === "error" && (
          <>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={tampil.lingkar}
              strokeWidth="7"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray="1"
              className="anim-garis"
            />
            <path
              d="M36 36l28 28M64 36L36 64"
              fill="none"
              stroke={tampil.isi}
              strokeWidth="8"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray="1"
              className="anim-garis anim-tunda"
            />
          </>
        )}
      </svg>

      {teks ? (
        <p
          className={cn(
            "text-sm font-medium",
            status === "success" && "text-emerald-600",
            status === "error" && "text-red-600",
            status === "loading" && "text-[#0B2F9F]",
            status === "idle" && "text-gray-500",
          )}
        >
          {teks}
        </p>
      ) : null}
    </div>
  );
}