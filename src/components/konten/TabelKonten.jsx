import { forwardRef } from "react";
import { cn } from "../../lib/utils.js";

export const TabelKonten = forwardRef(function TabelKonten({ className, ...props }, ref) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        ref={ref}
        className={cn("w-full border-collapse font-serif text-base text-grey-600", className)}
        {...props}
      />
    </div>
  );
});

export const KepalaTabelKonten = forwardRef(function KepalaTabelKonten(props, ref) {
  return <thead ref={ref} {...props} />;
});

export const BadanTabelKonten = forwardRef(function BadanTabelKonten(props, ref) {
  return <tbody ref={ref} {...props} />;
});

export const BarisTabelKonten = forwardRef(function BarisTabelKonten(
  { className, ...props },
  ref,
) {
  return (
    <tr
      ref={ref}
      className={cn("border-b border-grey-200", className)}
      {...props}
    />
  );
});

export const JudulKolomKonten = forwardRef(function JudulKolomKonten(
  { className, ...props },
  ref,
) {
  return (
    <th
      ref={ref}
      className={cn("bg-grey-100 px-4 py-3 text-left font-sans text-sm font-semibold text-grey-800", className)}
      {...props}
    />
  );
});

export const SelTabelKonten = forwardRef(function SelTabelKonten(
  { className, ...props },
  ref,
) {
  return <td ref={ref} className={cn("px-4 py-3 align-top", className)} {...props} />;
});

export const CaptionTabelKonten = forwardRef(function CaptionTabelKonten(
  { className, ...props },
  ref,
) {
  return (
    <caption
      ref={ref}
      className={cn("mb-3 text-left text-sm leading-normal text-grey-600", className)}
      {...props}
    />
  );
});
