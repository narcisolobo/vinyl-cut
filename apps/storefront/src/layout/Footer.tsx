import GradingGuideButton from "@/components/GradingGuide/GradingGuideButton";
import Link from "@/components/LocalizedClientLink";
import {
  TiktokLogoIcon,
  YoutubeLogoIcon,
  InstagramLogoIcon,
} from "@phosphor-icons/react";

const stateAbbreviations = ["CA", "OR", "WA", "NV", "AZ", "CO", "UT", "NM"];

interface StateProps {
  state: string;
}

function State({ state }: StateProps) {
  return (
    <div className="border-accent/50 border px-3 py-1">
      <p className="text-primary text-sm font-semibold">{state}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer lg:footer-horizontal bg-base-200 text-base-content gap-16 p-10">
      <aside>
        <h4 className="font-brand text-primary text-4xl">The Vinyl Cut</h4>
        <p className="mb-6">
          New pressings, rare finds,
          <br />
          and records worth digging for.
        </p>
        <div className="flex items-center gap-4">
          <TiktokLogoIcon size={32} />
          <YoutubeLogoIcon size={32} />
          <InstagramLogoIcon size={32} />
        </div>
      </aside>
      <nav>
        <h4 className="text-primary font-bold uppercase">Shop</h4>
        <Link className="link link-hover" href="/store">
          New Arrivals
        </Link>
        <Link className="link link-hover" href="/store">
          Browse by Genre
        </Link>
        <Link className="link link-hover" href="/store">
          Browse by Era
        </Link>
        <Link className="link link-hover" href="/sell">
          Sell Your Records
        </Link>
      </nav>
      <nav>
        <h4 className="text-primary font-bold uppercase">Help</h4>
        <GradingGuideButton label="Grading Guide" />
        <Link className="link link-hover" href="/shipping">
          Shipping & Returns
        </Link>
        <Link className="link link-hover" href="/contact#faq">
          FAQ
        </Link>
        <Link className="link link-hover" href="/contact">
          Contact
        </Link>
      </nav>
      <nav>
        <h4 className="text-primary font-bold uppercase">Where We Ship</h4>
        <p className="mb-2">
          Flat rate shipping. Mountain West and Pacific Coast only.
        </p>
        <div className="flex flex-wrap gap-2">
          {stateAbbreviations.map((state) => (
            <State key={state} state={state} />
          ))}
        </div>
      </nav>
    </footer>
  );
}

export default Footer;
