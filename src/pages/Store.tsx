import { ShoppingBag, Zap, Palette, User, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = ["All", "Themes", "Avatars", "Boosts", "Special"];

const items = [
  { id: 1, name: "Ocean Theme", description: "Calm blue interface theme", price: 500, category: "Themes", icon: Palette, owned: false, color: "primary" },
  { id: 2, name: "Forest Theme", description: "Nature-inspired green theme", price: 500, category: "Themes", icon: Palette, owned: true, color: "xp" },
  { id: 3, name: "Sunset Theme", description: "Warm orange gradient theme", price: 750, category: "Themes", icon: Palette, owned: false, color: "streak" },
  { id: 4, name: "Robot Avatar", description: "Futuristic robot profile picture", price: 300, category: "Avatars", icon: User, owned: false, color: "level" },
  { id: 5, name: "Ninja Avatar", description: "Stealthy ninja profile picture", price: 400, category: "Avatars", icon: User, owned: true, color: "achievement" },
  { id: 6, name: "2x XP Boost", description: "Double XP for 1 hour", price: 200, category: "Boosts", icon: Zap, owned: false, color: "xp", consumable: true },
  { id: 7, name: "Streak Shield", description: "Protect your streak for 1 day", price: 150, category: "Boosts", icon: Sparkles, owned: false, color: "streak", consumable: true },
  { id: 8, name: "Premium Badge", description: "Exclusive premium user badge", price: 2000, category: "Special", icon: Sparkles, owned: false, color: "achievement", special: true },
];

export default function Store() {
  const userXp = 12450;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-achievement flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-achievement-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Reward Store</h1>
            <p className="text-muted-foreground">Spend your hard-earned XP on cool rewards</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 bg-xp/10 rounded-xl border border-xp/20">
          <Zap className="h-5 w-5 text-xp" />
          <span className="text-lg font-bold text-xp">{userXp.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">XP</span>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2">
        {categories.map((category, index) => (
          <button
            key={category}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              index === 0
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const canAfford = userXp >= item.price;

          return (
            <div
              key={item.id}
              className={cn(
                "bg-card rounded-2xl border p-6 transition-all",
                item.special && "border-achievement/30 glow-achievement",
                item.owned && "opacity-60",
                !item.special && "border-border/50 hover:border-primary/30"
              )}
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto",
                  item.color === "primary" && "bg-primary/20",
                  item.color === "xp" && "bg-xp/20",
                  item.color === "streak" && "bg-streak/20",
                  item.color === "level" && "bg-level/20",
                  item.color === "achievement" && "bg-achievement/20"
                )}
              >
                <item.icon
                  className={cn(
                    "h-8 w-8",
                    item.color === "primary" && "text-primary",
                    item.color === "xp" && "text-xp",
                    item.color === "streak" && "text-streak",
                    item.color === "level" && "text-level",
                    item.color === "achievement" && "text-achievement"
                  )}
                />
              </div>

              <div className="text-center">
                <h3 className="font-semibold text-foreground mb-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{item.description}</p>

                {item.owned ? (
                  <div className="px-4 py-2 bg-xp/10 rounded-lg text-xp font-medium">
                    Owned
                  </div>
                ) : (
                  <button
                    disabled={!canAfford}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                      canAfford
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {!canAfford && <Lock className="h-4 w-4" />}
                    <Zap className="h-4 w-4" />
                    {item.price}
                  </button>
                )}
              </div>

              {item.consumable && (
                <span className="absolute top-4 right-4 text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                  Consumable
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
