import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework';
import { InventoryLevelWorkflowEvents } from '@medusajs/framework/utils';
import { revalidateProductsOnInventoryUpdateWorkflow } from '../workflows/revalidate-products-on-inventory-update';

async function inventoryLevelUpdatedHandler({
  container,
}: SubscriberArgs<{ id: string; order_id?: string }>) {
  await revalidateProductsOnInventoryUpdateWorkflow(container).run();
}

const config: SubscriberConfig = {
  event: InventoryLevelWorkflowEvents.UPDATED,
};

export { config };
export default inventoryLevelUpdatedHandler;
