import { InferTypeOf } from '@medusajs/framework/types';
import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { RESTOCK_MODULE } from '../../../modules/restock';
import RestockSubscription from '../../../modules/restock/models/restock-subscription';
import RestockModuleService from '../../../modules/restock/service';

type CreateRestockSubscriptionStepInput = {
  variant_id: string;
  sales_channel_id: string;
  email: string;
  customer_id?: string;
};

type RestockSubscriptionRecord = InferTypeOf<typeof RestockSubscription>;

const createOrGetRestockSubscriptionStep = createStep(
  'create-or-get-restock-subscription',
  async (input: CreateRestockSubscriptionStepInput, { container }) => {
    const restockModuleService: RestockModuleService =
      container.resolve(RESTOCK_MODULE);

    const restockSubscription =
      await restockModuleService.createRestockSubscriptions(input);

    return new StepResponse(restockSubscription, restockSubscription);
  },
  async (
    restockSubscription: RestockSubscriptionRecord | undefined,
    { container },
  ) => {
    if (!restockSubscription) return;
    const restockModuleService: RestockModuleService =
      container.resolve(RESTOCK_MODULE);

    await restockModuleService.deleteRestockSubscriptions(
      restockSubscription.id,
    );
  },
);

export { createOrGetRestockSubscriptionStep };
