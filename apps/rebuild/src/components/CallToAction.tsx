import Link from "@/components/LocalizedClientLink";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";

interface CallToActionProps {
  headline: string;
  flavorText: string;
}

function CallToAction({ headline, flavorText }: CallToActionProps) {
  return (
    <section className="bg-primary text-primary-content px-8 py-16 text-center lg:py-24">
      <h2 className="font-heading text-shadow-cta text-heading mb-4 uppercase">
        {headline}
      </h2>
      <p className="mx-auto mb-8 max-w-xl text-lg lg:text-xl">{flavorText}</p>
      <Link
        href="/store"
        className="btn btn-accent btn-lg lg:btn-xl group uppercase"
      >
        Browse The Crates
        <ArrowRightIcon
          size={32}
          className="transition-transform duration-200 ease-out group-hover:translate-x-1"
        />
      </Link>
    </section>
  );
}

export default CallToAction;
