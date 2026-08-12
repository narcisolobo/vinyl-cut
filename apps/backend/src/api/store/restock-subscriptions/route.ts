import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from '@medusajs/framework/http';
import { MedusaError } from '@medusajs/framework/utils';
import { z } from '@medusajs/framework/zod';
import { createRestockSubscriptionWorkflow } from '../../../workflows/create-restock-subscription';
import { PostStoreCreateRestockSubscription } from './validators';

type PostStoreCreateRestockSubscription = z.infer<
  typeof PostStoreCreateRestockSubscription
>;

export async function POST(
  req: AuthenticatedMedusaRequest<PostStoreCreateRestockSubscription>,
  res: MedusaResponse,
) {
  const salesChannelId =
    req.validatedBody.sales_channel_id ||
    (req.publishable_key_context?.sales_channel_ids?.length
      ? req.publishable_key_context?.sales_channel_ids[0]
      : undefined);
  if (!salesChannelId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'At least one sales channel ID is required, either associated with the publishable API key or in the request body.',
    );
  }
  const { result } = await createRestockSubscriptionWorkflow(req.scope).run({
    input: {
      variant_id: req.validatedBody.variant_id,
      sales_channel_id: salesChannelId,
      customer: {
        email: req.validatedBody.email,
        customer_id: req.auth_context?.actor_id,
      },
    },
  });

  return res.sendStatus(201);
}
