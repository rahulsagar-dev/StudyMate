
INSERT INTO public.store_items (id, name, description, category, rarity, price, item_type, effect_value, duration_minutes, scope, single_use, icon, accent, sort_order) VALUES
  -- Themes
  ('theme-sakura', 'Sakura Bloom', 'Soft pink cherry-blossom palette for serene study sessions.', 'themes', 'rare', 1000, 'theme', 0, 0, 'all', false, 'Sparkles', 'text-primary', 15),
  ('theme-forest', 'Deep Forest', 'Earthy emerald greens for focused, grounded study.', 'themes', 'epic', 1800, 'theme', 0, 0, 'all', false, 'Brain', 'text-success', 16),
  ('theme-galaxy', 'Galaxy Drift', 'Deep cosmic purple with starlight accents.', 'themes', 'legendary', 3000, 'theme', 0, 0, 'all', false, 'Star', 'text-level', 17),

  -- Avatars
  ('avatar-rocket', 'Cosmic Cadet', 'For learners who blast past goals.', 'avatars', 'common', 600, 'avatar', 0, 0, 'all', false, 'Rocket', 'text-primary', 25),
  ('avatar-flame', 'Streak Phoenix', 'Worn by those who never let the fire die.', 'avatars', 'rare', 1500, 'avatar', 0, 0, 'all', false, 'Flame', 'text-streak', 26),
  ('avatar-trophy', 'Champion', 'For perfectionists who collect victories.', 'avatars', 'epic', 2500, 'avatar', 0, 0, 'all', false, 'Trophy', 'text-achievement', 27),
  ('avatar-gem', 'Diamond Mind', 'Crystal-clear thinking, cut and polished.', 'avatars', 'legendary', 5000, 'avatar', 0, 0, 'all', false, 'Gem', 'text-level', 28),

  -- Power-ups
  ('power-hint-token-large', 'Hint Pack x10', '10 quiz hints. Auto-applied when you''re stuck.', 'powerups', 'rare', 1200, 'hint_token', 10, 0, 'quiz', false, 'Sparkles', 'text-achievement', 34),
  ('power-streak-shield-pack', 'Shield Pack x3', 'Three streak shields. Insurance against bad days.', 'powerups', 'rare', 1500, 'streak_shield', 3, 0, 'all', false, 'ShieldCheck', 'text-streak', 35),
  ('power-quiz-boost', 'Quiz Surge', '2× XP on quizzes for 2 hours.', 'powerups', 'rare', 1100, 'xp_multiplier', 2, 120, 'quiz', false, 'Brain', 'text-primary', 36),
  ('power-triple-xp', 'Triple XP (30m)', '3× XP on everything for 30 minutes. Burst hard.', 'powerups', 'epic', 2200, 'xp_multiplier', 3, 30, 'all', false, 'Zap', 'text-xp', 37),

  -- Boosts
  ('boost-weekend-warrior', 'Weekend Warrior', '1.5× XP on everything for 48 hours. Make weekends count.', 'boosts', 'rare', 2000, 'xp_multiplier', 1.5, 2880, 'all', false, 'Rocket', 'text-primary', 43),
  ('boost-marathon-month', 'Marathon Month', '1.25× XP on everything for 30 days. The slow grind.', 'boosts', 'epic', 6000, 'xp_multiplier', 1.25, 43200, 'all', false, 'Timer', 'text-level', 44),
  ('boost-legend-badge', 'Legend Badge', 'Permanent badge of greatness. Pure flex.', 'boosts', 'legendary', 10000, 'permanent_badge', 0, 0, 'all', false, 'Crown', 'text-achievement', 45)
ON CONFLICT (id) DO NOTHING;
