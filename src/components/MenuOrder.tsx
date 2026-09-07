import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { WhatsAppIcon } from "./OrderButton";
import { WHATSAPP_NUMBER } from "../lib/whatsapp";

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
  const [flavorItem, setFlavorItem] = useState<MenuItem | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const totals = useMemo(() => {
    const count = lines.reduce((sum, l) => sum + l.qty, 0);
    const value = lines.reduce((sum, l) => sum + l.qty * l.price, 0);
    return { count, value };
  }, [lines]);

  function addLine(label: string, price: number, key: string) {
    setLines((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { key, label, price, qty: 1 }];
    });
    setCartOpen(true);
  }

  function handleAdd(item: MenuItem) {
    if (item.scoops) {
      setPicked([]);
      setFlavorItem(item);
      return;
    }
    addLine(item.name, item.price, item.id);
  }

  function toggleFlavor(flavor: string) {
    if (!flavorItem) return;
    setPicked((prev) => {
      if (prev.includes(flavor)) return prev.filter((f) => f !== flavor);
      if (prev.length >= (flavorItem.scoops ?? 1)) return prev;
      return [...prev, flavor];
    });
  }

  function confirmFlavors() {
    if (!flavorItem) return;
    const flavors = picked.join(" + ");
    addLine(
      `${flavorItem.name} ${flavorItem.variant} (${flavors})`,
      flavorItem.price,
      `${flavorItem.id}-${picked.slice().sort().join("|")}`
    );
    setFlavorItem(null);
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

  const canSend = lines.length > 0 && name.trim().length > 1 && address.trim().length > 4;

  function buildMessage() {
    const itemLines = lines
      .map((l) => `• ${l.qty}x ${l.label} — ${brl(l.price)} cada (${brl(l.price * l.qty)})`)
      .join("\n");
    const parts = [
      "*Novo pedido — Beijo Frio* 🍦",
      "",
      itemLines,
      "",
      `*Total:* ${brl(totals.value)}`,
      "",
      `*Nome:* ${name.trim()}`,
      `*Endereço de entrega:* ${address.trim()}`,
    ];
    if (notes.trim()) parts.push(`*Observações:* ${notes.trim()}`);
    return parts.join("\n");
  }

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage())}`;

  return (
    <section id="pedido" className="order-section section-pad">
      <div className="section-heading">
        <p className="eyebrow eyebrow-dark">Peça online</p>
        <h2>Monte seu pedido</h2>
        <p>Escolha os itens, ajuste as quantidades e envie tudo pronto pelo WhatsApp.</p>
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
                <button type="button" className="order-add" onClick={() => handleAdd(item)}>
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
        onClick={() => setCartOpen(true)}
        aria-label={`Abrir carrinho, ${totals.count} itens, total ${brl(totals.value)}`}
      >
        <ShoppingCart aria-hidden="true" />
        <span className="cart-fab-count">{totals.count}</span>
        <span className="cart-fab-total">{brl(totals.value)}</span>
      </button>

      {flavorItem ? (
        <div className="bf-overlay" role="dialog" aria-modal="true" aria-label="Escolher sabores">
          <div className="bf-modal">
            <button type="button" className="bf-close" onClick={() => setFlavorItem(null)} aria-label="Fechar">
              <X aria-hidden="true" />
            </button>
            <h3>
              {flavorItem.name} {flavorItem.variant}
            </h3>
            <p className="bf-modal-note">
              Escolha {flavorItem.scoops} sabores ({picked.length}/{flavorItem.scoops})
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
            <button
              type="button"
              className="bf-primary"
              disabled={picked.length !== flavorItem.scoops}
              onClick={confirmFlavors}
            >
              Adicionar ao carrinho — {brl(flavorItem.price)}
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
                <label className="bf-field">
                  Endereço de entrega
                  <textarea
                    value={address}
                    maxLength={300}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número, bairro e ponto de referência"
                  />
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
                <button
                  type="button"
                  className="bf-primary"
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                >
                  <WhatsAppIcon className="h-5 w-5" /> Finalizar pedido no WhatsApp
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {checkoutOpen ? (
        <div className="bf-overlay" role="dialog" aria-modal="true" aria-label="Seus dados">
          <div className="bf-modal">
            <button type="button" className="bf-close" onClick={() => setCheckoutOpen(false)} aria-label="Fechar">
              <X aria-hidden="true" />
            </button>
            <h3>Seus dados</h3>
            <p className="bf-modal-note">Confirme nome e endereço para enviarmos seu pedido.</p>
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
              Endereço de entrega
              <textarea
                value={address}
                maxLength={300}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro e ponto de referência"
              />
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
            <p className="cart-total">
              <span>Total</span>
              <strong>{brl(totals.value)}</strong>
            </p>
            {canSend ? (
              <a
                className="bf-primary"
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setCheckoutOpen(false)}
              >
                <WhatsAppIcon className="h-5 w-5" /> Enviar pedido no WhatsApp
              </a>
            ) : (
              <button type="button" className="bf-primary" disabled>
                Preencha nome e endereço
              </button>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
