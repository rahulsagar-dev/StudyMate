import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type StoreCategory = "themes" | "avatars" | "powerups" | "boosts";
export type StoreRarity = "common" | "rare" | "epic" | "legendary";
export type StoreItemType =
  | "theme"
  | "avatar"
  | "streak_shield"
  | "xp_multiplier"
  | "hint_token"
  | "permanent_badge"
  | "cosmetic_vault";

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  category: StoreCategory;
  rarity: StoreRarity;
  price: number;
  item_type: StoreItemType;
  effect_value: number;
  duration_minutes: number;
  scope: "all" | "pomodoro" | "quiz";
  single_use: boolean;
  icon: string;
  accent: string;
  sort_order: number;
}

export interface InventoryRow {
  item_id: string;
  quantity: number;
  acquired_at: string;
}

export interface ActiveBoost {
  id: string;
  item_id: string;
  multiplier: number;
  scope: "all" | "pomodoro" | "quiz";
  activated_at: string;
  expires_at: string;
}

export interface Cosmetics {
  equipped_theme: string | null;
  equipped_avatar: string | null;
}

export function useStore() {
  const { user } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [boosts, setBoosts] = useState<ActiveBoost[]>([]);
  const [cosmetics, setCosmetics] = useState<Cosmetics>({
    equipped_theme: null,
    equipped_avatar: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const [itemsRes, invRes, boostsRes, cosmRes] = await Promise.all([
      supabase.from("store_items" as any).select("*").order("sort_order"),
      supabase.from("user_inventory" as any).select("item_id, quantity, acquired_at").eq("user_id", user.id),
      supabase
        .from("active_boosts" as any)
        .select("*")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString()),
      supabase.from("user_cosmetics" as any).select("equipped_theme, equipped_avatar").eq("user_id", user.id).maybeSingle(),
    ]);

    if (itemsRes.data) setItems(itemsRes.data as unknown as StoreItem[]);
    if (invRes.data) setInventory(invRes.data as unknown as InventoryRow[]);
    if (boostsRes.data) setBoosts(boostsRes.data as unknown as ActiveBoost[]);
    if (cosmRes.data) setCosmetics(cosmRes.data as unknown as Cosmetics);
    else setCosmetics({ equipped_theme: null, equipped_avatar: null });

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Re-fetch active boosts every 30 seconds so timers expire client-side too
  useEffect(() => {
    const interval = setInterval(() => {
      setBoosts((prev) => prev.filter((b) => new Date(b.expires_at) > new Date()));
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const purchase = useCallback(
    async (itemId: string) => {
      const { data, error } = await supabase.rpc("purchase_store_item" as any, { p_item_id: itemId });
      if (error) throw error;
      window.dispatchEvent(new Event("xp-changed"));
      await fetchAll();
      return data;
    },
    [fetchAll]
  );

  const equip = useCallback(
    async (itemId: string) => {
      const { data, error } = await supabase.rpc("equip_cosmetic" as any, { p_item_id: itemId });
      if (error) throw error;
      await fetchAll();
      return data;
    },
    [fetchAll]
  );

  const consume = useCallback(
    async (itemId: string) => {
      const { data, error } = await supabase.rpc("consume_inventory_item" as any, { p_item_id: itemId });
      if (error) throw error;
      await fetchAll();
      return data;
    },
    [fetchAll]
  );

  const ownedQty = useCallback(
    (itemId: string) => inventory.find((r) => r.item_id === itemId)?.quantity ?? 0,
    [inventory]
  );

  return {
    items,
    inventory,
    boosts,
    cosmetics,
    loading,
    purchase,
    equip,
    consume,
    ownedQty,
    refetch: fetchAll,
  };
}
