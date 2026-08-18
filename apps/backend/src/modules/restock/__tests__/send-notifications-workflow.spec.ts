jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'test' }, error: null }),
    },
  })),
}));

import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';
import { Resend } from 'resend';
import { createAdminUser } from '../../../../integration-tests/helpers/admin-auth';
import { sendRestockNotificationsWorkflow } from '../../../workflows/send-restock-notifications';
import { RESTOCK_MODULE } from '../index';
import type RestockModuleService from '../service';

jest.setTimeout(60000);

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    describe('sendRestockNotificationsWorkflow', () => {
      let salesChannelId: string;
      let restockedVariantId: string;
      let stillOutOfStockVariantId: string;
      let restockModuleService: RestockModuleService;

      beforeAll(async () => {
        const container = getContainer();
        const adminHeaders = await createAdminUser(container);

        const salesChannel = (
          await api.post(
            '/admin/sales-channels',
            { name: 'Test channel', description: 'channel' },
            adminHeaders,
          )
        ).data.sales_channel;
        salesChannelId = salesChannel.id;

        const stockLocation = (
          await api.post(
            '/admin/stock-locations',
            { name: 'Test location' },
            adminHeaders,
          )
        ).data.stock_location;

        await api.post(
          `/admin/stock-locations/${stockLocation.id}/sales-channels`,
          { add: [salesChannelId] },
          adminHeaders,
        );

        const shippingProfile = (
          await api.post(
            '/admin/shipping-profiles',
            { name: 'Test profile', type: 'default' },
            adminHeaders,
          )
        ).data.shipping_profile;

        const restockedInventoryItem = (
          await api.post(
            '/admin/inventory-items',
            { sku: 'restocked' },
            adminHeaders,
          )
        ).data.inventory_item;

        const stillOutOfStockInventoryItem = (
          await api.post(
            '/admin/inventory-items',
            { sku: 'still-out-of-stock' },
            adminHeaders,
          )
        ).data.inventory_item;

        await api.post(
          `/admin/inventory-items/${restockedInventoryItem.id}/location-levels`,
          { location_id: stockLocation.id, stocked_quantity: 5 },
          adminHeaders,
        );
        await api.post(
          `/admin/inventory-items/${stillOutOfStockInventoryItem.id}/location-levels`,
          { location_id: stockLocation.id, stocked_quantity: 0 },
          adminHeaders,
        );

        const product = (
          await api.post(
            '/admin/products',
            {
              title: 'Test Record',
              status: 'published',
              shipping_profile_id: shippingProfile.id,
              options: [{ title: 'Condition', values: ['G', 'NM'] }],
              variants: [
                {
                  title: 'NM',
                  sku: 'restocked',
                  inventory_items: [
                    {
                      inventory_item_id: restockedInventoryItem.id,
                      required_quantity: 1,
                    },
                  ],
                  prices: [{ currency_code: 'usd', amount: 2000 }],
                  options: { Condition: 'NM' },
                },
                {
                  title: 'G',
                  sku: 'still-out-of-stock',
                  inventory_items: [
                    {
                      inventory_item_id: stillOutOfStockInventoryItem.id,
                      required_quantity: 1,
                    },
                  ],
                  prices: [{ currency_code: 'usd', amount: 500 }],
                  options: { Condition: 'G' },
                },
              ],
            },
            adminHeaders,
          )
        ).data.product;

        restockedVariantId = product.variants.find(
          (variant) => variant.title === 'NM',
        ).id;
        stillOutOfStockVariantId = product.variants.find(
          (variant) => variant.title === 'G',
        ).id;

        const remoteLink = container.resolve(ContainerRegistrationKeys.LINK);
        await remoteLink.create([
          {
            [Modules.PRODUCT]: { variant_id: restockedVariantId },
            [Modules.INVENTORY]: {
              inventory_item_id: restockedInventoryItem.id,
            },
          },
          {
            [Modules.PRODUCT]: { variant_id: stillOutOfStockVariantId },
            [Modules.INVENTORY]: {
              inventory_item_id: stillOutOfStockInventoryItem.id,
            },
          },
        ]);

        restockModuleService =
          container.resolve<RestockModuleService>(RESTOCK_MODULE);
        await restockModuleService.createRestockSubscriptions([
          {
            variant_id: restockedVariantId,
            sales_channel_id: salesChannelId,
            email: 'restock-a@example.com',
          },
          {
            variant_id: restockedVariantId,
            sales_channel_id: salesChannelId,
            email: 'restock-b@example.com',
          },
          {
            variant_id: stillOutOfStockVariantId,
            sales_channel_id: salesChannelId,
            email: 'still-waiting@example.com',
          },
        ]);
      });

      it('notifies subscribers on the restocked variant, removes their subscriptions, and leaves unrelated subscriptions untouched', async () => {
        await sendRestockNotificationsWorkflow(getContainer()).run();

        const sendMock = (Resend as unknown as jest.Mock).mock.results[0]
          .value.emails.send;

        expect(sendMock).toHaveBeenCalledTimes(2);
        const notifiedEmails = sendMock.mock.calls.map(
          ([options]) => options.to[0],
        );
        expect(notifiedEmails).toEqual(
          expect.arrayContaining([
            'restock-a@example.com',
            'restock-b@example.com',
          ]),
        );

        const restockedSubscriptions =
          await restockModuleService.listRestockSubscriptions({
            variant_id: restockedVariantId,
          });
        expect(restockedSubscriptions).toHaveLength(0);

        const untouchedSubscriptions =
          await restockModuleService.listRestockSubscriptions({
            variant_id: stillOutOfStockVariantId,
          });
        expect(untouchedSubscriptions).toHaveLength(1);
        expect(untouchedSubscriptions[0].email).toEqual(
          'still-waiting@example.com',
        );
      });
    });
  },
});
