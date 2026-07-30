import { MapPinIcon } from "@phosphor-icons/react/dist/ssr";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";

function VisitUs() {
  return (
    <section className="bg-base-300 flex min-h-[25vh] items-center justify-center overflow-hidden px-8 py-12 md:py-16 lg:py-20">
      <div className="border-accent/50 flex w-fit flex-col gap-12 border p-8 md:justify-between md:p-16 lg:flex-row lg:items-center">
        <div className="border-accent bg-base-100 text-accent aspect-square w-fit rounded-full border p-4">
          <MapPinIcon size={48} weight="fill" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-3xl">Visit Us</h2>
          <p className="max-w-[45ch] text-lg">
            SE Hawthorne Blvd, Portland, OR. No appointment needed. Just bring
            the records and a little patience while we dig in.
          </p>
        </div>
        <button className="btn btn-accent btn-outline btn-xl uppercase">
          Get Directions
          <ArrowRightIcon className="hidden sm:block" />
        </button>
      </div>
    </section>
  );
}

export default VisitUs;
