import {
  AlertTriangle, Baby, BookOpen, Calendar, CheckCircle2, Droplets, FileText, Folder,
  GraduationCap, Heart, HeartPulse, Lightbulb, Map, MessageSquare, Mic, Monitor,
  Route, Scale, Shield, Siren, Sparkles, Stethoscope, Users, Wheat, type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  book: BookOpen, droplets: Droplets, "heart-pulse": HeartPulse, road: Route, shield: Shield,
  wheat: Wheat, monitor: Monitor, users: Users, scale: Scale, heart: Heart, alert: AlertTriangle,
  lightbulb: Lightbulb, mic: Mic, message: MessageSquare, stethoscope: Stethoscope, baby: Baby,
  siren: Siren, calendar: Calendar, folder: Folder, file: FileText, check: CheckCircle2,
  map: Map, sparkles: Sparkles, graduation: GraduationCap,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = icons[name] ?? Sparkles;
  return <Cmp className={className} aria-hidden />;
}
