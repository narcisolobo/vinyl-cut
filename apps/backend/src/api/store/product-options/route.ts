import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import type { IProductModuleService } from "@medusajs/framework/types";

/**
 * Exposes store-wide (non-exclusive) product options and their values,
 * e.g. `?title=Condition`. There's no built-in Store API route for this —
 * Medusa's default `/store` routes only ever return options nested under
 * a product, not a catalog-wide option like the shared "Condition" one
 * created by `etl/tools/load_catalog.py`. `is_exclusive: false` keeps
 * this from also returning every product-specific option.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productModuleService: IProductModuleService = req.scope.resolve(
    Modules.PRODUCT,
  );

  const { title } = req.query;

  const productOptions = await productModuleService.listProductOptions(
    {
      is_exclusive: false,
      ...(title ? { title: title as string | string[] } : {}),
    },
    { relations: ["values"] },
  );

  res.json({ product_options: productOptions });
}
