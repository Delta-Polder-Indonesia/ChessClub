/**
 * Pengganti tipis <Image> milik Next.js.
 *
 * UI analisis ini dipindah dari Brilliant-Chess yang memakai App Router;
 * di proyek ini tidak ada optimasi gambar server, sehingga cukup <img>.
 * Prop Next yang tidak berarti apa-apa di sini (`priority`, `fill`) diterima
 * lalu diabaikan supaya port-nya tetap mudah dibandingkan dengan aslinya.
 */
export default function Gambar({ src, alt = "", width, height, className, title, draggable = true, priority, ...lain }) {
  void priority;
  return (
    <img
      src={src}
      alt={alt}
      title={title}
      width={width}
      height={height}
      className={className}
      draggable={draggable}
      loading="lazy"
      decoding="async"
      {...lain}
    />
  );
}
