import {
  INotificationModuleService,
  ProductVariantDTO,
} from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';
import { createStep } from '@medusajs/framework/workflows-sdk';

type SendRestockNotificationStepInput = {
  email: string;
  product_variant?: ProductVariantDTO | null;
}[];

/**
 * Builds the storefront PDP link for a restock-notification email.
 * `STOREFRONT_DEFAULT_COUNTRY_CODE` is hardcoded rather than derived
 * because `restock_subscription` doesn't track which region a shopper
 * browsed from, and this store only serves one region today.
 */
function buildRestockUrl(handle?: string | null): string | undefined {
  if (!handle) {
    return undefined;
  }

  return `${process.env.STOREFRONT_URL}/${process.env.STOREFRONT_DEFAULT_COUNTRY_CODE}/albums/${handle}`;
}

export const sendRestockNotificationStep = createStep(
  'send-restock-notification',
  async (input: SendRestockNotificationStepInput, { container }) => {
    const notificationModuleService: INotificationModuleService =
      container.resolve(Modules.NOTIFICATION);

    const notificationData = input.map((subscription) => ({
      to: subscription.email,
      channel: 'email',
      template: 'variant-restock',
      data: {
        variant: subscription.product_variant,
        url: buildRestockUrl(subscription.product_variant?.product?.handle),
      },
    }));

    await notificationModuleService.createNotifications(notificationData);
  },
);
