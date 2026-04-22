import { useMemo, useState } from "react";
import {
  ShoppingBag,
  Sparkles,
  Zap,
  Palette,
  Crown,
  Rocket,
  Flame,
  Snowflake,
  Sun,
  Moon,
  Ghost,
  Coffee,
  Brain,
  Trophy,
  Star,
  Lock,
  Check,
  ShieldCheck,
  Gem,
  Swords,
  Wand2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Category = "themes" | "avatars" | "powerups" | "boosts";
type Rarity = "common" | "rare" | "epic" | "legendary";

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  rarity: Rarity;
  icon: React.ComponentType<{ className?: string }>;
  accent: string; // tailwind text color token
}

const ITEMS: StoreItem[] = [
  // Themes
  { id: "theme-aurora", name: "Aurora", description: "Cool teal-violet gradient theme inspired by polar lights.", price: 800, category: "themes", rarity: "rare", icon: Palette, accent: "text-primary" },
  { id: "theme-ember", name: "Ember", description: "Warm sunset palette to keep late-night sessions cozy.", price: 800, category: "themes", rarity: "rare", icon: Flame, accent: "text-streak" },
  { id: "theme-arctic", name: "Arctic", description: "Crisp icy blues for laser-sharp focus.", price: 1200, category: "themes", rarity: "epic", icon: Snowflake, accent: "text-primary" },
  { id: "theme-solstice", name: "Solstice", description: "Golden-hour warmth to celebrate big wins.", price: 1500, category: "themes", rarity: "epic", icon: Sun, accent: "text-achievement" },
  { id: "theme-midnight", name: "Midnight Pro", description: "Pitch-black OLED-friendly theme with neon accents.", price: 2500, category: "themes", rarity: "legendary", icon: Moon, accent: "text-level" },

  // Avatars
  { id: "avatar-scholar", name: "The Scholar", description: "Classic studious aesthetic. Books, glasses, energy.", price: 500, category: "avatars", rarity: "common", icon: Brain, accent: "text-primary" },
  { id: "avatar-knight", name: "Focus Knight", description: "Armored against distractions. Defender of deep work.", price: 1000, category: "avatars", rarity: "rare", icon: Swords, accent: "text-level" },
  { id: "avatar-ghost", name: "Ghost Writer", description: "Spectral aesthetic for the night-owl learners.", price: 1200, category: "avatars", rarity: "rare", icon: Ghost, accent: "text-muted-foreground" },
  { id: "avatar-wizard", name: "Arcane Tutor", description: "Wizard vibes. Conjure knowledge from the void.", price: 2000, category: "avatars", rarity: "epic", icon: Wand2, accent: "text-level" },
  { id: "avatar-monarch", name: "XP Monarch", description: "Reserved for those who rule the leaderboard.", price: 4000, category: "avatars", rarity: "legendary", icon: Crown, accent: "text-achievement" },

  // Power-ups
  { id: "power-streak-shield", name: "Streak Shield", description: "Protect your streak for one missed day. Single use.", price: 600, category: "powerups", rarity: "common", icon: ShieldCheck, accent: "text-streak" },
  { id: "power-double-xp", name: "Double XP (1h)", description: "Earn 2× XP from all activities for 60 minutes.", price: 1500, category: "powerups", rarity: "rare", icon: Zap, accent: "text-xp" },
  { id: "power-focus-boost", name: "Focus Boost", description: "+50% XP from Pomodoro sessions today.", price: 900, category: "powerups", rarity: "common", icon: Coffee, accent: "text-primary" },
  { id: "power-hint-token", name: "Hint Token x3", description: "Reveal a hint on tough quiz questions. 3 uses.", price: 400, category: "powerups", rarity: "common", icon: Sparkles, accent: "text-achievement" },

  // Boosts (long-term)
  { id: "boost-mega-week", name: "Mega Week", description: "1.5× XP across all features for a full week.", price: 5000, category: "boosts", rarity: "epic", icon: Rocket, accent: "text-primary" },
  { id: "boost-perfectionist", name: "Perfectionist Badge", description: "Permanent profile badge for elite learners.", price: 7500, category: "boosts", rarity: "legendary", icon: Trophy, accent: "text-achievement" },
  { id: "boost-gem-cache", name: "Gem Cache", description: "Cosmetic vault: unlock rotating cosmetics weekly.", price: 3500, category: "boosts", rarity: "epic", icon: Gem, accent: "text-level" },
];

const CATEGORIES: { id: Category | "all"; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All", icon: ShoppingBag },
  { id: "themes", label: "Themes", icon: Palette },
  { id: "avatars", label: "Avatars", icon: Crown },
  { id: "powerups", label: "Power-ups", icon: Zap },
  { id: "boosts", label: "Boosts", icon: Rocket },
];

const RARITY_STYLES: Record<Rarity, { label: string; ring: string; chip: string; glow: string }> = {
  common: {
    label: "Common",
    ring: "ring-border/60",
    chip: "bg-muted text-muted-foreground",
    glow: "",
  },
  rare: {
    label: "Rare",
    ring: "ring-primary/40",
    chip: "bg-primary/15 text-primary",
    glow: "shadow-[0_0_20px_-8px_hsl(var(--primary)/0.5)]",
  },
  epic: {
    label: "Epic",
    ring: "ring-level/50",
    chip: "bg-level/15 text-level",
    glow: "shadow-[0_0_25px_-8px_hsl(var(--level)/0.55)]",
  },
  legendary: {
    label: "Legendary",
    ring: "ring-achievement/60",
    chip: "bg-achievement/15 text-achievement",
    glow: "shadow-[0_0_30px_-6px_hsl(var(--achievement)/0.6)]",
  },
};

const OWNED_KEY = "studymate.store.owned";

function loadOwned(): Set<string> {
  try {
    const raw = localStorage.getItem(OWNED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveOwned(owned: Set<string>) {
  localStorage.setItem(OWNED_KEY, JSON.stringify(Array.from(owned)));
}

export default function Store() {
  const { profile, loading } = useProfile();
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [owned, setOwned] = useState<Set<string>>(() => loadOwned());
  const [pending, setPending] = useState<StoreItem | null>(null);

  const xp = profile?.total_xp ?? 0;

  const visibleItems = useMemo(() => {
    if (activeCategory === "all") return ITEMS;
    return ITEMS.filter((i) => i.category === activeCategory);
  }, [activeCategory]);

  const handleConfirmPurchase = () => {
    if (!pending) return;
    // Frontend-only: mark as owned. (No real XP is deducted — backend integration pending.)
    const next = new Set(owned);
    next.add(pending.id);
    setOwned(next);
    saveOwned(next);
    toast.success(`Unlocked: ${pending.name}`, {
      description: "Added to your inventory. (XP deduction coming when backend is wired up.)",
    });
    setPending(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Hero / Header */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-card p-6 sm:p-8">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-level/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Badge className="bg-primary/15 text-primary border-transparent hover:bg-primary/15 gap-1.5">
              <Sparkles className="h-3 w-3" />
              Reward Store
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Spend XP. <span className="text-gradient-primary">Flex hard.</span>
            </h1>
            <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
              Trade your hard-earned XP for themes, avatars, power-ups, and boosts. Every grind has its reward.
            </p>
          </div>

          {/* XP Balance */}
          <div className="shrink-0">
            <div className="rounded-2xl border border-border/60 bg-card-elevated px-5 py-4 min-w-[200px]">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-xp" />
                Your Balance
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-gradient-xp">
                  {loading ? "—" : xp.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">XP</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="h-3 w-3 text-achievement" />
                Level {profile?.current_level ?? 1}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "border-primary/40 bg-primary/10 text-primary glow-primary"
                  : "border-border/60 bg-card text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="h-4 w-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Item Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
        {visibleItems.map((item) => {
          const isOwned = owned.has(item.id);
          const canAfford = xp >= item.price;
          const rarity = RARITY_STYLES[item.rarity];
          const Icon = item.icon;

          return (
            <Card
              key={item.id}
              className={cn(
                "group relative overflow-hidden border bg-gradient-card p-5 transition-all duration-300 ring-1",
                rarity.ring,
                rarity.glow,
                "hover:-translate-y-1 hover:border-primary/30"
              )}
            >
              {/* Rarity chip */}
              <div className="flex items-start justify-between mb-4">
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", rarity.chip)}>
                  {rarity.label}
                </span>
                {isOwned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                    <Check className="h-3 w-3" /> Owned
                  </span>
                )}
              </div>

              {/* Icon */}
              <div className="mb-4 flex justify-center">
                <div
                  className={cn(
                    "relative flex h-20 w-20 items-center justify-center rounded-2xl border border-border/40 bg-card-elevated transition-transform duration-300 group-hover:scale-110",
                  )}
                >
                  <Icon className={cn("h-10 w-10", item.accent)} />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 via-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-base font-display font-semibold text-foreground text-center">
                {item.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground text-center leading-relaxed min-h-[2.5rem]">
                {item.description}
              </p>

              {/* Price + Buy */}
              <div className="mt-4 flex items-center justify-between gap-2 pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-xp" />
                  <span className="text-sm font-bold text-gradient-xp">
                    {item.price.toLocaleString()}
                  </span>
                </div>

                {isOwned ? (
                  <Button size="sm" variant="secondary" disabled className="h-8 text-xs">
                    <Check className="h-3.5 w-3.5" />
                    Owned
                  </Button>
                ) : canAfford ? (
                  <Button
                    size="sm"
                    onClick={() => setPending(item)}
                    className="h-8 text-xs bg-gradient-primary hover:opacity-90"
                  >
                    Unlock
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled className="h-8 text-xs">
                    <Lock className="h-3.5 w-3.5" />
                    {(item.price - xp).toLocaleString()} XP
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground pt-2">
        💡 Earn XP by completing tasks, finishing Pomodoros, and crushing quizzes. Cosmetics & boosts are visual previews — full activation is coming soon.
      </p>

      {/* Confirm purchase dialog */}
      <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Unlock {pending?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will spend{" "}
              <span className="font-semibold text-foreground">
                {pending?.price.toLocaleString()} XP
              </span>
              . You'll have{" "}
              <span className="font-semibold text-foreground">
                {Math.max(0, xp - (pending?.price ?? 0)).toLocaleString()} XP
              </span>{" "}
              remaining.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPurchase} className="bg-gradient-primary">
              Confirm Unlock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
