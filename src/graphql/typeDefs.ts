import { readFileSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

export const typeDefs = readFileSync(
  path.resolve(__dirname, 'schema.graphql'),
  { encoding: 'utf-8' },
);
