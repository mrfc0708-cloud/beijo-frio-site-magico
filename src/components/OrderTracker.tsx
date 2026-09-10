import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lerPedidosLocais, removerPedidoLocal } from "@/lib/pedidos-locais";

const ETAPAS = ["Pedido confirmado", "Em preparação", "Saiu para entrega"];

const NIVEL: Record<string, number> = {
  novo: 1,
  confirmado: 1,
  preparando: 2,
  saiu_entrega: 3,
  entregue: 4,
};

/** Banner discreto que acompanha a situação do último pedido feito neste navegador. */
export function OrderTracker() {
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    const sync = () => {
      const pedidos = lerPedidosLocais();
      const ultimo = pedidos[pedidos.length - 1] ?? null;
      setPedidoId((atual) => {
        if (ultimo?.id !== atual) {
          setStatus(null);
          setFechado(false);
        }
        return ultimo?.id ?? null;
      });
    };
    sync();
    window.addEventListener("beijo-frio-pedidos", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("beijo-frio-pedidos", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!pedidoId) return;
    let ativo = true;

    async function buscar() {
      const { data } = await supabase.rpc("status_pedido", { p_id: pedidoId! });
      if (!ativo) return;
      if (typeof data === "string") setStatus(data);
    }

    buscar();
    const timer = window.setInterval(buscar, 8000);

    const channel = supabase
      .channel(`pedido-${pedidoId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos", filter: `id=eq.${pedidoId}` },
        () => buscar()
      )
      .subscribe();

    return () => {
      ativo = false;
      window.clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [pedidoId]);

  useEffect(() => {
    if (pedidoId && status === "entregue") removerPedidoLocal(pedidoId);
  }, [pedidoId, status]);

  if (!pedidoId || fechado || !status || status === "entregue") return null;

  const nivel = NIVEL[status] ?? 1;

  return (
    <aside className="bf-track" aria-live="polite">
      <div className="bf-track-head">
        <strong>Seu pedido está a caminho 🍦</strong>
        <button
          type="button"
          className="bf-track-close"
          onClick={() => setFechado(true)}
          aria-label="Fechar aviso do pedido"
        >
          <X aria-hidden="true" />
        </button>
      </div>
      <ul className="bf-track-steps">
        {ETAPAS.map((etapa, i) => (
          <li key={etapa} className={nivel >= i + 1 ? "is-done" : ""}>
            <i aria-hidden="true" />
            {etapa}
          </li>
        ))}
      </ul>
    </aside>
  );
}
