import { Router } from 'express';
import createError from 'http-errors';
import { DuplicateEntityError } from '../db-error-handling/supabase-errors.js';
import { UserHouseholdsService } from '../user-households/user-households-service.js';

const router = Router();

router.get('/', async (request, response, next) => {
  const userId = request.auth?.payload.sub;
  if (userId) {
    const householdService = new UserHouseholdsService(userId);
    const households = await householdService.getUserHouseholds();
    response.status(200).json(households);
  } else {
    next(createError(401, 'Invalid credentials'));
  }
});
router.post('/', async (request, response, next) => {
  const userId = request.auth?.payload.sub;
  if (userId) {
    const householdService = new UserHouseholdsService(userId);
    try {
      const createdHousehold = await householdService.createHousehold(request.body);
      response.status(201).json(createdHousehold);
    } catch (error: unknown) {
      if (error instanceof DuplicateEntityError) {
        next(createError(409, error.message));
      } else if (error instanceof Error) {
        next(createError(500, error.message));
      } else {
        next(createError(500, 'An unknown error occurred.'));
      }
    }
  } else {
    next(createError(401, 'Invalid credentials'));
  }
});
router.delete('/:id', async (request, response, next) => {
  const userId = request.auth?.payload.sub;
  if (userId) {
    const householdService = new UserHouseholdsService(userId);
    await householdService.deleteHousehold(Number(request.params.id));
    response.sendStatus(204);
  } else {
    next(createError(401, 'Invalid credentials'));
  }
});

export default router;
