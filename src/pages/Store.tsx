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
  Timer,
  Package,
  type LucideIcon,
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
import { useStore, type StoreItem } from "@/hooks/useStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | "themes" | "avatars" | "powerups" | "boosts";

const ICON_MAP: Record<string, LucideIcon> = {
  Palette, Flame, Snowflake, Sun, Moon, Brain, Swords, Ghost, Wand2, Crown,
  ShieldCheck, Zap, Coffee, Sparkles, Rocket, Trophy, Gem, Star, Timer,
};

const CATEGORIES: { id: CategoryFilter; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "All", icon: ShoppingBag },
  { id: "themes", label: "Themes", icon: Palette },
  { id: "avatars", label: "Avatars", icon: Crown },
  { id: "powerups", label: "Power-ups", icon: Zap },
  { id: "boosts", label: "Boosts", icon: Rocket },
];

const RARITY_STYLES: Record<string, { label: string; ring: string; chip: string; glow: string }> = {
  common: { label: "Common", ring: "ring-border/60", chip: "bg-muted text-muted-foreground", glow: "" },
  rare: { label: "Rare", ring: "ring-primary/40", chip: "bg-primary/15 text-primary", glow: "shadow-[0_0_20px_-8px_hsl(var(--primary)/0.5)]" },
  epic: { label: "Epic", ring: "ring-level/50", chip: "bg-level/15 text-level", glow: "shadow-[0_0_25px_-8px_hsl(var(--level)/0.55)]" },
  legendary: { label: "Legendary", ring: "ring-achievement/60", chip: "bg-achievement/15 text-achievement", glow: "shadow-[0_0_30px_-6px_hsl(var(--achievement)/0.6)]" },
};

function formatTimeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m left`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h left`;
}

export default function Store() {
  const { profile, loading: profileLoading } = useProfile();
  const { items, boosts, cosmetics, loading: storeLoading, purchase, equip, ownedQty } = useStore();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [pending, setPending] = useState<StoreItem | null>(null);
  const [busy, setBusy] = useState(false);

  const xp = profile?.total_xp ?? 0;
  const loading = profileLoading || storeLoading;

  const visibleItems = useMemo(() => {
    if (activeCategory === "all") return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  const ownedItems = useMemo(
    () => items.filter((i) => ownedQty(i.id) > 0),
    [items, ownedQty]
  );

  const handleConfirmPurchase = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await purchase(pending.id);
      toast.success(`Unlocked: ${pending.name}`, {
        description: pending.duration_minutes > 0
          ? `Active for ${pending.duration_minutes >= 60 ? `${Math.floor(pending.duration_minutes / 60)}h` : `${pending.duration_minutes}m`}.`
          : "Added to your inventory.",
      });
      setPending(null);
    } catch (e: any) {
      toast.error("Purchase failed", { description: e?.message ?? "Try again." });
    } finally {
      setBusy(false);
    }
  };

  const handleEquip = async (item: StoreItem) => {
    try {
      await equip(item.id);
      window.dispatchEvent(new Event("cosmetics-changed"));
      toast.success(`${item.name} equipped`);
    } catch (e: any) {
      toast.error("Could not equip", { description: e?.message });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Hero Header */}
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

      {/* Active Boosts Banner */}
      {boosts.length > 0 && (
        <Card className="border-xp/30 bg-xp/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="h-4 w-4 text-xp" />
            <span className="text-sm font-semibold text-xp">Active Boosts</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {boosts.map((b) => {
              const item = items.find((i) => i.id === b.item_id);
              if (!item) return null;
              const Icon = ICON_MAP[item.icon] ?? Sparkles;
              return (
                <div
                  key={b.id}
                  className="inline-flex items-center gap-2 rounded-full bg-card-elevated border border-xp/30 px-3 py-1.5 text-xs"
                >
                  <Icon className="h-3.5 w-3.5 text-xp" />
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xp font-semibold">{b.multiplier}× XP</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{formatTimeLeft(b.expires_at)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Inventory Section */}
      {ownedItems.length > 0 && (
        <Card className="border-border/60 bg-card-elevated/40 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-display font-semibold">Your Inventory</h2>
            <Badge variant="secondary" className="text-[10px]">{ownedItems.length} item(s)</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {ownedItems.map((item) => {
              const Icon = ICON_MAP[item.icon] ?? Sparkles;
              const qty = ownedQty(item.id);
              const isEquippedTheme = item.item_type === "theme" && cosmetics.equipped_theme === item.id;
              const isEquippedAvatar = item.item_type === "avatar" && cosmetics.equipped_avatar === item.id;
              const isEquipped = isEquippedTheme || isEquippedAvatar;
              const isCosmetic = item.item_type === "theme" || item.item_type === "avatar";
              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border p-3 bg-card transition-all",
                    isEquipped ? "border-primary/60 ring-1 ring-primary/40" : "border-border/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-9 w-9 rounded-lg bg-card-elevated flex items-center justify-center">
                      <Icon className={cn("h-4 w-4", item.accent)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{item.name}</p>
                      {qty > 1 && <p className="text-[10px] text-muted-foreground">×{qty}</p>}
                    </div>
                  </div>
                  {isCosmetic && (
                    isEquipped ? (
                      <Badge variant="outline" className="w-full justify-center text-[10px] border-primary/40 text-primary">
                        <Check className="h-3 w-3 mr-1" /> Equipped
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-[10px]"
                        onClick={() => handleEquip(item)}
                      >
                        Equip
                      </Button>
                    )
                  )}
                  {item.item_type === "hint_token" && (
                    <p className="text-[10px] text-muted-foreground text-center">{qty} use(s) — auto-applied in quizzes</p>
                  )}
                  {item.item_type === "streak_shield" && (
                    <p className="text-[10px] text-muted-foreground text-center">{qty} shield(s) — auto-applied</p>
                  )}
                  {item.item_type === "permanent_badge" && (
                    <Badge className="w-full justify-center text-[10px] bg-achievement/15 text-achievement border-transparent">
                      Owned
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

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
        {loading && items.length === 0 ? (
          <p className="col-span-full text-center text-sm text-muted-foreground py-12">Loading store…</p>
        ) : visibleItems.map((item) => {
          const qty = ownedQty(item.id);
          const isCosmetic = item.item_type === "theme" || item.item_type === "avatar" || item.item_type === "permanent_badge" || item.item_type === "cosmetic_vault";
          const isOwned = isCosmetic ? qty > 0 : false; // stackable items can always be re-bought
          const canAfford = xp >= item.price;
          const rarity = RARITY_STYLES[item.rarity];
          const Icon = ICON_MAP[item.icon] ?? Sparkles;
          const isEquipped =
            (item.item_type === "theme" && cosmetics.equipped_theme === item.id) ||
            (item.item_type === "avatar" && cosmetics.equipped_avatar === item.id);

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
              <div className="flex items-start justify-between mb-4">
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", rarity.chip)}>
                  {rarity.label}
                </span>
                {isEquipped ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <Check className="h-3 w-3" /> Equipped
                  </span>
                ) : isOwned ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                    <Check className="h-3 w-3" /> Owned
                  </span>
                ) : qty > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    ×{qty}
                  </span>
                ) : null}
              </div>

              <div className="mb-4 flex justify-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-border/40 bg-card-elevated transition-transform duration-300 group-hover:scale-110">
                  <Icon className={cn("h-10 w-10", item.accent)} />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 via-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <h3 className="text-base font-display font-semibold text-foreground text-center">{item.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground text-center leading-relaxed min-h-[2.5rem]">
                {item.description}
              </p>

              <div className="mt-4 flex items-center justify-between gap-2 pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-xp" />
                  <span className="text-sm font-bold text-gradient-xp">
                    {item.price.toLocaleString()}
                  </span>
                </div>

                {isOwned && isCosmetic ? (
                  isEquipped ? (
                    <Button size="sm" variant="secondary" disabled className="h-8 text-xs">
                      <Check className="h-3.5 w-3.5" /> Equipped
                    </Button>
                  ) : (item.item_type === "theme" || item.item_type === "avatar") ? (
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleEquip(item)}>
                      Equip
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" disabled className="h-8 text-xs">
                      <Check className="h-3.5 w-3.5" /> Owned
                    </Button>
                  )
                ) : canAfford ? (
                  <Button
                    size="sm"
                    onClick={() => setPending(item)}
                    className="h-8 text-xs bg-gradient-primary hover:opacity-90"
                  >
                    {qty > 0 ? "Buy more" : "Unlock"}
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

      <p className="text-center text-xs text-muted-foreground pt-2">
        💡 Earn XP by completing tasks, finishing Pomodoros, and crushing quizzes. Boosts auto-activate on purchase.
      </p>

      {/* Confirm purchase dialog */}
      <AlertDialog open={!!pending} onOpenChange={(open) => !open && !busy && setPending(null)}>
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
              {pending?.duration_minutes ? (
                <span className="block mt-2 text-xs text-xp">
                  ⚡ Activates immediately for {pending.duration_minutes >= 60 ? `${Math.floor(pending.duration_minutes / 60)}h` : `${pending.duration_minutes}m`}.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPurchase} disabled={busy} className="bg-gradient-primary">
              {busy ? "Processing…" : "Confirm Unlock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
