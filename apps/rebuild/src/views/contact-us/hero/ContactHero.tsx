import Eyebrow from "@/components/Eyebrow";
import FunkyImageBorder from "@/components/FunkyImageBorder";
import helpingCustomer from "./images/contact-hero.jpg";

function ContactHero() {
  return (
    <section
      id="home"
      className="vc-gradient px-8 pt-36 pb-24 md:pb-28 lg:pt-56 lg:pb-32 2xl:px-0"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 sm:flex-row">
        <div className="order-1">
          <hgroup
            role="group"
            aria-roledescription="Heading group"
            className="mb-12"
          >
            <Eyebrow message="Reach Us" />
            <h1 className="font-heading text-shadow-headline mb-6 text-[clamp(2.6rem,6.2vw,6rem)] leading-none uppercase">
              Say{" "}
              <span className="text-shadow-headline-inverted text-accent">
                Hello.
              </span>
            </h1>
          </hgroup>
          <p className="mb-8 text-[clamp(1.05rem,1.4vw,1.3rem)] md:max-w-[35ch] lg:max-w-[50ch]">
            Questions about an order, a sale, or just want to talk vinyl?
            We&apos;re around.
          </p>
        </div>
        <div className="order-2 hidden flex-1 md:block">
          <FunkyImageBorder
            image={helpingCustomer}
            alt="Shop owner smiling and showing a customer wearing headphones a record at the counter, surrounded by vinyl displays and a turntable"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
}

export default ContactHero;
