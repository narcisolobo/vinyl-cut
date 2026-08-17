import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk';
import { useQueryGraphStep } from '@medusajs/medusa/core-flows';
import { buildRestockUrl } from '../../lib/build-restock-url';
import { Templates } from '../../modules/resend/service';
import { deleteRestockSubscriptionStep } from './steps/delete-restock-subscriptions';
import { getDistinctSubscriptionsStep } from './steps/get-distinct-subscriptions';
import { getRestockedStep } from './steps/get-restocked';
import { sendNotificationStep } from '../steps/send-notification';

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

    const notificationData = transform(
      { restockedSubscriptionsWithEmails },
      (data) =>
        data.restockedSubscriptionsWithEmails.map((subscription) => ({
          to: subscription.email,
          channel: 'email',
          template: Templates.RESTOCK_NOTIFY,
          data: {
            variant: subscription.product_variant,
            url: buildRestockUrl(subscription.product_variant?.product?.handle),
          },
        })),
    );

    sendNotificationStep(notificationData);

    deleteRestockSubscriptionStep(restockedSubscriptionsWithEmails);

    return new WorkflowResponse({
      subscriptions: restockedSubscriptionsWithEmails,
    });
  },
);

export { sendRestockNotificationsWorkflow };
