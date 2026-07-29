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
    <footer className="footer sm:footer-horizontal bg-base-200 text-base-content p-10">
      <aside>
        <h4 className="font-brand text-primary text-4xl">The Vinyl Cut</h4>
        <p className="mb-6">
          New pressings, rare finds, and records worth digging for.
        </p>
        <div className="flex items-center gap-4">
          <TiktokLogoIcon size={32} />
          <YoutubeLogoIcon size={32} />
          <InstagramLogoIcon size={32} />
        </div>
      </aside>
      <nav>
        <h4 className="text-primary font-bold uppercase">Shop</h4>
        <a className="link link-hover">New Arrivals</a>
        <a className="link link-hover">Browse by Genre</a>
        <a className="link link-hover">Browse by Era</a>
        <a className="link link-hover">Sell Your Records</a>
      </nav>
      <nav>
        <h4 className="text-primary font-bold uppercase">Help</h4>
        <a className="link link-hover">Grading Guide</a>
        <a className="link link-hover">Shipping & Returns</a>
        <a className="link link-hover">FAQ</a>
        <a className="link link-hover">Contact</a>
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
