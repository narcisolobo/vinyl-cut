import { render } from '@react-email/render';
import { orderPlacedEmail, type OrderPlacedEmailProps } from '../order-placed';

const order = {
  id: 'order_01TEST',
  display_id: 42,
  currency_code: 'usd',
  item_total: 1175,
  tax_total: 0,
  total: 1870,
  customer: { first_name: 'Narciso' },
  shipping_address: { first_name: 'Narciso' },
  items: [
    {
      id: 'item_01',
      thumbnail: null,
      product_title: 'Aquemini',
      variant_title: 'VG',
      total: 1175,
    },
  ],
  shipping_methods: [{ id: 'sm_01', name: 'Standard Shipping', total: 695 }],
} as unknown as OrderPlacedEmailProps['order'];

describe('orderPlacedEmail', () => {
  it('includes the order ID and each line item', async () => {
    const html = await render(orderPlacedEmail({ order }));

    expect(html).toContain('Order ID: #');
    expect(html).toContain('42');
    expect(html).toContain('Aquemini');
    expect(html).toContain('VG');
    expect(html).toContain('Standard Shipping');
  });
});
