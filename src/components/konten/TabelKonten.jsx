import { forwardRef } from "react";
import { cn } from "../../lib/utils.js";

export const TabelKonten = forwardRef(function TabelKonten({ className, ...props }, ref) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        ref={ref}
        className={cn("w-full border-collapse font-sans text-base font-light text-grey-800", className)}
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
      className={cn("bg-transparent py-2 pl-5 pr-0 text-left font-sans text-base font-light text-grey-600 [&:first-child]:pl-0", className)}
      {...props}
    />
  );
});

export const SelTabelKonten = forwardRef(function SelTabelKonten(
  { className, ...props },
  ref,
) {
  return <td ref={ref} className={cn("py-2 pl-5 pr-0 align-middle [&:first-child]:pl-0", className)} {...props} />;
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
