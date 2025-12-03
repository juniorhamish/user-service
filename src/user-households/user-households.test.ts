import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { DuplicateEntityError } from '../db-error-handling/supabase-errors.js';
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
vi.mock('./user-households-service.js', () => {
  const UserHouseholdsService = vi.fn(
    class {
      getUserHouseholds = getUserHouseholdsMock;
      createHousehold = createUserHouseholdMock;
      deleteHousehold = deleteUserHouseholdMock;
      updateHousehold = updateUserHouseholdMock;
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
    });
  });
});
