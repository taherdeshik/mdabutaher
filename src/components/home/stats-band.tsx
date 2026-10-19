import { stats } from "@/content/site";
import { Counter } from "@/components/ui/counter";
import { Reveal } from "@/components/ui/reveal";

export function StatsBand() {
  return (
    <div className="relative overflow-hidden border-b border-forest/8 bg-cream pt-8">
      <div className="container-x grid grid-cols-2 gap-y-8 pb-10 pt-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="relative px-2 text-center sm:text-left">
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <p className="font-display text-[2rem] font-bold leading-none text-forest sm:text-[2.4rem]">
                <Counter value={s.value} suffix={s.suffix} />
              </p>
              <p className="text-[0.8rem] font-semibold text-forest/80">{s.label}</p>
              <p className="text-[0.66rem] text-muted">{s.hint}</p>
            </div>
            {i < stats.length - 1 && (
              <span className="absolute -right-2 top-1/2 hidden h-10 w-px -translate-y-1/2 bg-forest/10 lg:block" />
            )}
          </Reveal>
        ))}
      </div>
    </div>
  );
}
