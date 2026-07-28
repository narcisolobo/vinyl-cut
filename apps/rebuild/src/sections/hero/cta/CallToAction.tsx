import { ArrowRightIcon } from "@phosphor-icons/react/ssr";

function CallToAction() {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-5">
      <button className="btn btn-lg text-primary btn-accent btn-outline hover:text-base-content font-bold tracking-widest uppercase">
        Browse the crates
        <ArrowRightIcon />
      </button>
      <div className="flex flex-col leading-5">
        <span className="text-sm uppercase">Since</span>
        <span className="font-heading text-primary text-xl">&lsquo;84</span>
      </div>
    </div>
  );
}

export default CallToAction;
