import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../db-error-handling/supabase-errors.js';
import app from '../index.js';
import { TokenExchangeService } from './token-exchange-service.js';

const authMiddleware = vi.hoisted(() => vi.fn());

vi.mock('express-oauth2-jwt-bearer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('express-oauth2-jwt-bearer')>()),
  auth: vi.fn().mockReturnValue(authMiddleware),
}));

vi.mock('./token-exchange-service.js');

describe('token exchange router', () => {
  beforeEach(() => {
    authMiddleware.mockImplementation((request: Request, _response: Response, next: NextFunction) => {
      request.auth = {
        header: {},
        payload: {
          email: 'test@example.com',
        },
        token: '',
      };
      next();
    });
  });

  it('should pass audience to TokenExchangeService', async () => {
    const exchangeTokenMock = vi.fn().mockResolvedValue('fake-token');
    vi.mocked(TokenExchangeService).prototype.exchangeToken = exchangeTokenMock;

    const response = await request(app)
      .post('/api/v1/token/exchange')
      .send({ household_id: 1, audience: 'custom-aud' });

    expect(response.status).toBe(200);
    expect(exchangeTokenMock).toHaveBeenCalledWith(1, 'custom-aud');
  });

  it('should use default audience from OpenAPI spec if not provided', async () => {
    const exchangeTokenMock = vi.fn().mockResolvedValue('fake-token');
    vi.mocked(TokenExchangeService).prototype.exchangeToken = exchangeTokenMock;

    const response = await request(app).post('/api/v1/token/exchange').send({ household_id: 1 });

    expect(response.status).toBe(200);
    expect(exchangeTokenMock).toHaveBeenCalledWith(1, 'internal');
  });

  describe('error handling', () => {
    it('should return 401 if user is not authenticated', async () => {
      authMiddleware.mockImplementation((request: Request, _response: Response, next: NextFunction) => {
        request.auth = undefined;
        next();
      });

      const response = await request(app).post('/api/v1/token/exchange').send({ household_id: 1 });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 if household_id is missing', async () => {
      const response = await request(app).post('/api/v1/token/exchange').send({});

      expect(response.status).toBe(400);
    });

    it('should return 400 if household_id is 0 (falsy)', async () => {
      const response = await request(app).post('/api/v1/token/exchange').send({ household_id: 0 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('household_id is required');
    });

    it('should return 403 if user does not have access', async () => {
      vi.mocked(TokenExchangeService).prototype.exchangeToken = vi
        .fn()
        .mockRejectedValue(new ForbiddenError('User does not have access to this household'));

      const response = await request(app).post('/api/v1/token/exchange').send({ household_id: 1 });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('User does not have access to this household');
    });

    it('should return 500 for other Error instances', async () => {
      vi.mocked(TokenExchangeService).prototype.exchangeToken = vi
        .fn()
        .mockRejectedValue(new Error('Some other error'));

      const response = await request(app).post('/api/v1/token/exchange').send({ household_id: 1 });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Some other error');
    });

    it('should return 500 for non-Error exceptions', async () => {
      vi.mocked(TokenExchangeService).prototype.exchangeToken = vi.fn().mockRejectedValue('not an error object');

      const response = await request(app).post('/api/v1/token/exchange').send({ household_id: 1 });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('An unknown error occurred.');
    });
  });

  describe('GET /public-key', () => {
    it('should return the public key', async () => {
      vi.mocked(TokenExchangeService.getPublicKey).mockReturnValue('test-public-key');

      const response = await request(app).get('/api/v1/token/public-key').send();

      expect(response.status).toBe(200);
      expect(response.body.publicKey).toBe('test-public-key');
    });

    it('should return 500 if public key is not set', async () => {
      vi.mocked(TokenExchangeService.getPublicKey).mockImplementation(() => {
        throw new Error('INTERNAL_JWT_PUBLIC_KEY environment variable not set');
      });

      const response = await request(app).get('/api/v1/token/public-key').send();

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('INTERNAL_JWT_PUBLIC_KEY environment variable not set');
    });

    it('should return 500 for non-Error exceptions in public-key', async () => {
      vi.mocked(TokenExchangeService.getPublicKey).mockImplementation(() => {
        throw 'not an error object';
      });

      const response = await request(app).get('/api/v1/token/public-key').send();

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('An unknown error occurred.');
    });
  });
});
