import { render } from '@react-email/render';
import {
  variantRestockEmail,
  type VariantRestockEmailProps,
} from '../variant-restock';

const variant = {
  id: 'variant_01',
  title: 'VG',
  sku: 'SKU-01',
  thumbnail: null,
  product: { title: 'Aquemini', thumbnail: null },
} as unknown as VariantRestockEmailProps['variant'];

describe('variantRestockEmail', () => {
  it('includes the restocked release title and grade', async () => {
    const html = await render(variantRestockEmail({ variant }));

    expect(html).toContain('Aquemini');
    expect(html).toContain('VG');
  });
});
