import ShippingAndReturnsHero from "@/views/shipping-and-returns/hero/ShippingAndReturnsHero";
import WhatsListedIsWhatYouGet from "@/views/shipping-and-returns/return-specs/WhatsListedIsWhatYouGet";
import WeKeepItClose from "@/views/shipping-and-returns/shipping-specs/WeKeepItClose";
import type { Metadata } from "next";

const metadata: Metadata = {
  title: "Shipping & Returns | The Vinyl Cut",
  description:
    "Flat-rate shipping across the Mountain West and Pacific Coast. Used records are sold as-graded; new pressings return unopened within 14 days.",
};

function ShippingAndReturnsPage() {
  return (
    <main>
      <ShippingAndReturnsHero />
      <WeKeepItClose />
      <WhatsListedIsWhatYouGet />
    </main>
  );
}

export { metadata };
export default ShippingAndReturnsPage;
