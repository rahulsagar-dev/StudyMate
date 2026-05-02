import { Brain, Crown, Ghost, Swords, Wand2, LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import { AVATAR_ICONS as PICKER_ICONS, parseIconAvatar } from "@/components/ProfilePhotoPicker";

const AVATAR_ICONS: Record<string, { icon: LucideIcon; bg: string; fg: string }> = {
  "avatar-scholar": { icon: Brain, bg: "bg-primary/20", fg: "text-primary" },
  "avatar-knight": { icon: Swords, bg: "bg-level/20", fg: "text-level" },
  "avatar-ghost": { icon: Ghost, bg: "bg-muted", fg: "text-muted-foreground" },
  "avatar-wizard": { icon: Wand2, bg: "bg-level/20", fg: "text-level" },
  "avatar-monarch": { icon: Crown, bg: "bg-achievement/20", fg: "text-achievement" },
};

interface EquippedAvatarProps {
  fallbackInitial: string;
  fallbackUrl?: string | null;
  className?: string;
  iconClassName?: string;
}

/**
 * Renders the user's equipped avatar (from store) if any, otherwise falls back to
 * the profile avatar URL or initial.
 */
export function EquippedAvatar({
  fallbackInitial,
  fallbackUrl,
  className,
  iconClassName,
}: EquippedAvatarProps) {
  const { equippedAvatar } = useCosmetics();
  const equipped = equippedAvatar ? AVATAR_ICONS[equippedAvatar] : null;

  if (equipped) {
    const Icon = equipped.icon;
    return (
      <Avatar className={cn(className, "ring-2 ring-primary/30")}>
        <AvatarFallback className={cn(equipped.bg, "flex items-center justify-center")}>
          <Icon className={cn("h-1/2 w-1/2", equipped.fg, iconClassName)} />
        </AvatarFallback>
      </Avatar>
    );
  }

  // User-picked icon avatar (stored as "icon:<key>" in profiles.avatar_url)
  const iconKey = parseIconAvatar(fallbackUrl);
  if (iconKey && PICKER_ICONS[iconKey]) {
    const Icon = PICKER_ICONS[iconKey].icon;
    return (
      <Avatar className={cn(className, "ring-2 ring-primary/30")}>
        <AvatarFallback className={cn(PICKER_ICONS[iconKey].bg, "flex items-center justify-center")}>
          <Icon className={cn("h-1/2 w-1/2", PICKER_ICONS[iconKey].fg, iconClassName)} />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={className}>
      <AvatarImage src={fallbackUrl || undefined} />
      <AvatarFallback className="bg-primary/20 text-primary font-semibold">
        {fallbackInitial}
      </AvatarFallback>
    </Avatar>
  );
}
