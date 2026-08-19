import NotFound from "@/views/not-found/NotFound";

const cta = {
  href: "/",
  label: "Back to home",
};

function NotFoundPage() {
  return (
    <NotFound
      eyebrow="Wrong turn"
      headline="Nothing Here."
      message="The page you're looking for doesn't exist, or it's moved. Let's get you back on track."
      cta={cta}
    />
  );
}

export default NotFoundPage;
