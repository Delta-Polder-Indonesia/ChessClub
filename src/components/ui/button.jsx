import { forwardRef } from "react";

const variants = {
  default: "bg-[#0B2F9F] text-white shadow-sm hover:bg-[#0a2a8e]",
  outline: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
};

/**
 * Tombol kecil bergaya shadcn/ui yang dipakai oleh panel-panel situs.
 * Tidak bergantung pada class-variance-authority agar bundle tetap ringan.
 */
export const Button = forwardRef(function Button(
  { className = "", variant = "default", size = "default", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2F9F] disabled:pointer-events-none disabled:opacity-50 ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`}
      {...props}
    />
  );
});
