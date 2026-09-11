import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Menggabungkan class Tailwind tanpa menyisakan utility yang saling bertabrakan. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
