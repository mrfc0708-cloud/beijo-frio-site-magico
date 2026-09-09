CREATE TABLE public.pedidos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  nome text NOT NULL DEFAULT '',
  endereco text NOT NULL DEFAULT '',
  bairro text NOT NULL DEFAULT '',
  numero text NOT NULL DEFAULT '',
  observacoes text,
  status text NOT NULL DEFAULT 'novo'
);

GRANT INSERT ON public.pedidos TO anon;
GRANT SELECT, INSERT, UPDATE ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode criar pedido" ON public.pedidos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados podem ver pedidos" ON public.pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados podem atualizar pedidos" ON public.pedidos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.pedidos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;