import type { INotificationModuleService, NotificationDTO } from '@medusajs/framework/types';

/**
 * order.placed dispatches over the local, in-process event bus this test
 * harness forces regardless of REDIS_URL — timing to the subscriber
 * actually running varied from near-instant to ~60s across observed
 * runs here (DB connection-pool contention, not a fixed delay), and
 * `utils.waitWorkflowExecutions()` didn't reliably track it either
 * (observed returning before the subscriber's workflow had even
 * started). Poll instead of assuming either is enough — also useful just
 * to let the async workflow settle before a spec file's `afterAll`
 * DB-drop hook runs, since Postgres won't drop a database with an
 * active connection still querying it.
 */
async function pollForNotification(
  notificationModuleService: INotificationModuleService,
  filters: { template: string; to: string },
  { attempts = 20, intervalMs = 500 } = {},
): Promise<NotificationDTO[]> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const notifications =
      await notificationModuleService.listNotifications(filters);
    if (notifications.length > 0) {
      return notifications;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return [];
}

export { pollForNotification };
