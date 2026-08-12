import { SqlEntityManager } from '@medusajs/framework/mikro-orm/knex';
import { type Context } from '@medusajs/framework/types';
import {
  InjectManager,
  MedusaContext,
  MedusaService,
} from '@medusajs/framework/utils';
import RestockSubscription from './models/restock-subscription';

class RestockModuleService extends MedusaService({
  RestockSubscription,
}) {
  @InjectManager() async getUniqueSubscriptions(
    @MedusaContext() context: Context<SqlEntityManager> = {},
  ): Promise<{ variant_id: string; sales_channel_id: string }[]> {
    return (
      (await context.manager
        ?.createQueryBuilder('restock_subscription')
        .select(['variant_id', 'sales_channel_id'])
        .distinct()
        .execute()) ?? []
    );
  }
}

export default RestockModuleService;
