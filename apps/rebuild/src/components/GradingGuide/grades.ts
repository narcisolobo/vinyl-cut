type Grade = {
  symbol: "M" | "NM" | "VG+" | "VG" | "G";
  title: string;
  description: string;
  pips: number;
};

const grades: Grade[] = [
  {
    symbol: "M",
    title: "Mint",
    description: "Perfect, unplayed condition.",
    pips: 5,
  },
  {
    symbol: "NM",
    title: "Near Mint",
    description: "Minimal signs of handling, no noticeable wear.",
    pips: 4,
  },
  {
    symbol: "VG+",
    title: "Very Good Plus",
    description: "Light wear, plays with minimal surface noise.",
    pips: 3,
  },
  {
    symbol: "VG",
    title: "Very Good",
    description: "Noticeable wear, audible but not distracting surface noise.",
    pips: 2,
  },
  {
    symbol: "G",
    title: "Good",
    description: "Significant wear, playable with clear surface noise.",
    pips: 1,
  },
];

export type { Grade };
export { grades };
