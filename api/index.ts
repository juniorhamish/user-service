import 'dotenv/config';
import express from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
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
app.use(jwtCheck);
app.use(express.json());

// Routes
app.use('/user-info', userInfoRouter);
// Error handlers
app.use(generalErrorHandler, notFoundHandler);

const port = process.env.PORT ?? '3000';
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

export default app;
