import {
  FacebookLogoIcon,
  TwitterLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react";

function Footer() {
  return (
    <footer className="footer sm:footer-horizontal bg-base-300 p-10">
      <aside>
        <p>
          <span className="text-xl">The Vinyl Cut</span>
          <br />
          Tagline goes here.
        </p>
      </aside>
      <nav>
        <h6 className="footer-title">Social</h6>
        <div className="grid grid-flow-col gap-4">
          <TwitterLogoIcon size={24} weight="fill" />
          <YoutubeLogoIcon size={24} weight="fill" />
          <FacebookLogoIcon size={24} weight="fill" />
        </div>
      </nav>
    </footer>
  );
}

export default Footer;
