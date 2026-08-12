import { InferTypeOf } from '@medusajs/framework/types';
import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { RESTOCK_MODULE } from '../../../modules/restock';
import RestockSubscription from '../../../modules/restock/models/restock-subscription';
import RestockModuleService from '../../../modules/restock/service';

type DeleteRestockSubscriptionsStepInput = Omit<
  InferTypeOf<typeof RestockSubscription>,
  'created_at' | 'updated_at' | 'deleted_at'
>[];

const deleteRestockSubscriptionStep = createStep(
  'delete-restock-subscription',
  async (
    restockSubscriptions: DeleteRestockSubscriptionsStepInput,
    { container },
  ) => {
    const restockModuleService: RestockModuleService =
      container.resolve(RESTOCK_MODULE);

    await restockModuleService.deleteRestockSubscriptions(
      restockSubscriptions.map((subscription) => subscription.id),
    );

    return new StepResponse(undefined, restockSubscriptions);
  },
  async (restockSubscriptions, { container }) => {
    if (!restockSubscriptions) {
      return;
    }

    const restockModuleService: RestockModuleService =
      container.resolve(RESTOCK_MODULE);

    await restockModuleService.createRestockSubscriptions(restockSubscriptions);
  },
);

export { deleteRestockSubscriptionStep };
