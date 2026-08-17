import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { ProductVariantDTO } from '@medusajs/framework/types';
import { assets, brandCopy, colors, fonts } from './brand';

type VariantRestockSubscribedEmailProps = {
  variant: ProductVariantDTO;
  url?: string;
};

function VariantRestockSubscribedEmailComponent({
  variant,
  url,
}: VariantRestockSubscribedEmailProps) {
  const productTitle = variant.product?.title ?? variant.title;
  const thumbnail = variant.thumbnail ?? variant.product?.thumbnail ?? '';

  return (
    <Tailwind>
      <Html className="font-sans" style={{ backgroundColor: '#F5F5F4' }}>
        <Head />
        <Preview>You're on the list for {productTitle}</Preview>
        <Body
          className="my-10 mx-auto w-full max-w-2xl"
          style={{ backgroundColor: '#fff', fontFamily: fonts.body }}>
          {/* Header */}
          <Section
            className="px-6 py-4"
            style={{ backgroundColor: colors.base100 }}>
            <Img src={assets.logoUrl} alt="The Vinyl Cut" height="32" />
          </Section>

          {/* Confirmation Message */}
          <Container className="p-6">
            <Heading
              className="text-2xl font-bold text-center"
              style={{
                color: colors.neutral,
                fontFamily: fonts.heading,
                textTransform: 'uppercase',
              }}>
              You're on the list!
            </Heading>
            <Text className="text-center mt-2" style={{ color: '#57534E' }}>
              We'll email you the moment this one's back in stock.
            </Text>
          </Container>

          {/* Variant Details */}
          <Container className="px-6">
            <Section className="border-b border-stone-200 py-4">
              <Row>
                <Column className="w-1/3">
                  <Img
                    src={thumbnail}
                    alt={productTitle}
                    className="rounded-lg"
                    width="100%"
                  />
                </Column>
                <Column className="w-2/3 pl-4">
                  <Text
                    className="text-lg font-semibold"
                    style={{ color: colors.neutral }}>
                    {productTitle}
                  </Text>
                  <Text style={{ color: '#57534E' }}>
                    Grading: {variant.title}
                  </Text>
                  {variant.sku && (
                    <Text className="text-sm" style={{ color: '#78716C' }}>
                      SKU: {variant.sku}
                    </Text>
                  )}
                </Column>
              </Row>
            </Section>

            {url && (
              <Section className="mt-6 text-center">
                <Link
                  href={url}
                  className="font-semibold px-6 py-3 rounded-lg"
                  style={{
                    backgroundColor: colors.accent,
                    color: '#fff',
                    textTransform: 'uppercase',
                  }}>
                  View This Record
                </Link>
              </Section>
            )}
          </Container>

          {/* Footer */}
          <Section
            className="p-6 mt-10"
            style={{ backgroundColor: colors.base100 }}>
            <Text
              className="text-center text-sm"
              style={{ color: '#A8A29E' }}>
              If you have any questions, reply to this email or contact our
              support team at {brandCopy.supportEmail}.
            </Text>
            <Text
              className="text-center text-xs mt-4"
              style={{ color: '#78716C' }}>
              © {new Date().getFullYear()} {brandCopy.copyrightName}. All
              rights reserved.
            </Text>
          </Section>
        </Body>
      </Html>
    </Tailwind>
  );
}

const variantRestockSubscribedEmail = (
  props: VariantRestockSubscribedEmailProps,
) => <VariantRestockSubscribedEmailComponent {...props} />;

/**
 * Sample variant for react-email dev's preview server, which renders the
 * default export with no props. This is a real variant/product dump (the
 * same Marvin Gaye record used in order-placed.tsx's preview), not a
 * hand-typed fixture, so it doesn't fully satisfy `ProductVariantDTO`'s
 * nested `product` field (missing `variants`/`options`/`tags`/etc.) — hence
 * the `@ts-expect-error` below.
 */
const mockVariant = {
  variant: {
    id: 'variant_01KYYXZ9K9J0XRANF2GSSSK01N',
    title: 'NM',
    sku: 'BA91F9E2-nm',
    barcode: null,
    ean: null,
    upc: null,
    allow_backorder: false,
    manage_inventory: true,
    thumbnail: null,
    requires_shipping: true,
    hs_code: null,
    origin_country: null,
    mid_code: null,
    material: null,
    weight: null,
    length: null,
    height: null,
    width: null,
    options: [],
    images: [],
    metadata: null,
    product_id: 'prod_01KYYXZ9J7FZKDE7E8DEFABK93',
    variant_rank: 0,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    product: {
      id: 'prod_01KYYXZ9J7FZKDE7E8DEFABK93',
      title: "What's Going On",
      handle: 'marvin-gaye-whats-going-on',
      subtitle: null,
      description:
        'Marvin Gaye — What’s Going On\n1971 · Tamla · TS310 · 12" Vinyl',
      is_giftcard: false,
      status: 'published',
      thumbnail:
        'http://localhost:54321/storage/v1/object/public/vinyl-cut/1785610531368-TS310-front-250-01KZ33899YBWAF96AX8KQ7G6QB.jpg',
      width: null,
      weight: null,
      length: null,
      height: null,
      origin_country: null,
      hs_code: null,
      mid_code: null,
      material: null,
      collection: null,
      collection_id: null,
      type: null,
      type_id: null,
      tags: [],
      images: [],
      external_id: null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    },
  },
  url: 'http://localhost:8000/us/albums/marvin-gaye-whats-going-on',
};

const VariantRestockSubscribedEmailPreview = () => (
  // @ts-expect-error mockVariant is a real variant/product dump, not a full ProductVariantDTO
  <VariantRestockSubscribedEmailComponent {...mockVariant} />
);

/**
 * The default export is for react-email dev's preview server, which only
 * discovers files with a default export; `variantRestockSubscribedEmail` is
 * what service.ts's `templates` map actually imports and uses.
 */
export {
  variantRestockSubscribedEmail,
  VariantRestockSubscribedEmailPreview as default,
};
