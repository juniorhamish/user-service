import { NextFunction, Request, Response } from 'express';
import request from 'supertest';

import app from '../index.js';
import getUserInfo from './user-info-service.js';

const authMiddleware = vi.hoisted(() => vi.fn());

vi.mock('express-oauth2-jwt-bearer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('express-oauth2-jwt-bearer')>()),
  auth: vi.fn().mockReturnValue(authMiddleware),
}));
vi.mock('./user-info-service.js');

describe('user info', () => {
  describe('unauthenticated', () => {
    beforeEach(() => {
      authMiddleware.mockImplementation(
        (_request: Request, _response: Response, next: NextFunction) => {
          next();
        },
      );
    });
    it('should throw an error if the user ID has not been set in the request', async () => {
      const response = await request(app).get('/user-info');

      expect(response.body).toEqual({ error: 'Invalid credentials' });
    });
  });
  describe('authenticated', () => {
    beforeEach(() => {
      authMiddleware.mockImplementation(
        (request: Request, _response: Response, next: NextFunction) => {
          request.auth = {
            header: {},
            payload: {
              sub: 'UserID',
            },
            token: '',
          };
          next();
        },
      );
    });
    it('should get the user info for the user ID set in the request', async () => {
      await request(app).get('/user-info');

      expect(getUserInfo).toHaveBeenCalledWith('UserID');
    });
    it('should log the users email address', async () => {
      vi.spyOn(console, 'log');
      vi.mocked(getUserInfo).mockResolvedValue({
        avatarImageSource: '',
        email: 'test@foo.com',
        firstName: '',
        gravatarEmailAddress: '',
        lastName: '',
        nickname: '',
        picture: '',
      });

      await request(app).get('/user-info');

      expect(console.log).toHaveBeenCalledWith(
        'Get user info for test@foo.com',
      );
    });
    it('should return the user info as json', async () => {
      vi.mocked(getUserInfo).mockResolvedValue({
        avatarImageSource: 'A',
        email: 'B',
        firstName: 'C',
        gravatarEmailAddress: 'D',
        lastName: 'E',
        nickname: 'F',
        picture: 'G',
      });

      const response = await request(app).get('/user-info');

      expect(response.body).toEqual({
        avatarImageSource: 'A',
        email: 'B',
        firstName: 'C',
        gravatarEmailAddress: 'D',
        lastName: 'E',
        nickname: 'F',
        picture: 'G',
      });
    });
  });
});
