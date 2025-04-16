import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import logger from 'morgan';
import userInfoRouter from './routes/user-info';
import { auth, InvalidRequestError } from 'express-oauth2-jwt-bearer';

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

// Error handling
// Uncaught errors returned as 500 internal server error
app.use(
  (
    error: InvalidRequestError,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    console.log(error.message);
    response.status(error.status).json({ error: error.message });
  },
);

// Catch all unprocessed requests and respond with 404
app.use((request: Request, response: Response) => {
  response.status(404).json({ error: `${request.path} Not Found` });
});

const port = process.env.PORT || '3000';
app.listen(port, () => console.log(`Listening on port ${port}`));

module.exports = app;
