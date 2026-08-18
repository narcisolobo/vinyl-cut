import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import { createAdminUser, generateStoreHeaders } from '../helpers/admin-auth';

jest.setTimeout(60000);

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    describe('GET /store/product-options', () => {
      let storeHeaders: Awaited<ReturnType<typeof generateStoreHeaders>>;

      beforeAll(async () => {
        const container = getContainer();
        const adminHeaders = await createAdminUser(container);
        storeHeaders = await generateStoreHeaders(container);

        // Store-wide option, created directly (not inline on a product) —
        // matches how etl/tools/load_catalog.py creates the real
        // "Condition" option, since inline product options default to
        // is_exclusive: true.
        await api.post(
          '/admin/product-options',
          { title: 'Condition', is_exclusive: false, values: ['VG', 'NM'] },
          adminHeaders,
        );

        const shippingProfile = (
          await api.post(
            '/admin/shipping-profiles',
            { name: 'Test profile', type: 'default' },
            adminHeaders,
          )
        ).data.shipping_profile;

        // Product-exclusive option (inline) — should NOT show up in the
        // store-wide listing.
        await api.post(
          '/admin/products',
          {
            title: 'Test Record',
            status: 'published',
            shipping_profile_id: shippingProfile.id,
            options: [{ title: 'Format', values: ['LP'] }],
            variants: [
              {
                title: 'LP',
                options: { Format: 'LP' },
                prices: [{ currency_code: 'usd', amount: 1000 }],
              },
            ],
          },
          adminHeaders,
        );
      });

      it('returns only non-exclusive product options', async () => {
        const response = await api.get('/store/product-options', storeHeaders);

        expect(response.status).toEqual(200);
        const titles = response.data.product_options.map(
          (option: { title: string }) => option.title,
        );
        expect(titles).toContain('Condition');
        expect(titles).not.toContain('Format');
      });

      it('includes the option values', async () => {
        const response = await api.get(
          '/store/product-options?title=Condition',
          storeHeaders,
        );

        const condition = response.data.product_options[0];
        const values = condition.values.map(
          (value: { value: string }) => value.value,
        );
        expect(values.sort()).toEqual(['NM', 'VG']);
      });
    });
  },
});
