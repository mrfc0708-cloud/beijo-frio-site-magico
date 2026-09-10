import { useMemo, useRef, useState } from "react";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adicionarPedidoLocal } from "@/lib/pedidos-locais";

type MenuItem = {
  id: string;
  name: string;
  variant?: string;
  price: number;
  scoops?: number;
};

const MENU: { group: string; items: MenuItem[] }[] = [
  {
    group: "Salgados",
    items: [
      { id: "pao-pizza", name: "Pão pizza", price: 7 },
      { id: "coxinha", name: "Coxinha", price: 5 },
      { id: "esfirra", name: "Esfirra", price: 7 },
    ],
  },
  {
    group: "Sorvetes",
    items: [
      { id: "sorvete-2", name: "Sorvete", variant: "2 bolas", price: 10, scoops: 2 },
      { id: "sorvete-3", name: "Sorvete", variant: "3 bolas", price: 13, scoops: 3 },
    ],
  },
];

const FLAVORS = [
  "Açaí zero",
  "Açaí tradicional",
  "Maracujá",
  "Coco",
  "Flocos",
  "Chocolate",
];

const CITY = "São Domingos - Bahia";

const PAYMENTS = [
  { id: "credito", label: "Cartão de crédito" },
  { id: "debito", label: "Cartão de débito" },
  { id: "dinheiro", label: "Dinheiro" },
] as const;

type PaymentId = (typeof PAYMENTS)[number]["id"];

type CartLine = {
  key: string;
  label: string;
  price: number;
  qty: number;
};

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function MenuOrder() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [district, setDistrict] = useState("");
  const [number, setNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<PaymentId | null>(null);
  const [changeFor, setChangeFor] = useState("");
  const [noChange, setNoChange] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [flight, setFlight] = useState<null | {
    id: number;
    style: React.CSSProperties;
  }>(null);

  const cartRef = useRef<HTMLButtonElement>(null);
  const flightId = useRef(0);

  const totals = useMemo(() => {
    const count = lines.reduce((sum, l) => sum + l.qty, 0);
    const value = lines.reduce((sum, l) => sum + l.qty * l.price, 0);
    return { count, value };
  }, [lines]);

  function flyToCart(from: HTMLElement | null) {
    const cart = cartRef.current;
    if (!from || !cart) return;
    const a = from.getBoundingClientRect();
    const b = cart.getBoundingClientRect();
    const id = ++flightId.current;
    setFlight({
      id,
      style: {
        left: `${a.left + a.width / 2}px`,
        top: `${a.top + a.height / 2}px`,
        ["--bf-tx" as string]: `${b.left + b.width / 2 - (a.left + a.width / 2)}px`,
        ["--bf-ty" as string]: `${b.top + b.height / 2 - (a.top + a.height / 2)}px`,
      },
    });
    window.setTimeout(() => {
      setFlight((cur) => (cur && cur.id === id ? null : cur));
    }, 760);
  }

  function addLine(label: string, price: number, key: string, amount: number) {
    setLines((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found)
        return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + amount } : l));
      return [...prev, { key, label, price, qty: amount }];
    });
  }

  function openItem(item: MenuItem) {
    setPicked([]);
    setQty(1);
    setActiveItem(item);
  }

  function toggleFlavor(flavor: string) {
    if (!activeItem?.scoops) return;
    setPicked((prev) => {
      if (prev.includes(flavor)) return prev.filter((f) => f !== flavor);
      if (prev.length >= (activeItem.scoops ?? 1)) return prev;
      return [...prev, flavor];
    });
  }

  function confirmAdd(event: React.MouseEvent<HTMLButtonElement>) {
    if (!activeItem) return;
    if (activeItem.scoops) {
      const flavors = picked.join(" + ");
      addLine(
        `${activeItem.name} ${activeItem.variant} (${flavors})`,
        activeItem.price,
        `${activeItem.id}-${picked.slice().sort().join("|")}`,
        qty
      );
    } else {
      addLine(activeItem.name, activeItem.price, activeItem.id, qty);
    }
    flyToCart(event.currentTarget);
    setActiveItem(null);
  }

  function changeQty(key: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  const changeValue = Number(changeFor.replace(",", "."));
  const cashOk =
    payment !== "dinheiro" ||
    noChange ||
    (changeFor.trim().length > 0 && !Number.isNaN(changeValue) && changeValue >= totals.value);

  const canSend =
    lines.length > 0 &&
    name.trim().length > 1 &&
    phone.replace(/\D/g, "").length >= 10 &&
    street.trim().length > 2 &&
    district.trim().length > 1 &&
    number.trim().length > 0 &&
    payment !== null &&
    cashOk;

  async function enviarPedido() {
    if (!canSend || sending) return;
    setSending(true);
    setSendError(null);
    const novoId = crypto.randomUUID();
    const { error } = await supabase.from("pedidos").insert({
      id: novoId,
      itens: lines.map((l) => ({ label: l.label, price: l.price, qty: l.qty })),
      total: totals.value,
      nome: name.trim(),
      telefone: phone.trim(),
      endereco: street.trim(),
      bairro: district.trim(),
      numero: number.trim(),
      observacoes: notes.trim() || null,
      forma_pagamento: payment,
      troco_para: payment === "dinheiro" && !noChange ? changeValue : null,
      sem_troco: payment === "dinheiro" ? noChange : false,
    });
    setSending(false);
    if (error) {
      setSendError("Não conseguimos enviar seu pedido. Tente novamente.");
      return;
    }
    adicionarPedidoLocal(novoId);
    setLines([]);
    setNotes("");
    setPayment(null);
    setChangeFor("");
    setNoChange(false);
    setCheckoutOpen(false);
    setDone(true);
  }

  const flavorsNeeded = activeItem?.scoops ?? 0;
  const flavorsOk = !activeItem?.scoops || picked.length === flavorsNeeded;

  return (
    <section id="pedido" className="order-section section-pad">
      <div className="section-heading">
        <p className="eyebrow eyebrow-dark">ENTÃO VEM CÁ....</p>
        <h2>Monte seu pedido!</h2>
        <p>Escolha os itens, ajuste as quantidades e finalize seu pedido.</p>
      </div>

      {MENU.map((group) => (
        <div className="order-group" key={group.group}>
          <h3>{group.group}</h3>
          <ul className="order-list">
            {group.items.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  {item.variant ? <span className="order-variant">{item.variant}</span> : null}
                  {item.scoops ? <p>Escolha {item.scoops} sabores</p> : null}
                </div>
                <span className="order-price">{brl(item.price)}</span>
                <button type="button" className="order-add" onClick={() => openItem(item)}>
                  <Plus aria-hidden="true" /> Adicionar
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <button
        type="button"
        className="cart-fab"
        ref={cartRef}
        onClick={() => setCartOpen(true)}
        aria-label={`Abrir carrinho, ${totals.count} itens, total ${brl(totals.value)}`}
      >
        <ShoppingCart aria-hidden="true" />
        <span className="cart-fab-count">{totals.count}</span>
        <span className="cart-fab-total">{brl(totals.value)}</span>
      </button>

      {flight ? (
        <span key={flight.id} className="magic-lamp" style={flight.style} aria-hidden="true">
          🍦
        </span>
      ) : null}

      {activeItem ? (
        <div className="bf-overlay" role="dialog" aria-modal="true" aria-label="Adicionar item">
          <div className="bf-modal">
            <button type="button" className="bf-close" onClick={() => setActiveItem(null)} aria-label="Fechar">
              <X aria-hidden="true" />
            </button>
            <h3>
              {activeItem.name} {activeItem.variant ?? ""}
            </h3>
            {activeItem.scoops ? (
              <>
                <p className="bf-modal-note">
                  Escolha {flavorsNeeded} sabores ({picked.length}/{flavorsNeeded})
                </p>
                <div className="flavor-grid">
                  {FLAVORS.map((flavor) => (
                    <button
                      type="button"
                      key={flavor}
                      className={`flavor-chip ${picked.includes(flavor) ? "is-on" : ""}`}
                      onClick={() => toggleFlavor(flavor)}
                    >
                      {flavor}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="bf-modal-note">{brl(activeItem.price)} cada</p>
            )}

            <div className="qty-picker">
              <span>Quantidade</span>
              <div className="qty-box">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuir">
                  <Minus aria-hidden="true" />
                </button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Aumentar">
                  <Plus aria-hidden="true" />
                </button>
              </div>
            </div>

            <button type="button" className="bf-primary" disabled={!flavorsOk} onClick={confirmAdd}>
              Adicionar ao carrinho — {brl(activeItem.price * qty)}
            </button>
          </div>
        </div>
      ) : null}

      {cartOpen ? (
        <div className="bf-overlay" role="dialog" aria-modal="true" aria-label="Carrinho">
          <div className="bf-modal">
            <button type="button" className="bf-close" onClick={() => setCartOpen(false)} aria-label="Fechar">
              <X aria-hidden="true" />
            </button>
            <h3>Seu carrinho</h3>
            {lines.length === 0 ? (
              <p className="bf-modal-note">Seu carrinho está vazio. Escolha um item do cardápio.</p>
            ) : (
              <>
                <ul className="cart-lines">
                  {lines.map((line) => (
                    <li key={line.key}>
                      <div>
                        <strong>{line.label}</strong>
                        <span>{brl(line.price)} cada</span>
                      </div>
                      <div className="qty-box">
                        <button type="button" onClick={() => changeQty(line.key, -1)} aria-label="Diminuir">
                          <Minus aria-hidden="true" />
                        </button>
                        <span>{line.qty}</span>
                        <button type="button" onClick={() => changeQty(line.key, 1)} aria-label="Aumentar">
                          <Plus aria-hidden="true" />
                        </button>
                      </div>
                      <strong className="line-total">{brl(line.price * line.qty)}</strong>
                      <button
                        type="button"
                        className="line-remove"
                        onClick={() => removeLine(line.key)}
                        aria-label={`Remover ${line.label}`}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="cart-total">
                  <span>Total</span>
                  <strong>{brl(totals.value)}</strong>
                </p>
                <button
                  type="button"
                  className="bf-primary"
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                >
                  Continuar para entrega
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {checkoutOpen ? (
        <div className="bf-overlay" role="dialog" aria-modal="true" aria-label="Dados de entrega">
          <div className="bf-modal">
            <button type="button" className="bf-close" onClick={() => setCheckoutOpen(false)} aria-label="Fechar">
              <X aria-hidden="true" />
            </button>
            <h3>Dados de entrega</h3>
            <p className="bf-modal-note">Última etapa: informe nome, telefone, endereço e forma de pagamento.</p>
            <label className="bf-field">
              Nome
              <input
                value={name}
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </label>
            <label className="bf-field">
              Telefone / WhatsApp
              <input
                value={phone}
                inputMode="tel"
                maxLength={20}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(75) 90000-0000"
              />
            </label>
            <label className="bf-field">
              Endereço
              <input
                value={street}
                maxLength={140}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Rua / avenida"
              />
            </label>
            <label className="bf-field">
              Bairro
              <input
                value={district}
                maxLength={100}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Seu bairro"
              />
            </label>
            <label className="bf-field">
              Número
              <input
                value={number}
                maxLength={12}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Nº"
              />
            </label>
            <label className="bf-field">
              Cidade
              <input value={CITY} readOnly disabled aria-readonly="true" />
            </label>
            <label className="bf-field">
              Observações (opcional)
              <textarea
                value={notes}
                maxLength={300}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: sem cobertura, trocar sabor"
              />
            </label>

            <p className="bf-modal-note bf-pay-title">Como deseja pagar?</p>
            <div className="flavor-grid">
              {PAYMENTS.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={`flavor-chip ${payment === option.id ? "is-on" : ""}`}
                  onClick={() => {
                    setPayment(option.id);
                    if (option.id !== "dinheiro") {
                      setChangeFor("");
                      setNoChange(false);
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {payment === "dinheiro" ? (
              <>
                <label className="bf-field">
                  Troco para quanto?
                  <input
                    value={changeFor}
                    inputMode="decimal"
                    maxLength={10}
                    disabled={noChange}
                    onChange={(e) => setChangeFor(e.target.value)}
                    placeholder="Ex.: 50"
                  />
                </label>
                <label className="bf-check">
                  <input
                    type="checkbox"
                    checked={noChange}
                    onChange={(e) => {
                      setNoChange(e.target.checked);
                      if (e.target.checked) setChangeFor("");
                    }}
                  />
                  Não preciso de troco
                </label>
              </>
            ) : null}

            <p className="cart-total">
              <span>Total</span>
              <strong>{brl(totals.value)}</strong>
            </p>
            {sendError ? <p className="bf-modal-note">{sendError}</p> : null}
            <button type="button" className="bf-primary" disabled={!canSend || sending} onClick={enviarPedido}>
              {sending ? "Enviando…" : canSend ? "Enviar pedido" : "Preencha os dados e o pagamento"}
            </button>
          </div>
        </div>
      ) : null}

      {done ? (
        <div className="bf-overlay" role="dialog" aria-modal="true" aria-label="Pedido enviado">
          <div className="bf-modal">
            <button type="button" className="bf-close" onClick={() => setDone(false)} aria-label="Fechar">
              <X aria-hidden="true" />
            </button>
            <h3>Pedido enviado! 🍦</h3>
            <p className="bf-modal-note">
              Recebemos seu pedido e já estamos preparando com carinho. Em instantes a equipe confirma a entrega.
            </p>
            <button type="button" className="bf-primary" onClick={() => setDone(false)}>
              Fazer outro pedido
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
