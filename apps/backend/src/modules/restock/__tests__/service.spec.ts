import { moduleIntegrationTestRunner } from '@medusajs/test-utils';
import { RESTOCK_MODULE } from '../index';
import RestockSubscription from '../models/restock-subscription';
import type RestockModuleService from '../service';

moduleIntegrationTestRunner<RestockModuleService>({
  moduleName: RESTOCK_MODULE,
  resolve: './src/modules/restock',
  moduleModels: [RestockSubscription],
  testSuite: ({ service }) => {
    describe('RestockModuleService', () => {
      describe('getUniqueSubscriptions', () => {
        it('returns only distinct (variant_id, sales_channel_id) pairs', async () => {
          const variantId = 'variant_1';
          const otherVariantId = 'variant_2';
          const salesChannelId = 'sc_1';

          await service.createRestockSubscriptions([
            {
              variant_id: variantId,
              sales_channel_id: salesChannelId,
              email: 'a@example.com',
            },
            {
              variant_id: variantId,
              sales_channel_id: salesChannelId,
              email: 'b@example.com',
            },
            {
              variant_id: otherVariantId,
              sales_channel_id: salesChannelId,
              email: 'c@example.com',
            },
          ]);

          const uniqueSubscriptions = await service.getUniqueSubscriptions();

          expect(uniqueSubscriptions).toHaveLength(2);
          expect(uniqueSubscriptions).toEqual(
            expect.arrayContaining([
              { variant_id: variantId, sales_channel_id: salesChannelId },
              { variant_id: otherVariantId, sales_channel_id: salesChannelId },
            ]),
          );
        });
      });
    });
  },
});
