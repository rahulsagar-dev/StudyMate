-- Fix security warnings: Add search_path to functions missing it

-- Fix calculate_level function
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF xp >= 50000 THEN RETURN 8;      -- Legend
  ELSIF xp >= 35000 THEN RETURN 7;   -- Grandmaster
  ELSIF xp >= 20000 THEN RETURN 6;   -- Master
  ELSIF xp >= 10000 THEN RETURN 5;   -- Expert
  ELSIF xp >= 5000 THEN RETURN 4;    -- Scholar
  ELSIF xp >= 2500 THEN RETURN 3;    -- Student
  ELSIF xp >= 1000 THEN RETURN 2;    -- Learner
  ELSE RETURN 1;                      -- Beginner
  END IF;
END;
$$;

-- Fix handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;