import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CosmeticsState {
  equippedTheme: string | null;
  equippedAvatar: string | null;
  refresh: () => Promise<void>;
}

const CosmeticsContext = createContext<CosmeticsState>({
  equippedTheme: null,
  equippedAvatar: null,
  refresh: async () => {},
});

const ALL_THEME_CLASSES = [
  "theme-aurora",
  "theme-ember",
  "theme-arctic",
  "theme-solstice",
  "theme-midnight",
];

export function CosmeticsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [equippedTheme, setEquippedTheme] = useState<string | null>(null);
  const [equippedAvatar, setEquippedAvatar] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setEquippedTheme(null);
      setEquippedAvatar(null);
      return;
    }
    const { data } = await supabase
      .from("user_cosmetics" as any)
      .select("equipped_theme, equipped_avatar")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setEquippedTheme((data as any).equipped_theme);
      setEquippedAvatar((data as any).equipped_avatar);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    ALL_THEME_CLASSES.forEach((c) => root.classList.remove(c));
    if (equippedTheme) root.classList.add(equippedTheme);
    return () => {
      ALL_THEME_CLASSES.forEach((c) => root.classList.remove(c));
    };
  }, [equippedTheme]);

  // Listen for cosmetics-changed events (from Store)
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("cosmetics-changed", handler);
    return () => window.removeEventListener("cosmetics-changed", handler);
  }, [refresh]);

  return (
    <CosmeticsContext.Provider value={{ equippedTheme, equippedAvatar, refresh }}>
      {children}
    </CosmeticsContext.Provider>
  );
}

export const useCosmetics = () => useContext(CosmeticsContext);

// Map avatar item ids to lucide icon names (string), for components to render
export const AVATAR_ICON_MAP: Record<string, string> = {
  "avatar-scholar": "Brain",
  "avatar-knight": "Swords",
  "avatar-ghost": "Ghost",
  "avatar-wizard": "Wand2",
  "avatar-monarch": "Crown",
};
