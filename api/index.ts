import 'dotenv/config';
import express from 'express';
import logger from 'morgan';
import userInfoRouter from './routes/user-info';
import { auth } from 'express-oauth2-jwt-bearer';
import { generalErrorHandler, notFoundHandler } from './error-handler';

const jwtCheck = auth({
  audience: 'https://user-service.dajohnston.co.uk',
  issuerBaseURL: 'https://dajohnston.eu.auth0.com/',
  tokenSigningAlg: 'RS256',
});

const app = express();

app.use(logger('combined'));
app.use(jwtCheck);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/user-info', userInfoRouter);
// Error handlers
app.use(generalErrorHandler, notFoundHandler);

const port = process.env.PORT || '3000';
app.listen(port, () => console.log(`Listening on port ${port}`));

module.exports = app;
