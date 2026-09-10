CREATE OR REPLACE FUNCTION public.status_pedido(p_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status FROM public.pedidos WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION public.status_pedido(uuid) TO anon, authenticated;