import { Logger } from '@medusajs/framework/types';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';
import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk';

/**
 * Invalidates the storefront's global "products" cache tag (see
 * apps/storefront/src/lib/data/products.ts) so a variant that just sold out
 * stops showing "Add to Cart" instead of "Notify Me" for however long the
 * cache would otherwise have lived (effectively indefinite — no
 * time-based revalidate is set). Soft-fails: a stale product page is low
 * blast radius and shouldn't block order confirmation.
 */
const revalidateProductsStep = createStep(
  'revalidate-products',
  async (_input: Record<string, never>, { container }) => {
    const logger: Logger = container.resolve(
      ContainerRegistrationKeys.LOGGER,
    );

    try {
      const response = await fetch(
        `${process.env.STOREFRONT_INTERNAL_URL}/api/revalidate?tag=products`,
        {
          method: 'POST',
          headers: {
            'x-revalidate-secret': process.env.REVALIDATE_SECRET ?? '',
          },
        },
      );

      if (!response.ok) {
        logger.error(
          `Failed to revalidate storefront "products" cache: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      logger.error('Failed to revalidate storefront "products" cache', error);
    }

    return new StepResponse();
  },
);

export { revalidateProductsStep };
