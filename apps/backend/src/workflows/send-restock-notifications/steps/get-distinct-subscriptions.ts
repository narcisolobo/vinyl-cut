import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { RESTOCK_MODULE } from '../../../modules/restock';
import RestockModuleService from '../../../modules/restock/service';

const getDistinctSubscriptionsStep = createStep(
  'get-distinct-subscriptions',
  async (_, { container }) => {
    const restockModuleService: RestockModuleService =
      container.resolve(RESTOCK_MODULE);

    const distinctSubscriptions =
      await restockModuleService.getUniqueSubscriptions();

    return new StepResponse(distinctSubscriptions);
  },
);

export { getDistinctSubscriptionsStep };
