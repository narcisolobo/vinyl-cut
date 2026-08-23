import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows";

// One-time data fix. `initial-data-seed.ts` only links `pp_system_default`
// to the US region -- Stripe was linked to the local region later, by hand,
// via the Admin dashboard, the same way tax regions and shipping options
// were (never scripted, so never applied to hosted -- see
// fix-tax-region-province-codes.ts and the shipping setup done in this
// session for the same pattern). Confirmed live: `/store/payment-providers`
// on hosted only returned `pp_system_default`, which is why the storefront's
// PaymentMethodForm (which assumes paymentProviders[0] is Stripe) never got
// a real Stripe client_secret back and hung on the Payment step forever.
export default async function link_stripe_payment_provider({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "payment_providers.id"],
  });

  for (const region of regions) {
    const existingProviderIds = (region.payment_providers ?? [])
      .filter((provider): provider is NonNullable<typeof provider> => provider !== null)
      .map((provider) => provider.id);

    if (existingProviderIds.includes("pp_stripe_stripe")) {
      logger.info(
        `link-stripe-payment-provider.ts: ${region.name} already has Stripe linked, skipping.`,
      );
      continue;
    }

    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: region.id },
        update: {
          payment_providers: [...existingProviderIds, "pp_stripe_stripe"],
        },
      },
    });
    logger.info(
      `link-stripe-payment-provider.ts: linked Stripe to ${region.name}.`,
    );
  }
}
