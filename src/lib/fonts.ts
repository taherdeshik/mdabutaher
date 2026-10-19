import localFont from "next/font/local";

export const anekBangla = localFont({
  src: [
    { path: "../fonts/anek-bangla-bengali-wght-normal.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/anek-bangla-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-anek",
  display: "swap",
  fallback: ["Noto Sans Bengali", "system-ui", "sans-serif"],
  preload: true,
});

export const inter = localFont({
  src: [{ path: "../fonts/inter-latin-wght-normal.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  preload: true,
});
