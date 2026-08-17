import { grades } from "./grades";
import Eyebrow from "../Eyebrow";
import GradingGuideTableRow from "./GradingGuideTableRow";
import { RefObject } from "react";

interface GradingGuideModalProps {
  ref: RefObject<HTMLDialogElement | null>;
}

function GradingGuideModal({ ref }: GradingGuideModalProps) {
  return (
    <dialog
      ref={ref}
      id="grading-guide-modal"
      className="modal"
      aria-labelledby="grading-guide-title"
    >
      <div className="modal-box">
        <hgroup role="group" aria-roledescription="Heading group">
          <Eyebrow message="The Scale" />
          <h1
            id="grading-guide-title"
            className="font-heading text-base-content text-shadow-headline mb-2 text-xl font-bold lg:text-4xl"
          >
            How We Grade
          </h1>
        </hgroup>
        <p className="mb-6">
          No guessing games. Here&apos;s exactly what each grade means.
        </p>
        <table className="mb-6">
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                Grade
              </th>
              <th scope="col" className="sr-only">
                Description
              </th>
              <th scope="col" className="sr-only">
                Scale
              </th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade) => (
              <GradingGuideTableRow key={grade.symbol} {...grade} />
            ))}
          </tbody>
        </table>
        <p className="text-primary text-xs lg:text-sm">
          Every used record in our crates is graded by hand against this same
          scale — what you see here is what lands in yours.
        </p>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn btn-neutral btn-outline text-neutral-content uppercase">
              Close
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
}

export default GradingGuideModal;
