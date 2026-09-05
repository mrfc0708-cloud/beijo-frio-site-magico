import type { ReactNode, Ref } from "react";
import { WHATSAPP_URL } from "../lib/whatsapp";

type OrderButtonProps = {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  ref?: Ref<HTMLAnchorElement>;
};

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
      <path d="M16.03 3.2a12.75 12.75 0 0 0-10.9 19.37L3.3 29.28l6.86-1.8a12.77 12.77 0 1 0 5.87-24.28Zm0 23.35c-1.9 0-3.77-.5-5.4-1.44l-.39-.23-4.07 1.07 1.09-3.97-.25-.41a10.57 10.57 0 1 1 9.02 4.98Zm5.8-7.92c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.31-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57a9.56 9.56 0 0 1-1.76-2.19c-.18-.32-.02-.49.14-.65.14-.14.32-.37.47-.55.16-.19.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.15-.71-1.71-.97-2.34-.26-.62-.52-.54-.71-.55h-.61c-.21 0-.55.08-.84.4-.29.31-1.1 1.08-1.1 2.63s1.13 3.05 1.29 3.26c.16.21 2.22 3.39 5.38 4.75.75.32 1.34.52 1.8.67.76.24 1.44.21 1.99.13.6-.09 1.88-.77 2.14-1.51.27-.74.27-1.37.19-1.5-.08-.13-.29-.21-.61-.37Z" />
    </svg>
  );
}

export function OrderButton({ children, className = "", compact = false, ref }: OrderButtonProps) {
  return (
      <a
        ref={ref}
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`order-button ${compact ? "order-button-compact" : ""} ${className}`}
        aria-label={`${String(children)} pelo WhatsApp`}
      >
        <WhatsAppIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
        <span>{children}</span>
    </a>
  );
}

export { WHATSAPP_URL };
