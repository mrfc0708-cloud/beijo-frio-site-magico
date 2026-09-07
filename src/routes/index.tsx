import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Heart, Instagram, MapPin, Sparkles, Star } from "lucide-react";
import { OrderButton, WhatsAppIcon } from "../components/OrderButton";
import { MenuOrder } from "../components/MenuOrder";
import { WHATSAPP_URL } from "../lib/whatsapp";
import heroImage from "../assets/beijo-frio-hero.jpg";
import acaiImage from "../assets/acai-bowl.jpg";
import milkshakeImage from "../assets/milkshake.jpg";
import balaImage from "../assets/bala-baiana.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beijo Frio | Sorveteria e Açaí em São Domingos" },
      {
        name: "description",
        content:
          "Sorvetes, açaí, milkshakes e bala baiana feitos com carinho em São Domingos, Bahia. Peça pelo WhatsApp.",
      },
      { property: "og:title", content: "Beijo Frio | Sorveteria e Açaí" },
      {
        property: "og:description",
        content: "Seu momento mais gostoso em São Domingos. Peça pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const products = [
  {
    category: "Sorvetes",
    name: "Casquinha caprichada",
    description: "Cremoso, colorido e com a calda escorrendo do jeito que a gente ama.",
    image: heroImage,
  },
  {
    category: "Açaí",
    name: "Açaí do seu jeito",
    description: "Açaí bem gelado com frutas, granola e os complementos que você escolher.",
    image: acaiImage,
  },
  {
    category: "Milkshakes",
    name: "Milkshake cremoso",
    description: "Batido na hora, cheio de sabor, com chantilly e uma calda generosa.",
    image: milkshakeImage,
  },
  {
    category: "Bala Baiana",
    name: "Crocante por fora",
    description: "Casquinha caramelizada e recheio de coco macio, feito artesanalmente.",
    image: balaImage,
  },
];

const testimonials = [
  {
    quote: "O açaí vem super caprichado e chega bem geladinho. Virou nosso pedido de domingo!",
    name: "Cliente da casa",
  },
  {
    quote: "A bala baiana é maravilhosa e o atendimento tem aquele carinho que faz a gente voltar.",
    name: "Cliente de São Domingos",
  },
  {
    quote: "Sorvete delicioso, cremoso e com muitas opções. As crianças amam — e a gente também!",
    name: "Família Beijo Frio",
  },
];

function BrandMark() {
  return (
    <a href="#inicio" className="brand" aria-label="Beijo Frio, voltar ao início">
      <span className="brand-scoop" aria-hidden="true">♥</span>
      <span>Beijo Frio</span>
    </a>
  );
}

function Index() {
  const heroOrderRef = useRef<HTMLAnchorElement>(null);
  const [isHeroOrderVisible, setIsHeroOrderVisible] = useState(true);

  useEffect(() => {
    const node = heroOrderRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setIsHeroOrderVisible(entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: "0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <main>
      <header className="site-header">
        <nav className="nav-shell" aria-label="Navegação principal">
          <BrandMark />
          <div className="nav-links">
            <a href="#cardapio">Cardápio</a>
            <a href="#sobre">Nossa história</a>
            <a href="#onde">Onde estamos</a>
          </div>
        </nav>
      </header>

      <section id="inicio" className="hero-section">
        <img
          src={heroImage}
          alt="Sorvete cremoso com calda de frutas vermelhas em fundo vibrante"
          width={1536}
          height={1024}
          fetchPriority="high"
          className="hero-image"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow"><Sparkles aria-hidden="true" /> Direto de São Domingos, Bahia</p>
          <h1>Sabor, qualidade<br />e <em>muito mais!</em></h1>
          <p className="hero-copy">Um beijo gelado em forma de sorvete, açaí e carinho. Feito pertinho de você.</p>
          <OrderButton ref={heroOrderRef} className="hero-order">Fazer pedido</OrderButton>
        </div>
        <div className="hero-sticker" aria-hidden="true"><span>feito com</span><strong>♥</strong><span>pra você</span></div>
      </section>

      <section id="cardapio" className="menu-section section-pad">
        <div className="section-heading">
          <p className="eyebrow eyebrow-dark">Escolha seu favorito</p>
          <h2>Nosso cardápio</h2>
          <p>Para matar a vontade de doce, refrescar o dia ou celebrar qualquer momento.</p>
        </div>
        <div className="product-grid">
          {products.map((product, index) => (
            <article className={`product-card card-${index + 1}`} key={product.category}>
              <div className="product-photo">
                <img src={product.image} alt={product.name} width={900} height={1000} loading="lazy" />
                <span>{product.category}</span>
              </div>
              <div className="product-copy">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <MenuOrder />

      <section id="sobre" className="story-section section-pad">
        <div className="story-photo-wrap">
          <img src={milkshakeImage} alt="Milkshake de morango Beijo Frio" width={900} height={1000} loading="lazy" />
          <span className="story-sparkle" aria-hidden="true">✦</span>
          <span className="story-label">Da nossa casa<br />para a sua</span>
        </div>
        <div className="story-copy">
          <p className="eyebrow">A nossa história</p>
          <h2>Tem carinho em cada colherada.</h2>
          <p>A Beijo Frio nasceu para deixar São Domingos mais doce. Somos uma sorveteria de bairro que acredita em sabores bem feitos, ingredientes de qualidade e atendimento que conhece você pelo nome.</p>
          <p>Aqui, cada pedido é preparado com calma e capricho — daquele jeitinho artesanal que transforma uma sobremesa em memória boa.</p>
          <div className="story-sign"><Heart aria-hidden="true" /> Feito por gente daqui</div>
        </div>
      </section>

      <section className="social-section section-pad" aria-labelledby="depoimentos-titulo">
        <div className="social-count">
          <strong>+550</strong>
          <span>pessoas acompanhando<br />nossos sabores no Instagram</span>
          <a href="https://www.instagram.com/beijofriosd" target="_blank" rel="noreferrer"><Instagram aria-hidden="true" /> @beijofriosd</a>
        </div>
        <div className="testimonials">
          <div className="section-heading align-left">
            <p className="eyebrow eyebrow-dark">Quem prova, se apaixona</p>
            <h2 id="depoimentos-titulo">Palavras que adoçam o dia</h2>
          </div>
          <div className="quotes-grid">
            {testimonials.map((item) => (
              <blockquote key={item.quote}>
                <div className="stars" aria-label="5 estrelas">{Array.from({ length: 5 }, (_, i) => <Star key={i} aria-hidden="true" />)}</div>
                <p>“{item.quote}”</p>
                <cite>{item.name}</cite>
              </blockquote>
            ))}
          </div>
          <p className="testimonial-note">Depoimentos ilustrativos para apresentação do site.</p>
        </div>
      </section>

      <section id="onde" className="location-section">
        <div className="location-copy">
          <p className="eyebrow">Vem dar um beijo no frio</p>
          <h2>Estamos pertinho de você.</h2>
          <div className="address-line"><MapPin aria-hidden="true" /><p><strong>Rua José Mota Araújo</strong><br />São Domingos — Bahia<br /><span>Próximo à Praça Izaque Pinheiro</span></p></div>
          <a className="directions-link" href="https://www.google.com/maps/search/?api=1&query=Rua%20Jos%C3%A9%20Mota%20Ara%C3%BAjo%2C%20S%C3%A3o%20Domingos%20-%20BA" target="_blank" rel="noreferrer">Abrir rota no Google Maps →</a>
        </div>
        <iframe
          className="map-frame"
          title="Mapa da Beijo Frio em São Domingos, Bahia"
          src="https://www.google.com/maps?q=Rua%20Jos%C3%A9%20Mota%20Ara%C3%BAjo%2C%20S%C3%A3o%20Domingos%20-%20BA&output=embed"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>

      <footer className="site-footer">
        <BrandMark />
        <div><span>Funcionamento</span><strong>Horário a confirmar</strong></div>
        <div><span>Faça seu pedido</span><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">(75) 98261-3780</a></div>
        <div><span>Acompanhe</span><a href="https://www.instagram.com/beijofriosd" target="_blank" rel="noreferrer">@beijofriosd</a></div>
        <p>© 2026 Beijo Frio · São Domingos, BA</p>
      </footer>

      <a
        className={`floating-whatsapp ${!isHeroOrderVisible ? "is-visible" : ""}`}
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Fazer pedido pelo WhatsApp"
      >
        <WhatsAppIcon className="h-7 w-7" />
        <span>Peça aqui</span>
      </a>
    </main>
  );
}
