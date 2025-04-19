import 'dotenv/config';
import express from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import { buildSchema } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';
import helmet from 'helmet';
import logger from 'morgan';
import fs from 'node:fs';
import path from 'node:path';

import { generalErrorHandler, notFoundHandler } from './error-handler.js';
import { resolvers } from './resolvers.js';

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

const typeDefs = fs.readFileSync(
  path.join(path.resolve(), 'graphql/schema.graphql'),
  'utf8',
);
const schema = buildSchema(typeDefs);

const rootValue = {
  getUserInfo: resolvers.Query?.getUserInfo,
};
app.all(
  '/graphql',
  createHandler({
    context: (request) => {
      return {
        userId: request.raw.auth?.payload.sub,
      };
    },
    rootValue,
    schema,
  }),
);

// Error handlers
app.use(generalErrorHandler, notFoundHandler);

const port = process.env.PORT ?? '3000';
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

export default app;
