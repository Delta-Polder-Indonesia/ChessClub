/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
/*
 * Bar kemajuan analisa. Bentuknya mengikuti kartu progres WintrChess
 * (`ProgressReporter`): jalur penuh selebar kartu dengan isian yang lebarnya
 * mengikuti persentase. Isian memakai biru aksen yang sudah dipakai spinner
 * kartu ini (#4a9dd9) dan jalurnya token `backgroundBoxBox` — tanpa warna baru.
 */
function LoadingBar(props) {
  const angka = Number(props.progress);
  const persen = Number.isFinite(angka) ? Math.min(Math.max(angka, 0), 100) : 0;
  return <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(persen)} className="w-full h-2 rounded-full bg-backgroundBoxBox overflow-hidden">
            <div style={{ width: `${persen}%`, transition: `width ${props.transitionTime}ms linear` }} className="h-full bg-[#4a9dd9]" />
        </div>;
}
export {
  LoadingBar as default
};
