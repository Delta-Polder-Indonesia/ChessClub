import { useState } from "react";

const AnimationStyles = () => (
  <style>{`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes drawCheck {
      0% {
        stroke-dashoffset: 50;
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
      100% {
        stroke-dashoffset: 0;
        opacity: 1;
      }
    }

    @keyframes scaleSuccess {
      0% { transform: scale(0.8); opacity: 0.5; }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes popIn {
      0% { transform: scale(0.9); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes ripple {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 16px rgba(34, 197, 94, 0);
      }
      100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
      }
    }

    .animate-spin-fast {
      animation: spin 0.8s linear infinite;
    }

    .animate-check-draw {
      stroke-dasharray: 50;
      stroke-dashoffset: 50;
      animation: drawCheck 0.5s cubic-bezier(0.65, 0, 0.45, 1) forwards;
      animation-delay: 0.15s;
    }

    .animate-success-pop {
      animation: scaleSuccess 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    .animate-ripple {
      animation: ripple 1.2s infinite;
    }
  `}</style>
);

/**
 * Spinner verifikasi dengan transisi ring loading → centang hijau.
 * @param {string} status - 'idle' | 'loading' | 'success' | 'error'
 * @param {number} size - Ukuran spinner dalam pixel (default: 64)
 * @param {string} successText - Teks saat berhasil
 * @param {string} loadingText - Teks saat memproses
 * @param {string} errorText - Teks saat gagal
 */
export default function VerificationSpinner({
  status = "idle",
  size = 64,
  loadingText = "Memverifikasi...",
  successText = "Verifikasi Berhasil!",
  errorText = "Verifikasi Gagal",
  showLabel = true,
  className = "",
}) {
  const strokeWidth = Math.max(3, Math.round(size / 16));
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <AnimationStyles />
      <div
        className="relative flex items-center justify-center transition-all duration-300"
        style={{ width: size, height: size }}
      >
        {/* Status: IDLE */}
        {status === "idle" && (
          <div
            className="w-full h-full rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 transition-all duration-300"
            style={{ borderWidth: strokeWidth }}
          >
            <svg
              className="w-1/2 h-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        )}

        {/* Status: LOADING (Ring Spinner) */}
        {status === "loading" && (
          <svg
            className="w-full h-full animate-spin-fast transform -rotate-90"
            viewBox={`0 0 ${size} ${size}`}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="text-emerald-100 dark:text-emerald-950/50"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="text-emerald-500 transition-all duration-300"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * 0.7}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
        )}

        {/* Status: SUCCESS (Green Checkmark) */}
        {status === "success" && (
          <div className="relative w-full h-full flex items-center justify-center animate-success-pop rounded-full">
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 animate-ripple" />
            <svg
              className="w-full h-full text-emerald-500 drop-shadow-sm"
              viewBox={`0 0 ${size} ${size}`}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="text-emerald-500"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth + 0.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-check-draw"
                d={`M ${size * 0.28} ${size * 0.52} L ${size * 0.44} ${size * 0.68} L ${size * 0.72} ${size * 0.36}`}
              />
            </svg>
          </div>
        )}

        {/* Status: ERROR (Red Cross) */}
        {status === "error" && (
          <div className="relative w-full h-full flex items-center justify-center animate-success-pop rounded-full">
            <svg
              className="w-full h-full text-rose-500"
              viewBox={`0 0 ${size} ${size}`}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="text-rose-500"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth + 0.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                d={`M ${size * 0.35} ${size * 0.35} L ${size * 0.65} ${size * 0.65} M ${size * 0.65} ${size * 0.35} L ${size * 0.35} ${size * 0.65}`}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Label Text */}
      {showLabel && (
        <div className="text-center font-medium transition-all duration-300">
          {status === "idle" && (
            <span className="text-gray-500 dark:text-gray-400">
              Siap Verifikasi
            </span>
          )}
          {status === "loading" && (
            <span className="text-emerald-600 dark:text-emerald-400 animate-pulse">
              {loadingText}
            </span>
          )}
          {status === "success" && (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
              {successText}
            </span>
          )}
          {status === "error" && (
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              {errorText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Demo/playground lengkap: sukses, gagal, dan reset.
 * Dipakai untuk pratinjau mandiri; panggil dengan <VerificationDemoApp />.
 */
export function VerificationDemoApp() {
  const [status, setStatus] = useState("idle");
  const [duration, setDuration] = useState(2500);
  const [size, setSize] = useState(72);

  const handleStartVerification = () => {
    if (status === "loading") return;
    setStatus("loading");
    setTimeout(() => setStatus("success"), duration);
  };

  const handleReset = () => setStatus("idle");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 sm:p-8 font-sans transition-colors duration-200">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold uppercase tracking-wider">
            UI Animation Component
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Ring Spinner & Centang Hijau
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mx-auto text-sm">
            Transisi loading → verifikasi berhasil dengan animasi SVG & CSS.
          </p>
        </header>

        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-8 border border-slate-200 dark:border-slate-700/60 shadow-xl flex flex-col items-center justify-center min-h-[340px]">
          <div className="self-end bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded text-xs font-mono text-slate-500 dark:text-slate-400">
            Status: <span className="font-bold text-emerald-500">{status}</span>
          </div>

          <VerificationSpinner
            status={status}
            size={size}
            loadingText="Memproses Verifikasi..."
            successText="Verifikasi Berhasil!"
            errorText="Gagal Memverifikasi"
          />

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={handleStartVerification}
              disabled={status === "loading"}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-300 text-white font-semibold rounded-xl shadow-md active:scale-95 transition-all text-sm"
            >
              {status === "loading" ? "Memproses..." : "Mulai Verifikasi"}
            </button>
            <button
              onClick={() => setStatus("error")}
              disabled={status === "loading"}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl transition-all text-sm font-medium border border-slate-200 dark:border-slate-600"
            >
              Simulasi Gagal
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all text-sm font-medium"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-md space-y-4">
          <div className="flex justify-between text-sm font-medium">
            <label className="text-slate-700 dark:text-slate-300">
              Ukuran Icon ({size}px)
            </label>
            <input
              type="range"
              min="32"
              max="128"
              step="8"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-1/2 accent-emerald-500 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-sm font-medium">
            <label className="text-slate-700 dark:text-slate-300">
              Durasi Loading ({duration}ms)
            </label>
            <input
              type="range"
              min="500"
              max="5000"
              step="250"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-1/2 accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}