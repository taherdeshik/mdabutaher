import { events } from "@/content/events";

export const dynamic = "force-dynamic";

function stamp(date: string, time: string) {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

function escape(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET() {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Md Abu Taher Campaign//BN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:মহাদান প্রচারণা ২০২৭",
    "X-WR-TIMEZONE:Asia/Dhaka",
  ];
  for (const e of events.filter((x) => x.status !== "past")) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@mdabutaher.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART;TZID=Asia/Dhaka:${stamp(e.date, e.start)}`,
      `DTEND;TZID=Asia/Dhaka:${stamp(e.date, e.end)}`,
      `SUMMARY:${escape(e.title)}`,
      `LOCATION:${escape(e.venue)}`,
      `DESCRIPTION:${escape(`${e.description}\nওয়ার্ড: ${e.ward}\nবিস্তারিত: https://mdabutaher.com/events`)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mahadan-campaign-2027.ics"',
    },
  });
}
