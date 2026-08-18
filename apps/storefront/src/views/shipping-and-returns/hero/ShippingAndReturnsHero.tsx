import Eyebrow from "@/components/Eyebrow";
import FunkyImageBorder from "@/components/FunkyImageBorder";
import packingRecord from "./images/packing-record.jpg";

function ShippingAndReturnsHero() {
  return (
    <section
      id="home"
      className="vc-gradient px-8 pt-36 pb-24 md:pb-28 lg:pt-56 lg:pb-32 2xl:px-0"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 sm:flex-row">
        <div className="order-2 hidden flex-1 md:block xl:order-1">
          <FunkyImageBorder
            image={packingRecord}
            alt="Image of clerk carefully packing a vinyl record"
            loading="eager"
          />
        </div>
        <div className="order-1 xl:order-2">
          <hgroup
            role="group"
            aria-roledescription="Heading group"
            className="mb-12"
          >
            <Eyebrow message="The Details" />
            <h1 className="font-heading text-shadow-headline mb-6 text-[clamp(2.6rem,6.2vw,6rem)] leading-none uppercase">
              Shipping
              <br />
              <span className="text-shadow-headline-inverted text-accent">
                & Returns
              </span>
            </h1>
          </hgroup>
          <p className="mb-8 text-[clamp(1.05rem,1.4vw,1.3rem)] md:max-w-[35ch] lg:max-w-[50ch]">
            Flat-rate shipping across the Mountain West and Pacific Coast. Sold
            as-graded, packed to last, and made right if something goes wrong
            along the way.
          </p>
        </div>
      </div>
    </section>
  );
}
export default ShippingAndReturnsHero;
