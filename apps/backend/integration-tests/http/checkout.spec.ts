jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'test' }, error: null }),
    },
  })),
}));

import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import { addShippingMethodToCartWorkflow } from '@medusajs/medusa/core-flows';
import { Modules } from '@medusajs/framework/utils';
import type { INotificationModuleService } from '@medusajs/framework/types';
import { createCheckoutSeeder } from '../helpers/create-checkout-seeder';
import { pollForNotification } from '../helpers/poll-for-notification';

jest.setTimeout(60000);

const cartAddress = {
  first_name: 'Shopper',
  last_name: 'Test',
  address_1: '123 Test St',
  city: 'Los Angeles',
  country_code: 'us',
  province: 'ca',
  postal_code: '90001',
};

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    describe('Guest checkout', () => {
      let seeder: Awaited<ReturnType<typeof createCheckoutSeeder>>;

      beforeAll(async () => {
        seeder = await createCheckoutSeeder({ api, container: getContainer() });
      });

      it('offers the flat-rate shipping option for an address inside the region', async () => {
        const cart = (
          await api.post(
            '/store/carts',
            {
              currency_code: 'usd',
              email: 'shopper@example.com',
              region_id: seeder.region.id,
              sales_channel_id: seeder.salesChannel.id,
              shipping_address: cartAddress,
              items: [{ quantity: 1, variant_id: seeder.product.variants[0].id }],
            },
            seeder.storeHeaders,
          )
        ).data.cart;

        const response = await api.get(
          `/store/shipping-options?cart_id=${cart.id}`,
          seeder.storeHeaders,
        );

        expect(
          response.data.shipping_options.map(
            (option: { id: string }) => option.id,
          ),
        ).toContain(seeder.shippingOption.id);
      });

      it('offers no shipping option for an address outside the region', async () => {
        const cart = (
          await api.post(
            '/store/carts',
            {
              currency_code: 'usd',
              email: 'shopper@example.com',
              region_id: seeder.region.id,
              sales_channel_id: seeder.salesChannel.id,
              shipping_address: { ...cartAddress, province: 'ny', city: 'New York' },
              items: [{ quantity: 1, variant_id: seeder.product.variants[0].id }],
            },
            seeder.storeHeaders,
          )
        ).data.cart;

        const response = await api.get(
          `/store/shipping-options?cart_id=${cart.id}`,
          seeder.storeHeaders,
        );

        expect(response.data.shipping_options).toHaveLength(0);
      });

      it('completes an order with matching totals', async () => {
        const cart = (
          await api.post(
            '/store/carts',
            {
              currency_code: 'usd',
              email: 'shopper@example.com',
              region_id: seeder.region.id,
              sales_channel_id: seeder.salesChannel.id,
              shipping_address: cartAddress,
              items: [{ quantity: 1, variant_id: seeder.product.variants[0].id }],
            },
            seeder.storeHeaders,
          )
        ).data.cart;

        await addShippingMethodToCartWorkflow(getContainer()).run({
          input: { cart_id: cart.id, options: [{ id: seeder.shippingOption.id }] },
        });

        const paymentCollection = (
          await api.post(
            '/store/payment-collections',
            { cart_id: cart.id },
            seeder.storeHeaders,
          )
        ).data.payment_collection;

        await api.post(
          `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
          { provider_id: 'pp_system_default' },
          seeder.storeHeaders,
        );

        const order = (
          await api.post(`/store/carts/${cart.id}/complete`, {}, seeder.storeHeaders)
        ).data.order;

        expect(order.item_total).toEqual(1175);
        expect(order.shipping_total).toEqual(695);
        expect(order.tax_total).toEqual(0);
        expect(order.total).toEqual(1870);
        expect(order.items).toHaveLength(1);
        expect(order.shipping_address.province).toEqual('ca');

        // Not asserted here (see order-confirmation.spec.ts) — just
        // drained so the async order.placed subscriber settles before
        // this file's afterAll DB-drop hook runs. Postgres won't drop a
        // database with an active connection still querying it, and
        // that subscriber fires regardless of whether this test waits
        // for it.
        const notificationModuleService =
          getContainer().resolve<INotificationModuleService>(
            Modules.NOTIFICATION,
          );
        await pollForNotification(notificationModuleService, {
          template: 'order-placed',
          to: 'shopper@example.com',
        });
      });
    });
  },
});
