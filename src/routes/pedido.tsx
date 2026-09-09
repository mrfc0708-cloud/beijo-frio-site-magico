import { createFileRoute, Link } from "@tanstack/react-router";
import { MenuOrder } from "../components/MenuOrder";

export const Route = createFileRoute("/pedido")({
  head: () => ({
    meta: [
      { title: "Monte seu pedido | Beijo Frio São Domingos" },
      {
        name: "description",
        content:
          "Escolha sorvetes, salgados e sabores, ajuste quantidades e finalize seu pedido para entrega em São Domingos, Bahia.",
      },
      { property: "og:title", content: "Monte seu pedido | Beijo Frio" },
      {
        property: "og:description",
        content: "Cardápio completo da Beijo Frio com pedido online e entrega em São Domingos, Bahia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PedidoPage,
});

function PedidoPage() {
  return (
    <main>
      <header className="site-header">
        <nav className="nav-shell" aria-label="Navegação principal">
          <Link to="/" className="brand" aria-label="Beijo Frio, voltar ao início">
            <span className="brand-scoop" aria-hidden="true">♥</span>
            <span>Beijo Frio</span>
          </Link>
          <div className="nav-links">
            <Link to="/">Início</Link>
            <a href="#pedido">Cardápio</a>
          </div>
        </nav>
      </header>

      <MenuOrder />

      <footer className="site-footer">
        <Link to="/" className="brand" aria-label="Beijo Frio, voltar ao início">
          <span className="brand-scoop" aria-hidden="true">♥</span>
          <span>Beijo Frio</span>
        </Link>
        <div><span>Funcionamento</span><strong>Horário a confirmar</strong></div>
        <div><span>Contato</span><strong>(75) 98261-3780</strong></div>
        <div><span>Acompanhe</span><a href="https://www.instagram.com/beijofriosd" target="_blank" rel="noopener noreferrer">@beijofriosd</a></div>
        <p>© 2026 Beijo Frio · São Domingos, BA</p>
      </footer>
    </main>
  );
}
