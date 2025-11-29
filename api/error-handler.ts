import type { NextFunction, Request, Response } from 'express';
import type { HttpError } from 'http-errors';

export const generalErrorHandler = (error: HttpError, _request: Request, response: Response, _next: NextFunction) => {
  console.log(error.message);
  response.status(error.status).json({ code: error.status, message: error.message });
};

export const notFoundHandler = (request: Request, response: Response) => {
  response.status(404).json({ code: 404, message: `${request.path} Not Found` });
};
