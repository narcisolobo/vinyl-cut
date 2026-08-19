import Eyebrow from "@/components/Eyebrow";
import Link from "next/link";

interface NotFoundProps {
  eyebrow: string;
  headline: string;
  message: string;
  cta: {
    href: string;
    label: string;
  };
}

function NotFound({ eyebrow, headline, message, cta }: NotFoundProps) {
  return (
    <section
      id="home"
      className="vc-gradient min-h-dvh px-8 pt-36 pb-24 md:pb-28 lg:pt-56 lg:pb-32 2xl:px-0"
    >
      <div className="mx-auto max-w-5xl">
        <hgroup>
          <Eyebrow message={eyebrow} />
          <h1 className="font-heading text-shadow-headline mb-6 text-[clamp(2.6rem,6.2vw,6rem)] leading-none uppercase">
            {headline}
          </h1>
        </hgroup>
        <p className="mb-8 text-[clamp(1.05rem,1.4vw,1.3rem)] md:max-w-[35ch] lg:max-w-[50ch]">
          {message}
        </p>
        <Link href={cta.href} className="btn btn-lg btn-primary">
          {cta.label}
        </Link>
      </div>
    </section>
  );
}

export default NotFound;
