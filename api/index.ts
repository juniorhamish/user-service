import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import cors from 'cors';
import express from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import { gql } from 'graphql-tag';
import helmet from 'helmet';
import logger from 'morgan';
import fs from 'node:fs';
import path from 'node:path';

import { generalErrorHandler, notFoundHandler } from './error-handler.js';
import { resolvers } from './resolvers.js';

export interface MyContext {
  userId?: string;
}

const jwtCheck = auth({
  audience: 'https://user-service.dajohnston.co.uk',
  issuerBaseURL: 'https://dajohnston.eu.auth0.com/',
  tokenSigningAlg: 'RS256',
});

const app = express();

app.use(logger('combined'));
app.use(helmet());
app.use(jwtCheck);
app.use(express.json());
app.use(cors());

const typeDefs = gql(
  fs.readFileSync(path.join(path.resolve(), 'graphql/schema.graphql'), 'utf8'),
);

const server = new ApolloServer<MyContext>({
  introspection: true,
  schema: buildSubgraphSchema({ resolvers, typeDefs }),
});
await server.start();

app.all(
  '/graphql',
  expressMiddleware<MyContext>(server, {
    context: ({ req }) => Promise.resolve({ userId: req.auth?.payload.sub }),
  }),
);

// Error handlers
app.use(generalErrorHandler, notFoundHandler);

const port = process.env.PORT ?? '3000';
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

export default app;
