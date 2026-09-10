ALTER TABLE public.pedidos ADD COLUMN arquivado boolean NOT NULL DEFAULT false;

ALTER TABLE public.pedidos ADD COLUMN telefone text;
UPDATE public.pedidos SET telefone = '' WHERE telefone IS NULL;
ALTER TABLE public.pedidos ALTER COLUMN telefone SET NOT NULL;

CREATE OR REPLACE FUNCTION public.pedidos_validar_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('novo','confirmado','preparando','saiu_entrega','entregue') THEN
    RAISE EXCEPTION 'status inválido: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pedidos_validar_status_trg ON public.pedidos;
CREATE TRIGGER pedidos_validar_status_trg
BEFORE INSERT OR UPDATE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.pedidos_validar_status();