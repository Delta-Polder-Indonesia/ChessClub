import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils.js";
import { varianAksiKonten } from "./varianAksiKonten.js";

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
