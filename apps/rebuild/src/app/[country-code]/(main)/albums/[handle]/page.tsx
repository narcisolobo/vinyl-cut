import { getProductByHandle } from "@/lib/data/products";
import { buildMetaDescription } from "@/lib/utils/build-meta-description";
import { toAlbum } from "@/lib/utils/map-to-album";
import AlbumDetails from "@/views/store/albums/AlbumDetails";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface AlbumDetailsPageProps {
  params: Promise<{ "country-code": string; handle: string }>;
  searchParams: Promise<{ variantId?: string }>;
}

async function generateMetadata(
  props: AlbumDetailsPageProps,
): Promise<Metadata> {
  const { "country-code": countryCode, handle } = await props.params;

  const album = await getProductByHandle(handle, countryCode);
  if (!album) notFound();

  return {
    title: `${album.subtitle} — ${album.title} | The Vinyl Cut`,
    description: buildMetaDescription(album.description ?? ""),
  };
}

async function AlbumDetailsPage(props: AlbumDetailsPageProps) {
  const { "country-code": countryCode, handle } = await props.params;

  const product = await getProductByHandle(handle, countryCode);
  if (!product) notFound();

  return (
    <main>
      <AlbumDetails album={toAlbum(product)} />
    </main>
  );
}

export { generateMetadata };
export default AlbumDetailsPage;
