jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'test' }, error: null }),
    },
  })),
}));

import { medusaIntegrationTestRunner } from '@medusajs/test-utils';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';
import { createAdminUser, generateStoreHeaders } from '../helpers/admin-auth';
import { RESTOCK_MODULE } from '../../src/modules/restock';
import type RestockModuleService from '../../src/modules/restock/service';

jest.setTimeout(60000);

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    describe('POST /store/restock-subscriptions', () => {
      let storeHeaders: Awaited<ReturnType<typeof generateStoreHeaders>>;
      let salesChannelId: string;
      let outOfStockVariantId: string;
      let inStockVariantId: string;

      beforeAll(async () => {
        const container = getContainer();
        const adminHeaders = await createAdminUser(container);
        storeHeaders = await generateStoreHeaders(container);

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

        const outOfStockInventoryItem = (
          await api.post(
            '/admin/inventory-items',
            { sku: 'out-of-stock' },
            adminHeaders,
          )
        ).data.inventory_item;

        const inStockInventoryItem = (
          await api.post(
            '/admin/inventory-items',
            { sku: 'in-stock' },
            adminHeaders,
          )
        ).data.inventory_item;

        await api.post(
          `/admin/inventory-items/${outOfStockInventoryItem.id}/location-levels`,
          { location_id: stockLocation.id, stocked_quantity: 0 },
          adminHeaders,
        );
        await api.post(
          `/admin/inventory-items/${inStockInventoryItem.id}/location-levels`,
          { location_id: stockLocation.id, stocked_quantity: 5 },
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
                  title: 'G',
                  sku: 'out-of-stock',
                  inventory_items: [
                    {
                      inventory_item_id: outOfStockInventoryItem.id,
                      required_quantity: 1,
                    },
                  ],
                  prices: [{ currency_code: 'usd', amount: 500 }],
                  options: { Condition: 'G' },
                },
                {
                  title: 'NM',
                  sku: 'in-stock',
                  inventory_items: [
                    {
                      inventory_item_id: inStockInventoryItem.id,
                      required_quantity: 1,
                    },
                  ],
                  prices: [{ currency_code: 'usd', amount: 2000 }],
                  options: { Condition: 'NM' },
                },
              ],
            },
            adminHeaders,
          )
        ).data.product;

        outOfStockVariantId = product.variants.find(
          (variant) => variant.title === 'G',
        ).id;
        inStockVariantId = product.variants.find(
          (variant) => variant.title === 'NM',
        ).id;

        const remoteLink = container.resolve(ContainerRegistrationKeys.LINK);
        await remoteLink.create([
          {
            [Modules.PRODUCT]: { variant_id: outOfStockVariantId },
            [Modules.INVENTORY]: {
              inventory_item_id: outOfStockInventoryItem.id,
            },
          },
          {
            [Modules.PRODUCT]: { variant_id: inStockVariantId },
            [Modules.INVENTORY]: { inventory_item_id: inStockInventoryItem.id },
          },
        ]);
      });

      it('creates a subscription for an out-of-stock variant', async () => {
        const response = await api.post(
          '/store/restock-subscriptions',
          {
            variant_id: outOfStockVariantId,
            email: 'shopper@example.com',
            sales_channel_id: salesChannelId,
          },
          storeHeaders,
        );

        expect(response.status).toEqual(201);
      });

      it('rejects a request for an in-stock variant', async () => {
        await expect(
          api.post(
            '/store/restock-subscriptions',
            {
              variant_id: inStockVariantId,
              email: 'shopper@example.com',
              sales_channel_id: salesChannelId,
            },
            storeHeaders,
          ),
        ).rejects.toMatchObject({ response: { status: 400 } });
      });

      it('does not duplicate a subscription for the same email and variant', async () => {
        await api.post(
          '/store/restock-subscriptions',
          {
            variant_id: outOfStockVariantId,
            email: 'repeat@example.com',
            sales_channel_id: salesChannelId,
          },
          storeHeaders,
        );
        await api.post(
          '/store/restock-subscriptions',
          {
            variant_id: outOfStockVariantId,
            email: 'repeat@example.com',
            sales_channel_id: salesChannelId,
          },
          storeHeaders,
        );

        const restockModuleService =
          getContainer().resolve<RestockModuleService>(RESTOCK_MODULE);
        const subscriptions = await restockModuleService.listRestockSubscriptions(
          { email: 'repeat@example.com', variant_id: outOfStockVariantId },
        );

        expect(subscriptions).toHaveLength(1);
      });
    });
  },
});
