/**
 * Lencana "skakmat" — gambar raja yang tumbang.
 *
 * Ini TAMBAHAN lokal, bukan bagian port Brilliant-Chess: set rating upstream
 * (rating.jsx) berhenti di blunder/forced dan tidak punya penanda skakmat,
 * padahal papan teka-teki butuh tanda di atas raja lawan yang termat.
 *
 * Gayanya disamakan dengan ikon di rating.jsx supaya serasi saat tampil
 * berdampingan di pojok petak: lingkaran penuh pada viewBox 120×120, glif
 * putih, plus lapisan bayangan hitam 40% yang digeser 3px ke bawah.
 */
import { getPropsDataset } from "./piece.jsx";

/** Warna lencana — gelap khas situs, sengaja beda dari semua warna ikon rating. */
const WARNA_LINGKARAN = "#2d3142";
const WARNA_GLIF = "#ffffff";

/**
 * Siluet raja tegak: salib di puncak, kubah mahkota, badan melebar, dan alas.
 * Digambar dua kali (bayangan + glif putih), jadi disimpan sebagai elemen.
 */
const GLIF_RAJA = (
  <g>
    {/* salib menjulur sampai menimpa kubah agar tetap menyatu */}
    <rect x={57.6} y={16} width={4.8} height={28} rx={1} ry={1} />
    <rect x={52.4} y={21.6} width={15.2} height={4.8} rx={1} ry={1} />
    <path d="M 42 52 C 42 38 78 38 78 52 Z" />
    <path d="M 44 60 L 76 60 L 72 52 L 48 52 Z" />
    <path d="M 40 84 L 80 84 L 76 60 L 44 60 Z" />
    <rect x={34} y={84} width={52} height={9} rx={3} ry={3} />
  </g>
);

/**
 * Raja dijatuhkan ke samping: glif digeser dulu ke tengah lingkaran lalu
 * diputar -90° mengelilingi pusat, sehingga tetap terpusat setelah rebah.
 */
const TRANSFORM_TUMBANG = "rotate(-90 60 60) translate(0 4.5)";

function Skakmat({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse
        cx={60}
        cy={59.773922}
        rx={60}
        ry={59.773922}
        fill={WARNA_LINGKARAN}
        fillOpacity={1}
        stroke="none"
      />
      <g transform="translate(0,3)">
        <g fill="#000000" fillOpacity={0.4} stroke="none" transform={TRANSFORM_TUMBANG}>
          {GLIF_RAJA}
        </g>
      </g>
      <g fill={WARNA_GLIF} fillOpacity={1} stroke="none" transform={TRANSFORM_TUMBANG}>
        {GLIF_RAJA}
      </g>
    </svg>
  );
}

/** Pembungkus yang sama bentuknya dengan RatingSVG (title, data-*, className). */
function SkakmatSVG({ size, dataset, draggable, className, style, title }) {
  const propsDataset = getPropsDataset(dataset ?? {});
  return (
    <div
      title={title}
      draggable={draggable}
      {...propsDataset}
      className={className}
      style={style}
    >
      <Skakmat size={size} />
    </div>
  );
}

export { SkakmatSVG as default, Skakmat };
