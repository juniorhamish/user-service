import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
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
vi.mock('./user-households-service.js', () => {
  const UserHouseholdsService = vi.fn(
    class {
      getUserHouseholds = getUserHouseholdsMock;
      createHousehold = createUserHouseholdMock;
      deleteHousehold = deleteUserHouseholdMock;
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
          code: 401,
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
          code: 401,
          message: 'Invalid credentials',
        });
      });
    });
    describe('deleteHousehold', () => {
      it('should throw an error if the user ID has not been set in the request', async () => {
        const response = await request(app).delete('/api/v1/households/1').send();

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
  });
});
