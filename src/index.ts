import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { verify } from 'jsonwebtoken';
import { GraphQLError } from 'graphql';

import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import postgres from 'postgres';
import { Repository } from './repository';
import { AppContext } from './types';
import { createAuthRouter } from './routes/auth';
import { createUserRouter } from './routes/users';

dotenv.config();

const pubKeyPath = path.join(__dirname, '../', 'id_rsa_pub.pem');
const PUB_KEY = fs.readFileSync(pubKeyPath, 'utf8');

const pgClient = postgres(process.env.DATABASE_URL as string);
const repo = new Repository(pgClient);

const app = express();
const port = parseInt(process.env.PORT as string);

app.use(cors());
app.use(express.json());

const server = new ApolloServer<AppContext>({
  typeDefs,
  resolvers,
});

(async () => {
  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        let token = req.headers.authorization || '';
        token = token.replace('Bearer ', '');

        let userId: number | null = null;
        try {
          const payload = verify(token, PUB_KEY, {
            algorithms: ['RS256'],
            ignoreExpiration: false,
          });
          userId = parseInt(payload.sub as string);
        } catch (error) {
          console.log('Invalid token');
        }

        if (!userId) {
          throw new GraphQLError('User is not authenticated', {
            extensions: {
              code: 'UNAUTHENTICATED',
              http: { status: 401 },
            },
          });
        }

        return {
          userId: userId,
          repository: repo,
        };
      },
    }),
  );

  app.use('/api/users', createUserRouter(repo));
  app.use('/api/authenticate', createAuthRouter(repo));

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
})();
