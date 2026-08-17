import Image from "next/image";
import kindOfBlue from "./covers/kind-of-blue.jpg";

function UsedAndRareMockup() {
  return (
    <div className="card bg-base-300 border-accent/50 relative w-fit border shadow-[0px_30px_60px_oklch(0_0_0/0.4)]">
      <div className="card-body">
        <figure className="mb-4">
          <Image src={kindOfBlue} alt="Kind of Blue album cover art" />
        </figure>
        <span className="badge badge-error badge-lg font-heading absolute -top-2 -left-4 uppercase">
          Sold Out
        </span>
        <h3 className="card-title text-lg font-bold lg:text-xl">
          Kind of Blue
        </h3>
        <p className="text-primary/80">Miles Davis (Grade VG+)</p>
        <div className="divider"></div>
        <p className="text-accent mb-1 font-semibold uppercase">Notify me</p>
        <div className="mb-1 flex items-center gap-2" aria-hidden="true">
          <div className="border-accent/50 bg-base-100 flex-1 border p-3">
            you@email.com
          </div>
          <div className="border-accent bg-base-300 border p-3 uppercase">
            Notify
          </div>
        </div>
        <p className="text-xs">
          We&apos;ll email a one-click link to confirm. No spam, no account.
        </p>
      </div>
    </div>
  );
}

export default UsedAndRareMockup;
