export const PEDIDOS_KEY = "beijoFrioPedidos";

export type PedidoLocal = { id: string; ts: number };

export function lerPedidosLocais(): PedidoLocal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PEDIDOS_KEY);
    const parsed = raw ? (JSON.parse(raw) as PedidoLocal[]) : [];
    if (!Array.isArray(parsed)) return [];
    const limite = Date.now() - 1000 * 60 * 60 * 12;
    return parsed.filter((p) => p && typeof p.id === "string" && p.ts > limite);
  } catch {
    return [];
  }
}

export function salvarPedidosLocais(pedidos: PedidoLocal[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PEDIDOS_KEY, JSON.stringify(pedidos));
  window.dispatchEvent(new Event("beijo-frio-pedidos"));
}

export function adicionarPedidoLocal(id: string) {
  salvarPedidosLocais([...lerPedidosLocais(), { id, ts: Date.now() }]);
}

export function removerPedidoLocal(id: string) {
  salvarPedidosLocais(lerPedidosLocais().filter((p) => p.id !== id));
}
