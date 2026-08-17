import { Fragment, ReactNode } from "react";
import GradingGuideButton from "@/components/GradingGuide/GradingGuideButton";
import Link from "@/components/LocalizedClientLink";

type FaqItem = {
  question: string;
  answer: string | ReactNode;
};

const faqItems: FaqItem[] = [
  {
    question: "Is this a real store?",
    answer:
      "No — The Vinyl Cut is a fictional portfolio demo. No real orders are placed or fulfilled.",
  },
  {
    question: "Do you buy records?",
    answer: (
      <Fragment>
        Yes — see{" "}
        <Link href="/sell" className="link link-primary">
          Sell Your Records
        </Link>{" "}
        for how it works.
      </Fragment>
    ),
  },
  {
    question: "Where do you ship?",
    answer: (
      <Fragment>
        Flat-rate, across the Mountain West and Pacific Coast. Full details on{" "}
        <Link href="/shipping" className="link link-primary">
          Shipping &amp; Returns
        </Link>
        .
      </Fragment>
    ),
  },
  {
    question: "How do you grade used vinyl?",
    answer: (
      <Fragment>
        By hand, against the same scale every time — see our{" "}
        <GradingGuideButton label="Grading Guide" className="link-primary" />.
      </Fragment>
    ),
  },
  {
    question: "Can I return something?",
    answer: (
      <Fragment>
        Depends what you bought — used records are sold as-graded, new pressings
        can go back unopened. Full policy on{" "}
        <Link href="/shipping" className="link link-primary">
          Shipping &amp; Returns
        </Link>
        .
      </Fragment>
    ),
  },
  {
    question: "Can I listen to a record before I buy it?",
    answer:
      "Bring it to the counter and we'll point you to the listening station right next door. Headphones are already plugged in.",
  },
  {
    question: "Can you hold a record for me?",
    answer:
      "Yes, for 48 hours — just ask at the counter. After that, it's back in the crates for the next person to find.",
  },
  {
    question: "Do you participate in Record Store Day?",
    answer:
      "Every single one since it began in 2008. Check our socials closer to the date for our RSD lineup and any doorbuster drops.",
  },
  {
    question: "Do you sell turntables, sleeves, or other accessories?",
    answer:
      "Not currently — we're all about the records themselves. For gear and accessories, your local audio shop's got you covered.",
  },
];

export { faqItems, type FaqItem };
