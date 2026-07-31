import ClosingCta from "@/components/ClosingCta";
import ShippingAndReturnsHero from "@/views/shipping-and-returns/hero/ShippingAndReturnsHero";
import ReturnSpecs from "@/views/shipping-and-returns/return-specs/ReturnSpecs";
import ShippingSpecs from "@/views/shipping-and-returns/shipping-specs/ShippingSpecs";
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
      <ShippingSpecs />
      <ReturnSpecs />
      <ClosingCta
        headline="Good. Now Let's Shop."
        flavorText="Shipping's sorted, returns are covered — nothing left to do but pick something out."
      />
    </main>
  );
}

export { metadata };
export default ShippingAndReturnsPage;
