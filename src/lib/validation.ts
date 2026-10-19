import { z } from "zod";

const phone = z
  .string()
  .trim()
  .regex(/^(\+?88)?01[3-9]\d{8}$/, "সঠিক মোবাইল নম্বর দিন (যেমন: 01711203997)");

export const appointmentSchema = z.object({
  name: z.string().trim().min(3, "নাম কমপক্ষে ৩ অক্ষর হতে হবে").max(80),
  phone,
  email: z.string().trim().email("সঠিক ইমেইল দিন").optional().or(z.literal("")),
  type: z.string().min(1, "সাক্ষাতের ধরন বেছে নিন"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "তারিখ বেছে নিন"),
  slot: z.string().regex(/^\d{2}:\d{2}$/, "সময় বেছে নিন"),
  mode: z.enum(["in-person", "phone", "home-visit"]),
  ward: z.string().min(1, "ওয়ার্ড বেছে নিন"),
  topic: z.string().trim().min(5, "বিষয় লিখুন").max(160),
  notes: z.string().trim().max(1200).optional().or(z.literal("")),
});

export const feedbackSchema = z.object({
  kind: z.enum(["problem", "advice", "threat"]),
  category: z.string().min(1, "বিভাগ বেছে নিন"),
  title: z.string().trim().min(5, "শিরোনাম লিখুন").max(140),
  details: z.string().trim().min(20, "অন্তত ২০ অক্ষরে বিস্তারিত লিখুন").max(3000),
  ward: z.string().min(1, "ওয়ার্ড বেছে নিন"),
  location: z.string().trim().max(160).optional().or(z.literal("")),
  severity: z.enum(["low", "medium", "high", "critical"]),
  name: z.string().trim().max(80).optional().or(z.literal("")),
  phone: phone.optional().or(z.literal("")),
  anonymous: z.boolean().default(false),
  photo: z.string().max(2_000_000).optional().or(z.literal("")),
});

export const contactSchema = z.object({
  name: z.string().trim().min(3, "নাম লিখুন").max(80),
  email: z.string().trim().email("সঠিক ইমেইল দিন").optional().or(z.literal("")),
  phone: phone.optional().or(z.literal("")),
  subject: z.string().trim().min(3, "বিষয় লিখুন").max(140),
  message: z.string().trim().min(10, "বার্তা লিখুন").max(2000),
});

export const newsletterSchema = z.object({ email: z.string().trim().email("সঠিক ইমেইল দিন") });

export const chatSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  name: z.string().trim().max(80).optional(),
  phone: phone.optional().or(z.literal("")),
});

export const voteSchema = z.object({
  optionId: z.string().min(1),
  fingerprint: z.string().min(6).max(80),
});

export const eventRegistrationSchema = z.object({
  name: z.string().trim().min(3, "নাম লিখুন").max(80),
  phone,
  ward: z.string().min(1, "ওয়ার্ড বেছে নিন"),
  guests: z.coerce.number().min(0).max(10).default(0),
});

export const volunteerSchema = z.object({
  name: z.string().trim().min(3, "নাম লিখুন").max(80),
  phone,
  ward: z.string().min(1, "ওয়ার্ড বেছে নিন"),
  role: z.string().min(1, "ভূমিকা বেছে নিন"),
  availability: z.string().min(1, "সময় বেছে নিন"),
});

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
