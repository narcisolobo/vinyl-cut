import { MedusaContainer } from '@medusajs/framework/types';
import { sendRestockNotificationsWorkflow } from '../workflows/send-restock-notifications';

const config = {
  name: 'check-restock',
  schedule: '0 0 * * *', // For debugging, change to `* * * * *`
};

async function checkRestockJob(container: MedusaContainer) {
  await sendRestockNotificationsWorkflow(container).run();
}

export { config };
export default checkRestockJob;
