-- =============================================================
-- 1. STORE ITEMS CATALOG
-- =============================================================
CREATE TABLE public.store_items (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('themes','avatars','powerups','boosts')),
  rarity text NOT NULL CHECK (rarity IN ('common','rare','epic','legendary')),
  price integer NOT NULL CHECK (price >= 0),
  item_type text NOT NULL CHECK (item_type IN ('theme','avatar','streak_shield','xp_multiplier','hint_token','permanent_badge','cosmetic_vault')),
  effect_value real DEFAULT 0,           -- multiplier (e.g. 2.0) or count (e.g. 3 hints)
  duration_minutes integer DEFAULT 0,    -- 0 = instant/permanent, >0 = timed
  scope text DEFAULT 'all' CHECK (scope IN ('all','pomodoro','quiz')),
  single_use boolean DEFAULT false,
  icon text NOT NULL,
  accent text DEFAULT 'text-primary',
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store items are viewable by all authenticated users"
  ON public.store_items FOR SELECT
  TO authenticated
  USING (true);

-- Seed catalog
INSERT INTO public.store_items (id, name, description, category, rarity, price, item_type, effect_value, duration_minutes, scope, single_use, icon, accent, sort_order) VALUES
  -- Themes
  ('theme-aurora',   'Aurora',       'Cool teal-violet gradient theme inspired by polar lights.', 'themes',   'rare',      800,  'theme',          0,   0, 'all', false, 'Palette',   'text-primary',         10),
  ('theme-ember',    'Ember',        'Warm sunset palette to keep late-night sessions cozy.',     'themes',   'rare',      800,  'theme',          0,   0, 'all', false, 'Flame',     'text-streak',          11),
  ('theme-arctic',   'Arctic',       'Crisp icy blues for laser-sharp focus.',                    'themes',   'epic',     1200,  'theme',          0,   0, 'all', false, 'Snowflake', 'text-primary',         12),
  ('theme-solstice', 'Solstice',     'Golden-hour warmth to celebrate big wins.',                 'themes',   'epic',     1500,  'theme',          0,   0, 'all', false, 'Sun',       'text-achievement',     13),
  ('theme-midnight', 'Midnight Pro', 'Pitch-black OLED-friendly theme with neon accents.',        'themes',   'legendary',2500,  'theme',          0,   0, 'all', false, 'Moon',      'text-level',           14),

  -- Avatars
  ('avatar-scholar', 'The Scholar',   'Classic studious aesthetic. Books, glasses, energy.',        'avatars', 'common',     500,  'avatar',         0,   0, 'all', false, 'Brain',  'text-primary',          20),
  ('avatar-knight',  'Focus Knight',  'Armored against distractions. Defender of deep work.',       'avatars', 'rare',      1000,  'avatar',         0,   0, 'all', false, 'Swords', 'text-level',            21),
  ('avatar-ghost',   'Ghost Writer',  'Spectral aesthetic for the night-owl learners.',             'avatars', 'rare',      1200,  'avatar',         0,   0, 'all', false, 'Ghost',  'text-muted-foreground', 22),
  ('avatar-wizard',  'Arcane Tutor',  'Wizard vibes. Conjure knowledge from the void.',             'avatars', 'epic',      2000,  'avatar',         0,   0, 'all', false, 'Wand2',  'text-level',            23),
  ('avatar-monarch', 'XP Monarch',    'Reserved for those who rule the leaderboard.',               'avatars', 'legendary', 4000,  'avatar',         0,   0, 'all', false, 'Crown',  'text-achievement',      24),

  -- Power-ups
  ('power-streak-shield','Streak Shield','Protect your streak for one missed day. Single use.',    'powerups','common',   600, 'streak_shield',  0,    0,    'all',      true,  'ShieldCheck','text-streak',     30),
  ('power-double-xp',    'Double XP (1h)','Earn 2× XP from all activities for 60 minutes.',         'powerups','rare',    1500, 'xp_multiplier',  2.0,  60,   'all',      false, 'Zap',        'text-xp',         31),
  ('power-focus-boost',  'Focus Boost',  '+50% XP from Pomodoro sessions for 4 hours.',             'powerups','common',   900, 'xp_multiplier',  1.5,  240,  'pomodoro', false, 'Coffee',     'text-primary',    32),
  ('power-hint-token',   'Hint Token x3','Reveal a hint on tough quiz questions. 3 uses.',          'powerups','common',   400, 'hint_token',     3,    0,    'quiz',     true,  'Sparkles',   'text-achievement',33),

  -- Boosts (long-term)
  ('boost-mega-week',     'Mega Week',           '1.5× XP across all features for a full week.',   'boosts','epic',     5000, 'xp_multiplier',  1.5,  10080, 'all', false, 'Rocket', 'text-primary',     40),
  ('boost-perfectionist', 'Perfectionist Badge', 'Permanent profile badge for elite learners.',    'boosts','legendary',7500, 'permanent_badge',0,    0,     'all', false, 'Trophy', 'text-achievement', 41),
  ('boost-gem-cache',     'Gem Cache',           'Cosmetic vault: unlock rotating cosmetics weekly.', 'boosts','epic', 3500, 'cosmetic_vault', 0,    0,     'all', false, 'Gem',    'text-level',       42);

-- =============================================================
-- 2. USER INVENTORY
-- =============================================================
CREATE TABLE public.user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id text NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  acquired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory" ON public.user_inventory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Inserts/updates handled by SECURITY DEFINER functions only; no direct policies for INSERT/UPDATE/DELETE

CREATE INDEX idx_user_inventory_user ON public.user_inventory(user_id);

-- =============================================================
-- 3. ACTIVE BOOSTS
-- =============================================================
CREATE TABLE public.active_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id text NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
  multiplier real NOT NULL DEFAULT 1.0,
  scope text NOT NULL DEFAULT 'all' CHECK (scope IN ('all','pomodoro','quiz')),
  activated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.active_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own active boosts" ON public.active_boosts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_active_boosts_user_expires ON public.active_boosts(user_id, expires_at);

-- =============================================================
-- 4. EQUIPPED COSMETICS
-- =============================================================
CREATE TABLE public.user_cosmetics (
  user_id uuid PRIMARY KEY,
  equipped_theme text REFERENCES public.store_items(id) ON DELETE SET NULL,
  equipped_avatar text REFERENCES public.store_items(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_cosmetics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cosmetics" ON public.user_cosmetics
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- =============================================================
-- 5. PURCHASE FUNCTION (atomic, validates XP, grants item)
-- =============================================================
CREATE OR REPLACE FUNCTION public.purchase_store_item(p_item_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_item public.store_items%ROWTYPE;
  v_user_xp integer;
  v_existing_qty integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_item FROM public.store_items WHERE id = p_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found: %', p_item_id;
  END IF;

  -- Lock the profile row to prevent race conditions
  SELECT total_xp INTO v_user_xp FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF v_user_xp IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  IF v_user_xp < v_item.price THEN
    RAISE EXCEPTION 'Not enough XP. Need %, have %', v_item.price, v_user_xp;
  END IF;

  -- For non-stackable items (themes, avatars, badges), reject duplicates
  IF v_item.item_type IN ('theme','avatar','permanent_badge','cosmetic_vault') THEN
    SELECT quantity INTO v_existing_qty FROM public.user_inventory
      WHERE user_id = v_user_id AND item_id = p_item_id;
    IF v_existing_qty IS NOT NULL AND v_existing_qty > 0 THEN
      RAISE EXCEPTION 'Item already owned';
    END IF;
  END IF;

  -- Deduct XP
  UPDATE public.profiles
    SET total_xp = total_xp - v_item.price,
        current_level = public.calculate_level(total_xp - v_item.price),
        updated_at = now()
    WHERE id = v_user_id;

  INSERT INTO public.xp_transactions (user_id, amount, source, source_id)
    VALUES (v_user_id, -v_item.price, 'store_purchase', NULL);

  -- Grant item
  INSERT INTO public.user_inventory (user_id, item_id, quantity)
    VALUES (v_user_id, p_item_id,
            CASE WHEN v_item.item_type = 'hint_token' THEN v_item.effect_value::int ELSE 1 END)
    ON CONFLICT (user_id, item_id) DO UPDATE
      SET quantity = public.user_inventory.quantity +
                     CASE WHEN v_item.item_type = 'hint_token' THEN v_item.effect_value::int ELSE 1 END;

  -- Auto-activate timed boosts on purchase
  IF v_item.item_type = 'xp_multiplier' AND v_item.duration_minutes > 0 THEN
    INSERT INTO public.active_boosts (user_id, item_id, multiplier, scope, expires_at)
      VALUES (v_user_id, p_item_id, v_item.effect_value, v_item.scope,
              now() + make_interval(mins => v_item.duration_minutes));
  END IF;

  -- Auto-equip cosmetic if user has none equipped yet
  IF v_item.item_type IN ('theme','avatar') THEN
    INSERT INTO public.user_cosmetics (user_id, equipped_theme, equipped_avatar)
      VALUES (
        v_user_id,
        CASE WHEN v_item.item_type = 'theme' THEN p_item_id ELSE NULL END,
        CASE WHEN v_item.item_type = 'avatar' THEN p_item_id ELSE NULL END
      )
      ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'item_id', p_item_id,
    'xp_spent', v_item.price,
    'remaining_xp', v_user_xp - v_item.price
  );
END;
$$;

-- =============================================================
-- 6. CONSUME INVENTORY ITEM (hint tokens etc.)
-- =============================================================
CREATE OR REPLACE FUNCTION public.consume_inventory_item(p_item_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_qty integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT quantity INTO v_qty FROM public.user_inventory
    WHERE user_id = v_user_id AND item_id = p_item_id FOR UPDATE;

  IF v_qty IS NULL OR v_qty <= 0 THEN
    RAISE EXCEPTION 'Item not available in inventory';
  END IF;

  UPDATE public.user_inventory
    SET quantity = quantity - 1
    WHERE user_id = v_user_id AND item_id = p_item_id;

  RETURN jsonb_build_object('success', true, 'remaining', v_qty - 1);
END;
$$;

-- =============================================================
-- 7. EQUIP COSMETIC (theme or avatar)
-- =============================================================
CREATE OR REPLACE FUNCTION public.equip_cosmetic(p_item_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_item public.store_items%ROWTYPE;
  v_owned integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_item FROM public.store_items WHERE id = p_item_id;
  IF NOT FOUND OR v_item.item_type NOT IN ('theme','avatar') THEN
    RAISE EXCEPTION 'Not a cosmetic item';
  END IF;

  SELECT quantity INTO v_owned FROM public.user_inventory
    WHERE user_id = v_user_id AND item_id = p_item_id;
  IF v_owned IS NULL OR v_owned <= 0 THEN
    RAISE EXCEPTION 'You do not own this item';
  END IF;

  INSERT INTO public.user_cosmetics (user_id, equipped_theme, equipped_avatar, updated_at)
    VALUES (
      v_user_id,
      CASE WHEN v_item.item_type = 'theme' THEN p_item_id ELSE NULL END,
      CASE WHEN v_item.item_type = 'avatar' THEN p_item_id ELSE NULL END,
      now()
    )
    ON CONFLICT (user_id) DO UPDATE
      SET equipped_theme  = CASE WHEN v_item.item_type = 'theme'  THEN p_item_id ELSE public.user_cosmetics.equipped_theme  END,
          equipped_avatar = CASE WHEN v_item.item_type = 'avatar' THEN p_item_id ELSE public.user_cosmetics.equipped_avatar END,
          updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- =============================================================
-- 8. GET ACTIVE XP MULTIPLIER
-- =============================================================
CREATE OR REPLACE FUNCTION public.get_xp_multiplier(p_user_id uuid, p_scope text DEFAULT 'all')
RETURNS real
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(multiplier), 1.0)
  FROM public.active_boosts
  WHERE user_id = p_user_id
    AND expires_at > now()
    AND (scope = 'all' OR scope = p_scope);
$$;

-- =============================================================
-- 9. UPDATE award_xp TO APPLY MULTIPLIERS
-- =============================================================
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_amount integer, p_source text, p_source_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_multiplier real;
  v_scope text;
  v_final_amount integer;
BEGIN
  -- Allow self or trusted internal callers (complete_task runs SECURITY DEFINER and may have null auth.uid())
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot award XP to another user';
  END IF;

  IF p_amount <= 0 OR p_amount > 1000 THEN
    RAISE EXCEPTION 'Invalid XP amount: must be between 1 and 1000';
  END IF;

  -- Determine scope from source
  v_scope := CASE
    WHEN p_source = 'pomodoro' THEN 'pomodoro'
    WHEN p_source = 'quiz' THEN 'quiz'
    ELSE 'all'
  END;

  v_multiplier := public.get_xp_multiplier(p_user_id, v_scope);
  v_final_amount := LEAST(2000, GREATEST(1, ROUND(p_amount * v_multiplier)));

  UPDATE public.profiles
    SET total_xp = total_xp + v_final_amount,
        current_level = public.calculate_level(total_xp + v_final_amount),
        updated_at = now()
    WHERE id = p_user_id;

  INSERT INTO public.xp_transactions (user_id, amount, source, source_id)
    VALUES (p_user_id, v_final_amount, p_source, p_source_id);
END;
$$;

-- =============================================================
-- 10. UPDATE update_streak TO CONSUME STREAK SHIELD
-- =============================================================
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_date DATE;
  new_streak INTEGER;
  v_shield_qty integer;
  v_gap integer;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot update another user streak';
  END IF;

  SELECT last_activity_date, current_streak INTO last_date, new_streak
    FROM public.profiles WHERE id = p_user_id;

  IF last_date IS NULL THEN
    new_streak := 1;
  ELSIF last_date = CURRENT_DATE - 1 THEN
    new_streak := new_streak + 1;
  ELSIF last_date = CURRENT_DATE THEN
    -- Already updated today, no change to streak
    RETURN;
  ELSE
    -- Missed one or more days — try to consume streak shields
    v_gap := (CURRENT_DATE - last_date - 1);
    SELECT quantity INTO v_shield_qty FROM public.user_inventory
      WHERE user_id = p_user_id AND item_id = 'power-streak-shield' FOR UPDATE;

    IF v_shield_qty IS NOT NULL AND v_shield_qty >= v_gap THEN
      -- Consume shields, preserve streak
      UPDATE public.user_inventory
        SET quantity = quantity - v_gap
        WHERE user_id = p_user_id AND item_id = 'power-streak-shield';
      new_streak := new_streak + 1;
    ELSE
      new_streak := 1;
    END IF;
  END IF;

  UPDATE public.profiles
    SET current_streak = new_streak,
        longest_streak = GREATEST(longest_streak, new_streak),
        last_activity_date = CURRENT_DATE,
        updated_at = now()
    WHERE id = p_user_id;
END;
$$;