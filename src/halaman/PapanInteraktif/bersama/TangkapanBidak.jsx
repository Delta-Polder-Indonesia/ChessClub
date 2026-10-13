import { ChessPiece } from "../../../components/chess/ChessPiece.jsx";

/** Ikon bidak yang ditangkap: satu ikon per jenis + pengali bila lebih dari satu. */
export default function TangkapanBidak({ daftar, set }) {
  if (!daftar || daftar.length === 0) return null;
  return (
    <span className="flex items-center gap-1.5">
      {daftar.map(({ huruf, jumlah }) => (
        <span key={huruf} className="flex shrink-0 items-center">
          <ChessPiece piece={huruf} set={set} className="h-4 w-4 opacity-80" />
          {jumlah > 1 && (
            <span className="ml-0.5 text-[10px] font-semibold leading-none text-gray-500">
              {jumlah}×
            </span>
          )}
        </span>
      ))}
    </span>
  );
}
