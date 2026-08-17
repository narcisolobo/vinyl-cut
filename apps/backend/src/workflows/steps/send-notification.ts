import {
  CreateNotificationDTO,
  INotificationModuleService,
} from '@medusajs/framework/types';
import { Modules } from '@medusajs/framework/utils';
import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';

const sendNotificationStep = createStep(
  'send-notification',
  async (data: CreateNotificationDTO[], { container }) => {
    const notificationModuleService: INotificationModuleService =
      container.resolve(Modules.NOTIFICATION);
    const notification =
      await notificationModuleService.createNotifications(data);
    return new StepResponse(notification);
  },
);

export { sendNotificationStep };
