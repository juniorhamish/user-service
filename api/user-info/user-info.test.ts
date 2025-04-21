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
      const response = await request(app)
        .post('/graphql')
        .send({ query: '{ getUserInfo { email } }' });

      expect(response.body).toEqual(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          errors: expect.arrayContaining([
            expect.objectContaining({ message: 'Invalid credentials' }),
          ]),
        }),
      );
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
      await request(app)
        .post('/graphql')
        .send({ query: '{ getUserInfo { email } }' });

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

      await request(app)
        .post('/graphql')
        .send({ query: '{ getUserInfo { email } }' });

      expect(console.log).toHaveBeenCalledWith(
        'Get user info for test@foo.com',
      );
    });
    it('should log unknown user if the email address is not set', async () => {
      vi.spyOn(console, 'log');
      vi.mocked(getUserInfo).mockResolvedValue({
        email: undefined,
      });

      await request(app)
        .post('/graphql')
        .send({ query: '{ getUserInfo { email } }' });

      expect(console.log).toHaveBeenCalledWith(
        'Get user info for unknown user',
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

      const response = await request(app)
        .post('/graphql')
        .send({
          query: `
            {
              getUserInfo {
                avatarImageSource
                email
                firstName
                gravatarEmailAddress
                lastName
                nickname
                picture
              }
            }`,
        });

      expect(response.body).toEqual({
        data: {
          getUserInfo: {
            avatarImageSource: 'A',
            email: 'B',
            firstName: 'C',
            gravatarEmailAddress: 'D',
            lastName: 'E',
            nickname: 'F',
            picture: 'G',
          },
        },
      });
    });
    it('should return only the requested fields', async () => {
      vi.mocked(getUserInfo).mockResolvedValue({
        avatarImageSource: 'A',
        email: 'B',
        firstName: 'C',
        gravatarEmailAddress: 'D',
        lastName: 'E',
        nickname: 'F',
        picture: 'G',
      });

      const response = await request(app)
        .post('/graphql')
        .send({
          query: `
            {
              getUserInfo {
                firstName
              }
            }`,
        });

      expect(response.body).toEqual({
        data: {
          getUserInfo: {
            firstName: 'C',
          },
        },
      });
    });
  });
});
