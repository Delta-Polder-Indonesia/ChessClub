/**
 * Dropdown profil admin di header dashboard.
 */

function ItemDropdown({ icon, label, onClick, disabled = false, bahaya = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full text-left px-4 py-2 text-sm
        flex items-center gap-3
        transition-colors duration-100
        disabled:opacity-40
        ${bahaya ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"}
      `}
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
      {label}
    </button>
  );
}

export default function DropdownProfil({
  terbuka,
  pengguna,
  peran,
  onTutup,
  onMuatUlang,
  onKeluar,
  onBukaPengaturan,
  memuat,
}) {
  const isMaster = (peran || "").toLowerCase() === "master";
  return (
    <div
      className={`
        absolute right-0 mt-2 w-56 z-50
        bg-white rounded-lg shadow-lg border border-slate-200 py-2
        origin-top-right transform-gpu
        transition-[opacity,transform] duration-200
        ease-[cubic-bezier(0.22,1,0.36,1)]
        ${terbuka
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }
      `}
    >
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-xs uppercase tracking-wide text-slate-500">Masuk sebagai</p>
        <p className="truncate text-sm font-semibold text-slate-900 flex items-center gap-2">
          {pengguna ? (
            <a
              href={`https://www.chess.com/member/${encodeURIComponent(pengguna)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {pengguna}
            </a>
          ) : (
            "Pengurus"
          )}
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${isMaster ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
            {isMaster ? "MASTER" : "PENGURUS"}
          </span>
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          {isMaster ? "Akses penuh + Pengaturan" : "Akses pengurus (tanpa Pengaturan)"}
        </p>
      </div>

      <ItemDropdown
        icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        label="Muat ulang data"
        onClick={() => { onTutup(); onMuatUlang(); }}
        disabled={memuat}
      />
      {isMaster && (
        <ItemDropdown
          icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          label="Pengaturan (Master)"
          onClick={() => { onTutup(); onBukaPengaturan(); }}
        />
      )}
      <ItemDropdown
        icon="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        label="Keluar"
        onClick={() => { onTutup(); onKeluar(); }}
        bahaya
      />
    </div>
  );
}
