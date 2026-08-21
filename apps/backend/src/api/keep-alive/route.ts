import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { Logger } from "@medusajs/framework/types";

/**
 * Deliberately named `/keep-alive` rather than `/health`: Medusa's
 * `medusa start` command already registers its own static `/health`
 * route (always 200, no DB check), so this route stays at a distinct
 * path instead of shadowing it. This is the endpoint the UptimeRobot
 * monitor targets — a real query, not just a 200, is what resets both
 * Render's spin-down and Supabase's inactivity pause (see PRD §5).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  /**
   * Knex instance; left untyped like Medusa's own internal usage of
   * this key (`@medusajs/medusa/dist/migration-scripts/*.js`), since
   * `knex` is only a transitive dependency here, not a direct one.
   */
  const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);
  const logger: Logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  try {
    await knex.raw("SELECT 1");
    res.status(200).json({ status: "ok" });
  } catch (error) {
    logger.error(
      `[keep-alive] database query failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    res.status(503).json({ status: "error" });
  }
}
