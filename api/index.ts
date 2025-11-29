import 'dotenv/config';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import OpenApiValidator from 'express-openapi-validator';
import helmet from 'helmet';
import logger from 'morgan';

import { generalErrorHandler, notFoundHandler } from './error-handler.js';
import userInfoRouter from './routes/user-info.js';

const jwtCheck = auth({
  audience: 'https://user-service.dajohnston.co.uk',
  issuerBaseURL: 'https://dajohnston.eu.auth0.com/',
  tokenSigningAlg: 'RS256',
});

const app = express();

app.use(logger('combined'));
app.use(helmet());
app.use(
  cors({
    origin: [
      'https://www.dajohnston.co.uk',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://generator.swagger.io',
      /^https:\/\/.*\.vercel\.app$/,
    ],
  }),
);
app.use('/spec', express.static(path.join(path.resolve(), 'api-spec')));
app.use(jwtCheck);
app.use(express.json());

app.use(
  OpenApiValidator.middleware({
    apiSpec: path.join(path.resolve(), 'api-spec/openapi.yml'),
    validateRequests: true,
    validateResponses: true,
  }),
);

// Routes
app.use('/api/v1/user-info', userInfoRouter);
// Error handlers
app.use(generalErrorHandler, notFoundHandler);

/* v8 ignore next */
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

export default app;
