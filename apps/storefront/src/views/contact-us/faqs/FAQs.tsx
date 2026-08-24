import Eyebrow from "@/components/Eyebrow";
import { faqItems } from "./faq-items";
import FaqItem from "./FaqItem";

function FAQs() {
  return (
    <section
      id="faq"
      className="bg-base-300 px-8 py-12 md:py-16 lg:py-20 2xl:px-0"
    >
      <div className="mx-auto max-w-7xl">
        <hgroup
          role="group"
          aria-roledescription="Heading group"
          className="mb-12"
        >
          <Eyebrow message="Just the FAQs" />
          <h2 className="font-heading text-shadow-headline text-heading mb-6 leading-none uppercase">
            Good Questions.
          </h2>
        </hgroup>
        <div className="space-y-6">
          {faqItems.map(({ question, answer }, index) => (
            <FaqItem
              key={question}
              question={question}
              answer={answer}
              open={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQs;
