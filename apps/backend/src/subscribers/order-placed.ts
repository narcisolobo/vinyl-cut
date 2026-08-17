import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework';
import { OrderWorkflowEvents } from '@medusajs/framework/utils';
import { sendOrderConfirmationWorkflow } from '../workflows/send-order-confirmation';

async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await sendOrderConfirmationWorkflow(container).run({
    input: {
      id: data.id,
    },
  });
}

const config: SubscriberConfig = {
  event: OrderWorkflowEvents.PLACED,
};

export { config };
export default orderPlacedHandler;
