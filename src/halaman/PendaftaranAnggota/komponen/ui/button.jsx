import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../../../lib/utils";

const variasi = {
  default:
    "bg-[#0B2F9F] text-white shadow-sm hover:bg-[#0a2b8f] active:bg-[#082576] focus-visible:ring-[#0B2F9F]/40",
  outline:
    "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-400/40",
  secondary:
    "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-400/40",
  ghost: "text-[#0B2F9F] hover:bg-blue-50 active:bg-blue-100 focus-visible:ring-[#0B2F9F]/30",
  success:
    "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-500/40",
  destructive:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500/40",
  link: "text-[#0B2F9F] underline-offset-4 hover:underline focus-visible:ring-[#0B2F9F]/30",
};

const ukuran = {
  sm: "h-9 px-3 text-xs",
  default: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

export const Button = forwardRef(function Button(
  {
    className,
    variant = "default",
    size = "default",
    type = "button",
    loading = false,
    disabled = false,
    children,
    ...sisa
  },
  ref,
) {
  const terkunci = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={terkunci}
      aria-busy={loading ? "true" : undefined}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-full font-medium tracking-tight",
        "transition-all duration-150 focus-visible:outline-none focus-visible:ring-4",
        "disabled:pointer-events-none disabled:opacity-55 active:scale-[0.985]",
        ukuran[size] || ukuran.default,
        variasi[variant] || variasi.default,
        className,
      )}
      {...sisa}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

export default Button;