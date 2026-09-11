import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/painel")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel de pedidos — Beijo Frio" },
      {
        name: "description",
        content: "Área restrita da Beijo Frio para acompanhar os pedidos recebidos em tempo real.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Painel de pedidos — Beijo Frio" },
      {
        property: "og:description",
        content: "Área restrita da Beijo Frio para acompanhar os pedidos recebidos em tempo real.",
      },
    ],
  }),
  component: PainelPage,
});

type ItemPedido = { label: string; price: number; qty: number };

type Pedido = {
  id: string;
  criado_em: string;
  itens: ItemPedido[];
  total: number;
  nome: string;
  endereco: string;
  bairro: string;
  numero: string;
  observacoes: string | null;
  status: string;
  telefone: string | null;
  arquivado: boolean | null;
  forma_pagamento: string | null;
  troco_para: number | null;
  sem_troco: boolean | null;
};

const PAGAMENTO: Record<string, string> = {
  credito: "Cartão de crédito",
  debito: "Cartão de débito",
  dinheiro: "Dinheiro",
};

const STATUS_STAGES = [
  { id: "novo", label: "Novo" },
  { id: "confirmado", label: "Confirmado" },
  { id: "preparando", label: "Preparando" },
  { id: "saiu_entrega", label: "Saiu para entrega" },
  { id: "entregue", label: "Entregue" },
] as const;

const statusLabel = (id: string) => STATUS_STAGES.find((s) => s.id === id)?.label ?? id;

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PainelPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    supabase.auth.getSession().then(({ data: d }) => {
      setSession(d.session);
      setCarregando(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (carregando) {
    return (
      <main className="painel-login-page">
        <p className="painel-state" style={{ marginTop: 0 }}>Carregando…</p>
      </main>
    );
  }

  return session ? <Pedidos /> : <Login />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro("E-mail ou senha incorretos.");
    setEnviando(false);
  }

  return (
    <main className="painel-login-page">
      <form onSubmit={entrar} className="painel-login">
        <h1>Painel Beijo Frio</h1>
        <p className="painel-login-sub">Acesso restrito à equipe.</p>

        <label className="painel-field">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="painel-input"
          />
        </label>
        <label className="painel-field">
          Senha
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="painel-input"
          />
        </label>

        {erro ? <p className="painel-error">{erro}</p> : null}

        <button type="submit" disabled={enviando} className="bf-primary">
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}

function Pedidos() {
  const queryClient = useQueryClient();

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos"],
    queryFn: async (): Promise<Pedido[]> => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("arquivado", false)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Pedido[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("pedidos-painel")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => {
        queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const definirStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("pedidos").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pedidos"] }),
  });

  const limparEntregues = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("pedidos")
        .update({ arquivado: true })
        .eq("status", "entregue")
        .eq("arquivado", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pedidos"] }),
  });

  const temEntregues = pedidos.some((p) => p.status === "entregue");
  const ordenados = [...pedidos].sort((a, b) => {
    const aEnt = a.status === "entregue" ? 1 : 0;
    const bEnt = b.status === "entregue" ? 1 : 0;
    return aEnt - bEnt;
  });

  return (
    <main className="painel-page">
      <div className="painel-wrap">
        <header className="painel-header">
          <div>
            <h1 className="painel-title">Pedidos</h1>
            <p className="painel-sub">Atualiza automaticamente a cada novo pedido.</p>
          </div>
          <div className="painel-actions">
            <button
              type="button"
              disabled={!temEntregues || limparEntregues.isPending}
              onClick={() => limparEntregues.mutate()}
              className="painel-btn painel-btn--lime"
            >
              Limpar pedidos entregues
            </button>
            <button
              type="button"
              onClick={async () => {
                await queryClient.cancelQueries();
                queryClient.clear();
                await supabase.auth.signOut();
              }}
              className="painel-btn"
            >
              Sair
            </button>
          </div>
        </header>

        {isLoading ? (
          <p className="painel-state">Carregando pedidos…</p>
        ) : pedidos.length === 0 ? (
          <p className="painel-state">
            Nenhum pedido por enquanto — assim que alguém pedir, aparece aqui.
          </p>
        ) : (
          <ul className="painel-list">
            {ordenados.map((p) => (
              <li
                key={p.id}
                className={`painel-card${p.status === "entregue" ? " is-entregue" : ""}`}
              >
                <div className="painel-card-head">
                  <div>
                    <h2>{p.nome}</h2>
                    <p className="painel-time">{new Date(p.criado_em).toLocaleString("pt-BR")}</p>
                  </div>
                  <span className={`status-pill status-pill--${p.status}`}>
                    {statusLabel(p.status)}
                  </span>
                </div>

                <ul className="painel-itens">
                  {(p.itens ?? []).map((item, i) => (
                    <li key={`${p.id}-${i}`}>
                      {item.qty}x {item.label} — {brl(item.price * item.qty)}
                    </li>
                  ))}
                </ul>

                <p className="painel-total">Total: {brl(Number(p.total))}</p>

                <p className="painel-info">
                  Telefone: {p.telefone?.trim() ? p.telefone : "não informado"}
                </p>
                <p className="painel-info painel-info--dim">
                  {p.endereco}, nº {p.numero} — {p.bairro} — São Domingos, Bahia
                </p>
                <p className="painel-info">
                  Pagamento: {PAGAMENTO[p.forma_pagamento ?? ""] ?? p.forma_pagamento ?? "—"}
                  {p.forma_pagamento === "dinheiro"
                    ? p.sem_troco
                      ? " — não precisa de troco"
                      : p.troco_para
                        ? ` — troco para ${brl(Number(p.troco_para))}`
                        : ""
                    : ""}
                </p>
                {p.observacoes ? (
                  <p className="painel-info painel-info--dim">Observações: {p.observacoes}</p>
                ) : null}

                <div className="painel-status-row">
                  {STATUS_STAGES.map((stage) => (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => definirStatus.mutate({ id: p.id, status: stage.id })}
                      disabled={definirStatus.isPending || p.status === stage.id}
                      className={`status-btn status-btn--${stage.id}${
                        p.status === stage.id ? " is-active" : ""
                      }`}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
