import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "মোঃ আবু তাহের — চেয়ারম্যান পদপ্রার্থী, মহাদান ইউনিয়ন";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Bengali glyphs are rendered with the self-hosted Noto Sans Bengali WOFF
 * build, so social cards are generated offline (Satori cannot read WOFF2).
 */
async function loadFont(file: string) {
  return readFile(path.join(process.cwd(), "src/fonts", file));
}

export default async function OG() {
  const [bnRegular, bnBold, latinRegular, latinBold] = await Promise.all([
    loadFont("og-bengali-400.woff"),
    loadFont("og-bengali-700.woff"),
    loadFont("og-latin-400.woff"),
    loadFont("og-latin-700.woff"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: "linear-gradient(135deg,#05130f 0%,#0a3025 55%,#0e4334 100%)",
          padding: "64px", color: "#f8f4ea", position: "relative",
          fontFamily: "Noto Bengali, Noto Latin",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#e7b75f", display: "flex", alignItems: "center", justifyContent: "center", color: "#05130f", fontSize: 34, fontWeight: 700 }}>আ</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 26, fontWeight: 700 }}>মোঃ আবু তাহের</span>
            <span style={{ fontSize: 16, color: "rgba(248,244,234,.55)" }}>MD. ABU TAHER</span>
          </div>
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 20, color: "#e7b75f" }}>নির্বাচন ২০২৭ · ৮ নং মহাদান ইউনিয়ন</span>
          <span style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.12, marginTop: 16 }}>মানুষের পাশে সবসময়</span>
          <span style={{ fontSize: 26, color: "rgba(248,244,234,.62)", marginTop: 18 }}>৮টি স্তম্ভ · ৩২টি অঙ্গীকার · একটি পরিকল্পিত মহাদান</span>
        </div>

        <div style={{ position: "absolute", right: -80, top: -80, width: 420, height: 420, borderRadius: 999, border: "1px solid rgba(231,183,95,.25)" }} />
        <div style={{ position: "absolute", right: 40, bottom: 52, fontSize: 18, color: "rgba(248,244,234,.35)" }}>mdabutaher.com</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Bengali", data: bnRegular, weight: 400, style: "normal" },
        { name: "Noto Bengali", data: bnBold, weight: 700, style: "normal" },
        { name: "Noto Latin", data: latinRegular, weight: 400, style: "normal" },
        { name: "Noto Latin", data: latinBold, weight: 700, style: "normal" },
      ],
    },
  );
}
