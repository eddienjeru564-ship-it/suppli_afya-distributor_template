"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { Portrait } from "@/components/brand/Portrait";
import { useStorefront } from "@/components/store/StorefrontProvider";
import { Bag, WhatsAppIcon } from "@/components/ui/icons";
import { ContactAction } from "@/components/whatsapp/ContactAction";
import { askMessage } from "@/storefront/messages";

/** The distributor's name is always in view; so are "message" and "your order". */
export function TopBar() {
  const { sf, priced, openOrder, goToSection } = useStorefront();
  const d = sf.distributor;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const nav = [
    { id: "choose", label: "Recommendations" },
    { id: "products", label: "Products" },
    { id: "ordering", label: "Ordering" },
    { id: "about", label: `Meet ${d.firstName}` },
  ];

  return (
    <header
      className={clsx(
        "sticky top-0 z-30 transition-[background-color,box-shadow] duration-300",
        "bg-canvas",
        scrolled && "shadow-[0_1px_0_rgb(28_26_23/0.08)]",
      )}
    >
      <div className="container-x flex h-16 items-center gap-3">
        <a href="#top" className="flex min-h-11 min-w-0 items-center gap-2.5" aria-label={`${d.name}, back to the top`}>
          <Portrait distributor={d} size="sm" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[0.98rem] font-semibold text-ink">{d.name}</span>
            <span className="block truncate text-[0.75rem] text-ink-3">{d.role}</span>
          </span>
        </a>

        <nav aria-label="Sections" className="ml-auto hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => goToSection(n.id)}
              className="h-11 rounded-full px-3.5 text-[0.9rem] font-medium text-ink-2 transition-colors hover:bg-ink/[0.05] hover:text-ink"
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-3">
          <ContactAction
            text={askMessage(sf)}
            unstyled
            aria-label={`Message ${d.firstName} on WhatsApp`}
            className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]"
          >
            <WhatsAppIcon className="h-[1.3rem] w-[1.3rem]" />
          </ContactAction>
          <button
            type="button"
            onClick={openOrder}
            aria-label={priced.count ? `Your order: ${priced.count} item${priced.count > 1 ? "s" : ""}` : "Your order"}
            className="relative grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]"
          >
            <Bag className="h-[1.35rem] w-[1.35rem]" />
            {priced.count > 0 && (
              <span
                key={priced.count}
                className="price absolute right-0.5 top-0.5 grid h-[1.15rem] min-w-[1.15rem] animate-bump place-items-center rounded-full bg-accent px-1 text-[0.68rem] font-bold text-on-accent"
              >
                {priced.count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
