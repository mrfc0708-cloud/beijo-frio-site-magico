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
  forma_pagamento: string | null;
  troco_para: number | null;
  sem_troco: boolean | null;
};

const PAGAMENTO: Record<string, string> = {
  credito: "Cartão de crédito",
  debito: "Cartão de débito",
  dinheiro: "Dinheiro",
};

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
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando…</p>
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
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <h1 className="text-xl font-bold text-foreground">Painel Beijo Frio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acesso restrito à equipe.</p>

        <label className="mt-5 block text-sm font-medium text-foreground">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="mt-3 block text-sm font-medium text-foreground">
          Senha
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>

        {erro ? <p className="mt-3 text-sm text-destructive">{erro}</p> : null}

        <button
          type="submit"
          disabled={enviando}
          className="mt-5 w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
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

  const marcarEntregue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pedidos").update({ status: "entregue" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pedidos"] }),
  });

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
            <p className="text-sm text-muted-foreground">Atualiza automaticamente a cada novo pedido.</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await queryClient.cancelQueries();
              queryClient.clear();
              await supabase.auth.signOut();
            }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground"
          >
            Sair
          </button>
        </header>

        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Carregando pedidos…</p>
        ) : pedidos.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">Nenhum pedido por aqui ainda.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {pedidos.map((p) => (
              <li key={p.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{p.nome}</h2>
                    <p className="text-sm text-muted-foreground">
                      {new Date(p.criado_em).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase text-foreground">
                    {p.status}
                  </span>
                </div>

                <ul className="mt-3 space-y-1 text-sm text-foreground">
                  {(p.itens ?? []).map((item, i) => (
                    <li key={`${p.id}-${i}`}>
                      {item.qty}x {item.label} — {brl(item.price * item.qty)}
                    </li>
                  ))}
                </ul>

                <p className="mt-3 text-base font-bold text-foreground">Total: {brl(Number(p.total))}</p>

                <p className="mt-2 text-sm text-muted-foreground">
                  {p.endereco}, nº {p.numero} — {p.bairro} — São Domingos, Bahia
                </p>
                {p.observacoes ? (
                  <p className="mt-1 text-sm text-muted-foreground">Observações: {p.observacoes}</p>
                ) : null}

                {p.status !== "entregue" ? (
                  <button
                    type="button"
                    onClick={() => marcarEntregue.mutate(p.id)}
                    disabled={marcarEntregue.isPending}
                    className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    Marcar como entregue
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
