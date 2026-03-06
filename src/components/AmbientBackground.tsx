const VARIANTS = {
  calendar: [
    "bg-primary/5 top-1/4 left-1/3 w-[500px] h-[500px]",
    "bg-level/5 bottom-1/4 right-1/4 w-[400px] h-[400px]",
    "bg-xp/3 top-2/3 left-1/2 w-[300px] h-[300px]",
  ],
  planner: [
    "bg-xp/5 top-1/3 right-1/3 w-[500px] h-[500px]",
    "bg-level/5 bottom-1/3 left-1/4 w-[400px] h-[400px]",
    "bg-primary/3 top-1/2 right-1/2 w-[300px] h-[300px]",
  ],
  dashboard: [
    "bg-primary/4 top-1/4 left-1/2 w-[600px] h-[600px]",
    "bg-xp/4 bottom-1/3 right-1/3 w-[400px] h-[400px]",
  ],
  flashcards: [
    "bg-primary/5 top-1/3 left-1/3 w-[500px] h-[500px]",
    "bg-achievement/5 bottom-1/4 right-1/4 w-[400px] h-[400px]",
    "bg-level/3 top-2/3 right-1/3 w-[300px] h-[300px]",
  ],
} as const;

type Variant = keyof typeof VARIANTS;

export function AmbientBackground({ variant = "dashboard" }: { variant?: Variant }) {
  const orbs = VARIANTS[variant];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {orbs.map((cls, i) => (
        <div
          key={i}
          className={`absolute rounded-full blur-3xl animate-pulse ${cls}`}
          style={{ animationDelay: `${i * 1.5}s`, animationDuration: `${4 + i}s` }}
        />
      ))}
    </div>
  );
}
