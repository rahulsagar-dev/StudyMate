import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Crown, Ghost, Swords, Wand2, Rocket, Flame, Trophy, Gem, Upload, Trash2, Loader2, LucideIcon, Check, Lock, ShoppingBag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Each picker avatar maps to a store item id. Users must own the store item to equip.
export const AVATAR_ICONS: Record<string, {
  icon: LucideIcon; bg: string; fg: string; label: string; storeItemId: string; price: number;
}> = {
  scholar: { icon: Brain,  bg: "bg-primary/20",     fg: "text-primary",          label: "The Scholar",    storeItemId: "avatar-scholar", price: 500 },
  rocket:  { icon: Rocket, bg: "bg-xp/20",          fg: "text-xp",               label: "Cosmic Cadet",   storeItemId: "avatar-rocket",  price: 600 },
  knight:  { icon: Swords, bg: "bg-level/20",       fg: "text-level",            label: "Focus Knight",   storeItemId: "avatar-knight",  price: 1000 },
  ghost:   { icon: Ghost,  bg: "bg-muted",          fg: "text-muted-foreground", label: "Ghost Writer",   storeItemId: "avatar-ghost",   price: 1200 },
  flame:   { icon: Flame,  bg: "bg-streak/20",      fg: "text-streak",           label: "Streak Phoenix", storeItemId: "avatar-flame",   price: 1500 },
  wizard:  { icon: Wand2,  bg: "bg-level/20",       fg: "text-level",            label: "Arcane Tutor",   storeItemId: "avatar-wizard",  price: 2000 },
  trophy:  { icon: Trophy, bg: "bg-achievement/20", fg: "text-achievement",      label: "Champion",       storeItemId: "avatar-trophy",  price: 2500 },
  monarch: { icon: Crown,  bg: "bg-achievement/20", fg: "text-achievement",      label: "XP Monarch",     storeItemId: "avatar-monarch", price: 4000 },
  gem:     { icon: Gem,    bg: "bg-primary/20",     fg: "text-primary",          label: "Diamond Mind",   storeItemId: "avatar-gem",     price: 5000 },
};

export function parseIconAvatar(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("icon:")) return url.slice(5);
  return null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentAvatarUrl: string | null | undefined;
  fallbackInitial: string;
  onUpdated: () => void;
}

export function ProfilePhotoPicker({ open, onOpenChange, userId, currentAvatarUrl, fallbackInitial, onUpdated }: Props) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [savingIcon, setSavingIcon] = useState<string | null>(null);
  const [ownedItems, setOwnedItems] = useState<Set<string>>(new Set());
  const [loadingInventory, setLoadingInventory] = useState(true);
  const currentIcon = parseIconAvatar(currentAvatarUrl);
  const isPhoto = currentAvatarUrl && !currentAvatarUrl.startsWith("icon:");

  // Load which store avatars the user owns
  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    (async () => {
      setLoadingInventory(true);
      const { data } = await supabase
        .from("user_inventory")
        .select("item_id, quantity")
        .eq("user_id", userId)
        .gt("quantity", 0);
      if (!cancelled) {
        setOwnedItems(new Set((data ?? []).map((r: any) => r.item_id)));
        setLoadingInventory(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, userId]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
      if (updErr) throw updErr;
      toast({ title: "Profile photo updated!" });
      onUpdated();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message ?? "Try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handlePickIcon = async (key: string) => {
    const av = AVATAR_ICONS[key];
    if (!ownedItems.has(av.storeItemId)) {
      toast({
        title: "Locked avatar 🔒",
        description: `Buy "${av.label}" from the Store for ${av.price.toLocaleString()} XP to unlock it.`,
      });
      return;
    }
    setSavingIcon(key);
    const { error } = await supabase.from("profiles").update({ avatar_url: `icon:${key}` }).eq("id", userId);
    setSavingIcon(null);
    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Avatar updated!" });
    onUpdated();
    onOpenChange(false);
  };

  const handleRemove = async () => {
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
    if (error) {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Profile photo removed" });
    onUpdated();
    onOpenChange(false);
  };

  const ownedCount = Object.values(AVATAR_ICONS).filter(a => ownedItems.has(a.storeItemId)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change profile photo</DialogTitle>
          <DialogDescription>Upload your own photo or equip a collectible avatar from the Store.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload photo</TabsTrigger>
            <TabsTrigger value="avatar">Choose avatar</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4 space-y-4">
            <div className="flex items-center justify-center">
              <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                {isPhoto ? <AvatarImage src={currentAvatarUrl || undefined} /> : null}
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-semibold">
                  {fallbackInitial}
                </AvatarFallback>
              </Avatar>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {uploading ? "Uploading…" : "Choose photo from device"}
              </Button>
              {currentAvatarUrl && (
                <Button variant="ghost" onClick={handleRemove} className="w-full text-destructive hover:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Remove current photo
                </Button>
              )}
              <p className="text-xs text-muted-foreground text-center">PNG, JPG, WEBP or GIF · Max 5MB</p>
            </div>
          </TabsContent>

          <TabsContent value="avatar" className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {loadingInventory ? "Loading collection…" : `Unlocked: ${ownedCount} / ${Object.keys(AVATAR_ICONS).length}`}
              </span>
              <button
                onClick={() => { onOpenChange(false); navigate("/store"); }}
                className="flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <ShoppingBag className="h-3.5 w-3.5" /> Visit Store
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {Object.entries(AVATAR_ICONS).map(([key, av]) => {
                const Icon = av.icon;
                const isSelected = currentIcon === key;
                const isSaving = savingIcon === key;
                const isOwned = ownedItems.has(av.storeItemId);
                const isLocked = !isOwned && !loadingInventory;

                return (
                  <button
                    key={key}
                    onClick={() => handlePickIcon(key)}
                    disabled={!!savingIcon}
                    title={isLocked ? `Locked — ${av.price.toLocaleString()} XP in Store` : av.label}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : isLocked
                          ? "border-border/30 hover:border-border/60 cursor-not-allowed"
                          : "border-border/50 hover:border-primary/50 hover:bg-secondary/50"
                    )}
                  >
                    <div className={cn(
                      "relative h-14 w-14 rounded-full flex items-center justify-center transition-all",
                      av.bg,
                      isLocked && "opacity-40 grayscale"
                    )}>
                      {isSaving ? (
                        <Loader2 className={cn("h-6 w-6 animate-spin", av.fg)} />
                      ) : (
                        <Icon className={cn("h-7 w-7", av.fg)} />
                      )}
                      {isLocked && (
                        <div className="absolute inset-0 rounded-full bg-background/40 flex items-center justify-center">
                          <Lock className="h-5 w-5 text-foreground/80" />
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-medium text-center leading-tight",
                      isLocked ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {av.label}
                    </span>
                    {isLocked && (
                      <span className="text-[10px] text-xp font-semibold">{av.price.toLocaleString()} XP</span>
                    )}
                    {isSelected && (
                      <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground text-center pt-1">
              🔒 Avatars are collectibles. Earn XP by studying, then unlock them in the Store.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
