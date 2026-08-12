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
      },
    }));

    await notificationModuleService.createNotifications(notificationData);
  },
);
