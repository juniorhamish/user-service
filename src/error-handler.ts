import type { NextFunction, Request, Response } from 'express';
import type { HttpError } from 'http-errors';

export const generalErrorHandler = (error: HttpError, _request: Request, response: Response, _next: NextFunction) => {
  console.log(`Caught HttpError with status ${error.status} and message ${error.message}`);
  response.status(error.status).json({ ...error, status: error.status, message: error.message });
};

export const notFoundHandler = (request: Request, response: Response) => {
  console.log(`Request for ${request.path} was not handled`);
  response.status(404).json({ status: 404, message: `${request.path} Not Found` });
};
