import { Module } from '@medusajs/framework/utils';
import RestockModuleService from './service';

export const RESTOCK_MODULE = 'restock';

const restock = Module(RESTOCK_MODULE, {
  service: RestockModuleService,
});

export default restock;
