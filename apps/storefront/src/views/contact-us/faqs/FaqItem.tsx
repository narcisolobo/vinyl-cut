import type { FaqItem as FaqItemData } from "./faq-items";

interface FaqItemProps extends FaqItemData {
  open?: boolean;
}

function FaqItem({ question, answer, open = false }: FaqItemProps) {
  return (
    <details
      open={open}
      name="faq-accordion"
      className="collapse-plus border-accent/30 bg-base-200 collapse border"
    >
      <summary className="collapse-title hover:text-primary text-lg font-semibold lg:text-xl">
        {question}
      </summary>
      <div className="collapse-content text-sm lg:text-lg">{answer}</div>
    </details>
  );
}

export default FaqItem;
