import { ImageResponse } from "next/og";

export const alt = "মোঃ আবু তাহের — চেয়ারম্যান পদপ্রার্থী, মহাদান ইউনিয়ন";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: "linear-gradient(135deg,#05130f 0%,#0a3025 55%,#0e4334 100%)",
          padding: "64px", color: "#f8f4ea", position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#e7b75f", display: "flex", alignItems: "center", justifyContent: "center", color: "#05130f", fontSize: 34, fontWeight: 800 }}>আ</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 26, fontWeight: 700 }}>মোঃ আবু তাহের</span>
            <span style={{ fontSize: 16, color: "rgba(248,244,234,.55)", letterSpacing: 3 }}>MD. ABU TAHER</span>
          </div>
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 20, color: "#e7b75f", letterSpacing: 4 }}>নির্বাচন ২০২৭ · ৮ নং মহাদান ইউনিয়ন</span>
          <span style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.12, marginTop: 16 }}>মানুষের পাশে সবসময়</span>
          <span style={{ fontSize: 26, color: "rgba(248,244,234,.62)", marginTop: 18 }}>৮টি স্তম্ভ · ৩২টি অঙ্গীকার · একটি পরিকল্পিত মহাদান</span>
        </div>

        <div style={{ position: "absolute", right: -80, top: -80, width: 420, height: 420, borderRadius: 999, border: "1px solid rgba(231,183,95,.25)" }} />
        <div style={{ position: "absolute", right: 40, bottom: 52, fontSize: 18, color: "rgba(248,244,234,.35)" }}>mdabutaher.com</div>
      </div>
    ),
    { ...size },
  );
}
