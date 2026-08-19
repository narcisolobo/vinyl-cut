import NotFound from "@/views/not-found/NotFound";

const cta = {
  href: "/store",
  label: "Browse the Crates",
};

function AlbumNotFoundPage() {
  return (
    <NotFound
      eyebrow="Skipped track"
      headline="This One's Not on the Record."
      message="Whatever you were looking for isn't here — but the crates are just a click away."
      cta={cta}
    />
  );
}

export default AlbumNotFoundPage;
