CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  roblox_id bigint NOT NULL UNIQUE,
  username text NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  balance numeric(14,2) NOT NULL DEFAULT 1000,
  wagered numeric(14,2) NOT NULL DEFAULT 0,
  profit numeric(14,2) NOT NULL DEFAULT 0,
  luck numeric(5,2) NOT NULL DEFAULT 1,
  multiplier_boost numeric(5,2) NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles are public readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game text NOT NULL,
  wager numeric(14,2) NOT NULL,
  multiplier numeric(10,2) NOT NULL DEFAULT 0,
  payout numeric(14,2) NOT NULL DEFAULT 0,
  won boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.bets TO authenticated;
GRANT SELECT ON public.bets TO anon;
GRANT ALL ON public.bets TO service_role;

ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bets are public readable" ON public.bets FOR SELECT USING (true);
CREATE POLICY "users insert own bets" ON public.bets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX bets_created_at_idx ON public.bets (created_at DESC);
CREATE INDEX bets_user_idx ON public.bets (user_id, created_at DESC);

CREATE TABLE public.roblox_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roblox_id bigint NOT NULL,
  username text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '10 minutes',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.roblox_verifications TO service_role;

ALTER TABLE public.roblox_verifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.market_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  side text NOT NULL,
  margin numeric(14,2) NOT NULL,
  leverage integer NOT NULL,
  entry_price numeric(14,4) NOT NULL,
  exit_price numeric(14,4),
  pnl numeric(14,2),
  status text NOT NULL DEFAULT 'open',
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.market_positions TO authenticated;
GRANT ALL ON public.market_positions TO service_role;

ALTER TABLE public.market_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own positions" ON public.market_positions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own positions" ON public.market_positions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own positions" ON public.market_positions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.apply_bet(_game text, _wager numeric, _multiplier numeric, _payout numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _new_balance numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _wager < 0 OR _payout < 0 THEN RAISE EXCEPTION 'invalid amounts'; END IF;

  UPDATE public.profiles
     SET balance = balance - _wager + _payout,
         wagered = wagered + _wager,
         profit = profit + (_payout - _wager)
   WHERE id = _uid AND balance >= _wager
   RETURNING balance INTO _new_balance;

  IF _new_balance IS NULL THEN RAISE EXCEPTION 'insufficient balance'; END IF;

  INSERT INTO public.bets (user_id, game, wager, multiplier, payout, won)
  VALUES (_uid, _game, _wager, _multiplier, _payout, _payout > _wager);

  RETURN _new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_bet(text, numeric, numeric, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_demo_balance(_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _new numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.profiles SET balance = greatest(_amount, 0) WHERE id = _uid RETURNING balance INTO _new;
  RETURN _new;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_demo_balance(numeric) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.bets;