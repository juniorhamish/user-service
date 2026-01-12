import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { DuplicateEntityError, InvitedUserIsOwnerError, NotFoundError } from '../db-error-handling/supabase-errors.js';
import app from '../index.js';
import { UserHouseholdsService } from './user-households-service.js';

const authMiddleware = vi.hoisted(() => vi.fn());
vi.mock('express-oauth2-jwt-bearer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('express-oauth2-jwt-bearer')>()),
  auth: vi.fn().mockReturnValue(authMiddleware),
}));
const getUserHouseholdsMock = vi.hoisted(() => vi.fn());
const createUserHouseholdMock = vi.hoisted(() => vi.fn());
const deleteUserHouseholdMock = vi.hoisted(() => vi.fn());
const updateUserHouseholdMock = vi.hoisted(() => vi.fn());
const inviteUserToHouseholdMock = vi.hoisted(() => vi.fn());
const deleteHouseholdInvitationMock = vi.hoisted(() => vi.fn());
vi.mock('./user-households-service.js', () => {
  const UserHouseholdsService = vi.fn(
    class {
      getUserHouseholds = getUserHouseholdsMock;
      createHousehold = createUserHouseholdMock;
      deleteHousehold = deleteUserHouseholdMock;
      updateHousehold = updateUserHouseholdMock;
      inviteUsers = inviteUserToHouseholdMock;
      deleteInvitation = deleteHouseholdInvitationMock;
    },
  );
  return { UserHouseholdsService };
});

describe('user households routes', () => {
  describe('unauthenticated', () => {
    beforeEach(() => {
      authMiddleware.mockImplementation((_request: Request, _response: Response, next: NextFunction) => {
        next();
      });
    });
    describe('getHouseholds', () => {
      it('should throw an error if the user ID has not been set in the request', async () => {
        const response = await request(app).get('/api/v1/households').send();

        expect(response.body).toEqual({
          status: 401,
          message: 'Invalid credentials',
        });
      });
    });
    describe('createHousehold', () => {
      it('should throw an error if the user ID has not been set in the request', async () => {
        const response = await request(app)
          .post('/api/v1/households')
          .send({ name: 'David' })
          .set('Content-Type', 'application/json');

        expect(response.body).toEqual({
          status: 401,
          message: 'Invalid credentials',
        });
      });
    });
    describe('deleteHousehold', () => {
      it('should throw an error if the user ID has not been set in the request', async () => {
        const response = await request(app).delete('/api/v1/households/1').send();

        expect(response.body).toEqual({
          status: 401,
          message: 'Invalid credentials',
        });
      });
    });
    describe('updateHousehold', () => {
      it('should throw an error if the user ID has not been set in the request', async () => {
        const response = await request(app).patch('/api/v1/households/1').send({ name: 'David' });

        expect(response.body).toEqual({
          status: 401,
          message: 'Invalid credentials',
        });
      });
    });
    describe('invite user to household', () => {
      it('should throw an error if the user ID has not been set in the request', async () => {
        const response = await request(app)
          .post('/api/v1/households/1/invitations')
          .send([{ invited_user: 'dave@foo.com' }]);

        expect(response.body).toEqual({
          status: 401,
          message: 'Invalid credentials',
        });
      });
    });
    describe('delete household invitation', () => {
      it('should throw an error if the user ID has not been set in the request', async () => {
        const response = await request(app).delete('/api/v1/invitations/1').send();

        expect(response.body).toEqual({
          status: 401,
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
            email: 'UserID',
          },
          token: '',
        };
        next();
      });
    });
    describe('getHouseholds', () => {
      it('should return the households for the user making the request', async () => {
        getUserHouseholdsMock.mockResolvedValue([
          {
            id: 1,
            name: 'Dave',
            created_by: '',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
            pending_invites: [],
          },
        ]);
        const response = await request(app).get('/api/v1/households').send();

        expect(UserHouseholdsService).toHaveBeenCalledWith('UserID');
        expect(response.status).toEqual(200);
        expect(response.body).toEqual([
          {
            id: 1,
            name: 'Dave',
            created_by: '',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
            pending_invites: [],
          },
        ]);
      });
    });
    describe('createHousehold', () => {
      it('should return the created household', async () => {
        createUserHouseholdMock.mockResolvedValue({
          id: 1,
          name: 'Dave',
          created_by: '',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          pending_invites: [],
        });
        const response = await request(app).post('/api/v1/households').send({ name: 'Dave' });

        expect(UserHouseholdsService).toHaveBeenCalledWith('UserID');
        expect(createUserHouseholdMock).toHaveBeenCalledWith({ name: 'Dave' });
        expect(response.status).toEqual(201);
        expect(response.body).toEqual({
          id: 1,
          name: 'Dave',
          created_by: '',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          pending_invites: [],
        });
      });
      it('should return a 409 status code when the household already exists', async () => {
        createUserHouseholdMock.mockRejectedValue(new DuplicateEntityError());
        const response = await request(app).post('/api/v1/households').send({ name: 'Dave' });
        expect(response.status).toEqual(409);
        expect(response.body).toEqual({ status: 409, message: 'Duplicate entity' });
      });
      it('should return a 500 status code when an error occurs', async () => {
        createUserHouseholdMock.mockRejectedValue(new Error('Message'));
        const response = await request(app).post('/api/v1/households').send({ name: 'Dave' });
        expect(response.status).toEqual(500);
        expect(response.body).toEqual({ status: 500, message: 'Message' });
      });
      it('should return a 500 status code when an unknown error occurs', async () => {
        createUserHouseholdMock.mockRejectedValue({});
        const response = await request(app).post('/api/v1/households').send({ name: 'Dave' });
        expect(response.status).toEqual(500);
        expect(response.body).toEqual({ status: 500, message: 'An unknown error occurred.' });
      });
    });
    describe('deleteHousehold', () => {
      it('should delete household and return 204', async () => {
        deleteUserHouseholdMock.mockReturnValue({});
        const response = await request(app).delete('/api/v1/households/1').send();

        expect(UserHouseholdsService).toHaveBeenCalledWith('UserID');
        expect(deleteUserHouseholdMock).toHaveBeenCalledWith(1);
        expect(response.status).toEqual(204);
      });
    });
    describe('updateHousehold', () => {
      it('should return the updated household', async () => {
        updateUserHouseholdMock.mockResolvedValue({
          id: 1,
          name: 'Dave',
          created_by: '',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          pending_invites: [],
        });
        const response = await request(app).patch('/api/v1/households/1').send({ name: 'Dave' });

        expect(UserHouseholdsService).toHaveBeenCalledWith('UserID');
        expect(updateUserHouseholdMock).toHaveBeenCalledWith(1, { name: 'Dave' });
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({
          id: 1,
          name: 'Dave',
          created_by: '',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          pending_invites: [],
        });
      });
      it('should return a 409 status code when updating name to match an existing household', async () => {
        updateUserHouseholdMock.mockRejectedValue(new DuplicateEntityError());
        const response = await request(app).patch('/api/v1/households/1').send({ name: 'Dave' });
        expect(response.status).toEqual(409);
        expect(response.body).toEqual({ status: 409, message: 'Duplicate entity' });
      });
      it('should return a 500 status code when an error occurs', async () => {
        updateUserHouseholdMock.mockRejectedValue(new Error('Message'));
        const response = await request(app).patch('/api/v1/households/1').send({ name: 'Dave' });
        expect(response.status).toEqual(500);
        expect(response.body).toEqual({ status: 500, message: 'Message' });
      });
      it('should return a 500 status code when an unknown error occurs', async () => {
        updateUserHouseholdMock.mockRejectedValue({});
        const response = await request(app).patch('/api/v1/households/1').send({ name: 'Dave' });
        expect(response.status).toEqual(500);
        expect(response.body).toEqual({ status: 500, message: 'An unknown error occurred.' });
      });
      it('should return a 400 status code when id is included in the request body', async () => {
        const response = await request(app).patch('/api/v1/households/1').send({ name: 'Dave', id: 123 });
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          errors: [
            {
              errorCode: 'readOnly.openapi.validation',
              message: 'is read-only',
              path: '/body/id',
            },
          ],
          message: 'request/body/id is read-only',
          name: 'Bad Request',
          path: '/api/v1/households/1',
          status: 400,
        });
      });
      it('should return a 400 status code when created_at is included in the request body', async () => {
        const response = await request(app)
          .patch('/api/v1/households/1')
          .send({ name: 'Dave', created_at: '2025-12-03T20:06:30.617804+00:00' });
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          errors: [
            {
              errorCode: 'readOnly.openapi.validation',
              message: 'is read-only',
              path: '/body/created_at',
            },
          ],
          message: 'request/body/created_at is read-only',
          name: 'Bad Request',
          path: '/api/v1/households/1',
          status: 400,
        });
      });
      it('should return a 400 status code when created_by is included in the request body', async () => {
        const response = await request(app)
          .patch('/api/v1/households/1')
          .send({ name: 'Dave', created_by: '2025-12-03T20:06:30.617804+00:00' });
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          errors: [
            {
              errorCode: 'readOnly.openapi.validation',
              message: 'is read-only',
              path: '/body/created_by',
            },
          ],
          message: 'request/body/created_by is read-only',
          name: 'Bad Request',
          path: '/api/v1/households/1',
          status: 400,
        });
      });
      it('should return a 400 status code when updated_at is included in the request body', async () => {
        const response = await request(app)
          .patch('/api/v1/households/1')
          .send({ name: 'Dave', updated_at: '2025-12-03T20:06:30.617804+00:00' });
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          errors: [
            {
              errorCode: 'readOnly.openapi.validation',
              message: 'is read-only',
              path: '/body/updated_at',
            },
          ],
          message: 'request/body/updated_at is read-only',
          name: 'Bad Request',
          path: '/api/v1/households/1',
          status: 400,
        });
      });
      it('should return a 404 status code when the household does not exist', async () => {
        updateUserHouseholdMock.mockRejectedValue(new NotFoundError());
        const response = await request(app).patch('/api/v1/households/1').send({ name: 'Dave' });
        expect(response.status).toEqual(404);
        expect(response.body).toEqual({
          message: 'The requested entity was not found',
          status: 404,
        });
      });
    });
    describe('invite users to household', () => {
      it('should reject requests where the invited_user is not a valid email address', async () => {
        const response = await request(app)
          .post('/api/v1/households/1/invitations')
          .send([{ invited_user: 'Dave' }]);

        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          errors: [
            {
              errorCode: 'format.openapi.validation',
              message: 'must match format "email"',
              path: '/body/0/invited_user',
            },
          ],
          message: 'request/body/0/invited_user must match format "email"',
          name: 'Bad Request',
          path: '/api/v1/households/1/invitations',
          status: 400,
        });
      });
      it('should reject requests where the body contains an id', async () => {
        const response = await request(app)
          .post('/api/v1/households/1/invitations')
          .send([{ invited_user: 'david@foo.com', id: 123 }]);

        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          errors: [
            {
              errorCode: 'readOnly.openapi.validation',
              message: 'is read-only',
              path: '/body/0/id',
            },
          ],
          message: 'request/body/0/id is read-only',
          name: 'Bad Request',
          path: '/api/v1/households/1/invitations',
          status: 400,
        });
      });
      it('should reject requests where the body contains multiple invites for the same user', async () => {
        const response = await request(app)
          .post('/api/v1/households/1/invitations')
          .send([{ invited_user: 'david@foo.com' }, { invited_user: 'david@foo.com' }]);

        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          message: 'Request body includes the same email address multiple times',
          status: 400,
        });
      });
      it('should return an invitation object for each invited_user', async () => {
        inviteUserToHouseholdMock.mockResolvedValue([
          {
            id: 1,
            household_id: 1,
            invited_by_user_id: 'UserId',
            invited_user: 'david@foo.com',
            invited_at: '2025-01-01T00:00:00Z',
          },
          {
            id: 2,
            household_id: 1,
            invited_by_user_id: 'UserId',
            invited_user: 'david@bar.com',
            invited_at: '2025-01-01T00:00:00Z',
          },
        ]);
        const response = await request(app)
          .post('/api/v1/households/1/invitations')
          .send([{ invited_user: 'david@foo.com' }, { invited_user: 'david@bar.com' }]);
        expect(inviteUserToHouseholdMock).toHaveBeenCalledWith(1, ['david@foo.com', 'david@bar.com']);
        expect(response.status).toEqual(201);
        expect(response.body).toEqual([
          {
            id: 1,
            household_id: 1,
            invited_by_user_id: 'UserId',
            invited_user: 'david@foo.com',
            invited_at: '2025-01-01T00:00:00Z',
          },
          {
            id: 2,
            household_id: 1,
            invited_by_user_id: 'UserId',
            invited_user: 'david@bar.com',
            invited_at: '2025-01-01T00:00:00Z',
          },
        ]);
      });
      it('should respond with a 400 if the invited user is the owner', async () => {
        inviteUserToHouseholdMock.mockRejectedValue(new InvitedUserIsOwnerError());
        const response = await request(app)
          .post('/api/v1/households/1/invitations')
          .send([{ invited_user: 'david@foo.com' }]);
        expect(inviteUserToHouseholdMock).toHaveBeenCalledWith(1, ['david@foo.com']);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          message: 'The invited user is already the owner of the household',
          status: 400,
        });
      });
      it('should respond with a 500 if there is an unknown error', async () => {
        inviteUserToHouseholdMock.mockRejectedValue(new Error('Unknown error'));
        const response = await request(app)
          .post('/api/v1/households/1/invitations')
          .send([{ invited_user: 'david@foo.com' }]);
        expect(response.status).toEqual(500);
        expect(response.body).toEqual({
          message: 'Unknown error',
          status: 500,
        });
      });
      it('should respond with a 500 if there is an error', async () => {
        inviteUserToHouseholdMock.mockRejectedValue({});
        const response = await request(app)
          .post('/api/v1/households/1/invitations')
          .send([{ invited_user: 'david@foo.com' }]);
        expect(response.status).toEqual(500);
        expect(response.body).toEqual({
          message: 'An unknown error occurred.',
          status: 500,
        });
      });
      it('should respond with a 409 if the invited user is already invited', async () => {
        inviteUserToHouseholdMock.mockRejectedValue(new DuplicateEntityError('User already invited'));
        const response = await request(app)
          .post('/api/v1/households/1/invitations')
          .send([{ invited_user: 'david@foo.com' }]);
        expect(response.status).toEqual(409);
        expect(response.body).toEqual({
          message: 'User already invited',
          status: 409,
        });
      });
    });
    describe('delete household invite', () => {
      it('should return a 204 status when the deletion is successful', async () => {
        deleteHouseholdInvitationMock.mockResolvedValue(0);
        const response = await request(app).delete('/api/v1/invitations/2').send();
        expect(UserHouseholdsService).toHaveBeenCalledWith('UserID');
        expect(deleteHouseholdInvitationMock).toHaveBeenCalledWith(2);
        expect(response.status).toEqual(204);
      });
      it('should respond with a 500 if there is an unknown error', async () => {
        deleteHouseholdInvitationMock.mockRejectedValue(new Error('Unknown error'));
        const response = await request(app).delete('/api/v1/invitations/1').send();
        expect(response.status).toEqual(500);
        expect(response.body).toEqual({
          message: 'Unknown error',
          status: 500,
        });
      });
      it('should respond with a 500 if there is an error', async () => {
        deleteHouseholdInvitationMock.mockRejectedValue({});
        const response = await request(app).delete('/api/v1/invitations/23').send();
        expect(response.status).toEqual(500);
        expect(response.body).toEqual({
          message: 'An unknown error occurred.',
          status: 500,
        });
      });
    });
  });
});
