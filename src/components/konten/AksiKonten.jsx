import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils.js";

const varianAksiKonten = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 rounded px-4 py-2 font-sans text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        utama: "border border-primary bg-primary text-white hover:bg-primary/90",
        sekunder: "border border-primary bg-white text-primary hover:bg-grey-100",
        teks: "min-h-0 justify-start border-0 bg-transparent px-0 py-0 text-primary hover:underline",
      },
    },
    defaultVariants: { variant: "utama" },
  },
);

export const AksiKonten = forwardRef(function AksiKonten(
  { className, variant, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(varianAksiKonten({ variant }), className)}
      {...props}
    />
  );
});

export const TautanKonten = forwardRef(function TautanKonten(
  { className, variant, ...props },
  ref,
) {
  return (
    <Link
      ref={ref}
      className={cn(varianAksiKonten({ variant }), className)}
      {...props}
    />
  );
});

export { varianAksiKonten };
