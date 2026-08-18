import {
  Text,
  Column,
  Container,
  Heading,
  Html,
  Img,
  Row,
  Section,
  Tailwind,
  Head,
  Preview,
  Body,
  Link,
} from '@react-email/components';
import {
  BigNumberValue,
  CustomerDTO,
  OrderDTO,
} from '@medusajs/framework/types';
import { assets, brandCopy, colors, fonts } from './brand';

type OrderPlacedEmailProps = {
  order: OrderDTO & {
    customer: CustomerDTO;
  };
  email_banner?: {
    body: string;
    title: string;
    url: string;
  };
};

function OrderPlacedEmailComponent({
  order,
  email_banner,
}: OrderPlacedEmailProps) {
  const shouldDisplayBanner = email_banner && 'title' in email_banner;

  const formatter = new Intl.NumberFormat([], {
    style: 'currency',
    currencyDisplay: 'narrowSymbol',
    currency: order.currency_code,
  });

  const formatPrice = (price: BigNumberValue) => {
    if (typeof price === 'number') {
      return formatter.format(price / 100);
    }

    if (typeof price === 'string') {
      return formatter.format(parseFloat(price) / 100);
    }

    return price?.toString() || '';
  };

  return (
    <Tailwind>
      <Html className="font-sans" style={{ backgroundColor: '#F5F5F4' }}>
        <Head />
        <Preview>Thank you for your order from The Vinyl Cut</Preview>
        <Body
          className="my-10 mx-auto w-full max-w-2xl"
          style={{ backgroundColor: '#fff', fontFamily: fonts.body }}>
          {/* Header */}
          <Section
            className="px-6 py-4"
            style={{ backgroundColor: colors.base100 }}>
            {assets.logoUrl ? (
              <Img src={assets.logoUrl} alt="The Vinyl Cut" height="32" />
            ) : (
              <svg
                width="15"
                height="15"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M16.2447 3.92183L12.1688 1.57686C10.8352 0.807712 9.20112 0.807712 7.86753 1.57686L3.77285 3.92183C2.45804 4.69098 1.63159 6.11673 1.63159 7.63627V12.345C1.63159 13.8833 2.45804 15.2903 3.77285 16.0594L7.84875 18.4231C9.18234 19.1923 10.8165 19.1923 12.15 18.4231L16.2259 16.0594C17.5595 15.2903 18.3672 13.8833 18.3672 12.345V7.63627C18.4048 6.11673 17.5783 4.69098 16.2447 3.92183ZM10.0088 14.1834C7.69849 14.1834 5.82019 12.3075 5.82019 10C5.82019 7.69255 7.69849 5.81657 10.0088 5.81657C12.3191 5.81657 14.2162 7.69255 14.2162 10C14.2162 12.3075 12.3379 14.1834 10.0088 14.1834Z"
                  fill={colors.primary}></path>
              </svg>
            )}
          </Section>

          {/* Thank You Message */}
          <Container className="p-6">
            <Heading
              className="text-2xl font-bold text-center"
              style={{
                color: colors.neutral,
                fontFamily: fonts.heading,
                textTransform: 'uppercase',
              }}>
              Thank you for your order,{' '}
              {order.customer?.first_name || order.shipping_address?.first_name}
            </Heading>
            <Text className="text-center mt-2" style={{ color: '#57534E' }}>
              We're processing your order and will notify you when it ships.
            </Text>
          </Container>

          {/* Promotional Banner */}
          {shouldDisplayBanner && (
            <Container
              className="mb-4 rounded-lg p-7"
              style={{
                background: `linear-gradient(to right, ${colors.secondary}, ${colors.accent})`,
              }}>
              <Section>
                <Row>
                  <Column align="left">
                    <Heading
                      className="text-xl font-semibold"
                      style={{
                        color: '#fff',
                        fontFamily: fonts.heading,
                        textTransform: 'uppercase',
                      }}>
                      {email_banner.title}
                    </Heading>
                    <Text className="mt-2" style={{ color: '#fff' }}>
                      {email_banner.body}
                    </Text>
                  </Column>
                  <Column align="right">
                    <Link
                      href={email_banner.url}
                      className="font-semibold px-2 underline"
                      style={{ color: '#fff' }}>
                      Shop Now
                    </Link>
                  </Column>
                </Row>
              </Section>
            </Container>
          )}

          {/* Order Items */}
          <Container className="px-6">
            <Heading
              className="text-xl font-semibold mb-4"
              style={{
                color: colors.neutral,
                fontFamily: fonts.heading,
                textTransform: 'uppercase',
              }}>
              Your Items
            </Heading>
            <Row>
              <Column>
                <Text className="text-sm m-0 my-2" style={{ color: '#78716C' }}>
                  Order ID: #{order.display_id}
                </Text>
              </Column>
            </Row>
            {order.items?.map((item) => (
              <Section key={item.id} className="border-b border-stone-200 py-4">
                <Row>
                  <Column className="w-1/3">
                    <Img
                      src={item.thumbnail ?? ''}
                      alt={item.product_title ?? ''}
                      className="rounded-lg"
                      width="100%"
                    />
                  </Column>
                  <Column className="w-2/3 pl-4">
                    <Text
                      className="text-lg font-semibold"
                      style={{ color: colors.neutral }}>
                      {item.product_title}
                    </Text>
                    <Text style={{ color: '#57534E' }}>
                      {item.variant_title}
                    </Text>
                    <Text
                      className="mt-2 font-bold"
                      style={{ color: colors.neutral }}>
                      {formatPrice(item.total)}
                    </Text>
                  </Column>
                </Row>
              </Section>
            ))}

            {/* Order Summary */}
            <Section className="mt-8">
              <Heading
                className="text-xl font-semibold mb-4"
                style={{
                  color: colors.neutral,
                  fontFamily: fonts.heading,
                  textTransform: 'uppercase',
                }}>
                Order Summary
              </Heading>
              <Row style={{ color: '#57534E' }}>
                <Column className="w-1/2">
                  <Text className="m-0">Subtotal</Text>
                </Column>
                <Column className="w-1/2 text-right">
                  <Text className="m-0">{formatPrice(order.item_total)}</Text>
                </Column>
              </Row>
              {order.shipping_methods?.map((method) => (
                <Row style={{ color: '#57534E' }} key={method.id}>
                  <Column className="w-1/2">
                    <Text className="m-0">{method.name}</Text>
                  </Column>
                  <Column className="w-1/2 text-right">
                    <Text className="m-0">{formatPrice(method.total)}</Text>
                  </Column>
                </Row>
              ))}
              <Row style={{ color: '#57534E' }}>
                <Column className="w-1/2">
                  <Text className="m-0">Tax</Text>
                </Column>
                <Column className="w-1/2 text-right">
                  <Text className="m-0">
                    {formatPrice(order.tax_total || 0)}
                  </Text>
                </Column>
              </Row>
              <Row
                className="border-t border-stone-200 mt-4 font-bold"
                style={{ color: colors.neutral }}>
                <Column className="w-1/2">
                  <Text>Total</Text>
                </Column>
                <Column className="w-1/2 text-right">
                  <Text>{formatPrice(order.total)}</Text>
                </Column>
              </Row>
            </Section>
          </Container>

          {/* Footer */}
          <Section
            className="p-6 mt-10"
            style={{ backgroundColor: colors.base100 }}>
            <Text className="text-center text-sm" style={{ color: '#A8A29E' }}>
              If you have any questions, reply to this email or contact our
              support team at {brandCopy.supportEmail}.
            </Text>
            <Text className="text-center text-sm" style={{ color: '#A8A29E' }}>
              Order Token: {order.id}
            </Text>
            <Text
              className="text-center text-xs mt-4"
              style={{ color: '#78716C' }}>
              © {new Date().getFullYear()} {brandCopy.copyrightName}. All rights
              reserved.
            </Text>
          </Section>
        </Body>
      </Html>
    </Tailwind>
  );
}

const orderPlacedEmail = (props: OrderPlacedEmailProps) => (
  <OrderPlacedEmailComponent {...props} />
);

/**
 * Sample order for react-email dev's preview server, which renders the
 * default export with no props — `OrderPlacedEmailComponent` needs an
 * `order` or it crashes reading `order.currency_code`. This is a real
 * order dump, not a hand-typed fixture, so it doesn't fully satisfy
 * `OrderDTO` (missing fields like `status`/`region_id`/etc.) — hence the
 * `@ts-expect-error` below rather than typing it as `OrderPlacedEmailProps`.
 */
const mockOrder = {
  order: {
    id: 'order_01JSNXDH9BPJWWKVW03B9E9KW8',
    display_id: 1,
    email: 'afsaf@gmail.com',
    currency_code: 'usd',
    total: 2675,
    subtotal: 1675,
    discount_total: 0,
    shipping_total: 1000,
    tax_total: 0,
    item_subtotal: 1675,
    item_total: 1675,
    item_tax_total: 0,
    customer_id: 'cus_01JSNXD6VQC1YH56E4TGC81NWX',
    items: [
      {
        id: 'ordli_01JSNXDH9C47KZ43WQ3TBFXZA9',
        title: 'NM',
        subtitle: "What's Going On",
        thumbnail:
          'http://localhost:54321/storage/v1/object/public/vinyl-cut/1785610531368-TS310-front-250-01KZ33899YBWAF96AX8KQ7G6QB.jpg',
        variant_id: 'variant_01KYYXZ9K9J0XRANF2GSSSK01N',
        product_id: 'prod_01KYYXZ9J7FZKDE7E8DEFABK93',
        product_title: "What's Going On",
        product_description:
          'Marvin Gaye — What’s Going On\n1971 · Tamla · TS310 · 12" Vinyl',
        product_subtitle: null,
        product_type: null,
        product_type_id: null,
        product_collection: null,
        product_handle: 'marvin-gaye-whats-going-on',
        variant_sku: 'BA91F9E2-nm',
        variant_barcode: null,
        variant_title: 'NM',
        variant_option_values: null,
        requires_shipping: true,
        is_giftcard: false,
        is_discountable: true,
        is_tax_inclusive: false,
        is_custom_price: false,
        metadata: {},
        raw_unit_price: { value: '1675', precision: 20 },
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        tax_lines: [],
        adjustments: [],
        compare_at_unit_price: null,
        unit_price: 1675,
        quantity: 1,
        raw_quantity: { value: '1', precision: 20 },
        subtotal: 1675,
        total: 1675,
        original_total: 1675,
        discount_total: 0,
        discount_subtotal: 0,
        discount_tax_total: 0,
        tax_total: 0,
        original_tax_total: 0,
        refundable_total_per_unit: 1675,
        refundable_total: 1675,
        fulfilled_total: 0,
        shipped_total: 0,
        return_requested_total: 0,
        return_received_total: 0,
        return_dismissed_total: 0,
        write_off_total: 0,
      },
    ],
    shipping_address: {
      id: 'caaddr_01JSNXD6W0TGPH2JQD18K97B25',
      customer_id: null,
      company: '',
      first_name: 'safasf',
      last_name: 'asfaf',
      address_1: 'asfasf',
      address_2: '',
      city: 'asfasf',
      country_code: 'dk',
      province: '',
      postal_code: 'asfasf',
      phone: '',
      metadata: null,
      created_at: '2025-04-25T07:25:48.801Z',
      updated_at: '2025-04-25T07:25:48.801Z',
      deleted_at: null,
    },
    billing_address: {
      id: 'caaddr_01JSNXD6W0V7RNZH63CPG26K5W',
      customer_id: null,
      company: '',
      first_name: 'safasf',
      last_name: 'asfaf',
      address_1: 'asfasf',
      address_2: '',
      city: 'asfasf',
      country_code: 'dk',
      province: '',
      postal_code: 'asfasf',
      phone: '',
      metadata: null,
      created_at: '2025-04-25T07:25:48.801Z',
      updated_at: '2025-04-25T07:25:48.801Z',
      deleted_at: null,
    },
    shipping_methods: [
      {
        id: 'ordsm_01JSNXDH9B9DDRQXJT5J5AE5V1',
        name: 'Standard Shipping',
        description: null,
        is_tax_inclusive: false,
        is_custom_amount: false,
        shipping_option_id: 'so_01JSNXAQA64APG6BNHGCMCTN6V',
        data: {},
        metadata: null,
        raw_amount: { value: '1000', precision: 20 },
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        tax_lines: [],
        adjustments: [],
        amount: 1000,
        order_id: 'order_01JSNXDH9BPJWWKVW03B9E9KW8',
        subtotal: 1000,
        total: 1000,
        original_total: 1000,
        discount_total: 0,
        discount_subtotal: 0,
        discount_tax_total: 0,
        tax_total: 0,
        original_tax_total: 0,
      },
    ],
    customer: {
      id: 'cus_01JSNXD6VQC1YH56E4TGC81NWX',
      company_name: null,
      first_name: null,
      last_name: null,
      email: 'afsaf@gmail.com',
      phone: null,
      has_account: false,
      metadata: null,
      created_by: null,
      created_at: '2025-04-25T07:25:48.791Z',
      updated_at: '2025-04-25T07:25:48.791Z',
      deleted_at: null,
    },
  },
};

const OrderPlacedEmailPreview = () => (
  // @ts-expect-error mockOrder is a real order dump, not a full OrderDTO
  <OrderPlacedEmailComponent {...mockOrder} />
);

/**
 * The default export is for react-email dev's preview server, which only
 * discovers files with a default export; `orderPlacedEmail` is what
 * service.ts's `templates` map actually imports and uses.
 */
export { orderPlacedEmail, OrderPlacedEmailPreview as default };
export type { OrderPlacedEmailProps };
