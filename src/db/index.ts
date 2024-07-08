import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export const createDB = (client: postgres.Sql) => {
  return drizzle(client, { schema, logger: true });
};

export * from './schema';
