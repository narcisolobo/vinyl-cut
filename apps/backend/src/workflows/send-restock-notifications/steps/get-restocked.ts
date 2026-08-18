import {
  ContainerRegistrationKeys,
  getVariantAvailability,
  promiseAll,
} from '@medusajs/framework/utils';
import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';
import { isVariantAvailable } from '../../../lib/is-variant-available';

type GetRestockedStepInput = {
  variant_id: string;
  sales_channel_id: string;
}[];

const getRestockedStep = createStep(
  'get-restocked',
  async (input: GetRestockedStepInput, { container }) => {
    const restocked: GetRestockedStepInput = [];
    const query = container.resolve<
      Parameters<typeof getVariantAvailability>[0]
    >(ContainerRegistrationKeys.QUERY);

    await promiseAll(
      input.map(async (restockSubscription) => {
        const variantAvailability = await getVariantAvailability(query, {
          variant_ids: [restockSubscription.variant_id],
          sales_channel_id: restockSubscription.sales_channel_id,
        });

        if (
          isVariantAvailable(
            variantAvailability[restockSubscription.variant_id].availability,
          )
        ) {
          restocked.push(restockSubscription);
        }
      }),
    );

    return new StepResponse(restocked);
  },
);

export { getRestockedStep };
