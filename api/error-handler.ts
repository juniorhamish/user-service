import { NextFunction, Request, Response } from 'express';
import { InvalidRequestError } from 'express-oauth2-jwt-bearer';

export const generalErrorHandler = (
  error: InvalidRequestError,
  _request: Request,
  response: Response,
  _next: NextFunction,
) => {
  console.log(error.message);
  response.status(error.status).json({ error: error.message });
};

export const notFoundHandler = (request: Request, response: Response) => {
  response.status(404).json({ error: `${request.path} Not Found` });
};
