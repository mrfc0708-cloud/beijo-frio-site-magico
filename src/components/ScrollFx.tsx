import { useEffect } from "react";

const REVEAL = ".product-card, .story-section, .quotes-grid blockquote";
const PARALLAX: { selector: string; amount: number }[] = [
  { selector: ".hero-image", amount: 28 },
  { selector: ".product-photo img", amount: 16 },
  { selector: ".story-photo-wrap img", amount: 20 },
];

/** Efeitos leves de scroll: entrada suave dos blocos e parallax nas imagens. */
export function ScrollFx() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const revealEls = Array.from(document.querySelectorAll<HTMLElement>(REVEAL));
    revealEls.forEach((el) => el.classList.add("bf-reveal"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));

    const layers = PARALLAX.flatMap(({ selector, amount }) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)).map((el) => {
        el.classList.add("bf-parallax");
        return { el, amount };
      })
    );

    let frame = 0;
    const update = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      layers.forEach(({ el, amount }) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
        const center = rect.top + rect.height / 2;
        const progress = Math.max(-1, Math.min(1, (middle - center) / window.innerHeight));
        el.style.setProperty("--bf-py", `${(progress * amount).toFixed(2)}px`);
      });
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      layers.forEach(({ el }) => {
        el.classList.remove("bf-parallax");
        el.style.removeProperty("--bf-py");
      });
      revealEls.forEach((el) => el.classList.remove("bf-reveal", "is-in"));
    };
  }, []);

  return null;
}
