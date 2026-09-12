import { cn } from "@/lib/utils";

export function ImageCard({
  imageUrl,
  alt = "Gambar",
  caption,
  ratio = "aspect-video",
  className,
  imageClassName,
}) {
  return (
    <figure className={cn("border-2 border-slate-200 bg-white", className)}>
      <div className={cn("relative w-full overflow-hidden", ratio)}>
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      </div>
      {caption ? (
        <figcaption className="border-t-2 border-slate-200 px-4 py-2 text-center font-sans text-xs font-semibold text-slate-700">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}