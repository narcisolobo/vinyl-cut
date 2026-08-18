import {
  ContainerRegistrationKeys,
  getVariantAvailability,
  MedusaError,
} from '@medusajs/framework/utils';
import { createStep } from '@medusajs/framework/workflows-sdk';
import { isVariantAvailable } from '../../../lib/is-variant-available';

type ValidateVariantOutOfStockStepInput = {
  variant_id: string;
  sales_channel_id: string;
};

const validateVariantOutOfStockStep = createStep(
  'validate-variant-out-of-stock',
  async (
    { variant_id, sales_channel_id }: ValidateVariantOutOfStockStepInput,
    { container },
  ) => {
    const query = container.resolve<
      Parameters<typeof getVariantAvailability>[0]
    >(ContainerRegistrationKeys.QUERY);
    const availability = await getVariantAvailability(query, {
      variant_ids: [variant_id],
      sales_channel_id,
    });

    if (isVariantAvailable(availability[variant_id].availability)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Variant isn't out of stock.",
      );
    }
  },
);

export { validateVariantOutOfStockStep };
