import { LABEL_STATUS } from "./bagianData.js";

export function Lencana({ status }) {
  const s = LABEL_STATUS[status] || LABEL_STATUS.draf;
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${s.kelas}`}>
      {s.teks}
    </span>
  );
}
