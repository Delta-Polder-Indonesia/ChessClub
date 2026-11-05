/** Kerangka papan saat data soal dimuat (bukan papan contoh palsu). */
export default function KerangkaPapan() {
  return (
    <div
      data-kerangka-papan="true"
      aria-hidden="true"
      className="grid h-full w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-md"
    >
      {Array.from({ length: 64 }, (_, i) => {
        const baris = Math.floor(i / 8);
        const kolom = i % 8;
        const terang = (baris + kolom) % 2 === 0;
        return (
          <div
            key={i}
            className={terang ? "bg-[#eeeed2]/60" : "bg-[#769656]/60"}
          />
        );
      })}
    </div>
  );
}
