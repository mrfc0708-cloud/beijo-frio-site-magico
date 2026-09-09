ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS forma_pagamento text NOT NULL DEFAULT 'dinheiro',
  ADD COLUMN IF NOT EXISTS troco_para numeric,
  ADD COLUMN IF NOT EXISTS sem_troco boolean NOT NULL DEFAULT false;