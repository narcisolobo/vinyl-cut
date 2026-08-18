import Step from "./Step";
import styles from "./steps.module.css";
import type { Step as StepType } from "./types";

interface StepsProps {
  steps: StepType[];
}

function Steps({ steps }: StepsProps) {
  return (
    <ol className={`${styles.steps} flex flex-col gap-8`}>
      {steps.map(({ step, title, subtitle }) => (
        <Step key={step} step={step} title={title} subtitle={subtitle} />
      ))}
    </ol>
  );
}

export default Steps;
