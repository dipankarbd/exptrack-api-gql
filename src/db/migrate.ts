import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const runMigration = async () => {
  const migrationClient = postgres(process.env.DATABASE_URL as string, {
    max: 1,
  });

  await migrate(drizzle(migrationClient), {
    migrationsFolder: './src/db/migrations',
  });

  await migrationClient.end();
};

runMigration();
