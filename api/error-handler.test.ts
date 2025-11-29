import type { Request, Response } from 'express';
import type { HttpError } from 'http-errors';

import { generalErrorHandler, notFoundHandler } from './error-handler.js';

describe('error handling', () => {
  let response: Partial<Response>;
  beforeEach(() => {
    response = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });
  describe('general errors', () => {
    it('should set the status code according to the error', () => {
      const error = { status: 404 } as HttpError;

      generalErrorHandler(error, {} as Request, response as Response, vi.fn());

      expect(response.status).toHaveBeenCalledWith(404);
    });
    it('should respond with the error message as a json object', () => {
      const error = {
        message: 'This is the error message.',
        status: 400,
      } as HttpError;

      generalErrorHandler(error, {} as Request, response as Response, vi.fn());

      expect(response.json).toHaveBeenCalledWith({
        code: 400,
        message: 'This is the error message.',
      });
    });
    it('should log the error message', () => {
      vi.spyOn(console, 'log');
      const error = {
        message: 'This is the error message.',
      } as HttpError;

      generalErrorHandler(error, {} as Request, response as Response, vi.fn());

      expect(console.log).toHaveBeenCalledWith('This is the error message.');
    });
  });
  describe('not found error', () => {
    it('should set the response status to 404', () => {
      notFoundHandler({} as Request, response as Response);

      expect(response.status).toHaveBeenCalledWith(404);
    });
    it('should return a json response body with the request path', () => {
      notFoundHandler({ path: '/not-found' } as Request, response as Response);

      expect(response.json).toHaveBeenCalledWith({
        code: 404,
        message: '/not-found Not Found',
      });
    });
  });
});
