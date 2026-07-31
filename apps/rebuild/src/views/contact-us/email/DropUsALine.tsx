import Eyebrow from "@/components/Eyebrow";
import { InfoIcon } from "@phosphor-icons/react/ssr";

function DropUsALine() {
  return (
    <section className="bg-base-100 px-8 py-12 md:py-16 lg:py-20 2xl:px-0">
      <div className="mx-auto max-w-7xl">
        <hgroup
          role="group"
          aria-roledescription="Heading group"
          className="mb-12"
        >
          <Eyebrow message="Get in Touch" />
          <h2 className="font-heading text-shadow-headline text-heading mb-6 leading-none uppercase">
            Drop us a line.
          </h2>
        </hgroup>
        <p className="mb-6 text-lg lg:text-xl">
          Have a question about an order, a record you&apos;re looking to sell?
          In the mood to talk shop? We usually get back within a day or two.
          Email us at{" "}
          <a
            href="mailto:thevinylcut@narcisolobo.com"
            className="link link-primary"
          >
            hello@thevinylcut.com
          </a>
          .
        </p>
        <div className="alert alert-info alert-soft border-info border">
          <InfoIcon size={24} color="#0ca5e9" weight="fill" />
          <p className="text-base-content/70 text-xs lg:text-sm">
            This page describes a fictional business as part of a non-commercial
            portfolio demo. Messages sent through this page are not monitored as
            part of a real support process.
          </p>
        </div>
      </div>
    </section>
  );
}

export default DropUsALine;
