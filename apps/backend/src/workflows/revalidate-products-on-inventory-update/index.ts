import {
  createWorkflow,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk';
import { revalidateProductsStep } from '../steps/revalidate-products';

export const revalidateProductsOnInventoryUpdateWorkflow = createWorkflow(
  'revalidate-products-on-inventory-update',
  () => {
    const result = revalidateProductsStep({});
    return new WorkflowResponse(result);
  },
);
