import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";

function CallToAction() {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-5">
      <Link
        href="/store"
        className="btn btn-lg md:text-primary btn-accent md:btn-outline hover:text-base-content font-bold tracking-widest uppercase"
      >
        Browse the crates
        <ArrowRightIcon />
      </Link>
      <div className="flex basis-full flex-col leading-5 xl:basis-auto">
        <span className="text-sm uppercase">Since</span>
        <span className="font-heading text-primary text-xl">&lsquo;84</span>
      </div>
    </div>
  );
}

export default CallToAction;
