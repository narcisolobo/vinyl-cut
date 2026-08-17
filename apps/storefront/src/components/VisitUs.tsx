import Eyebrow from "@/components/Eyebrow";
import { InfoIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils/cn";

interface VisitUsProps {
  className: string;
}

function VisitUs({ className }: VisitUsProps) {
  return (
    <section className={cn("px-8 py-12 md:py-16 lg:py-20 2xl:px-0", className)}>
      <div className="mx-auto max-w-7xl">
        <hgroup
          role="group"
          aria-roledescription="Heading group"
          className="mb-12"
        >
          <Eyebrow message="Get Directions" />
          <h2 className="font-heading text-shadow-headline text-heading mb-6 leading-none uppercase">
            Come on by.
          </h2>
          <p className="mb-6 text-lg lg:text-xl">
            Right on Hawthorne, Portland&apos;s record-row strip — swing by, dig
            through the crates, and take your time.
          </p>
        </hgroup>
        <div className="mt-16 mb-8 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[3fr_2fr]">
          <div className="relative h-64 overflow-hidden rounded-lg lg:h-auto">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d11183.624608801363!2d-122.64163027249208!3d45.511967787193896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5495a091c76662e7%3A0xb091c3a833660c89!2sHawthorne%2C%20Portland%2C%20OR!5e0!3m2!1sen!2sus!4v1785520359132!5m2!1sen!2sus"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full border-0"
              title="The Vinyl Cut Location"
            ></iframe>
          </div>
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-primary text-xs font-semibold tracking-wide uppercase">
                Address
              </h3>
              <p className="mt-2 font-semibold">SE Hawthorne Blvd.</p>
              <p>Portland, OR 97214</p>
              <p className="text-base-content/70 mt-2 text-sm">
                Street parking + small lot behind the building.
              </p>
            </div>
            <div>
              <h3 className="text-primary text-xs font-semibold tracking-wide uppercase">
                Hours
              </h3>
              <div className="mt-2 flex max-w-xs justify-between">
                <span>Mon</span>
                <span className="font-semibold">Closed</span>
              </div>
              <div className="mt-1 flex max-w-xs justify-between">
                <span>Tues – Sun</span>
                <span className="font-semibold">11:00 AM – 7:00 PM</span>
              </div>
            </div>
            <div>
              <h3 className="text-primary text-xs font-semibold tracking-wide uppercase">
                Contact
              </h3>
              <p className="mt-2 font-semibold">(503) 555-1984</p>
              <p className="font-semibold">
                <a href="mailto:thevinylcut.com">hello@thevinylcut.com</a>
              </p>
            </div>
          </div>
        </div>
        <div className="alert alert-info alert-soft border-info">
          <InfoIcon size={24} color="#0ca5e9" weight="fill" />
          <p className="text-base-content/70 text-xs lg:text-sm">
            The address, hours, and phone number above are fictional, provided
            as part of this non-commercial portfolio demo. The Vinyl Cut is not
            a real, visitable location.
          </p>
        </div>
      </div>
    </section>
  );
}

export default VisitUs;
