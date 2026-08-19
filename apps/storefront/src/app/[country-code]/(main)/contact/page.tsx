import ClosingCta from "@/components/ClosingCta";
import VisitUs from "@/components/VisitUs";
import FAQs from "@/views/contact-us/faqs/FAQs";
import ContactHero from "@/views/contact-us/hero/ContactHero";
import DropUsALine from "@/views/contact-us/email/DropUsALine";
import type { Metadata } from "next";

const meta = {
  title: "Contact Us | The Vinyl Cut",
  description:
    "Get in touch with The Vinyl Cut — questions about an order, selling your records, or grading. Visit us on SE Hawthorne Blvd in Portland, or drop us a line.",
};

const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: "https://vinylcut.narcisolobo.com/contact",
    type: "website",
  },
};

function ContactUsPage() {
  return (
    <main>
      <ContactHero />
      <DropUsALine />
      <FAQs />
      <VisitUs className="bg-base-100" />
      <ClosingCta
        headline="Don't Just Wait Around."
        flavorText="We'll get back to you soon — no reason not to browse in the meantime."
      />
    </main>
  );
}

export { metadata };
export default ContactUsPage;
