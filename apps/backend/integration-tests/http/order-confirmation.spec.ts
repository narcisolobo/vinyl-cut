const mockSend = jest
  .fn()
  .mockResolvedValue({ data: { id: 'test' }, error: null });

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import { addShippingMethodToCartWorkflow } from '@medusajs/medusa/core-flows';
import { Modules } from '@medusajs/framework/utils';
import type { INotificationModuleService } from '@medusajs/framework/types';
import { createCheckoutSeeder } from '../helpers/create-checkout-seeder';
import { pollForNotification } from '../helpers/poll-for-notification';

jest.setTimeout(60000);

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    describe('Order confirmation notification', () => {
      it('sends an order-confirmation notification when an order is placed', async () => {
        const container = getContainer();
        const seeder = await createCheckoutSeeder({ api, container });

        const cart = (
          await api.post(
            '/store/carts',
            {
              currency_code: 'usd',
              email: 'shopper@example.com',
              region_id: seeder.region.id,
              sales_channel_id: seeder.salesChannel.id,
              shipping_address: {
                first_name: 'Shopper',
                last_name: 'Test',
                address_1: '123 Test St',
                city: 'Los Angeles',
                country_code: 'us',
                province: 'ca',
                postal_code: '90001',
              },
              items: [{ quantity: 1, variant_id: seeder.product.variants[0].id }],
            },
            seeder.storeHeaders,
          )
        ).data.cart;

        await addShippingMethodToCartWorkflow(container).run({
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

        await api.post(`/store/carts/${cart.id}/complete`, {}, seeder.storeHeaders);

        const notificationModuleService =
          container.resolve<INotificationModuleService>(Modules.NOTIFICATION);
        const notifications = await pollForNotification(notificationModuleService, {
          template: 'order-placed',
          to: 'shopper@example.com',
        });

        expect(notifications.length).toBeGreaterThan(0);
        expect(mockSend).toHaveBeenCalled();
        expect(mockSend.mock.calls[0][0]).toMatchObject({
          to: ['shopper@example.com'],
        });
      });
    });
  },
});
