import type { Metadata } from "next";
import { About } from "@/components/sections/About";
import { Catalogue } from "@/components/sections/Catalogue";
import { ChooseSection } from "@/components/sections/ChooseSection";
import { Closing, Footer } from "@/components/sections/Closing";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { MobileBar, Toaster } from "@/components/sections/MobileBar";
import { Overlays } from "@/components/Overlays";
import { Ordering } from "@/components/sections/Ordering";
import { TopBar } from "@/components/sections/TopBar";
import { PageShell } from "@/components/store/PageShell";
import { StorefrontProvider } from "@/components/store/StorefrontProvider";
import { canPlaceOrders } from "@/storefront/order";
import { themeCss } from "@/storefront/theme";
import type { Storefront } from "@/storefront/types";

/**
 * One distributor's storefront. The page reads top to bottom as one journey:
 *   whose page this is, and personal recommendations or the products
 *   → what would you like help with? (the first step of the recommendations)
 *   → how the recommendations work, in three steps
 *   → the products, with prices
 *   → how ordering, delivery and payment work
 *   → meet your distributor
 *   → a last, low-pressure "ask".
 * Overlays (selector, product, order) sit on top of the page rather than replacing it,
 * so nobody loses their place.
 */
export function StorefrontPage({ sf }: { sf: Storefront }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCss(sf.theme) }} />
      <StorefrontProvider sf={sf}>
        <PageShell>
          <TopBar />
          <main>
            <Hero />
            <ChooseSection />
            <HowItWorks />
            <Catalogue />
            <Ordering />
            <About />
            <Closing />
          </main>
          <Footer />
          <MobileBar />
        </PageShell>
        <Toaster />
        <Overlays />
      </StorefrontProvider>
    </>
  );
}

export function storefrontMetadata(sf: Storefront, path: string): Metadata {
  const d = sf.distributor;
  const count = Object.keys(sf.catalogue.offers).length;
  const title = `${d.name} · Help choosing BF Suma products, with prices`;
  const description = `Find the right wellness products for your goals. Answer a few simple questions and see what may suit you, with prices and the reasons why. Or browse ${count} products and order from ${d.firstName}${canPlaceOrders(sf) ? "" : " on WhatsApp"}.`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${d.name}${d.area ? ` · ${d.area}` : ""}`, description, siteName: d.name, locale: "en_KE", type: "website", url: path },
    twitter: { card: "summary_large_image" },
    // Preview storefronts carry placeholder details; keep them out of search results.
    robots: sf.status === "live" ? undefined : { index: false, follow: false },
  };
}
