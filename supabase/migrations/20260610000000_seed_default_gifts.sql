-- Seed default gifts (only if table is empty)
INSERT INTO public.gifts (title, category, price_cents, icon, description, sort_order)
SELECT * FROM (VALUES
  ('Jogo de Talheres Tramontina Búzios', 'Lar', 18000, '🍴', '24 peças em aço inox para compor a nossa mesa em todos os jantares a dois.', 1),
  ('Fuê Profissional 25 e 30cm', 'Lar', 6000, '🥄', 'Par de fuês profissionais para as receitas que vamos preparar juntos no nosso novo lar.', 2),
  ('Jogo de Pano de Prato (4 un.)', 'Lar', 5000, '🧺', 'Conjunto com 4 panos de prato de algodão para o dia a dia da nossa cozinha.', 3),
  ('Mop Flash Limp', 'Lar', 6999, '🧽', 'Mop spray prático para deixar o piso da nossa casa sempre brilhando.', 4),
  ('Kit Organizador com Tampa (3 un.)', 'Lar', 7431, '🧺', 'Trio de cestos organizadores com tampa de bambu para manter o nosso lar sempre em ordem.', 5)
) AS v(title, category, price_cents, icon, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.gifts LIMIT 1);
