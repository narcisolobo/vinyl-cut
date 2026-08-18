import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import { createCheckoutSeeder } from '../helpers/create-checkout-seeder';

jest.setTimeout(60000);

const ITEM_PRICE_CENTS = 2000;
const CA_TAX_RATE_PERCENT = 10;

const baseAddress = {
  first_name: 'Shopper',
  last_name: 'Test',
  address_1: '123 Test St',
  country_code: 'us',
  postal_code: '90001',
};

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    describe('Cart tax calculation', () => {
      let seeder: Awaited<ReturnType<typeof createCheckoutSeeder>>;

      beforeAll(async () => {
        seeder = await createCheckoutSeeder({
          api,
          container: getContainer(),
          provinces: ['ca', 'or'],
          withTaxRegions: true,
          caTaxRatePercent: CA_TAX_RATE_PERCENT,
          itemPriceCents: ITEM_PRICE_CENTS,
        });
      });

      it('applies the province tax rate for CA', async () => {
        const cart = (
          await api.post(
            '/store/carts',
            {
              currency_code: 'usd',
              email: 'shopper@example.com',
              region_id: seeder.region.id,
              sales_channel_id: seeder.salesChannel.id,
              shipping_address: { ...baseAddress, city: 'Los Angeles', province: 'ca' },
              items: [{ quantity: 1, variant_id: seeder.product.variants[0].id }],
            },
            seeder.storeHeaders,
          )
        ).data.cart;

        const response = await api.post(
          `/store/carts/${cart.id}/taxes`,
          {},
          seeder.storeHeaders,
        );

        // 10% of $20.00 — a round number so the assertion doesn't depend
        // on Medusa's cent-rounding behavior.
        expect(response.data.cart.tax_total).toEqual(
          (ITEM_PRICE_CENTS * CA_TAX_RATE_PERCENT) / 100,
        );
      });

      it('falls back to the country default (0%) for OR', async () => {
        const cart = (
          await api.post(
            '/store/carts',
            {
              currency_code: 'usd',
              email: 'shopper@example.com',
              region_id: seeder.region.id,
              sales_channel_id: seeder.salesChannel.id,
              shipping_address: { ...baseAddress, city: 'Portland', province: 'or' },
              items: [{ quantity: 1, variant_id: seeder.product.variants[0].id }],
            },
            seeder.storeHeaders,
          )
        ).data.cart;

        const response = await api.post(
          `/store/carts/${cart.id}/taxes`,
          {},
          seeder.storeHeaders,
        );

        expect(response.data.cart.tax_total).toEqual(0);
      });
    });
  },
});
