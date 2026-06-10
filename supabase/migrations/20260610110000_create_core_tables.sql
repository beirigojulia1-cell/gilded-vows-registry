-- ============================================================
-- GIFTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gifts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  category    text NOT NULL DEFAULT 'Lar',
  price_cents integer NOT NULL DEFAULT 0,
  icon        text NOT NULL DEFAULT '🎁',
  description text,
  image_url   text,
  gradient    text,
  accent      text,
  sort_order  integer NOT NULL DEFAULT 100,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- Anyone can read gifts (public list)
DROP POLICY IF EXISTS "Anyone can read gifts" ON public.gifts;
CREATE POLICY "Anyone can read gifts"
  ON public.gifts FOR SELECT
  TO public
  USING (true);

-- Only admins can insert/update/delete
DROP POLICY IF EXISTS "Admins can insert gifts" ON public.gifts;
CREATE POLICY "Admins can insert gifts"
  ON public.gifts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update gifts" ON public.gifts;
CREATE POLICY "Admins can update gifts"
  ON public.gifts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete gifts" ON public.gifts;
CREATE POLICY "Admins can delete gifts"
  ON public.gifts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.gifts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gifts TO authenticated;

-- ============================================================
-- PURCHASES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchases (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id     uuid REFERENCES public.gifts(id) ON DELETE SET NULL,
  guest_name  text NOT NULL,
  message     text,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a purchase (guest buying a gift)
DROP POLICY IF EXISTS "Anyone can create purchases" ON public.purchases;
CREATE POLICY "Anyone can create purchases"
  ON public.purchases FOR INSERT
  TO public
  WITH CHECK (true);

-- Only admins can read all purchases
DROP POLICY IF EXISTS "Admins can read purchases" ON public.purchases;
CREATE POLICY "Admins can read purchases"
  ON public.purchases FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update/delete purchases
DROP POLICY IF EXISTS "Admins can update purchases" ON public.purchases;
CREATE POLICY "Admins can update purchases"
  ON public.purchases FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete purchases" ON public.purchases;
CREATE POLICY "Admins can delete purchases"
  ON public.purchases FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can read purchases to check if a gift is taken
DROP POLICY IF EXISTS "Anyone can read purchases gift_id" ON public.purchases;
CREATE POLICY "Anyone can read purchases gift_id"
  ON public.purchases FOR SELECT
  TO public
  USING (true);

GRANT SELECT ON public.purchases TO anon, authenticated;
GRANT INSERT ON public.purchases TO anon, authenticated;
GRANT UPDATE, DELETE ON public.purchases TO authenticated;

-- ============================================================
-- SETTINGS TABLE (single row, id = 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id           integer PRIMARY KEY DEFAULT 1,
  couple_names text NOT NULL DEFAULT 'Geovana & Sérgio',
  wedding_date text NOT NULL DEFAULT '2026-11-15T17:00:00-03:00',
  pix_key      text NOT NULL DEFAULT '',
  pix_name     text NOT NULL DEFAULT '',
  pix_city     text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settings_single_row CHECK (id = 1)
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (used to show couple name, date, PIX info)
DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;
CREATE POLICY "Anyone can read settings"
  ON public.settings FOR SELECT
  TO public
  USING (true);

-- Only admins can update settings
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
CREATE POLICY "Admins can update settings"
  ON public.settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.settings TO anon, authenticated;
GRANT UPDATE ON public.settings TO authenticated;

-- Insert default settings row if it doesn't exist
INSERT INTO public.settings (id, couple_names, wedding_date, pix_key, pix_name, pix_city)
VALUES (1, 'Geovana & Sérgio', '2026-11-15T17:00:00-03:00', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Seed default gifts (only if table is empty)
-- ============================================================
INSERT INTO public.gifts (title, category, price_cents, icon, description, sort_order)
SELECT * FROM (VALUES
  ('Jogo de Talheres Tramontina Búzios', 'Lar', 18000, '🍴', '24 peças em aço inox para compor a nossa mesa em todos os jantares a dois.', 1),
  ('Fuê Profissional 25 e 30cm', 'Lar', 6000, '🥄', 'Par de fuês profissionais para as receitas que vamos preparar juntos no nosso novo lar.', 2),
  ('Jogo de Pano de Prato (4 un.)', 'Lar', 5000, '🧺', 'Conjunto com 4 panos de prato de algodão para o dia a dia da nossa cozinha.', 3),
  ('Mop Flash Limp', 'Lar', 6999, '🧽', 'Mop spray prático para deixar o piso da nossa casa sempre brilhando.', 4),
  ('Kit Organizador com Tampa (3 un.)', 'Lar', 7431, '🧺', 'Trio de cestos organizadores com tampa de bambu para manter o nosso lar sempre em ordem.', 5)
) AS v(title, category, price_cents, icon, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.gifts LIMIT 1);

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
