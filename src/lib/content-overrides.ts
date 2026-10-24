import { read } from "@/lib/store";
import { events as baseEvents, type CampaignEvent } from "@/content/events";
import { pillars as basePillars, type Pillar } from "@/content/manifesto";
import { cmsEvents } from "@/lib/cms";

/**
 * Applies whatever the admin saved in "ইভেন্ট ও ম্যানিফেস্টো" on top of the
 * curated content. Nothing is copied: a missing edit simply means "show the
 * original", and a hidden item is dropped from every list.
 */

function applyEvent(event: CampaignEvent, edit?: Record<string, unknown>): CampaignEvent {
  if (!edit) return event;
  const text = (key: keyof CampaignEvent) =>
    typeof edit[key] === "string" && (edit[key] as string).trim() ? (edit[key] as string) : undefined;
  return {
    ...event,
    title: text("title") ?? event.title,
    date: text("date") ?? event.date,
    start: text("start") ?? event.start,
    end: text("end") ?? event.end,
    venue: text("venue") ?? event.venue,
    ward: text("ward") ?? event.ward,
    description: text("description") ?? event.description,
    status: (text("status") as CampaignEvent["status"]) ?? event.status,
  };
}

/** All events (curated + CMS posts) with admin edits and hidden items applied. */
export async function getCampaignEvents(): Promise<CampaignEvent[]> {
  let edits: Record<string, any> = {};
  try {
    edits = (await read()).eventEdits || {};
  } catch {
    edits = {};
  }
  const cms = await cmsEvents().catch(() => [] as CampaignEvent[]);
  return [...cms, ...baseEvents]
    .filter((e) => !edits[e.id]?.hidden)
    .map((e) => applyEvent(e, edits[e.id]));
}

export async function findCampaignEvent(id: string) {
  return (await getCampaignEvents()).find((e) => e.id === id);
}

function applyPillar(pillar: Pillar, edit?: Record<string, any>): Pillar {
  if (!edit) return pillar;
  const text = (key: string) =>
    typeof edit[key] === "string" && edit[key].trim() ? (edit[key] as string) : undefined;
  const commitments = Array.isArray(edit.commitments) && edit.commitments.length
    ? pillar.commitments.map((c, i) => {
        const e = edit.commitments[i] || {};
        return {
          title: typeof e.title === "string" && e.title.trim() ? e.title : c.title,
          detail: typeof e.detail === "string" && e.detail.trim() ? e.detail : c.detail,
          timeline: typeof e.timeline === "string" && e.timeline.trim() ? e.timeline : c.timeline,
        };
      })
    : pillar.commitments;
  return {
    ...pillar,
    title: text("title") ?? pillar.title,
    summary: text("summary") ?? pillar.summary,
    problem: text("problem") ?? pillar.problem,
    target: text("target") ?? pillar.target,
    budget: text("budget") ?? pillar.budget,
    progress: typeof edit.progress === "number" ? Math.max(0, Math.min(100, edit.progress)) : pillar.progress,
    commitments,
  };
}

/** Manifesto pillars with admin edits, hidden pillars removed. */
export async function getPillars(): Promise<Pillar[]> {
  let edits: Record<string, any> = {};
  try {
    edits = (await read()).pillarEdits || {};
  } catch {
    edits = {};
  }
  return basePillars.filter((p) => !edits[p.id]?.hidden).map((p) => applyPillar(p, edits[p.id]));
}
