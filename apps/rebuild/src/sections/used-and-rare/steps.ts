type Step = {
  step: number;
  title: string;
  subtitle: string;
};

const steps: Step[] = [
  {
    step: 1,
    title: "Drop your email",
    subtitle: "No account needed — just an inbox.",
  },
  {
    step: 2,
    title: "Confirm it's you",
    subtitle: "One click on the link we send over.",
  },
  {
    step: 3,
    title: "We holler when it's back",
    subtitle: "Same release, same grade, straight to your inbox.",
  },
];

export { type Step };
export { steps };
