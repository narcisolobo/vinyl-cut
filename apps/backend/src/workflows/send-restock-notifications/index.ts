import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk';
import { useQueryGraphStep } from '@medusajs/medusa/core-flows';
import { deleteRestockSubscriptionStep } from './steps/delete-restock-subscriptions';
import { getDistinctSubscriptionsStep } from './steps/get-distinct-subscriptions';
import { getRestockedStep } from './steps/get-restocked';
import { sendRestockNotificationStep } from './steps/send-restock-notification';

const sendRestockNotificationsWorkflow = createWorkflow(
  'send-restock-notifications',
  () => {
    const subscriptions = getDistinctSubscriptionsStep();

    const restockedSubscriptions = getRestockedStep(subscriptions);

    const { variant_ids, sales_channel_ids } = transform(
      {
        restockedSubscriptions,
      },
      (data) => {
        const filters: Record<string, string[]> = {
          variant_ids: [],
          sales_channel_ids: [],
        };
        data.restockedSubscriptions.map((subscription) => {
          filters.variant_ids.push(subscription.variant_id);
          filters.sales_channel_ids.push(subscription.sales_channel_id);
        });

        return filters;
      },
    );

    const { data: restockedSubscriptionsWithEmails } = useQueryGraphStep({
      entity: 'restock_subscription',
      fields: ['*', 'product_variant.*', 'product_variant.product.handle'],
      filters: {
        variant_id: variant_ids,
        sales_channel_id: sales_channel_ids,
      },
    });

    // @ts-expect-error useQueryGraphStep's joined `product_variant` resolves
    // to the MikroORM ProductVariant entity, not ProductVariantDTO, and the
    // two disagree recursively through nested relations (options.option, ...).
    sendRestockNotificationStep(restockedSubscriptionsWithEmails);

    deleteRestockSubscriptionStep(restockedSubscriptionsWithEmails);

    return new WorkflowResponse({
      subscriptions: restockedSubscriptionsWithEmails,
    });
  },
);

export { sendRestockNotificationsWorkflow };
