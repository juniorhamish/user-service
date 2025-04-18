import { Request, Response } from 'express';
import { InvalidRequestError } from 'express-oauth2-jwt-bearer';

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
      const error = { status: 404 } as InvalidRequestError;

      generalErrorHandler(error, {} as Request, response as Response, vi.fn());

      expect(response.status).toHaveBeenCalledWith(404);
    });
    it('should respond with the error message as a json object', () => {
      const error = {
        message: 'This is the error message.',
      } as InvalidRequestError;

      generalErrorHandler(error, {} as Request, response as Response, vi.fn());

      expect(response.json).toHaveBeenCalledWith({
        error: 'This is the error message.',
      });
    });
    it('should log the error message', () => {
      vi.spyOn(console, 'log');
      const error = {
        message: 'This is the error message.',
      } as InvalidRequestError;

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
        error: '/not-found Not Found',
      });
    });
  });
});
