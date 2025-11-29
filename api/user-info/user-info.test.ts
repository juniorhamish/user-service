import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';

import app from '../index.js';
import { AvatarImageSource, type UserInfo } from '../types/UserInfo.js';
import { getUserInfo, updateUserInfo } from './user-info-service.js';

const authMiddleware = vi.hoisted(() => vi.fn());

vi.mock('express-oauth2-jwt-bearer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('express-oauth2-jwt-bearer')>()),
  auth: vi.fn().mockReturnValue(authMiddleware),
}));
vi.mock('./user-info-service.js');

describe('user info', () => {
  describe('unauthenticated', () => {
    beforeEach(() => {
      authMiddleware.mockImplementation((_request: Request, _response: Response, next: NextFunction) => {
        next();
      });
    });
    describe('getUserInfo', () => {
      it('should throw an error if the user ID has not been set in the request', async () => {
        const response = await request(app).get('/api/v1/user-info').send();

        expect(response.body).toEqual({
          code: 401,
          message: 'Invalid credentials',
        });
      });
    });
    describe('updateUserInfo', () => {
      it('should throw an error if the user ID has not been set in the request', async () => {
        const response = await request(app).patch('/api/v1/user-info').send({ firstName: 'David' });

        expect(response.body).toEqual({
          code: 401,
          message: 'Invalid credentials',
        });
      });
    });
  });
  describe('authenticated', () => {
    beforeEach(() => {
      authMiddleware.mockImplementation((request: Request, _response: Response, next: NextFunction) => {
        request.auth = {
          header: {},
          payload: {
            sub: 'UserID',
          },
          token: '',
        };
        next();
      });
      vi.mocked(updateUserInfo).mockResolvedValue({} as UserInfo);
    });
    describe('getUserInfo', () => {
      it('should get the user info for the user ID set in the request', async () => {
        vi.mocked(getUserInfo).mockResolvedValue({} as UserInfo);
        await request(app).get('/api/v1/user-info').send();

        expect(getUserInfo).toHaveBeenCalledWith('UserID');
      });
      it('should log the users email address', async () => {
        vi.spyOn(console, 'log');
        vi.mocked(getUserInfo).mockResolvedValue({
          email: 'test@foo.com',
        } as UserInfo);

        await request(app).get('/api/v1/user-info').send();

        expect(console.log).toHaveBeenCalledWith('Handle user info for test@foo.com');
      });
      it('should return the user info as json', async () => {
        vi.mocked(getUserInfo).mockResolvedValue({
          avatarImageSource: AvatarImageSource.GRAVATAR,
          email: 'B',
          firstName: 'C',
          gravatarEmailAddress: 'D',
          lastName: 'E',
          nickname: 'F',
          picture: 'G',
        });

        const response = await request(app).get('/api/v1/user-info').send();

        expect(response.body).toEqual({
          avatarImageSource: 'GRAVATAR',
          email: 'B',
          firstName: 'C',
          gravatarEmailAddress: 'D',
          lastName: 'E',
          nickname: 'F',
          picture: 'G',
        });
      });
    });
    describe('updateUserInfo', () => {
      it('should throw an error if the input is not supplied', async () => {
        const response = await request(app).patch('/api/v1/user-info').send({});

        expect(response.body).toEqual({
          code: 400,
          message: 'request/body must NOT have fewer than 1 properties',
        });
      });
      it('should update the user info for the user ID set in the request', async () => {
        await request(app).patch('/api/v1/user-info').send({ firstName: 'David' });

        expect(updateUserInfo).toHaveBeenCalledWith('UserID', expect.anything());
      });
      it('should log the users email address', async () => {
        vi.spyOn(console, 'log');
        vi.mocked(updateUserInfo).mockResolvedValue({
          email: 'test@foo.com',
        } as UserInfo);

        await request(app).patch('/api/v1/user-info').send({ lastName: 'Johnston' });

        expect(console.log).toHaveBeenCalledWith('Handle user info for test@foo.com');
      });
      it('should return the updated user info as json', async () => {
        vi.mocked(updateUserInfo).mockResolvedValue({
          avatarImageSource: AvatarImageSource.GRAVATAR,
          email: 'B',
          firstName: 'C',
          gravatarEmailAddress: 'D',
          lastName: 'E',
          nickname: 'F',
          picture: 'G',
        });

        const response = await request(app).patch('/api/v1/user-info').send({ firstName: 'David' });

        expect(response.body).toEqual({
          avatarImageSource: 'GRAVATAR',
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
});
