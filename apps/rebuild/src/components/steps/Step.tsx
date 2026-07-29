import type { Step } from "./types";
import styles from "./steps.module.css";

function Step({ title, subtitle }: Step) {
  return (
    <li className={`${styles.step} flex items-center gap-4`}>
      <div className="flex flex-col gap-0.5">
        <strong className="text-primary text-lg font-bold">{title}</strong>
        <p>{subtitle}</p>
      </div>
    </li>
  );
}

export default Step;
